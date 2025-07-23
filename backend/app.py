from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta, timezone
import os
import bcrypt
import jwt
from functools import wraps
from dotenv import load_dotenv
from sql_loader import SQLLoader
from query_timer import QueryTimer

load_dotenv()

# Initialize SQL loader
sql = SQLLoader()

# Initialize query timer
query_timer = QueryTimer()

def execute_timed_query(cursor, query_key: str, params=None):
    """
    Execute a SQL query with timing using the query timer.
    
    Args:
        cursor: Database cursor object
        query_key: The query identifier (e.g., 'auth.get_user_by_username')
        params: Query parameters (optional)
        
    Returns:
        Result of cursor.execute()
    """
    sql_query = sql.get_query(query_key)
    return query_timer.time_query(cursor, query_key, sql_query, params)

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/auth/*": {"origins": "http://localhost:3000"},
    r"/markets/*": {"origins": "http://localhost:3000"},
    r"/api/*": {"origins": "http://localhost:3000"},
    r"/bets/*": {"origins": "http://localhost:3000"},
})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Token expiration time
TOKEN_EXPIRATION = 24 * 60 * 60

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST'),
    'user': os.getenv('DB_USER'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE')
}

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        connection.autocommit = True
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def calculate_market_odds(market_id, cursor, exclude_user_id=None):
    """
    Calculate market odds based on current volume distribution.
    This implements a proper prediction market mechanism where:
    - Odds reflect the current market sentiment based on volume distribution
    - More volume on YES side = higher probability for YES outcome
    - More volume on NO side = lower probability for YES outcome
    - If exclude_user_id is provided, that user's bets are excluded from calculation
    
    Args:
        market_id: The market ID to calculate odds for
        cursor: Database cursor
        exclude_user_id: Optional user ID whose bets should be excluded from calculation
        
    Returns the probability (0.01 to 0.99) for YES outcome.
    """
    try:
        # Get total volume on YES and NO sides
        if exclude_user_id is not None:
            execute_timed_query(cursor, 'markets.get_market_volume_distribution_excluding_user', (market_id, exclude_user_id))
        else:
            execute_timed_query(cursor, 'markets.get_market_volume_distribution', (market_id,))
        
        result = cursor.fetchone()
        
        # Handle both dictionary and tuple results
        if isinstance(result, dict):
            yes_volume = float(result['yes_volume']) if result['yes_volume'] else 0.0
            no_volume = float(result['no_volume']) if result['no_volume'] else 0.0
        else:
            yes_volume = float(result[0]) if result[0] else 0.0
            no_volume = float(result[1]) if result[1] else 0.0
        
        total_volume = yes_volume + no_volume
        
        # If no bets yet, return default 0.50 (50/50)
        if total_volume == 0:
            return 0.50
        
        # Calculate probability based on volume distribution
        # Add a small smoothing factor to prevent division by zero and extreme odds
        smoothing_factor = 1.0
        yes_probability = (yes_volume + smoothing_factor) / (total_volume + 2 * smoothing_factor)
        
        # Ensure odds are within reasonable bounds (0.01 to 0.99)
        yes_probability = max(0.01, min(0.99, yes_probability))
        
        return round(yes_probability, 2)
        
    except Error as e:
        print(f"Error calculating market odds: {e}")
        return 0.50

def get_user_market_odds(market_id, user_id, cursor):
    """
    Get market odds calculated excluding a specific user's volume.
    This should be used whenever user-specific odds are needed (betting, selling, calculating gains).
    
    Args:
        market_id: The market ID
        user_id: The user ID whose volume should be excluded
        cursor: Database cursor
        
    Returns the probability (0.01 to 0.99) for YES outcome.
    """
    return calculate_market_odds(market_id, cursor, exclude_user_id=user_id)

def get_display_market_odds(market_id, cursor):
    """
    Get market odds for display purposes (including all users).
    This should be used for market listings and general display.
    
    Args:
        market_id: The market ID
        cursor: Database cursor
        
    Returns the probability (0.01 to 0.99) for YES outcome.
    """
    return calculate_market_odds(market_id, cursor)

def get_user_from_token():
    """
    Extract user information from the Authorization header if present.
    Returns user_id if valid token is provided, None otherwise.
    """
    auth_header = request.headers.get('Authorization')
    if not auth_header:
        return None

    # Accept both "Bearer <token>" and raw token
    parts = auth_header.split()
    token = parts[1] if len(parts) == 2 and parts[0].lower() == 'bearer' else parts[0]

    if not token:
        return None

    try:
        # Decode the token
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload.get('user_id')
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization')
        if not auth_header:
            return jsonify({'error': 'Authorization header missing'}), 401

        # Accept both "Bearer <token>" and raw token
        parts = auth_header.split()
        token = parts[1] if len(parts) == 2 and parts[0].lower() == 'bearer' else parts[0]

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            # Add the current user to the request context
            request.current_user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Token is invalid'}), 401

        return f(*args, **kwargs)
    return decorated

@app.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        phone_number = data.get('phoneNumber', '')
        
        # Validate required fields
        if not all([username, email, password]):
            return jsonify({'error': 'Username, email, and password are required'}), 400
            
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
            
        # Validate password strength
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
            
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
            
        cursor = connection.cursor(dictionary=True)
        
        # Check if username already exists
        execute_timed_query(cursor, 'auth.check_username_exists', (username,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Username already exists'}), 400
            
        # Check if email already exists
        execute_timed_query(cursor, 'auth.check_email_exists', (email,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert the new user
        execute_timed_query(cursor, 'auth.insert_user', (username, email, hashed_password.decode('utf-8'), phone_number))
        
        user_id = cursor.lastrowid
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'message': 'Registration successful',
            'user_id': user_id
        }), 201
        
    except Exception as e:
        print(f"Registration error: {str(e)}")
        return jsonify({'error': 'An error occurred during registration'}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        username = data.get('username')
        password = data.get('password')
        
        if not username or not password:
            return jsonify({'error': 'Username and password are required'}), 400
        
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
            
        cursor = connection.cursor(dictionary=True)
        execute_timed_query(cursor, 'auth.get_user_by_username', (username,))
        user = cursor.fetchone()
        cursor.close()
        connection.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 401
            
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['passwordHash'].encode('utf-8')):
            return jsonify({'error': 'Incorrect password'}), 401
            
        # Create JWT token
        token = jwt.encode({
            'user_id': user['uid'],
            'username': user['uname'],
            'exp': datetime.now(timezone.utc) + timedelta(seconds=TOKEN_EXPIRATION)
        }, app.config['SECRET_KEY'], algorithm='HS256')
        
        return jsonify({
            'message': 'Login successful',
            'token': token,
            'user': {
                'id': user['uid'],
                'username': user['uname'],
                'email': user['email'],
                'balance': float(user['balance'])
            }
        })
        
    except Exception as e:
        print(f"Login error: {str(e)}")
        return jsonify({'error': 'An error occurred during login'}), 500

@app.route('/markets', methods=['GET'])
def get_markets():
    """Get all available markets for the home screen"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        # Modified to fetch only active markets (volume > 0)
        execute_timed_query(cursor, 'markets.get_active_markets')
        
        markets = cursor.fetchall()
        
        # Get user ID if logged in
        user_id = get_user_from_token()
        
        # Convert datetime objects to strings for JSON serialization and calculate dynamic odds
        for market in markets:
            if market['end_date']:
                market['end_date'] = market['end_date'].isoformat()
            
            # Calculate odds dynamically based on user login status
            if user_id:
                # Logged in user: exclude their own volume
                market['podd'] = get_user_market_odds(market['mid'], user_id, cursor)
            else:
                # Logged out user: include all volume
                market['podd'] = get_display_market_odds(market['mid'], cursor)
            
            market['volume'] = float(market['volume'])
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'markets': markets,
            'count': len(markets)
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to fetch markets'}), 500

@app.route('/markets/trending', methods=['GET'])
def get_trending_markets():
    """Get trending markets based on recent activity"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        # This can remain as is, assuming trending logic inherently filters out old markets
        execute_timed_query(cursor, 'markets.get_trending_markets')
        
        markets = cursor.fetchall()
        
        # Get user ID if logged in
        user_id = get_user_from_token()
        
        for market in markets:
            if market['end_date']:
                market['end_date'] = market['end_date'].isoformat()
            
            # Calculate odds dynamically based on user login status
            if user_id:
                # Logged in user: exclude their own volume
                market['podd'] = get_user_market_odds(market['mid'], user_id, cursor)
            else:
                # Logged out user: include all volume
                market['podd'] = get_display_market_odds(market['mid'], cursor)
            
            market['volume'] = float(market['volume'])
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'markets': markets,
            'count': len(markets)
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to fetch trending markets'}), 500

@app.route('/markets/<int:market_id>', methods=['GET'])
def get_market(market_id):
    """Get a specific market with current odds and volume"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get market information
        execute_timed_query(cursor, 'markets.get_market_by_id', (market_id,))
        
        market = cursor.fetchone()
        if not market:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found'}), 404
        
        # Get user ID if logged in
        user_id = get_user_from_token()
        
        # Calculate odds dynamically based on user login status
        if user_id:
            # Logged in user: exclude their own volume
            market['podd'] = get_user_market_odds(market_id, user_id, cursor)
        else:
            # Logged out user: include all volume
            market['podd'] = get_display_market_odds(market_id, cursor)
        
        # Convert data types for JSON serialization
        market['volume'] = float(market['volume'])
        if market['end_date']:
            market['end_date'] = market['end_date'].isoformat()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'market': market
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to fetch market'}), 500

@app.route('/markets/<int:market_id>/bets', methods=['GET'])
def get_market_bets(market_id):
    """Get all bets for a specific market"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # First check if market exists
        execute_timed_query(cursor, 'validation.check_market_exists', (market_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found'}), 404
        
        # Get all bets for the market with user information
        execute_timed_query(cursor, 'markets.get_market_bets', (market_id,))
        
        bets = cursor.fetchall()
        
        # Convert data types for JSON serialization
        for bet in bets:
            bet['podd'] = float(bet['podd'])
            bet['amt'] = float(bet['amt'])
            bet['createdAt'] = bet['createdAt'].isoformat()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'market_id': market_id,
            'bets': bets,
            'count': len(bets)
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to fetch bets'}), 500

@app.route('/markets/<int:market_id>/bets', methods=['POST'])
@token_required
def create_bet(market_id):
    """Create a new bet on a specific market"""
    connection = get_db_connection()
    connection.autocommit = False
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Get user ID from JWT token
        user_id = request.current_user['user_id']
        
        # Validate required fields
        required_fields = ['amount', 'prediction']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        amount = float(data['amount'])
        prediction = bool(data['prediction'])  # True for YES, False for NO
                
        cursor = connection.cursor(dictionary=True)
        execute_timed_query(cursor, 'transactions.set_serializable_isolation')
        
        # Check if market exists and is still active
        execute_timed_query(cursor, 'validation.check_market_active', (market_id,))
        market_result = cursor.fetchone()
        if not market_result:
            connection.rollback() # rollback the transaction
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found or has ended'}), 404
        
        # Calculate odds excluding the current user's bets to prevent manipulation
        current_odds = get_user_market_odds(market_id, user_id, cursor)
        
        # Check if user exists
        execute_timed_query(cursor, 'bets.get_user_balance', (user_id,))
        user = cursor.fetchone()
        if not user:
            connection.rollback()
            cursor.close()
            connection.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Handle balance validation based on whether this is a buy or sell
        if amount > 0:
            # BUY: Check if user has sufficient balance
            if user['balance'] < amount:
                connection.rollback()
                cursor.close()
                connection.close()
                return jsonify({'error': 'Insufficient balance'}), 400
        else:
            # SELL: Check if user has sufficient holdings to sell
            execute_timed_query(cursor, 'bets.get_user_holdings', (user_id,))
            holdings = cursor.fetchall()
            
            # Find the specific holding for this market and prediction
            target_holding = None
            for holding in holdings:
                if holding['mId'] == market_id and holding['yes'] == prediction:
                    target_holding = holding
                    break
            
            if not target_holding:
                connection.rollback()
                cursor.close()
                connection.close()
                return jsonify({'error': 'No holdings found for this market and prediction'}), 400
            
            # Check if user has enough current market value to sell
            net_units = float(target_holding['net_units'])
            is_yes = bool(target_holding['yes'])
            
            # Calculate the correct unit price for YES and NO
            if is_yes:
                unit_price = current_odds
            else:
                unit_price = 1 - current_odds
            
            # For NO, units are based on amt/(1-podd), so selling should check units * unit_price
            current_market_value = net_units * unit_price
            
            # Check if the sell amount exceeds the current market value
            if abs(amount) > current_market_value:
                connection.rollback()
                cursor.close()
                connection.close()
                return jsonify({'error': f'Insufficient holdings. Your current market value is ${current_market_value:.2f}, trying to sell ${abs(amount):.2f}'}), 400
        
        try:
            # Insert the bet using current market odds (trigger will handle balance and volume updates)
            execute_timed_query(cursor, 'bets.insert_bet', (user_id, market_id, current_odds, amount, prediction))
            
            bet_id = cursor.lastrowid
            
            # After inserting the bet, update the market's podd
            execute_timed_query(cursor, 'bets.get_all_market_bets', (market_id,))
            all_bets = cursor.fetchall()

            yes_volume = sum(b['amt'] for b in all_bets if b['yes'])
            no_volume = sum(b['amt'] for b in all_bets if not b['yes'])
            total_volume = yes_volume + no_volume

            if total_volume > 0:
                new_podd = yes_volume / total_volume
                execute_timed_query(cursor, 'markets.update_market_podd', (new_podd, market_id))

            connection.commit() # commit the transaction
            cursor.close()
            connection.close()
            
            return jsonify({
                'success': True,
                'message': 'Bet created successfully',
                'bet_id': bet_id,
                'market_id': market_id,
                'user_id': user_id,
                'amount': amount,
                'odds_at_bet': current_odds,
                'prediction': prediction
            }), 201
            
        except Error as e:
            connection.rollback() # rollback the transaction
            cursor.close()
            connection.close()
            print(f"Transaction error: {e}")
            return jsonify({'error': 'Failed to create bet'}), 500
        
    except (ValueError, TypeError) as e:
        connection.rollback()
        cursor.close()
        connection.close()
        return jsonify({'error': 'Invalid data format'}), 400
    except Error as e:
        connection.rollback()
        cursor.close()
        connection.close()
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to create bet'}), 500



@app.route('/markets/<int:market_id>/comments', methods=['GET'])
def get_market_comments(market_id):
    """Get all comments for a specific market in a threaded structure"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get threaded comments
        cursor = connection.cursor(dictionary=True)
        execute_timed_query(cursor, 'comments.get_threaded_comments', (market_id, market_id))
        comments = cursor.fetchall()

        for comment in comments:
            comment['created_at'] = comment['created_at'].isoformat()

        cursor.close()
        connection.close()

        return jsonify({
            'success': True,
            'market_id': market_id,
            'comments': comments,
            'count': len(comments)
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to fetch comments'}), 500

@app.route('/markets/<int:market_id>/comments', methods=['POST'])
def create_comment(market_id):
    """Create a new top-level comment on a market"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_id = data['user_id']
        content = data['content']
        
        cursor = connection.cursor()
        
        # Check if market exists
        execute_timed_query(cursor, 'validation.check_market_exists', (market_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found'}), 404
        
        # Check if user exists
        execute_timed_query(cursor, 'validation.check_user_exists', (user_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'User not found'}), 404
        
        # Insert the comment
        execute_timed_query(cursor, 'comments.insert_comment', (user_id, market_id, content))
        
        comment_id = cursor.lastrowid
        
        connection.commit()
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'message': 'Comment created successfully',
            'comment_id': comment_id,
            'market_id': market_id,
            'user_id': user_id
        }), 201
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to create comment'}), 500

@app.route('/markets/<int:market_id>/comments/<int:parent_id>/replies', methods=['POST'])
def create_reply(market_id, parent_id):
    """Create a reply to an existing comment"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'content']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_id = data['user_id']
        content = data['content']
        
        cursor = connection.cursor()
        
        # Check if market exists
        execute_timed_query(cursor, 'validation.check_market_exists', (market_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found'}), 404
        
        # Check if parent comment exists and belongs to this market
        execute_timed_query(cursor, 'validation.check_comment_exists_in_market', (parent_id, market_id))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Parent comment not found'}), 404
        
        # Check if user exists
        execute_timed_query(cursor, 'validation.check_user_exists', (user_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'User not found'}), 404
        
        connection.start_transaction()
        
        try:
            execute_timed_query(cursor, 'comments.insert_reply', (user_id, market_id, content))
            
            reply_id = cursor.lastrowid
            
            execute_timed_query(cursor, 'comments.create_parent_child_relationship', (parent_id, reply_id))
            
            connection.commit()
            
            cursor.close()
            connection.close()
            
            return jsonify({
                'success': True,
                'message': 'Reply created successfully',
                'comment_id': reply_id,
                'parent_id': parent_id,
                'market_id': market_id,
                'user_id': user_id
            }), 201
            
        except Error as e:
            connection.rollback()
            raise e
            
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to create reply'}), 500

@app.route('/api/user-profits', methods=['GET'])
def get_user_profits():
    """Get all users sorted by their total profits (realized + unrealized gains)"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # Get all users with their basic info and realized gains
        execute_timed_query(cursor, 'bets.get_user_profits')
        results = cursor.fetchall()
        
        # For each user, calculate unrealized gains using current odds excluding their volume
        for user in results:
            user_id = user['uid']
            
            # Get user holdings to calculate unrealized gains
            execute_timed_query(cursor, 'bets.get_user_holdings', (user_id,))
            holdings = cursor.fetchall()
            
            unrealized_gains = 0.0
            
            for holding in holdings:
                market_id = holding['mId']
                net_units = float(holding['net_units'])
                avg_buy_price = float(holding['avg_buy_price_per_unit'])
                total_invested = float(holding['total_invested'])
                is_yes = bool(holding['yes'])
                
                # Calculate current odds excluding this user's volume
                current_odds = get_user_market_odds(market_id, user_id, cursor)
                
                # Calculate unrealized gains for this holding
                if is_yes:
                    # For YES holdings: net_units * current_odds - total_invested
                    current_value = net_units * current_odds
                    unrealized_gains += current_value - total_invested
                else:
                    # For NO holdings: net_units * (1-current_odds) - total_invested
                    current_value = net_units * (1 - current_odds)
                    unrealized_gains += current_value - total_invested
            
            # Update user data
            user['current_balance'] = float(user['current_balance'])
            user['realized_gains'] = float(user['realized_gains'])
            user['unrealized_gains'] = float(unrealized_gains)
            user['total_profits'] = float(user['realized_gains']) + float(unrealized_gains)
            
            # Calculate percent change from initial investment
            # Use total invested from holdings for more accurate calculation
            total_investment = sum([float(holding['total_invested']) for holding in holdings])
            if total_investment > 0:
                user['percent_change'] = (user['total_profits'] / total_investment) * 100
            else:
                user['percent_change'] = 0.0
        
        # Sort by total profits
        results.sort(key=lambda x: x['total_profits'], reverse=True)
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'users': results
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to get user profits'}), 500

@app.route('/api/user-holdings', methods=['GET'])
@token_required
def get_user_holdings():
    """Get current holdings for the authenticated user with unrealized gains"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        user_id = request.current_user['user_id']
        
        # Get user holdings with bet unit calculations
        execute_timed_query(cursor, 'bets.get_user_holdings', (user_id,))
        holdings = cursor.fetchall()
        
        # Calculate unrealized gains for each holding
        for holding in holdings:
            market_id = holding['mId']
            net_units = float(holding['net_units'])
            avg_buy_price = float(holding['avg_buy_price_per_unit'])
            is_yes = bool(holding['yes'])
            
            # Calculate current odds excluding this user's volume
            current_odds = get_user_market_odds(market_id, user_id, cursor)
            
            # Calculate unrealized gains for this holding
            if is_yes:
                # For YES holdings: net_units * current_odds - total_invested
                unrealized_gains = (net_units * current_odds) - float(holding['total_invested'])
            else:
                # For NO holdings: net_units * (1-current_odds) - total_invested
                unrealized_gains = (net_units * (1 - current_odds)) - float(holding['total_invested'])
            
            # Calculate current market value
            if is_yes:
                current_value = net_units * current_odds
            else:
                current_value = net_units * (1 - current_odds)
            
            # Calculate percent change
            total_invested = float(holding['total_invested'])
            if total_invested > 0:
                percent_change = ((current_value - total_invested) / total_invested) * 100
            else:
                percent_change = 0.0
            
            # Update holding data
            holding['unrealized_gains'] = float(unrealized_gains)
            holding['current_value'] = float(current_value)
            holding['percent_change'] = float(percent_change)
            holding['current_odds'] = float(current_odds)
            
            # Convert numeric fields to float
            holding['bought_units'] = float(holding['bought_units'])
            holding['sold_units'] = float(holding['sold_units'])
            holding['net_units'] = float(holding['net_units'])
            holding['total_invested'] = float(holding['total_invested'])
            holding['avg_buy_price_per_unit'] = float(holding['avg_buy_price_per_unit'])
        
        # Sort by unrealized gains (descending)
        holdings.sort(key=lambda x: x['unrealized_gains'], reverse=True)
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'holdings': holdings,
            'total_holdings': len(holdings),
            'total_unrealized_gains': sum([h['unrealized_gains'] for h in holdings]),
            'total_current_value': sum([h['current_value'] for h in holdings]),
            'total_invested': sum([h['total_invested'] for h in holdings])
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to get user holdings'}), 500

@app.route('/api/user-bets', methods=['GET'])
@token_required
def get_user_bets():
    """Get all bets for the authenticated user"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        user_id = request.current_user['user_id']
        
        # Get user bets with market information
        execute_timed_query(cursor, 'bets.get_user_bets', (user_id,))
        bets = cursor.fetchall()
        
        # Convert data types for JSON serialization
        for bet in bets:
            bet['podd'] = float(bet['podd'])
            bet['amt'] = float(bet['amt'])
            bet['createdAt'] = bet['createdAt'].isoformat()
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'bets': bets,
            'count': len(bets)
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to fetch user bets'}), 500

@app.route('/api/user-balance', methods=['GET'])
@token_required
def get_user_balance():
    """Get current balance for the authenticated user"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        user_id = request.current_user['user_id']
        
        # Get user balance
        execute_timed_query(cursor, 'bets.get_user_balance', (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            connection.close()
            return jsonify({'error': 'User not found'}), 404
        
        cursor.close()
        connection.close()
        
        return jsonify({
            'success': True,
            'balance': float(user['balance'])
        })
        
    except Error as e:
        print(f"Database error: {e}")
        return jsonify({'error': 'Failed to get user balance'}), 500

@app.route('/api/query-stats', methods=['GET'])
def get_query_stats():
    """Get SQL query performance statistics"""
    try:
        stats = query_timer.get_all_stats()
        return jsonify({
            'success': True,
            'stats': stats
        })
    except Exception as e:
        print(f"Error getting query stats: {e}")
        return jsonify({'error': 'Failed to get query statistics'}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000)