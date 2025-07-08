# SQL Files Organization

This directory contains all SQL queries used by the backend application, organized by functionality.

## Structure

```
sql/
├── auth/                           # Authentication related queries
│   ├── check_username_exists.sql   # Check if username already exists
│   ├── check_email_exists.sql      # Check if email already exists
│   ├── insert_user.sql             # Insert new user registration
│   └── get_user_by_username.sql    # Get user for login validation
├── markets/                        # Market related queries
│   ├── get_all_markets.sql         # Get all active markets
│   ├── get_market_by_id.sql        # Get specific market details
│   ├── get_market_bets.sql         # Get all bets for a market
│   ├── get_market_volume_distribution.sql  # Get YES/NO volume for odds calculation
│   ├── update_market_odds.sql      # Update market odds
│   └── update_market_volume.sql    # Update market volume
├── bets/                           # Betting related queries
│   ├── insert_bet.sql              # Insert new bet
│   ├── update_user_balance.sql     # Update user balance after bet
│   └── get_user_balance.sql        # Get user balance for validation
├── comments/                       # Comment related queries
│   ├── get_market_comments.sql     # Get all comments for a market
│   ├── get_comment_parent_relationships.sql  # Get parent-child relationships
│   ├── insert_comment.sql          # Insert new comment
│   ├── insert_reply.sql            # Insert reply comment
│   └── create_parent_child_relationship.sql  # Create parent-child relationship
└── validation/                     # Validation queries
    ├── check_market_exists.sql     # Check if market exists
    ├── check_market_active.sql     # Check if market exists and is active
    ├── check_user_exists.sql       # Check if user exists
    └── check_comment_exists_in_market.sql  # Check if comment exists in market
```

## Usage

The SQL files are loaded automatically by the `SQLLoader` class in `sql_loader.py`. Queries are accessed using dot notation based on the directory structure:

```python
from sql_loader import SQLLoader

sql = SQLLoader()

# Access queries using dot notation
cursor.execute(sql.get_query('auth.check_username_exists'), (username,))
cursor.execute(sql.get_query('markets.get_all_markets'))
cursor.execute(sql.get_query('bets.insert_bet'), (user_id, market_id, odds, amount, prediction))
```

## Benefits

1. **Separation of Concerns**: SQL logic is separated from Python business logic
2. **Maintainability**: Easy to modify queries without touching Python code
3. **Reusability**: Queries can be reused across different parts of the application
4. **Version Control**: SQL changes are tracked separately and clearly
5. **Testing**: SQL queries can be tested independently
6. **Organization**: Related queries are grouped together logically

## Adding New Queries

1. Create a new `.sql` file in the appropriate directory
2. Write your SQL query using `%s` placeholders for parameters
3. The query will be automatically loaded and available using the dot notation path

Example:
- File: `sql/markets/get_market_statistics.sql`
- Access: `sql.get_query('markets.get_market_statistics')` 