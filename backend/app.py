from flask import Flask, request, jsonify, make_response
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime, timedelta
import json
import os
import bcrypt
import jwt
from functools import wraps
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Enable CORS for all routes
CORS(app, resources={
    r"/auth/*": {"origins": "http://localhost:3000"},
    r"/api/*": {"origins": "http://localhost:3000"}
})
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Token expiration time (24 hours)
TOKEN_EXPIRATION = 24 * 60 * 60  # 24 hours in seconds

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'polymarket'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE', 'polymarket')
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

# Authentication decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Remove 'Bearer ' from token
            token = token.split(' ')[1]
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
            # You can add the current user to the request context if needed
            # current_user = data['user_id']
        except Exception as e:
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
        name = data.get('name', '')
        phone_number = data.get('phoneNumber', '')
        
        # Validate required fields
        if not all([username, email, password]):
            return jsonify({'error': 'Username, email, and password are required'}), 400
            
        # Validate email format
        if '@' not in email or '.' not in email:
            return jsonify({'error': 'Invalid email format'}), 400
            
        # Validate password strength (at least 8 characters)
        if len(password) < 8:
            return jsonify({'error': 'Password must be at least 8 characters long'}), 400
            
        connection = get_db_connection()
        if not connection:
            return jsonify({'error': 'Database connection failed'}), 500
            
        cursor = connection.cursor(dictionary=True)
        
        # Check if username already exists
        cursor.execute("SELECT uid FROM users WHERE uname = %s", (username,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Username already exists'}), 400
            
        # Check if email already exists
        cursor.execute("SELECT uid FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Email already registered'}), 400
        
        # Hash the password
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
        
        # Insert the new user
        cursor.execute("""
            INSERT INTO users (uname, email, passwordHash, phoneNumber, name)
            VALUES (%s, %s, %s, %s, %s)
        """, (username, email, hashed_password.decode('utf-8'), phone_number, name))
        
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
        cursor.execute("SELECT * FROM users WHERE uname = %s", (username,))
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
            'exp': datetime.utcnow() + timedelta(seconds=TOKEN_EXPIRATION)
        }, app.config['SECRET_KEY'])
        
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
        cursor.execute("""
            SELECT mid, name, description, podd, volume, end_date 
            FROM markets 
            WHERE end_date > NOW()
            ORDER BY end_date ASC
        """)
        
        markets = cursor.fetchall()
        
        # Convert datetime objects to strings for JSON serialization
        for market in markets:
            if market['end_date']:
                market['end_date'] = market['end_date'].isoformat()
            # Convert Decimal to float for JSON serialization
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

@app.route('/markets/<int:market_id>/bets', methods=['GET'])
def get_market_bets(market_id):
    """Get all bets for a specific market"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        
        # First check if market exists
        cursor.execute("SELECT mid FROM markets WHERE mid = %s", (market_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found'}), 404
        
        # Get all bets for the market with user information
        cursor.execute("""
            SELECT b.bId, b.uId, b.mId, b.podd, b.amt, b.yes, b.createdAt, u.uname
            FROM bets b
            JOIN users u ON b.uId = u.uid
            WHERE b.mId = %s
            ORDER BY b.createdAt DESC
        """, (market_id,))
        
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
def create_bet(market_id):
    """Create a new bet on a specific market"""
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        # Get JSON data from request
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['user_id', 'odds', 'amount', 'prediction']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user_id = data['user_id']
        odds = float(data['odds'])
        amount = float(data['amount'])
        prediction = bool(data['prediction'])  # True for YES, False for NO
        
        # Validate data ranges
        if odds < 0.01 or odds > 0.99:
            return jsonify({'error': 'Odds must be between 0.01 and 0.99'}), 400
        
        if amount <= 0:
            return jsonify({'error': 'Amount must be positive'}), 400
        
        cursor = connection.cursor()
        
        # Check if market exists and is still active
        cursor.execute("SELECT mid FROM markets WHERE mid = %s AND end_date > NOW()", (market_id,))
        if not cursor.fetchone():
            cursor.close()
            connection.close()
            return jsonify({'error': 'Market not found or has ended'}), 404
        
        # Check if user exists and has sufficient balance
        cursor.execute("SELECT uid, balance FROM users WHERE uid = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            cursor.close()
            connection.close()
            return jsonify({'error': 'User not found'}), 404
        
        if user[1] < amount:  # balance < amount
            cursor.close()
            connection.close()
            return jsonify({'error': 'Insufficient balance'}), 400
        
        try:
            # Insert the bet
            cursor.execute("""
                INSERT INTO bets (uId, mId, podd, amt, yes)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, market_id, odds, amount, prediction))
            
            bet_id = cursor.lastrowid
            
            # Update user balance
            cursor.execute("""
                UPDATE users SET balance = balance - %s WHERE uid = %s
            """, (amount, user_id))
            
            # Update market volume
            cursor.execute("""
                UPDATE markets SET volume = volume + %s WHERE mid = %s
            """, (amount, market_id))
            
            cursor.close()
            connection.close()
            
            return jsonify({
                'success': True,
                'message': 'Bet created successfully',
                'bet_id': bet_id,
                'market_id': market_id,
                'user_id': user_id,
                'amount': amount,
                'odds': odds,
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

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    debug_mode = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    app.run(debug=debug_mode, host='0.0.0.0', port=5000) 