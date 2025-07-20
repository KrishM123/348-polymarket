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
    r"/api/*": {"origins": "http://localhost:3000"}
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

def calculate_market_odds(market_id, cursor):
    """
    Calculate market odds based on current volume distribution.
    This implements a proper prediction market mechanism where:
    - Odds reflect the current market sentiment based on volume distribution
    - More volume on YES side = higher probability for YES outcome
    - More volume on NO side = lower probability for YES outcome
    
    Returns the probability (0.01 to 0.99) for YES outcome.
    """
    try:
        # Get total volume on YES and NO sides
        execute_timed_query(cursor, 'markets.get_market_volume_distribution', (market_id,))
        
        result = cursor.fetchone()
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
        execute_timed_query(cursor, 'markets.get_all_markets')
        
        markets = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for market in markets:
            if market['end_date']:
                market['end_date'] = market['end_date'].isoformat()
            market['podd'] = float(market['podd'])
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
        execute_timed_query(cursor, 'markets.get_trending_markets')
        
        markets = cursor.fetchall()
        
        for market in markets:
            if market['end_date']:
                market['end_date'] = market['end_date'].isoformat()
            market['podd'] = float(market['podd'])
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
        
        # Convert data types for JSON serialization
        market['podd'] = float(market['podd'])
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
        
        # Validate data ranges
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        cursor = connection.cursor()
        
        # Check if market exists and is still active, and get current odds
        execute_timed_query(cursor, 'validation.check_market_active', (market_id,))
        market_result = cursor.fetchone()
        if not market_result:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found or has ended'}), 404
        
        current_odds = float(market_result[1])
        
        # Check if user exists and has sufficient balance
        execute_timed_query(cursor, 'bets.get_user_balance', (user_id,))
        user = cursor.fetchone()
        if not user:
            cursor.close()
            connection.close()
            return jsonify({'error': 'User not found'}), 404
        
        if user[1] < amount:
            cursor.close()
            connection.close()
            return jsonify({'error': 'Insufficient balance'}), 400
        
        try:
            # Insert the bet using current market odds
            execute_timed_query(cursor, 'bets.insert_bet', (user_id, market_id, current_odds, amount, prediction))
            
            bet_id = cursor.lastrowid
            
            # Update user balance
            execute_timed_query(cursor, 'bets.update_user_balance', (amount, user_id))
            
            # Update market volume
            execute_timed_query(cursor, 'markets.update_market_volume', (amount, market_id))
            
            # Recalculate and update market odds based on new volume distribution
            new_odds = calculate_market_odds(market_id, cursor)
            execute_timed_query(cursor, 'markets.update_market_odds', (new_odds, market_id))
            
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
                'new_market_odds': new_odds,
                'prediction': prediction
            }), 201
            
        except Error as e:
            cursor.close()
            connection.close()
            print(f"Transaction error: {e}")
            return jsonify({'error': 'Failed to create bet'}), 500
        
    except (ValueError, TypeError) as e:
        return jsonify({'error': 'Invalid data format'}), 400
    except Error as e:
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

        # Convert datetime objects to strings for JSON serialization
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