#!/usr/bin/env python3
"""
Database inspection script
"""

import mysql.connector
from dotenv import load_dotenv
import os
from datetime import datetime

load_dotenv()

DB_CONFIG = {
    'host': os.getenv('DB_HOST', '127.0.0.1'),
    'user': os.getenv('DB_USER', 'polymarket'),
    'password': os.getenv('DB_PASSWORD'),
    'database': os.getenv('DB_DATABASE', 'polymarket')
}

def show_stats(cursor):
    """Show basic database statistics"""
    tables = ['users', 'markets', 'bets', 'comments']
    
    print("Database Statistics:")
    for table in tables:
        cursor.execute(f"SELECT COUNT(*) FROM {table}")
        count = cursor.fetchone()[0]
        print(f"  {table}: {count}")
    
    # Market stats
    cursor.execute("SELECT MIN(volume), MAX(volume), AVG(volume) FROM markets WHERE volume > 0")
    result = cursor.fetchone()
    if result[0]:
        print(f"  volume range: ${result[0]:,.0f} - ${result[1]:,.0f} (avg: ${result[2]:,.0f})")

def check_duplicates(cursor):
    """Check for duplicates"""
    print("\nDuplicate Check:")
    
    # Check users
    cursor.execute("SELECT COUNT(*) FROM (SELECT uname FROM users GROUP BY uname HAVING COUNT(*) > 1) as dups")
    user_dups = cursor.fetchone()[0]
    print(f"  duplicate users: {user_dups}")
    
    # Check markets
    cursor.execute("SELECT COUNT(*) FROM (SELECT name FROM markets GROUP BY name HAVING COUNT(*) > 1) as dups")
    market_dups = cursor.fetchone()[0]
    print(f"  duplicate markets: {market_dups}")

def show_sample_data(cursor, table, limit=5):
    """Show sample records from a table"""
    cursor.execute(f"SELECT * FROM {table} LIMIT {limit}")
    results = cursor.fetchall()
    
    if results:
        print(f"\n{table.upper()} (showing {len(results)} of total):")
        for row in results:
            # Format row data concisely
            formatted = []
            for item in row:
                if isinstance(item, datetime):
                    formatted.append(item.strftime("%m/%d %H:%M"))
                elif isinstance(item, str) and len(item) > 30:
                    formatted.append(item[:30] + "...")
                else:
                    formatted.append(str(item))
            print(f"  {' | '.join(formatted)}")

def main():
    """Main inspection function"""
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        show_stats(cursor)
        check_duplicates(cursor)
        
        # Show sample data from key tables
        show_sample_data(cursor, 'users', 3)
        show_sample_data(cursor, 'markets', 5)
        show_sample_data(cursor, 'bets', 5)
        show_sample_data(cursor, 'comments', 3)
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    main() 