from flask import Flask, request, jsonify
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

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
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

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
        
        # Start transaction
        connection.start_transaction()
        
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
            
            # Commit transaction
            connection.commit()
            
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
            connection.rollback()
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