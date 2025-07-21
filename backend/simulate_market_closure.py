#!/usr/bin/env python3
"""
Test Script for Market Resolution and Payout Simulation

This script allows for the immediate testing of the market resolution
and payout process without waiting for the scheduled daily event.

It performs the following actions:
1.  Selects a random, active market from the database.
2.  Artificially sets its end_date to a time in the past to make it 'expired'.
3.  Calls the `resolve_markets()` stored procedure to trigger the payout logic.
4.  Reports on the "before" and "after" state of the market to verify the process.

WARNING: This script performs a DESTRUCTIVE action on one market
for testing purposes. The selected market's volume will be permanently
set to 0.
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Database configuration
DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'polymarket'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE', 'polymarket')
}

def get_db_connection():
    """Create and return a database connection."""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def simulate_market_closure():
    """Finds an active market, expires it, and runs the resolution procedure."""
    connection = get_db_connection()
    if not connection:
        return

    cursor = connection.cursor(dictionary=True)
    
    try:
        print("--- Market Resolution Simulation ---")
        
        # 1. Find a random, active, unexpired market to use for the test
        print("\nStep 1: Selecting a random active market...")
        cursor.execute("SELECT mid, name, volume, podd, end_date FROM markets WHERE volume > 0 AND end_date > NOW() ORDER BY RAND() LIMIT 1")
        market = cursor.fetchone()
        
        if not market:
            print("\n[ERROR] No active, unexpired markets found to test. Please seed the database with fresh markets.")
            return

        market_id = market['mid']
        print(f"   -> Found market: '{market['name']}' (ID: {market_id})")
        print(f"   -> Initial State: Volume=${market['volume']}, End Date: {market['end_date']}")

        # 2. Artificially expire the market
        print("\nStep 2: Artificially setting the market's end_date to yesterday...")
        cursor.execute("UPDATE markets SET end_date = DATE_SUB(NOW(), INTERVAL 1 DAY) WHERE mid = %s", (market_id,))
        connection.commit()
        print("   -> Market end_date updated successfully.")

        # 3. Call the stored procedure
        print("\nStep 3: Calling the `resolve_markets()` stored procedure...")
        cursor.callproc('resolve_markets')
        connection.commit()
        print("   -> Stored procedure executed.")
        
        # 4. Verify the outcome
        print("\nStep 4: Verifying the market's final state...")
        cursor.execute("SELECT volume FROM markets WHERE mid = %s", (market_id,))
        final_market_state = cursor.fetchone()

        final_volume = final_market_state['volume']
        
        if final_volume == 0:
            print("\n[SUCCESS] The market was successfully resolved and paid out.")
            print(f"   -> Final State: Volume=${final_volume}")
        else:
            print("\n[FAILURE] The market was not resolved correctly.")
            print(f"   -> Final State: Volume=${final_volume}")

        print("\n--- Simulation Complete ---")

    except Error as e:
        print(f"\n[ERROR] A database error occurred: {e}")
    finally:
        if connection.is_connected():
            cursor.close()
            connection.close()

if __name__ == "__main__":
    simulate_market_closure() 