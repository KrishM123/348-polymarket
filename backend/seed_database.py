#!/usr/bin/env python3
"""
Database seeding script for Polymarket clone
Fetches real data from Polymarket API and creates sample data for testing
"""

import requests
import mysql.connector
from mysql.connector import Error
import json
import random
from datetime import datetime, timedelta
import bcrypt
from decimal import Decimal
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'polymarket'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE', 'polymarket')
}

# Polymarket API endpoints
GAMMA_API_BASE = "https://gamma-api.polymarket.com"
DATA_API_BASE = "https://data-api.polymarket.com"

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def fetch_polymarket_markets():
    """Fetch current market data from Polymarket APIs"""
    markets = []
    
    # Fetch current active events from Gamma API
    try:
        # Get active events with markets
        url = f"{GAMMA_API_BASE}/events?active=true&limit=15"
        response = requests.get(url, timeout=15)
        
        if response.status_code == 200:
            events_data = response.json()
            print(f"Successfully fetched {len(events_data)} events from Gamma API")
            
            # Extract markets from events
            for event in events_data:
                if 'markets' in event and event['markets']:
                    for market in event['markets']:
                        # Add event context to market
                        market['event_title'] = event.get('title', '')
                        market['event_description'] = event.get('description', '')
                        market['event_category'] = event.get('category', 'General')
                        markets.append(market)
            
            print(f"Extracted {len(markets)} markets from events")
        else:
            print(f"Failed to fetch events from Gamma API: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching events from Gamma API: {e}")
    
    # Also try to get current markets directly from Gamma API
    try:
        url = f"{GAMMA_API_BASE}/markets?active=true&limit=10"
        response = requests.get(url, timeout=15)
        
        if response.status_code == 200:
            direct_markets = response.json()
            print(f"Successfully fetched {len(direct_markets)} direct markets from Gamma API")
            markets.extend(direct_markets)
        else:
            print(f"Failed to fetch direct markets from Gamma API: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching direct markets from Gamma API: {e}")
    
    # Get current active markets from CLOB API for trading data
    try:
        url = "https://clob.polymarket.com/markets?active=true&limit=10"
        response = requests.get(url, timeout=15)
        
        if response.status_code == 200:
            clob_data = response.json()
            if 'data' in clob_data:
                clob_markets = clob_data['data']
                print(f"Successfully fetched {len(clob_markets)} active markets from CLOB API")
                
                # Filter for non-closed markets with future end dates
                current_markets = []
                for market in clob_markets:
                    if not market.get('closed', True) and market.get('active', False):
                        current_markets.append(market)
                
                print(f"Found {len(current_markets)} truly active markets from CLOB")
                markets.extend(current_markets)
            else:
                print("No 'data' field in CLOB response")
        else:
            print(f"Failed to fetch from CLOB API: {response.status_code}")
    except requests.exceptions.RequestException as e:
        print(f"Error fetching from CLOB API: {e}")
    
    if not markets:
        raise Exception("Failed to fetch any markets from Polymarket APIs. Cannot proceed without real data.")
    
    return markets

def create_sample_users(connection):
    """Create sample users for testing"""
    sample_users = [
        {
            'uname': 'alice_trader',
            'email': 'alice@example.com',
            'phone': '+1234567890',
            'balance': 10000.00
        },
        {
            'uname': 'bob_predictor',
            'email': 'bob@example.com', 
            'phone': '+1234567891',
            'balance': 5000.00
        },
        {
            'uname': 'charlie_analyst',
            'email': 'charlie@example.com',
            'phone': '+1234567892',
            'balance': 15000.00
        },
        {
            'uname': 'diana_investor',
            'email': 'diana@example.com',
            'phone': '+1234567893',
            'balance': 8000.00
        },
        {
            'uname': 'eve_speculator',
            'email': 'eve@example.com',
            'phone': '+1234567894',
            'balance': 12000.00
        }
    ]
    
    cursor = connection.cursor()
    user_ids = []
    
    for user in sample_users:
        try:
            # Hash a default password (same for all test users)
            password_hash = bcrypt.hashpw("testpassword123".encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
            
            cursor.execute("""
                INSERT INTO users (uname, passwordHash, email, phoneNumber, balance)
                VALUES (%s, %s, %s, %s, %s)
            """, (user['uname'], password_hash, user['email'], user['phone'], user['balance']))
            
            user_ids.append(cursor.lastrowid)
            print(f"Created user: {user['uname']}")
            
        except Error as e:
            if "Duplicate entry" in str(e):
                # User already exists, get their ID
                cursor.execute("SELECT uid FROM users WHERE uname = %s", (user['uname'],))
                result = cursor.fetchone()
                if result:
                    user_ids.append(result[0])
                    print(f"User {user['uname']} already exists, using existing ID")
            else:
                print(f"Error creating user {user['uname']}: {e}")
    
    connection.commit()
    cursor.close()
    return user_ids

def create_markets_from_api(connection, polymarket_data):
    """Create markets based on real Polymarket API data only"""
    cursor = connection.cursor()
    market_ids = []
    
    print(f"Processing {len(polymarket_data)} markets from Polymarket APIs...")
    
    for i, market in enumerate(polymarket_data[:15]):  # Process up to 15 markets
        try:
            # Extract market information - handle different API response formats
            # Try multiple fields for the market name/question
            name = market.get('question', 
                   market.get('title', 
                   market.get('event_title', f'Market {i+1}')))[:255]
            
            # Get description from multiple possible sources
            description = market.get('description', 
                         market.get('event_description', 
                         'Market data from Polymarket'))
            
            # Set a small initial volume, which will be updated later based on bet activity
            volume = round(random.uniform(1.0, 10.0), 2)
            odds = 0.50  # Default to 50/50
            
            # Calculate odds from outcome prices if available
            try:
                outcome_prices = market.get('outcomePrices', '[]')
                if isinstance(outcome_prices, str):
                    import json
                    prices = json.loads(outcome_prices)
                    if len(prices) >= 2 and prices[0] != '0':
                        odds = min(0.99, max(0.01, float(prices[0])))
                elif isinstance(outcome_prices, list) and len(outcome_prices) >= 2:
                    odds = min(0.99, max(0.01, float(outcome_prices[0])))
                
                # Alternative: check tokens for price data
                if odds == 0.50 and 'tokens' in market:
                    tokens = market['tokens']
                    if len(tokens) >= 2 and 'price' in tokens[0]:
                        price = float(tokens[0]['price'])
                        if 0 < price < 1:
                            odds = price
            except (json.JSONDecodeError, ValueError, KeyError, IndexError):
                pass
            
            # Handle different date formats for end_date
            end_date = datetime.now() + timedelta(days=30)  # Default fallback
            
            end_date_fields = ['endDate', 'end_date_iso', 'endDateIso']
            for field in end_date_fields:
                end_date_str = market.get(field)
                if end_date_str:
                    try:
                        # Parse ISO format
                        parsed_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00'))
                        # Convert to naive datetime for database storage
                        if parsed_date.tzinfo is not None:
                            parsed_date = parsed_date.replace(tzinfo=None)
                        
                        # Only use future dates, extend past dates
                        if parsed_date > datetime.now():
                            end_date = parsed_date
                        else:
                            end_date = datetime.now() + timedelta(days=random.randint(7, 60))
                        break
                    except (ValueError, AttributeError):
                        continue
            
            # Insert market into database
            cursor.execute("""
                INSERT INTO markets (name, description, podd, volume, end_date)
                VALUES (%s, %s, %s, %s, %s)
            """, (name, description, odds, volume, end_date))
            
            market_ids.append(cursor.lastrowid)
            print(f"Created market {len(market_ids)}: {name[:50]}... (Volume: ${volume:.0f})")
            
        except Error as e:
            print(f"Database error creating market {i}: {e}")
        except Exception as e:
            print(f"Unexpected error processing market {i}: {e}")
    
    connection.commit()
    cursor.close()
    
    print(f"Successfully created {len(market_ids)} markets from real Polymarket data")
    return market_ids

def create_sample_bets(connection, user_ids, market_ids):
    """Create sample bets for testing"""
    cursor = connection.cursor()
    bet_ids = []
    
    # Create 20-30 random bets
    num_bets = random.randint(20, 30)
    
    for _ in range(num_bets):
        try:
            user_id = random.choice(user_ids)
            market_id = random.choice(market_ids)
            
            # Random bet parameters
            odds = round(random.uniform(0.20, 0.80), 2)
            amount = round(random.uniform(50, 1000), 2)
            prediction = random.choice([True, False])  # YES or NO
            
            cursor.execute("""
                INSERT INTO bets (uId, mId, podd, amt, yes)
                VALUES (%s, %s, %s, %s, %s)
            """, (user_id, market_id, odds, amount, prediction))
            
            bet_ids.append(cursor.lastrowid)
            
        except Error as e:
            print(f"Error creating bet: {e}")
    
    connection.commit()
    cursor.close()
    print(f"Created {len(bet_ids)} sample bets")
    return bet_ids

def create_sample_comments(connection, user_ids, market_ids):
    """Create sample comments for testing"""
    sample_comments = [
        "This looks like a solid bet based on current trends.",
        "I think the odds are too high on this one.",
        "The market fundamentals suggest this will resolve YES.",
        "Historical data shows this is unlikely to happen.",
        "Great analysis! I'm betting YES on this.",
        "The risk/reward ratio seems favorable here.",
        "I disagree with the current market sentiment.",
        "This reminds me of a similar market from last year.",
        "The volume is picking up, might be time to bet.",
        "I'm staying neutral on this one for now."
    ]
    
    cursor = connection.cursor()
    comment_ids = []
    
    # Create 15-25 random comments
    num_comments = random.randint(15, 25)
    
    for _ in range(num_comments):
        try:
            user_id = random.choice(user_ids)
            market_id = random.choice(market_ids)
            content = random.choice(sample_comments)
            
            cursor.execute("""
                INSERT INTO comments (uId, mId, content)
                VALUES (%s, %s, %s)
            """, (user_id, market_id, content))
            
            comment_ids.append(cursor.lastrowid)
            
        except Error as e:
            print(f"Error creating comment: {e}")
    
    connection.commit()
    cursor.close()
    print(f"Created {len(comment_ids)} sample comments")
    return comment_ids

def main():
    """Main seeding function"""
    print("Starting database seeding process...")
    
    # Get database connection
    connection = get_db_connection()
    if not connection:
        print("Failed to connect to database. Exiting.")
        return
    
    try:
        # Fetch data from Polymarket API - this will raise exception if it fails
        print("Fetching real market data from Polymarket APIs...")
        polymarket_data = fetch_polymarket_markets()
        
        # Create sample users
        print("Creating sample users...")
        user_ids = create_sample_users(connection)
        
        # Create markets using real API data only
        print("Creating markets from real Polymarket data...")
        market_ids = create_markets_from_api(connection, polymarket_data)
        
        if not market_ids:
            raise Exception("No markets were created from the API data. Cannot proceed.")
        
        # Create sample bets and comments only if we have markets
        if market_ids:
            print("Creating sample bets...")
            bet_ids = create_sample_bets(connection, user_ids, market_ids)
            
            print("Creating sample comments...")
            comment_ids = create_sample_comments(connection, user_ids, market_ids)
        else:
            print("No markets created, skipping bets and comments")
            bet_ids = []
            comment_ids = []
        
        print("\n=== Database Seeding Complete ===")
        print(f"Created {len(user_ids)} users")
        print(f"Created {len(market_ids)} markets")
        print(f"Created {len(bet_ids)} bets")
        print(f"Created {len(comment_ids)} comments")
        print("\nTest login credentials:")
        print("Username: alice_trader")
        print("Password: testpassword123")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
    
    finally:
        connection.close()
        print("Database connection closed.")

if __name__ == "__main__":
    main() 