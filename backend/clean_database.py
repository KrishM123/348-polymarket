#!/usr/bin/env python3
"""
Database Cleaner Script
Removes all rows from all tables while preserving the table structure.
"""

import mysql.connector
from mysql.connector import Error
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

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
        connection.autocommit = False  # We'll handle transactions manually
        return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

def clean_database():
    """Remove all rows from all tables in the correct order to respect foreign key constraints"""
    
    # Tables in order of deletion (child tables first, then parent tables)
    tables = [
        'isParentOf',    # Child table for comment relationships
        'comments',      # Child table for markets and users
        'bets',         # Child table for markets and users
        'markets',      # Parent table
        'users'         # Parent table
    ]
    
    connection = get_db_connection()
    if not connection:
        print("Failed to connect to database")
        return False
    
    cursor = connection.cursor()
    
    try:
        print("Starting database cleanup...")
        
        # Disable foreign key checks temporarily to avoid constraint issues
        cursor.execute("SET FOREIGN_KEY_CHECKS = 0")
        
        total_rows_deleted = 0
        
        for table in tables:
            try:
                # Count rows before deletion
                cursor.execute(f"SELECT COUNT(*) FROM {table}")
                row_count = cursor.fetchone()[0]
                
                # Delete all rows from the table
                cursor.execute(f"DELETE FROM {table}")
                deleted_rows = cursor.rowcount
                
                print(f"✓ {table}: Deleted {deleted_rows} rows (was {row_count})")
                total_rows_deleted += deleted_rows
                
            except Error as e:
                print(f"✗ Error cleaning table {table}: {e}")
                connection.rollback()
                return False
        
        # Re-enable foreign key checks
        cursor.execute("SET FOREIGN_KEY_CHECKS = 1")
        
        # Commit all changes
        connection.commit()
        
        print(f"\n✅ Database cleanup completed successfully!")
        print(f"Total rows deleted: {total_rows_deleted}")
        
        # Verify all tables are empty
        print("\nVerifying cleanup...")
        for table in tables:
            cursor.execute(f"SELECT COUNT(*) FROM {table}")
            remaining_rows = cursor.fetchone()[0]
            if remaining_rows == 0:
                print(f"✓ {table}: Empty")
            else:
                print(f"⚠ {table}: Still has {remaining_rows} rows")
        
        return True
        
    except Error as e:
        print(f"Error during database cleanup: {e}")
        connection.rollback()
        return False
    
    finally:
        cursor.close()
        connection.close()

def main():
    """Main function to run the database cleaner"""
    print("=" * 50)
    print("DATABASE CLEANER")
    print("=" * 50)
    print("This script will remove ALL data from your database.")
    print("Table structures will be preserved.")
    print()
    
    # Confirm with user
    response = input("Are you sure you want to proceed? (yes/no): ").lower().strip()
    
    if response not in ['yes', 'y']:
        print("Operation cancelled.")
        return
    
    print()
    
    if clean_database():
        print("\n🎉 Database has been successfully cleaned!")
    else:
        print("\n❌ Database cleanup failed!")

if __name__ == "__main__":
    main() 