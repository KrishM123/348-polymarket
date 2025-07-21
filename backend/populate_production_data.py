#!/usr/bin/env python3
"""
Production data population script for Polymarket clone
Builds upon seed_database.py to create a rich, realistic dataset
while keeping the existing market data from the Polymarket API
"""

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

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'polymarket'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE', 'polymarket')
}

fake = faker.Faker()
BATCH_SIZE = 100
COMMIT_FREQUENCY = 1000
sql_loader = SQLLoader()

def get_db_connection():
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        connection.autocommit = False
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def create_production_users(connection, num_users: int = 100) -> List[int]:
    cursor = connection.cursor()
    user_ids = []
    
    user_types = [
        {'type': 'whale', 'balance_range': (50000, 200000), 'probability': 0.05},
        {'type': 'active_trader', 'balance_range': (10000, 50000), 'probability': 0.15},
        {'type': 'regular', 'balance_range': (1000, 10000), 'probability': 0.50},
        {'type': 'novice', 'balance_range': (100, 1000), 'probability': 0.30}
    ]
    
    users_data = []
    for i in tqdm(range(num_users), desc="Generating users"):
        username = fake.user_name()
        email = fake.email()
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
    
    for i in tqdm(range(0, len(users_data), BATCH_SIZE), desc="Inserting users"):
        batch = users_data[i:i + BATCH_SIZE]
        try:
            insert_user_query = sql_loader.get_query('auth.insert_user')
            cursor.executemany(insert_user_query, [(user[0], user[1], user[2], user[3]) for user in batch])
            
            cursor.execute("SELECT uid FROM users ORDER BY uid DESC LIMIT %s", (len(batch),))
            batch_ids = [row[0] for row in cursor.fetchall()]
            batch_ids.reverse()
            
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

def create_production_bets(connection, user_ids: List[int], markets_data: List[Dict[str, Any]]):
    cursor = connection.cursor()
    
    patterns = [
        {'type': 'high_roller', 'amt_range': (1000, 10000), 'frequency': 0.1},
        {'type': 'medium_stake', 'amt_range': (100, 1000), 'frequency': 0.3},
        {'type': 'small_stake', 'amt_range': (10, 100), 'frequency': 0.6}
    ]
    
    insert_bet_sql = sql_loader.get_query('bets.insert_bet_with_timestamp')
    update_balance_sql = sql_loader.get_query('bets.update_user_balance')
    
    cursor.execute("SELECT mid, podd FROM markets")
    market_odds_map = dict(cursor.fetchall())
    
    if not user_ids or not markets_data:
        cursor.close()
        return

    market_map = {market['mid']: market for market in markets_data}
    market_ids = list(market_map.keys())
    
    # Track yes/no counts for each market to enforce distribution
    market_bet_counts = {mid: {'yes': 0, 'no': 0} for mid in market_ids}
    
    for i in tqdm(range(len(user_ids)), desc="Creating bets for users"):
        user_id = user_ids[i]
        
        cursor.execute("SELECT balance FROM users WHERE uid = %s", (user_id,))
        balance = float(cursor.fetchone()[0])
        
        num_bets = int(np.random.normal(loc=min(5, balance / 100), scale=2, size=1)[0])
        num_bets = max(1, min(10, num_bets))
        
        user_total_bets = 0
        
        for _ in range(num_bets):
            if not market_ids:
                continue
                
            market_id = random.choice(market_ids)
            market_info = market_map[market_id]
            market_created_at = market_info['createdAt']
            now = datetime.now()

            if market_created_at > now:
                 bet_created_at = now
            else:
                time_diff_seconds = (now - market_created_at).total_seconds()
                random_seconds = random.uniform(0, time_diff_seconds)
                bet_created_at = market_created_at + timedelta(seconds=random_seconds)

            pattern = random.choices(
                patterns,
                weights=[p['frequency'] for p in patterns],
                k=1
            )[0]
            
            max_bet = min(pattern['amt_range'][1], balance * 0.2)
            min_bet = min(pattern['amt_range'][0], max_bet)
            
            if min_bet <= 0:
                continue
                
            amount = round(random.uniform(min_bet, max_bet), 2)
            
            if amount > (balance - user_total_bets) or amount <= 0:
                continue
            
            if market_id not in market_odds_map:
                continue
                
            market_odds = float(market_odds_map[market_id])
            odds_variation = random.uniform(-0.05, 0.05)
            odds = round(max(0.01, min(0.99, market_odds + odds_variation)), 2)
            
            # Enforce 35/65 distribution
            yes_count = market_bet_counts[market_id]['yes']
            no_count = market_bet_counts[market_id]['no']
            total_bets = yes_count + no_count
            
            if total_bets > 0:
                yes_ratio = yes_count / total_bets
                if yes_ratio > 0.65:
                    is_yes = False
                elif yes_ratio < 0.35:
                    is_yes = True
                else:
                    is_yes = random.random() < odds
            else:
                is_yes = random.random() < odds
            
            if is_yes:
                market_bet_counts[market_id]['yes'] += 1
            else:
                market_bet_counts[market_id]['no'] += 1
            
            try:
                cursor.execute(insert_bet_sql, (user_id, market_id, odds, amount, is_yes, bet_created_at))
                user_total_bets += amount
            except Error as e:
                print(f"Error inserting bet: {e}")
                connection.rollback()
                continue
        
        if user_total_bets > 0:
            try:
                cursor.execute(update_balance_sql, (user_total_bets, user_id))
            except Error as e:
                print(f"Error updating balance: {e}")
                connection.rollback()
                continue
        
        if (i + 1) % COMMIT_FREQUENCY == 0:
            connection.commit()
    
    connection.commit()
    cursor.close()

def update_market_volumes(connection):
    """Update market volumes based on the sum of bet amounts"""
    cursor = connection.cursor()
    
    try:
        # Calculate total bet volume for each market
        volume_query = """
            SELECT m.mid, SUM(b.amt) 
            FROM markets m
            JOIN bets b ON m.mid = b.mid
            GROUP BY m.mid
        """
        cursor.execute(volume_query)
        market_volumes = cursor.fetchall()
        
        # Update volume for each market
        update_volume_query = "UPDATE markets SET volume = %s WHERE mid = %s"
        
        for market_id, total_volume in tqdm(market_volumes, desc="Updating market volumes"):
            cursor.execute(update_volume_query, (total_volume, market_id))
        
        connection.commit()
        print(f"\nSuccessfully updated volumes for {len(market_volumes)} markets.")
        
    except Error as e:
        print(f"Error updating market volumes: {e}")
        connection.rollback()
    finally:
        cursor.close()

def create_production_comments(connection, user_ids: List[int], markets_data: List[Dict[str, Any]]):
    cursor = connection.cursor()
    
    if not user_ids or not markets_data:
        cursor.close()
        return
    
    market_map = {market['mid']: market for market in markets_data}
    market_ids = list(market_map.keys())

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
    
    for market_id in tqdm(market_ids, desc="Creating comments"):
        num_root_comments = random.randint(2, 5)
        market_info = market_map[market_id]
        market_created_at = market_info['createdAt']
        now = datetime.now()
        
        for _ in range(num_root_comments):
            try:
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

                if market_created_at > now:
                    comment_created_at = now
                else:
                    time_diff_seconds = (now - market_created_at).total_seconds()
                    random_seconds = random.uniform(0, time_diff_seconds)
                    comment_created_at = market_created_at + timedelta(seconds=random_seconds)
                
                insert_comment_query = sql_loader.get_query('comments.insert_comment_with_timestamp')
                cursor.execute(insert_comment_query, (user_id, market_id, content, comment_created_at))
                
                root_comment_id = cursor.lastrowid
                
                num_replies = random.randint(0, 3)
                
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

                    if comment_created_at > now:
                        reply_created_at = now
                    else:
                        time_diff_seconds = (now - comment_created_at).total_seconds()
                        random_seconds = random.uniform(0, time_diff_seconds)
                        reply_created_at = comment_created_at + timedelta(seconds=random_seconds)

                    cursor.execute(insert_comment_query, (replier_id, market_id, reply_content, reply_created_at))
                    reply_comment_id = cursor.lastrowid
                    
                    create_parent_child_query = sql_loader.get_query('comments.create_parent_child_relationship')
                    cursor.execute(create_parent_child_query, (root_comment_id, reply_comment_id))
                
                connection.commit()
                
            except Error as e:
                print(f"Error creating comment thread: {e}")
                connection.rollback()
                continue
    
    cursor.close()

def create_markets_from_csv(connection, market_names: List[str]) -> List[Dict[str, Any]]:
    """Create markets from a list of names from a CSV file."""
    cursor = connection.cursor()
    markets_data = []
    
    for name in tqdm(market_names, desc="Creating markets from CSV"):
        try:
            description = f"Market for '{name}'."
            volume = round(random.uniform(1.0, 10.0), 2)
            odds = 0.50
            end_date = datetime.now() + timedelta(days=random.randint(30, 90))
            createdAt = datetime.now() - timedelta(days=random.randint(1, 29))

            cursor.execute(
                "INSERT INTO markets (name, description, podd, volume, end_date) VALUES (%s, %s, %s, %s, %s)",
                (name, description, odds, volume, end_date)
            )
            
            market_id = cursor.lastrowid
            
            markets_data.append({'mid': market_id, 'createdAt': createdAt})
        
        except Error as e:
            print(f"Error creating market from CSV: {e}")
            connection.rollback()
    
    connection.commit()
    cursor.close()
    return markets_data

def main():
    start_time = time.time()
    print("Starting production data generation...")
    
    connection = get_db_connection()
    if not connection:
        return
    
    try:
        # Read market names from production_data.csv
        with open('production_data.csv', 'r') as f:
            market_names = [line.strip() for line in f.readlines()[1:]] # Skip header

        markets_data = create_markets_from_csv(connection, market_names)
        
        if not markets_data:
            raise Exception("No markets were created. Cannot proceed.")
        
        print(f"\nCreating production dataset with 100 users...")
        
        user_ids = create_production_users(connection, 100)
        print(f"Created {len(user_ids)} users")
        
        create_production_bets(connection, user_ids, markets_data)
        
        update_market_volumes(connection)
        
        create_production_comments(connection, user_ids, markets_data)
        
        connection.commit()
        
        end_time = time.time()
        duration = end_time - start_time
        print(f"\nProduction dataset creation completed in {duration:.2f} seconds!")
        
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