#!/usr/bin/env python3

import mysql.connector
from mysql.connector import Error
from datetime import datetime
import os
from dotenv import load_dotenv
import sys

# Load environment variables
load_dotenv()

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

def format_table_output(results, headers, title):
    """Format query results into a table format"""
    if not results:
        return f"\n{title}\n{'='*80}\nNo results found.\n"
    
    # Create the header
    output = f"\n{title}\n{'='*80}\n"
    
    # Format headers
    header_line = " | ".join(f"{header:>15}" for header in headers)
    output += header_line + "\n"
    output += "-" * len(header_line) + "\n"
    
    # Format data rows
    for row in results:
        row_line = " | ".join(f"{str(value):>15}" for value in row)
        output += row_line + "\n"
    
    return output

def run_query(cursor, query, title, headers):
    """Execute a query and return formatted output"""
    try:
        cursor.execute(query)
        results = cursor.fetchall()
        return format_table_output(results, headers, title)
    except Error as e:
        return f"\nError executing query for {title}: {e}\n"

def run_sql_file(sql_filename, output_filename, test_name):
    """Run a SQL file and generate output"""
    print(f"\n{'='*60}")
    print(f"Running {test_name}")
    print(f"{'='*60}")
    
    # Read the SQL file
    try:
        with open(sql_filename, 'r') as f:
            sql_content = f.read()
    except FileNotFoundError:
        print(f"Error: {sql_filename} file not found!")
        return False
    
    # Split queries by comments
    queries = []
    current_query = ""
    current_title = ""
    
    for line in sql_content.split('\n'):
        line = line.strip()
        if line.startswith('-- '):
            if current_query.strip():
                queries.append((current_title, current_query.strip()))
            current_title = line[3:].strip()
            current_query = ""
        elif line and not line.startswith('--'):
            current_query += line + "\n"
    
    # Add the last query
    if current_query.strip():
        queries.append((current_title, current_query.strip()))
    
    # Connect to database
    connection = get_db_connection()
    if not connection:
        print("Failed to connect to database")
        return False
    
    cursor = connection.cursor()
    
    # Define headers for each query type
    query_headers = {
        "All Active Markets (Top 10)": ["mid", "name", "description", "podd", "volume", "end_date"],
        "All Markets Including Expired (Top 10)": ["mid", "name", "description", "podd", "volume", "end_date"],
        "Market by ID (First Market)": ["mid", "name", "description", "podd", "volume", "end_date"],
        "Market Bets for Market ID 1 (Top 10)": ["bId", "uId", "mId", "market_name", "podd", "amt", "yes", "createdAt", "uname"],
        "Volume Distribution for Market ID 1": ["yes_volume", "no_volume"],
        "Markets with Highest Volume (Top 10)": ["mid", "name", "description", "podd", "volume", "end_date"],
        "Markets with Most Bets (Top 10)": ["mid", "name", "description", "podd", "volume", "bet_count"],
        "Recent Betting Activity (Top 10)": ["bId", "uId", "mId", "market_name", "podd", "amt", "yes", "createdAt", "uname"],
        "Market Statistics Summary (Top 10 by Volume)": ["mid", "name", "podd", "volume", "end_date", "total_bets", "yes_volume", "no_volume", "unique_bettors"],
        "Active Markets with Recent Activity (Top 10)": ["mid", "name", "description", "podd", "volume", "end_date", "last_bet_time"]
    }
    
    # Generate output
    output = f"POLYMARKET DATABASE {test_name.upper()} RESULTS\n{'='*80}\n"
    output += f"Generated on: {datetime.now()}\n{'='*80}\n"
    
    # Execute each query
    for title, query in queries:
        if title in query_headers:
            headers = query_headers[title]
            result = run_query(cursor, query, title, headers)
            output += result
        else:
            print(f"Warning: Unknown query title: {title}")
    
    # Close database connection
    cursor.close()
    connection.close()
    
    # Write to file
    with open(output_filename, 'w') as f:
        f.write(output)
    
    # Also print to console
    print(output)
    
    print(f"\nResults saved to {output_filename}")
    return True

def main():
    print("POLYMARKET DATABASE TEST RUNNER")
    print("="*60)
    
    # Run both test files
    success1 = run_sql_file('test-production.sql', 'test-production.out', 'Production Test')
    success2 = run_sql_file('test-sample.sql', 'test-sample.out', 'Sample Test')
    
    if success1 and success2:
        print(f"\n{'='*60}")
        print("ALL TESTS COMPLETED SUCCESSFULLY!")
        print(f"{'='*60}")
        print("Generated files:")
        print("- test-production.out")
        print("- test-sample.out")
    else:
        print(f"\n{'='*60}")
        print("SOME TESTS FAILED!")
        print(f"{'='*60}")
        if not success1:
            print("- test-production.sql failed")
        if not success2:
            print("- test-sample.sql failed")

if __name__ == "__main__":
    main() 