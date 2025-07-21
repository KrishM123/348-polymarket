# Updated Polymarket Clone Presentation Script

## D1. Application Overview

### Slide 1: Title Slide
**Title:** Polymarket Clone: Predicting the Future, Together  
**Subtitle:** CS 348 Project Demo  
**Team Members:** Akshar Barot, Darsh Shah, Krish Modi, Pearl Natalia, Sanskriti Akhoury

**Script (1-2 minutes):**
"Good afternoon everyone, and welcome to our demo of the Polymarket Clone. We're Team, and we're excited to show you a fully functional prediction market application that reimagines event-based betting.

Our application is a comprehensive Polymarket clone that displays real betting events with dynamic odds calculation, user authentication, and a complete betting ecosystem. We utilize real market data from the Polymarket API, including event details, betting amounts, and calculated probabilities that update in real-time based on market activity. Each user has a virtual wallet displaying their balance, active holdings, and comprehensive profit tracking including both realized and unrealized gains.

At its core, our platform operates on a simple yet powerful mechanic. When you bet on a market, you're not just placing a wager; you're buying shares of a potential outcome. If a market has a 60% chance of resolving to 'YES', a 'YES' share costs $0.60, and a 'NO' share costs $0.40. If the market resolves to 'YES', every 'YES' share you own becomes worth $1, and 'NO' shares become worthless. This dynamic, where the share price reflects the market's perceived probability (`podd`), is what allows for real-time odds and creates a vibrant trading ecosystem.

The primary users of our application are individuals interested in prediction markets, allowing them to browse markets, place bets with dynamic odds, sell holdings, participate in threaded discussions, and track their performance through detailed analytics. Our system also includes a leaderboard showing user profitability rankings and comprehensive market management features."

## D2. How to Use Your Application? (Demonstrating Functionalities/Features)

### Slide 2: System Support & Architecture
**Title:** Under the Hood: Our System Architecture

**Content:**

**Technology Stack:**
- **Frontend:** Next.js 14 with React, TypeScript, and Tailwind CSS
- **Backend:** Flask (Python) with JWT authentication
- **Database:** MySQL with optimized indexes and triggers
- **Communication:** RESTful API with CORS support
- **Queries:** Modularized SQL queries with performance timing
- **Deployment:** Local development with production-ready data generation
- **Data Plan:** Real Polymarket API integration + 10,000 synthetic users with realistic betting patterns

**Systems Architecture Diagram:**
```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────┐  │
│  │   Next.js 14    │  │   React/TSX     │  │      Tailwind CSS           │  │
│  │   (Port 3000)   │  │   Components    │  │      Styling                │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────────────────┘  │
│           │                      │                              │            │
│           │  ┌─────────────────────────────────────────────────┐            │
│           └──┤              API Client Layer                  │            │
│              │  • marketsAPI (lib/markets.ts)                 │            │
│              │  • usersAPI (lib/users.ts)                     │            │
│              │  • authAPI (lib/auth.ts)                       │            │
│              └─────────────────────────────────────────────────┘            │
│                              │                                              │
│                              │ HTTP Requests (CORS enabled)                │
│                              ▼                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              BACKEND LAYER                                  │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        Flask Application                               │ │
│  │                        (app.py - Port 5000)                           │ │
│  │                                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │ │
│  │  │   JWT Auth      │  │   CORS Setup    │  │    Error Handling       │ │ │
│  │  │   Middleware    │  │   (CORS app)    │  │    & Validation         │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    API Endpoints                                │   │ │
│  │  │  • /auth/login, /auth/register                                  │   │ │
│  │  │  • /markets, /markets/<id>, /markets/trending                  │   │ │
│  │  │  • /markets/<id>/bets (GET/POST)                               │   │ │
│  │  │  • /markets/<id>/comments (GET/POST)                           │   │ │
│  │  │  • /api/user-profits, /api/user-holdings                       │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                  Business Logic Layer                           │   │ │
│  │  │  • calculate_market_odds() - Dynamic odds calculation           │   │ │
│  │  │  • get_user_market_odds() - User-specific odds                  │   │ │
│  │  │  • Transaction management for betting                           │   │ │
│  │  │  • JWT token generation & validation                            │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                              │                                              │
│                              │ MySQL Connection                             │
│                              ▼                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              DATA LAYER                                     │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                        SQL Query System                               │ │
│  │                                                                         │ │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │ │
│  │  │   SQLLoader     │  │   QueryTimer    │  │    Modular SQL Files    │ │ │
│  │  │   (sql_loader.py)│  │ (query_timer.py)│  │  • auth/*.sql           │ │ │
│  │  │                 │  │                 │  │  • markets/*.sql         │ │ │
│  │  │ • Loads SQL     │  │ • Tracks perf   │  │  • bets/*.sql            │ │ │
│  │  │ • Caches queries│  │ • Thread-safe   │  │  • comments/*.sql        │ │ │
│  │  │ • Error handling│  │ • Real-time stats│  │  • validation/*.sql      │ │ │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────────┘ │ │
│  │                                                                         │ │
│  │  ┌─────────────────────────────────────────────────────────────────┐   │ │
│  │  │                    MySQL Database                               │   │ │
│  │  │                    (Port 3306)                                  │   │ │
│  │  │                                                                   │   │ │
│  │  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐              │   │ │
│  │  │  │    users    │  │   markets   │  │     bets    │              │   │ │
│  │  │  │             │  │             │  │             │              │   │ │
│  │  │  │ • uid (PK)  │  │ • mid (PK)  │  │ • bId (PK)  │              │   │ │
│  │  │  │ • uname     │  │ • name      │  │ • uId (FK)  │              │   │ │
│  │  │  │ • email     │  │ • podd      │  │ • mId (FK)  │              │   │ │
│  │  │  │ • balance   │  │ • volume    │  │ • amt       │              │   │ │
│  │  │  │ • password  │  │ • end_date  │  │ • yes       │              │   │ │
│  │  │  └─────────────┘  └─────────────┘  └─────────────┘              │   │ │
│  │  │                                                                   │   │ │
│  │  │  ┌─────────────┐  ┌─────────────┐                               │   │ │
│  │  │  │  comments   │  │ isParentOf  │                               │   │ │
│  │  │  │             │  │             │                               │   │ │
│  │  │  │ • cId (PK)  │  │ • pCId (FK) │                               │   │ │
│  │  │  │ • uId (FK)  │  │ • cCId (FK) │                               │   │ │
│  │  │  │ • mId (FK)  │  │             │                               │   │ │
│  │  │  │ • content   │  │ (Threaded   │                               │   │ │
│  │  │  │ • created_at│  │  comments)  │                               │   │ │
│  │  │  └─────────────┘  └─────────────┘                               │   │ │
│  │  │                                                                   │   │ │
│  │  │  ┌─────────────────────────────────────────────────────────────┐ │   │ │
│  │  │  │                    Database Indexes                        │ │   │ │
│  │  │  │  • idx_users_uname ON users(uname)                         │ │   │ │
│  │  │  │  • idx_markets_end_date ON markets(end_date)               │ │   │ │
│  │  │  │  • idx_bets_mId ON bets(mId)                               │ │   │ │
│  │  │  │  • idx_comments_mId ON comments(mId)                       │ │   │ │
│  │  │  │  • idx_comments_user_market ON comments(uId, mId)          │ │   │ │
│  │  │  └─────────────────────────────────────────────────────────────┘ │   │ │
│  │  └─────────────────────────────────────────────────────────────────┘   │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │
┌─────────────────────────────────────────────────────────────────────────────┐
│                              EXTERNAL INTEGRATION                           │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │                    Polymarket API Integration                          │ │
│  │  • Gamma API (gamma-api.polymarket.com) - Market metadata              │ │
│  │  • CLOB API (clob.polymarket.com) - Trading data                       │ │
│  │  • Real market data fetching in seed_database.py                       │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Data Flow Explanation:**

1. **Frontend Request Flow:**
   - User interacts with Next.js components (MarketCard, BettingForm, etc.)
   - Components call API functions from lib/markets.ts, lib/users.ts, lib/auth.ts
   - API functions make HTTP requests to Flask backend with JWT tokens

2. **Backend Processing Flow:**
   - Flask app.py receives HTTP requests on port 5000
   - JWT middleware validates authentication tokens
   - CORS middleware handles cross-origin requests
   - Route handlers process requests and call business logic functions
   - Business logic (odds calculation, transaction management) executes
   - SQLLoader loads appropriate SQL queries from modular files
   - QueryTimer tracks performance of each database operation

3. **Database Interaction Flow:**
   - MySQL connection established with connection pooling
   - SQL queries executed with parameters and timing
   - Results returned through cursor objects
   - Data serialized to JSON for API responses

4. **Performance Monitoring:**
   - QueryTimer class tracks execution times for all queries
   - Performance statistics available via /api/query-stats endpoint
   - Indexes optimize common query patterns
   - Thread-safe timing data collection

**Script (1-2 minutes):**
"Before we dive into the demo, let me walk you through our sophisticated system architecture that powers this prediction market application.

Our frontend is built with Next.js 14, providing a modern, responsive user interface with TypeScript for type safety and Tailwind CSS for styling. The frontend communicates with our backend through a well-defined API client layer that handles authentication, error handling, and data transformation.

The backend is powered by Flask with Python, running on port 5000. We've implemented JWT-based authentication with 24-hour token expiration, comprehensive CORS support for cross-origin requests, and a modular SQL query system. The backend includes sophisticated business logic for dynamic odds calculation, transaction management, and user analytics.

Our database layer uses MySQL with a carefully designed schema including five core tables: users, markets, bets, comments, and isParentOf for threaded discussions. We've implemented strategic indexing across all major query patterns, and our custom QueryTimer class provides real-time performance monitoring.

The system integrates with the real Polymarket API to fetch live market data, and our production data generation creates 10,000 realistic users with varied profiles and betting patterns. The entire architecture is designed for scalability, maintainability, and optimal performance.

What makes this architecture particularly sophisticated is how all components work together seamlessly - from the frontend's real-time data fetching to the backend's dynamic odds calculation to the database's optimized query execution. Each layer has been carefully designed to handle the complex requirements of a prediction market platform."

### Slide 3: Feature Demo: Walkthrough Introduction
**Title:** Feature Showcase: Navigating Our Polymarket Clone

**Content:** Live Demonstration of Key Features

**Script (Transition to Live Demo - 5-7 minutes for all features):**
"Now, let's move into the exciting part – a live demonstration of our Polymarket clone! We'll walk you through the key features we've implemented, showing you exactly how users interact with our application, and highlighting the sophisticated backend logic powering each interaction.

(Begin Live Demo - Ensure you have your application running and ready to show)"

**[DEMO SEGMENT 1: Login/Authentication (Feature 5)]**
**Script:** "First, let's start with user authentication. Our system uses JWT tokens for secure session management. Users can either log in with an existing account or sign up if they're new.

[SQL Complexity] When a user attempts to log in, our backend executes a SELECT query from the users table with username lookup, optimized with an index on users(uname). The password is securely compared using bcrypt, and upon successful authentication, we generate a JWT token with 24-hour expiration.

[SQL Complexity] For registration, we validate email format, check for existing usernames and emails using SELECT queries, hash the password with bcrypt, and insert the new user with a default balance of $0.00.

**Action:** Go to the login page. Attempt to log in with correct credentials (e.g., alice_trader / testpassword123). Show successful login and token generation. Briefly mention error handling for invalid credentials.

**[DEMO SEGMENT 2: View All Markets (Feature 1)]**
**Script:** "Once logged in, users are presented with our dynamic markets page. Here, you'll see a comprehensive list of all active betting events with real-time odds calculation. Each market card displays the name, description, current probability, volume, and end date.

[SQL Complexity] To populate this view, our backend executes a SELECT query filtering for active markets where end_date > NOW(), ordered by end date. The key innovation here is our dynamic odds calculation - for logged-in users, we exclude their own betting volume from the odds calculation to prevent manipulation, while for logged-out users, we show the full market odds.

[SQL Complexity] The odds calculation uses a sophisticated algorithm: we sum all YES and NO volume separately, apply a smoothing factor to prevent extreme odds, and calculate the probability as (yes_volume + smoothing) / (total_volume + 2*smoothing), ensuring odds stay between 0.01 and 0.99.

**Action:** Navigate to the main markets page. Show the toggle between "Latest" and "Trending" markets. Point out the dynamic odds calculation and how they change based on user login status.

**[DEMO SEGMENT 3: Place a Bet on an Outcome (Feature 3)]**
**Script:** "Let's dive into the core functionality: placing a bet. When you click on a market, you're taken to its detailed page with a sophisticated betting interface. Here, you can input your desired betting amount, select 'Yes' or 'No' for your prediction, and see real-time potential profit calculations.

[SQL Complexity] Placing a bet is a complex transactional process. First, we validate the market's existence and active status. Then, we calculate the current odds excluding the user's own volume to prevent manipulation. We check the user's balance, and if sufficient, we insert the bet with the current odds. A sophisticated `BEFORE INSERT` trigger automatically updates the user's balance and the market's total volume. Our betting system uses a sophisticated unit-based approach where the number of units purchased is calculated based on the bet amount and the odds at the time of the transaction.

[SQL Complexity] The system also supports selling holdings. This is handled in the application layer by validating that the user has enough market value in their current holdings before allowing the sale. The sell operation is recorded as a bet with a negative amount.

**Action:** Click on a market from the main page. Show the detailed market page with the betting form. Demonstrate placing a "Yes" or "No" bet with a valid amount. Show the potential profit calculation and confirmation message. If possible, demonstrate the selling functionality.

**[DEMO SEGMENT 4: Leave a Comment Under a Market (Feature 2)]**
**Script:** "Beyond just betting, we've implemented a sophisticated commenting system. On each market's detail page, users can leave comments and engage in threaded discussions. Our system supports unlimited nesting levels, creating rich conversational experiences.

[SQL Complexity] Retrieving these comments involves a complex recursive Common Table Expression (CTE) that efficiently reconstructs the threaded hierarchy. The query uses a WITH RECURSIVE clause to traverse the isParentOf relationship table, building the comment tree with proper level tracking and ordering.

[SQL Complexity] We've optimized this with indexes on comments(mId) and comments(uId, mId), significantly improving lookup times for market-specific comments and user-specific comments within markets.

**Action:** On the same detailed market page, scroll down to the comments section. Show existing threaded comments. Demonstrate posting a new root comment. Show replying to an existing comment to create nested discussions.

**[DEMO SEGMENT 5: View User's Betting History & Holdings (Feature 4)]**
**Script:** "Finally, every user wants comprehensive tracking of their activity. Our profile page provides detailed analytics including current balance, active holdings with unrealized gains, and a complete betting history.

[SQL Complexity] The holdings calculation uses a sophisticated CTE that tracks bought units, sold units, net units, total invested, and average buy price per unit. For each holding, we calculate unrealized gains using current market odds excluding the user's own volume.

[SQL Complexity] The system also provides a global leaderboard showing all users ranked by total profits (realized + unrealized gains), with percentage change calculations based on total investment.

**Action:** Navigate to the user's profile page. Show the balance, active bets count, and total profit display. Demonstrate the holdings table with unrealized gains calculations. Show the leaderboard tab with user rankings.

**(End Live Demo)**

## D3. System Support & Backend Queries (Continued from D2)

### Slide 4: Database Schema & Key Relationships
**Title:** Data Foundation: Our Relational Model

**Content:**
**Entities:**
- **users** (uid, uname, passwordHash, email, phoneNumber, balance)
- **markets** (mid, name, description, podd, volume, end_date)
- **bets** (bId, uId, mId, podd, amt, yes, createdAt)
- **comments** (cId, uId, mId, created_at, content)
- **isParentOf** (pCId, cCId) - Associative table for recursive comments

**Key Relationships:**
- Foreign Keys: bets.uId → users.uid, bets.mId → markets.mid
- Foreign Keys: comments.uId → users.uid, comments.mId → markets.mid
- Foreign Keys: isParentOf.pCId → comments.cId, isParentOf.cCId → comments.cId

**Integrity & Assumptions:**
- DECIMAL(12,2) for financial accuracy (balance, amt, volume)
- DECIMAL(3,2) for probability (podd)
- UNIQUE constraints for uname and email in users table
- ON DELETE CASCADE on all foreign key relationships
- Dynamic odds calculation in application layer

**Script (2-3 minutes):**
"Our application is underpinned by a robust MySQL relational database with sophisticated design patterns. Here's a detailed look at our schema and the key relationships that ensure data integrity and functionality.

We have five core entities: users, markets, bets, comments, and the isParentOf associative table. The isParentOf table is particularly innovative - it allows us to model complex nested comment threads by mapping parent comment IDs to child comment IDs, enabling unlimited nesting levels.

We've established comprehensive foreign key relationships: bets and comments both reference users and markets, ensuring every bet and comment is properly linked. The isParentOf table creates a self-referencing relationship within comments for threaded discussions.

Crucially, we've focused heavily on data integrity and precision. We use DECIMAL(12,2) for all financial attributes to prevent precision and rounding errors. We enforce UNIQUE constraints on uname and email for user account integrity. ON DELETE CASCADE is implemented on all foreign key relationships to prevent orphaned data.

Our design assumes that market odds (podd) and volume are managed dynamically by the application layer, recalculated based on current betting activity rather than stored statically."

### Slide 5: Backend Queries & Performance Optimizations
**Title:** Powering Features: Backend Queries & Performance

**Content:**

**Feature 1 (View All Markets):**
```sql
SELECT mid, name, description, podd, volume, end_date 
FROM markets 
WHERE end_date > NOW()
ORDER BY end_date ASC
```

**Feature 2 (Comments - Recursive CTE):**
```sql
WITH RECURSIVE threaded_comments AS (
    -- Base case: top-level comments
    SELECT c.cId, c.content, c.created_at, c.uId, u.uname,
           CAST(NULL AS SIGNED) AS parent_id, 0 AS level
    FROM comments c JOIN users u ON c.uId = u.uid
    WHERE c.mId = %s AND c.cId NOT IN (SELECT cCId FROM isParentOf)
    
    UNION ALL
    
    -- Recursive case: fetch replies
    SELECT child.cId, child.content, child.created_at, child.uId, u.uname,
           ip.pCId AS parent_id, tc.level + 1 AS level
    FROM isParentOf ip
    JOIN comments child ON child.cId = ip.cCId
    JOIN users u ON child.uId = u.uid
    JOIN threaded_comments tc ON tc.cId = ip.pCId
    WHERE child.mId = %s
)
SELECT * FROM threaded_comments ORDER BY level, created_at DESC;
```

**Feature 3 (Dynamic Odds Calculation):**
```sql
SELECT 
    COALESCE(SUM(CASE WHEN yes = 1 THEN amt ELSE 0 END), 0) as yes_volume,
    COALESCE(SUM(CASE WHEN yes = 0 THEN amt ELSE 0 END), 0) as no_volume
FROM bets 
WHERE mId = %s
```

**Feature 4 (User Holdings with Unrealized Gains):**
```sql
WITH user_market_holdings AS (
    SELECT b.uId, b.mId, b.yes, m.name, m.description, m.end_date,
           SUM(CASE WHEN b.amt > 0 THEN b.amt / b.podd ELSE 0 END) as bought_units,
           SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) / b.podd ELSE 0 END) as sold_units,
           SUM(CASE WHEN b.amt > 0 THEN b.amt / b.podd ELSE 0 END) - 
           SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) / b.podd ELSE 0 END) as net_units,
           SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END) as total_invested,
           CASE WHEN SUM(CASE WHEN b.amt > 0 THEN b.amt / b.podd ELSE 0 END) > 0 
                THEN SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END) / 
                     SUM(CASE WHEN b.amt > 0 THEN b.amt / b.podd ELSE 0 END)
                ELSE 0 END as avg_buy_price_per_unit
    FROM bets b JOIN markets m ON b.mId = m.mid
    WHERE b.uId = %s
    GROUP BY b.uId, b.mId, b.yes, m.name, m.description, m.end_date
)
SELECT * FROM user_market_holdings WHERE net_units > 0 ORDER BY net_units DESC;
```

**Performance Optimizations:**
- `CREATE INDEX idx_users_uname ON users(uname);` - Login optimization
- `CREATE INDEX idx_markets_end_date ON markets(end_date);` - Active markets filtering
- `CREATE INDEX idx_bets_mId ON bets(mId);` - Market odds calculation
- `CREATE INDEX idx_comments_mId ON comments(mId);` - Market comments lookup
- `CREATE INDEX idx_comments_user_market ON comments(uId, mId);` - User comments in markets

**Query Timing System:**
- Custom QueryTimer class tracks execution times for all queries
- Thread-safe performance monitoring
- Real-time statistics via `/api/query-stats` endpoint

**Script (3-4 minutes):**
"Let's dive deeper into the SQL queries that power these features, and crucially, how we've optimized them for performance.

For 'View All Markets', we use a straightforward SELECT with date filtering and ordering. The real complexity comes in the dynamic odds calculation, which uses a sophisticated volume aggregation query that separates YES and NO volume, then applies our smoothing algorithm.

The 'Comments' feature utilizes a complex recursive Common Table Expression (CTE) that efficiently reconstructs threaded discussions. This query uses a WITH RECURSIVE clause to traverse the isParentOf relationship table, building the complete comment tree with proper level tracking.

When users 'Place a Bet', we execute a transactional process that includes market validation, balance checking, odds calculation excluding the user's volume, and bet insertion. The system uses a unit-based approach where bet_amount / odds = units purchased, enabling sophisticated position management.

The 'User Holdings' feature uses a comprehensive CTE that tracks bought units, sold units, net units, total invested, and average buy price per unit. This enables accurate unrealized gains calculations using current market odds.

For performance, we've implemented strategic indexing across all major query patterns. The idx_users_uname index optimizes login lookups, idx_markets_end_date speeds up active market filtering, and idx_bets_mId accelerates odds calculations. Our composite index on comments(uId, mId) optimizes user-specific comment retrieval.

We've also built a sophisticated query timing system that tracks execution times for all database operations, providing real-time performance monitoring and optimization insights."

## D4. The Contribution of Each Member

### Slide 6: Team Contributions
**Title:** Our Collective Effort: Team Contributions

**Content:**

**Sanskriti Akhoury:**
- Led conceptual database design and E/R diagram creation
- Translated requirements into formal relational data model
- Co-authored detailed R5a Assumptions and constraints
- Assembled comprehensive Milestone 2 report
- Contributed to production data generation pipeline
- Assisted in developing query timer utility for performance monitoring

**Pearl Natalia:**
- Conducted extensive Polymarket API research and integration
- Collaborated on database schema design and optimization
- Refined project functional requirements and R5a Assumptions
- Applied strategic indexing for query performance optimization
- Assisted in user authentication feature development
- Contributed to query timer utility implementation

**Darsh Shah:**
- Authored all SQL queries for core features (R6-R10)
- Developed comprehensive sample queries and expected outputs
- Analyzed application-level logic for betting and authentication
- Implemented sophisticated nested commenting system with recursive queries
- Contributed to production data generation and testing
- Designed complex user holdings and profit calculation queries

**Krish Modi:**
- Developed complete backend API using Python/Flask
- Established MySQL database connections and configuration
- Implemented initial API endpoints and JWT authentication
- Managed schema.sql and database setup scripts
- Researched and implemented API-based data population
- Refactored and debugged core app.py functionality
- Authored comprehensive test-production.sql
- Modularized SQL queries into dedicated loader system

**Akshar Barot:**
- Led frontend development using Next.js 14 and React
- Created UI mockups and wireframes for user experience
- Implemented primary frontend components (market view, betting forms)
- Refactored frontend for improved UX and responsiveness
- Resolved critical client-side authentication errors
- Built comprehensive user profile and leaderboard interfaces
- Implemented real-time data fetching and state management

**Script (2-3 minutes):**
"Our project was a true collaborative effort, with each team member playing a crucial role in bringing the Polymarket clone to life. Let me summarize their specific contributions based on our actual implementation.

Sanskriti Akhoury led the conceptual database design, creating the foundational E/R diagram and translating it into our formal relational data model. She contributed significantly to the detailed R5a Assumptions section, assembled our comprehensive Milestone 2 report, and helped develop our production data generation pipeline and query timer utility.

Pearl Natalia conducted extensive research into the Polymarket API, ensuring our integration with real market data. She collaborated on database schema design, refined our functional requirements, and was instrumental in applying strategic indexing for query optimization. She also assisted in developing our user authentication system.

Darsh Shah authored all the SQL queries for our core features, developing comprehensive sample queries and analyzing application-level logic. He implemented our sophisticated nested commenting system using recursive CTEs and designed complex queries for user holdings and profit calculations.

Krish Modi developed our complete backend API using Python and Flask, establishing MySQL connections and implementing JWT authentication. He managed our database schema, researched API-based data population, and modularized our SQL queries into a dedicated loader system for maintainability.

Akshar Barot led our frontend development using Next.js 14 and React, creating the user interface and implementing all major components. He built our market view, betting forms, user profiles, and leaderboard interfaces, ensuring a responsive and intuitive user experience.

Together, we leveraged our individual strengths to deliver a comprehensive, production-ready prediction market application."

## D5. Summary

### Slide 7: Project Summary & Future Scope
**Title:** Recap & What's Next

**Content:**

**Recap:**
- Fully functional Polymarket clone with real-time odds calculation
- Core features: Dynamic Markets, Smart Betting, Threaded Comments, User Analytics, Secure Authentication
- Robust Flask backend with MySQL database and optimized SQL queries
- Modern Next.js frontend with TypeScript and responsive design
- Production data generation with 10,000 realistic users and Polymarket API integration
- Comprehensive performance monitoring and query optimization

**Future Enhancements:**
- Automated market resolution and payout calculations
- Enhanced user profiles with detailed transaction history
- Advanced market analytics and trend prediction
- Mobile application development
- Real-time notifications and market alerts
- Advanced trading features (limit orders, market orders)

**Script (1-2 minutes):**
"To summarize, our Polymarket clone is a fully functional prediction market application that successfully replicates the core functionality of Polymarket with several innovative enhancements.

We have successfully implemented all key features including dynamic market viewing with real-time odds calculation, sophisticated betting with position management, threaded commenting with unlimited nesting, comprehensive user analytics with unrealized gains tracking, and secure JWT-based authentication.

Our application is built on a robust Flask backend connecting to an optimized MySQL database using sophisticated SQL queries. We've demonstrated how strategic indexing significantly improved query performance, and our query timing system provides real-time performance monitoring.

Our Next.js frontend provides a modern, responsive user interface with TypeScript for type safety and comprehensive state management. The integration with real Polymarket API data combined with our synthetic user generation creates a realistic and scalable testing environment.

Looking ahead, while we've achieved significant milestones, there's always room for growth. We envision features like automated market resolution with precise payout calculations, enhanced user profiles with detailed transaction histories, advanced market analytics, mobile applications, and sophisticated trading features like limit orders and market orders.

Our application demonstrates not just technical competence, but a deep understanding of prediction market mechanics and user experience design."

## D6. Advanced Features Implementation

### Slide 8: Advanced Database Features & SQL Complexity
**Title:** Advanced Features: Beyond Basic CRUD Operations

**Content:**

**Implemented Advanced Features:**

**1. Sell Bet Logic with BEFORE INSERT Trigger ✅ IMPLEMENTED**
- **Advanced SQL Feature:** Application-level validation combined with a multi-statement BEFORE INSERT trigger.
- **Implementation:** The `create_bet` endpoint in `app.py` handles complex validation, while the `handleBetOnInsert` trigger in `backend/sql/bets/bet_trigger.sql` ensures atomic updates.
- **Complexity:** A hybrid approach where the application validates complex business rules (e.g., preventing over-selling) and the database trigger handles simple, crucial updates to balance and volume.
- **Advanced Aspects:**
  - The `BEFORE INSERT` trigger automatically updates user balance and market volume for both buys and sells.
  - The application layer calculates bet units and performs market value validation *before* the bet is inserted, preventing invalid sell orders.
  - The trigger itself is simple and efficient, containing conditional IF-ELSE logic to handle positive (buy) and negative (sell) amounts.
  - This separation of concerns places complex, stateful validation in the application while leaving the database to enforce transactional integrity.
- **Fundamental Approach:** This feature uses a **reactive, row-level trigger**, which is fundamentally different from the time-based automation of the market scheduler or the declarative, set-based logic of the trending markets query.
- **Business Logic:** Enforces financial consistency through a combination of application logic and database triggers.
- **Code Reference:** `backend/sql/bets/bet_trigger.sql`, lines 3-15
  ```sql
  CREATE TRIGGER handleBetOnInsert
  BEFORE INSERT ON bets
  FOR EACH ROW
  BEGIN
      -- Handle both buy and sell cases
      IF NEW.amt > 0 THEN
          -- BUY: Deduct amount from user balance and add to market volume
          UPDATE users SET balance = balance - NEW.amt WHERE uid = NEW.uId;
          UPDATE markets SET volume = volume + NEW.amt WHERE mid = NEW.mId;
      ELSEIF NEW.amt < 0 THEN
          -- SELL: Add amount to user balance and subtract from market volume
          UPDATE users SET balance = balance + ABS(NEW.amt) WHERE uid = NEW.uId;
          UPDATE markets SET volume = volume - ABS(NEW.amt) WHERE mid = NEW.mId;
      END IF;
  END
  ```

**2. Trending Markets with Complex JOINs ✅ IMPLEMENTED**
- **Advanced SQL Feature:** Complex JOINs, GROUP BY, date arithmetic, and exponential decay
- **Implementation:** `get_trending_markets.sql` with sophisticated scoring algorithm
- **Complexity:** 
  - LEFT JOIN with subquery for activity scoring
  - UNION ALL combining bets and comments with different weights
  - Exponential decay function: `EXP(-0.03 * TIMESTAMPDIFF(HOUR, activity_date, NOW()))`
  - Weighted scoring: bets (1.0 weight) vs comments (0.5 weight)
- **Advanced Aspects:**
  - Date arithmetic for time-based scoring
  - Mathematical functions for trend calculation
  - Complex aggregation with COALESCE for null handling
  - Real-time ranking based on recent activity
  - **Dual activity tracking:** Combines betting volume and user engagement metrics
- **Fundamental Approach:** This feature uses a **declarative, set-based query** to perform complex data aggregation and ranking, contrasting with the procedural, row-by-row processing of the market resolution cursor and the event-driven logic of the insert trigger.
- **Code Reference:** `backend/sql/markets/get_trending_markets.sql`, lines 1-13
  ```sql
  SELECT m.mid, m.name, m.description, m.podd, m.volume, m.end_date
  FROM markets m
  LEFT JOIN (
      SELECT mId, SUM(weight * EXP(-0.03 * TIMESTAMPDIFF(HOUR, activity_date, NOW()))) AS trending_score
      FROM (
          SELECT mId, createdAt AS activity_date, 1.0 AS weight FROM bets
          UNION ALL
          SELECT mId, created_at AS activity_date, 0.5 AS weight FROM comments
      ) AS activities
      GROUP BY mId
  ) AS activity_scores ON m.mid = activity_scores.mId
  WHERE m.end_date > NOW()
  ORDER BY COALESCE(activity_scores.trending_score, 0) DESC, m.mid;
  ```

**3. Automated Market Closure via Event Scheduler ✅ IMPLEMENTED**
- **Advanced SQL Feature:** MySQL Event Scheduler, Stored Procedures with Cursors, and Transactional Control.
- **Implementation:**
  - `backend/sql/procedures/resolve_markets_procedure.sql`: A comprehensive stored procedure that iterates through expired markets using a cursor to handle the entire resolution and payout process.
  - `backend/sql/events/market_resolution_event.sql`: A daily event that calls the stored procedure.
  - `backend/simulate_market_closure.py`: A testing script to manually trigger and verify the resolution process.
- **Complexity:** 
  - The procedure defines a `CURSOR` with a `SELECT` query that finds all markets ready for resolution by filtering for `end_date <= NOW()` and `volume > 0`. This is the core logic the scheduler is responsible for running periodically.
  - It then uses this `CURSOR` to loop through each expired market individually.
  - For each market, it determines the winning outcome and calculates a `payout_per_unit` by dividing the total losing volume (the prize pool) by the total number of winning units.
  - All payouts for a market are executed within a `TRANSACTION`, ensuring that all user balances are updated atomically before the market is marked as resolved.
- **Advanced Aspects:**
  - This feature demonstrates a robust, automated system for market lifecycle management from expiration to payout.
  - It uses advanced procedural SQL, including cursors and explicit transactional control, to handle complex financial logic safely and directly within the database.
- **Fundamental Approach:** This feature demonstrates **proactive, time-based automation** using a server scheduler and procedural logic (cursors), which differs from the reactive trigger on the bets table and the on-demand, set-based aggregation of the trending query.
  - The encapsulation of the entire process within a single, clean procedure is a professional and maintainable design.
  - The inclusion of a simulation script highlights a strong approach to testing and verification.
- **Code Reference:** `backend/sql/procedures/resolve_markets_procedure.sql`, lines 3-4 (procedure) and 10-11 (cursor)
  ```sql
  CREATE PROCEDURE `resolve_markets`()
  BEGIN
    -- ...
    DECLARE cur_markets CURSOR FOR 
        SELECT mid, podd FROM markets WHERE end_date <= NOW() AND volume > 0;
    -- ...
  END
  ```

**4. Row-Level Locking for Market Podd Updates ✅ IMPLEMENTED**
- **Advanced SQL Feature:** Strict 2-phase locking with `SELECT ... FOR UPDATE` and SERIALIZABLE isolation
- **Implementation:** Transactions in `app.py` set the isolation level, perform the read-modify-write operations, and then explicitly commit or rollback.
- **Fundamental Approach:** This feature's complexity comes from its use of **explicit transactional control** managed from the application layer (`connection.commit()`, `connection.rollback()`) combined with MySQL's strictest isolation level (`SERIALIZABLE`). This guarantees atomicity and prevents race conditions, which is a core advanced requirement for financial-grade operations and is fundamentally different from the other database-side automation features.
- **Code Reference:** `backend/sql/transactions/set_serializable_isolation.sql`, line 1
  ```sql
  SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
  ```

  **Sophisticated Odds Calculation with Anti-Manipulation (sub-feature):**
  - **Dual query strategy:** User-specific odds exclusion and sophisticated volume mapping
  - **Smoothing factor algorithm:** `(yes_volume + smoothing) / (total_volume + 2*smoothing)` prevents extreme odds
  - **Bounds enforcement:** Odds constrained between 0.01 and 0.99
  - **User-specific odds:** Excludes user's own volume to prevent self-manipulation
  - **Display vs betting odds:** Different calculations for public display vs user betting
  - **Advanced volume mapping:** 
    - Buy YES (`yes=1 AND amt>0`) → increases YES volume
    - Sell NO (`yes=0 AND amt<0`) → increases YES volume (equivalent to buying YES)
    - Buy NO (`yes=0 AND amt>0`) → increases NO volume
    - Sell YES (`yes=1 AND amt<0`) → increases NO volume (equivalent to buying NO)
  - **Advanced Aspects:**
    - Mathematical smoothing prevents division by zero and extreme probabilities
    - Anti-manipulation design prevents users from artificially inflating odds
    - Real-time odds recalculation based on volume distribution
    - **Prediction market mechanics:** Properly models the relationship between buying/selling and YES/NO volume

**5. Leaderboard with Windowed Aggregates ✅ IMPLEMENTED**
- **Advanced SQL Feature:** Window functions for ranking and running totals
- **Implementation:** `get_user_profits.sql` with ROW_NUMBER(), RANK(), and SUM() OVER (ORDER BY)
- **Complexity:**
  - Uses window functions to calculate user rankings in a single query
  - ROW_NUMBER() for unique ranking, RANK() for tied rankings
  - SUM() OVER (ORDER BY realized_gains DESC) for running totals
  - Combines multiple tables (users, bets) in consolidated results
- **Advanced Aspects:**
  - Window functions for efficient ranking without subqueries
  - Consolidated results from multiple tables in one query
  - Real-time leaderboard updates with running totals
  - Demonstrates advanced SQL aggregation techniques
- **Fundamental Approach:** This feature leverages **modern, set-based analytical functions (window functions)** to perform complex calculations over an entire result set without requiring procedural cursors, representing a different and more efficient paradigm for ranking and aggregation.
- **Code Reference:** (Illustrative example for presentation)
  ```sql
  WITH user_profits AS (
      -- This CTE calculates realized and unrealized gains per user
      SELECT uid, uname, SUM(realized_gain) AS total_realized, SUM(unrealized_gain) AS total_unrealized
      FROM user_gains_calculation
      GROUP BY uid, uname
  )
  SELECT
      uname,
      total_realized + total_unrealized AS total_profit,
      RANK() OVER (ORDER BY (total_realized + total_unrealized) DESC) AS user_rank,
      ROW_NUMBER() OVER (ORDER BY (total_realized + total_unrealized) DESC) AS row_num
  FROM user_profits;
  ```

**Script (2-3 minutes):**
"Beyond our core features, we've implemented several advanced database features that demonstrate sophisticated SQL usage and database design principles.

Our **Sell Bet functionality** uses a sophisticated BEFORE INSERT trigger that handles both buy and sell operations. This trigger automatically manages user balances and market volumes, ensuring financial consistency without requiring application-level intervention. The trigger uses multi-statement logic with conditional processing, demonstrating advanced trigger capabilities. We've also implemented a sophisticated unit-based betting system where bet_amount / odds = units purchased, with dual unit pricing logic that properly handles YES bets using current_odds and NO bets using 1 - current_odds, along with careful cost basis tracking for accurate profit calculations. The system includes advanced holdings validation that prevents over-selling by checking current market value against user holdings using complex SQL queries.

Our **Trending Markets feature** implements a complex scoring algorithm using advanced SQL features. The query combines bets and comments with different weights, applies exponential decay based on time, and uses sophisticated JOINs and GROUP BY operations. This creates a real-time ranking system that prioritizes recent activity while considering both betting volume and user engagement.

Our **Automated Market Closure** system uses MySQL's Event Scheduler to automatically resolve expired markets. The logic is encapsulated in a dedicated stored procedure, `resolve_markets`, which uses a cursor to iterate through each expired market, calculate the correct payout per winning share, and distribute the winnings to users within a transaction, ensuring the entire process is atomic and reliable. This modular design is complemented by a simulation script that allows us to test the entire resolution process on demand.

For **Row-Level Locking**, our betting transaction sets the isolation level to SERIALIZABLE and uses a SELECT ... FOR UPDATE on the market row. This ensures that only one transaction can update a market's odds and volume at a time, preventing race conditions and guaranteeing fair, serialized updates. The lock is released immediately on commit, so no client can hold a market row indefinitely.

Our **Leaderboard with Windowed Aggregates** uses advanced window functions to efficiently calculate user rankings and running totals. The implementation uses ROW_NUMBER() for unique rankings, RANK() for handling ties, and SUM() OVER (ORDER BY) for running totals, all in a single consolidated query that combines data from multiple tables.

Additionally, we've implemented **Sophisticated Odds Calculation** with anti-manipulation features. Our system uses a smoothing factor algorithm to prevent extreme odds, enforces bounds between 0.01 and 0.99, and implements user-specific odds that exclude a user's own volume to prevent self-manipulation. The volume distribution logic properly models prediction market mechanics, where selling NO is equivalent to buying YES and selling YES is equivalent to buying NO, ensuring accurate odds calculation. This creates a fair and stable prediction market.

These implementations showcase our understanding of advanced SQL features, database design principles, and the importance of data integrity in financial applications. Each feature goes beyond basic CRUD operations to demonstrate sophisticated database engineering capabilities."

## D7. Overall Quality of the Presentation

### Slide 9: Q&A / Thank You
**Title:** Thank You!

**Content:**
- Questions?
- GitHub Repository: https://github.com/KrishM123/348-polymarket
- Live Demo Available

**Script (1 minute + Q&A):**
"That concludes our demonstration of the Polymarket Clone. We hope you've seen the dedication and technical sophistication that went into building this application, from its robust backend with optimized SQL queries to its modern frontend with real-time data updates.

We're proud of what we've accomplished - a production-ready prediction market platform that not only replicates existing functionality but introduces innovative features like dynamic odds calculation, sophisticated position management, and comprehensive user analytics.

Our application demonstrates advanced database design, performance optimization, and full-stack development skills. We've created something that's not just academically sound, but practically useful and technically impressive.

Thank you for your time and attention. We'd now be happy to answer any questions you might have about our implementation, technical decisions, or future development plans." 