# Polymarket Clone

A Flask-based prediction market application that mimics Polymarket functionality.

## Features

- User authentication and account management
- Market creation and management
- Betting system with odds and amounts
- Comments and discussions on markets
- Real-time market data from Polymarket APIs

## Setup Instructions

### 1. Database Setup

First, make sure you have MySQL installed and running. Then create the database:

```bash
# Login to MySQL
mysql -u root -p

# Create user and database
CREATE USER 'polymarket'@'localhost' IDENTIFIED BY 'YourStrongPassword!';
CREATE DATABASE polymarket;
GRANT ALL PRIVILEGES ON polymarket.* TO 'polymarket'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Create tables
mysql -u polymarket -p polymarket < schema.sql
```

### 2. Python Environment Setup

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Linux/Mac
# or
venv\Scripts\activate     # On Windows

# Install dependencies
pip install -r requirements.txt
```

### 3. Database Seeding

Seed the database with sample data and real market data from Polymarket:

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the seeding script
python3 seed_database.py
```

The seeding script will:
- Fetch real market data from Polymarket APIs (Gamma and CLOB)
- Create 5 sample users with test credentials
- Create markets based on real Polymarket data (with fallback to sample data)
- Generate sample bets and comments for testing

### 4. Production Data Generation

For production-like data volume and patterns, use the production data generation script:

```bash
source venv/bin/activate

python3 populate_production_data.py
```

The production data generation script will:
- Generate 10,000 realistic user profiles with varied characteristics:
  - Whales (high balance, large bets), Active traders (medium balance, frequent bets), Regular users (moderate activity), Novice users (small balance, occasional bets)
- Create realistic betting patterns and market interactions
- Generate threaded comments and discussions
- Preserve existing market data from Polymarket API

Note: The script takes approximately 30 minutes to run due to the volume of data being generated.

### 5. Run the Application

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the Flask app
python3 app.py
```

The application will be available at `http://localhost:5000`

## Test Credentials

After running the seeding script, you can use these test accounts:

- **Username:** `alice_trader` / **Password:** `testpassword123`
- **Username:** `bob_predictor` / **Password:** `testpassword123`
- **Username:** `charlie_analyst` / **Password:** `testpassword123`
- **Username:** `diana_investor` / **Password:** `testpassword123`
- **Username:** `eve_speculator` / **Password:** `testpassword123`

## API Endpoints

### Markets
- `GET /markets` - Get all active markets
- `GET /markets/<id>/bets` - Get all bets for a specific market
- `POST /markets/<id>/bets` - Place a new bet on a market

### Betting
When placing a bet via POST to `/markets/<id>/bets`, send JSON data:
```json
{
    "user_id": 1,
    "odds": 0.65,
    "amount": 100.0,
    "prediction": true
}
```

## Database Schema

- **users**: User accounts with authentication and balance
- **markets**: Prediction markets with questions and end dates
- **bets**: User bets on markets with odds and amounts
- **comments**: User comments on markets
- **isParentOf**: Threaded comment replies

## Data Sources

The seeding script fetches real market data from:
- [Polymarket Gamma API](https://gamma-api.polymarket.com) - Market metadata and questions
- [Polymarket CLOB API](https://clob.polymarket.com) - Trading data and active markets

## Testing

Run the API endpoint test:
```bash
python3 test_api.py
```

## Files

- `app.py` - Main Flask application
- `schema.sql` - Database schema
- `seed_database.py` - Database seeding script with Polymarket data
- `test_api.py` - API endpoint testing script
- `requirements.txt` - Python dependencies 