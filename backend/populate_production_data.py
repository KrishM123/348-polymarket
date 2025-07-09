#!/usr/bin/env python3
"""
Production data population script for Polymarket clone
Builds upon seed_database.py to create a rich, realistic dataset
while keeping the existing market data from the Polymarket API
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
import faker
import numpy as np
from typing import List, Dict, Any
from tqdm import tqdm
import time
from sql_loader import SQLLoader

# Load environment variables
load_dotenv()

# Database configuration from environment variables
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'polymarket'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE', 'polymarket')
}

# Initialize Faker for generating realistic data
fake = faker.Faker()

# Configuration for batch sizes
BATCH_SIZE = 100  # Process users in batches of 100
COMMIT_FREQUENCY = 1000  # Commit every 1000 operations

# Initialize SQL loader
sql_loader = SQLLoader()

def get_db_connection():
    """Create and return a database connection"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        # Remove autocommit to handle transactions properly
        connection.autocommit = False
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def fetch_polymarket_markets():
    """Reuse the existing market fetching logic from seed_database.py"""
    from seed_database import fetch_polymarket_markets
    return fetch_polymarket_markets()

def create_production_users(connection, num_users: int = 100) -> List[int]:
    """Create a larger set of realistic users for production"""
    cursor = connection.cursor()
    user_ids = []
    
    # Create different user types with varying initial balances
    user_types = [
        {'type': 'whale', 'balance_range': (50000, 200000), 'probability': 0.05},
        {'type': 'active_trader', 'balance_range': (10000, 50000), 'probability': 0.15},
        {'type': 'regular', 'balance_range': (1000, 10000), 'probability': 0.50},
        {'type': 'novice', 'balance_range': (100, 1000), 'probability': 0.30}
    ]
    
    # Pre-generate all user data
    print("Generating user data...")
    users_data = []
    for i in tqdm(range(num_users)):
        username = fake.user_name()
        email = fake.email()
        # Generate shorter phone number to fit VARCHAR(20)
        phone = f"+1{random.randint(1000000000, 9999999999)}"
        
        user_type = random.choices(
            user_types,
            weights=[t['probability'] for t in user_types],
            k=1
        )[0]
        
        balance = round(random.uniform(*user_type['balance_range']), 2)
        password = fake.password(length=12)
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        users_data.append((username, email, password_hash, phone, balance))
    
    # Insert users in batches
    print("Inserting users in batches...")
    for i in tqdm(range(0, len(users_data), BATCH_SIZE)):
        batch = users_data[i:i + BATCH_SIZE]
        try:
            # Insert users without balance first
            insert_user_query = sql_loader.get_query('auth.insert_user')
            cursor.executemany(insert_user_query, [(user[0], user[1], user[2], user[3]) for user in batch])
            
            # Get the actual inserted IDs from the database
            cursor.execute("SELECT uid FROM users ORDER BY uid DESC LIMIT %s", (len(batch),))
            batch_ids = [row[0] for row in cursor.fetchall()]
            batch_ids.reverse()  # Reverse to get correct order
            
            # Update balances separately
            balance_updates = [(user[4], user_id) for user, user_id in zip(batch, batch_ids)]
            cursor.executemany(
                "UPDATE users SET balance = %s WHERE uid = %s",
                balance_updates
            )
            
            user_ids.extend(batch_ids)
            connection.commit()
            
        except Error as e:
            print(f"Error inserting batch: {e}")
            connection.rollback()
            continue
    
    cursor.close()
    
    if not user_ids:
        raise Exception("No users were created successfully. Cannot proceed.")
    
    return user_ids

def create_production_bets(connection, user_ids: List[int], market_ids: List[int]):
    """Create realistic betting patterns for users"""
    cursor = connection.cursor()
    
    # Define betting patterns
    patterns = [
        {'type': 'high_roller', 'amt_range': (1000, 10000), 'frequency': 0.1},
        {'type': 'medium_stake', 'amt_range': (100, 1000), 'frequency': 0.3},
        {'type': 'small_stake', 'amt_range': (10, 100), 'frequency': 0.6}
    ]
    
    # Pre-calculate market odds for efficiency
    print("Fetching market odds...")
    cursor.execute("SELECT mid, podd FROM markets")
    market_odds_map = dict(cursor.fetchall())
    
    # Validate that we have user IDs and market IDs
    if not user_ids or not market_ids:
        print("No user IDs or market IDs available for betting")
        cursor.close()
        return
    
    print(f"Creating bets for {len(user_ids)} users across {len(market_ids)} markets...")
    
    # Process users in batches
    print("Creating bets...")
    for i in tqdm(range(0, len(user_ids), BATCH_SIZE)):
        batch_users = user_ids[i:i + BATCH_SIZE]
        
        # Fetch balances for batch
        cursor.execute(
            "SELECT uid, balance FROM users WHERE uid IN ({})".format(
                ','.join(['%s'] * len(batch_users))
            ),
            batch_users
        )
        user_balances = dict(cursor.fetchall())
        
        bets_data = []
        balance_updates = []
        
        for user_id in batch_users:
            if user_id not in user_balances:
                continue
                
            balance = float(user_balances[user_id])
            
            # Number of bets varies by user's balance
            num_bets = int(np.random.normal(
                loc=min(5, balance/100),  # Reduced average bets for scale
                scale=2,
                size=1
            )[0])
            num_bets = max(1, min(10, num_bets))  # Cap at 10 bets per user
            
            user_total_bets = 0
            for _ in range(num_bets):
                if not market_ids:
                    continue
                    
                market_id = random.choice(market_ids)
                pattern = random.choices(
                    patterns,
                    weights=[p['frequency'] for p in patterns],
                    k=1
                )[0]
                
                # Calculate bet amount
                max_bet = min(pattern['amt_range'][1], balance * 0.2)
                min_bet = min(pattern['amt_range'][0], max_bet)
                
                if min_bet <= 0:
                    continue
                    
                amount = round(random.uniform(min_bet, max_bet), 2)
                
                if amount > (balance - user_total_bets) or amount <= 0:
                    continue
                
                # Get market odds with variation
                if market_id not in market_odds_map:
                    continue
                    
                market_odds = float(market_odds_map[market_id])
                odds_variation = random.uniform(-0.05, 0.05)
                odds = max(0.01, min(0.99, market_odds + odds_variation))
                # Ensure odds precision matches schema (3,2) 
                odds = round(odds, 2)
                
                is_yes = random.random() < odds
                
                bets_data.append((user_id, market_id, odds, amount, is_yes))
                user_total_bets += amount
            
            if user_total_bets > 0:
                balance_updates.append((user_total_bets, user_id))
        
        # Batch insert bets using SQL loader
        if bets_data:
            try:
                insert_bet_query = sql_loader.get_query('bets.insert_bet')
                cursor.executemany(insert_bet_query, bets_data)
                connection.commit()
            except Error as e:
                print(f"Error inserting bets: {e}")
                connection.rollback()
                continue
        
        # Batch update balances using SQL loader
        if balance_updates:
            try:
                update_balance_query = sql_loader.get_query('bets.update_user_balance')
                cursor.executemany(update_balance_query, balance_updates)
                connection.commit()
            except Error as e:
                print(f"Error updating balances: {e}")
                connection.rollback()
                continue
    
    cursor.close()

def create_production_comments(connection, user_ids: List[int], market_ids: List[int]):
    """Create realistic comment threads with varied engagement"""
    cursor = connection.cursor()
    
    # Validate inputs
    if not user_ids or not market_ids:
        print("No user IDs or market IDs available for comments")
        cursor.close()
        return
    
    # Comment templates and components
    comment_templates = [
        "I {sentiment} this prediction because {reason}",
        "The odds seem {odds_opinion}. {explanation}",
        "Based on {evidence}, I think {conclusion}",
        "Looking at {factor}, this market might {prediction}",
        "{timeframe} update: {observation}"
    ]
    
    sentiments = ['agree with', 'disagree with', 'am uncertain about']
    reasons = [
        'the historical data suggests a different outcome',
        'recent events point in this direction',
        'market sentiment seems overly optimistic',
        'the fundamentals are strong',
        'there are too many unknown variables'
    ]
    odds_opinions = ['too high', 'too low', 'about right', 'misaligned with reality']
    explanations = [
        'Market makers seem to be overlooking key factors.',
        'Recent developments support this view.',
        'Historical patterns suggest a correction is due.',
        'The crowd wisdom here is probably accurate.'
    ]
    evidence = ['technical analysis', 'fundamental data', 'expert opinions', 'market trends']
    conclusions = [
        'this is likely to go up',
        'we might see a reversal soon',
        'the current trend will continue',
        'volatility will increase'
    ]
    factors = ['volume patterns', 'price action', 'market sentiment', 'news flow']
    predictions = ['trend upward', 'see increased volatility', 'stabilize', 'correct downward']
    timeframes = ['Daily', 'Weekly', 'Monthly', 'Short-term', 'Long-term']
    observations = [
        'seeing increased activity',
        'noticing a shift in sentiment',
        'volume is picking up',
        'momentum is building'
    ]
    
    print("Creating comments...")
    # Process markets in batches for comments
    for market_id in tqdm(market_ids):
        # Reduce number of root comments for scale
        num_root_comments = random.randint(2, 5)
        
        for _ in range(num_root_comments):
            try:
                # Create root comment
                user_id = random.choice(user_ids)
                template = random.choice(comment_templates)
                
                content = template.format(
                    sentiment=random.choice(sentiments),
                    reason=random.choice(reasons),
                    odds_opinion=random.choice(odds_opinions),
                    explanation=random.choice(explanations),
                    evidence=random.choice(evidence),
                    conclusion=random.choice(conclusions),
                    factor=random.choice(factors),
                    prediction=random.choice(predictions),
                    timeframe=random.choice(timeframes),
                    observation=random.choice(observations)
                )
                
                # Use SQL loader for comment insertion
                insert_comment_query = sql_loader.get_query('comments.insert_comment')
                cursor.execute(insert_comment_query, (user_id, market_id, content))
                
                root_comment_id = cursor.lastrowid
                
                # Reduce number of replies for scale
                num_replies = random.randint(0, 3)
                
                # Create replies one by one to get correct IDs
                for _ in range(num_replies):
                    replier_id = random.choice(user_ids)
                    reply_template = random.choice(comment_templates)
                    reply_content = reply_template.format(
                        sentiment=random.choice(sentiments),
                        reason=random.choice(reasons),
                        odds_opinion=random.choice(odds_opinions),
                        explanation=random.choice(explanations),
                        evidence=random.choice(evidence),
                        conclusion=random.choice(conclusions),
                        factor=random.choice(factors),
                        prediction=random.choice(predictions),
                        timeframe=random.choice(timeframes),
                        observation=random.choice(observations)
                    )
                    
                    # Insert reply comment
                    cursor.execute(insert_comment_query, (replier_id, market_id, reply_content))
                    reply_comment_id = cursor.lastrowid
                    
                    # Create parent-child relationship
                    create_parent_child_query = sql_loader.get_query('comments.create_parent_child_relationship')
                    cursor.execute(create_parent_child_query, (root_comment_id, reply_comment_id))
                
                connection.commit()
                
            except Error as e:
                print(f"Error creating comment thread: {e}")
                connection.rollback()
                continue
    
    cursor.close()

def main():
    """Main execution function"""
    start_time = time.time()
    print("Starting production data generation...")
    
    connection = get_db_connection()
    if not connection:
        return
    
    try:
        # Fetch markets from Polymarket API (reusing existing logic)
        print("\nFetching markets from API...")
        markets_data = fetch_polymarket_markets()
        
        # Create markets from API data (reusing existing logic)
        print("\nCreating markets...")
        from seed_database import create_markets_from_api
        market_ids = create_markets_from_api(connection, markets_data)
        
        if not market_ids:
            raise Exception("No markets were created. Cannot proceed.")
        
        print(f"\nCreating production dataset with 100 users...")
        
        # Create users
        print("\nCreating users...")
        user_ids = create_production_users(connection, 100)
        print(f"Created {len(user_ids)} users")
        
        # Create bets
        print("\nCreating bets...")
        create_production_bets(connection, user_ids, market_ids)
        
        # Create comments and replies
        print("\nCreating comments and replies...")
        create_production_comments(connection, user_ids, market_ids)
        
        # Final commit to ensure all changes are saved
        connection.commit()
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"\nProduction dataset creation completed in {duration:.2f} seconds!")
        
        # Show final statistics
        cursor = connection.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM markets")
        market_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM bets")
        bet_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM comments")
        comment_count = cursor.fetchone()[0]
        cursor.execute("SELECT COUNT(*) FROM isParentOf")
        thread_count = cursor.fetchone()[0]
        
        print(f"\nFinal Statistics:")
        print(f"- Users: {user_count}")
        print(f"- Markets: {market_count}")
        print(f"- Bets: {bet_count}")
        print(f"- Comments: {comment_count}")
        print(f"- Comment Threads: {thread_count}")
        
        cursor.close()
        
    except Exception as e:
        print(f"Error in main execution: {e}")
        connection.rollback()
        import traceback
        traceback.print_exc()
    finally:
        connection.close()

if __name__ == "__main__":
    main() 