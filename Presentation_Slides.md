# Polymarket Clone: Presentation Slides

---

### **Slide 1: Title Slide**

*   **Title:** Polymarket Clone: Predicting the Future, Together
*   **Subtitle:** CS 348 Project Demo
*   **Team Members:** Akshar Barot, Darsh Shah, Krish Modi, Pearl Natalia, Sanskriti Akhoury

---

### **Slide 2: Application Overview**

*   **(HOOK: Play a short, 15-30 second video showing a fast-paced demo of placing a bet and seeing the result.)**
*   Fully functional prediction market application that reimagines event-based betting.
*   **Core Mechanics:**
    *   Users buy and sell shares of potential outcomes.
    *   Share price is determined by the market's perceived probability (the `podd`).
    *   Example: A 60% chance of 'YES' means a 'YES' share costs $0.60.
    *   Winning shares are redeemed for $1, creating profit.
*   **Key Features:**
    *   Real-time, dynamic odds calculation.
    *   Secure user authentication and virtual wallets.
    *   Detailed user analytics, including holdings and profit tracking.
    *   Threaded discussions for community engagement.
    *   Global leaderboard for user rankings.

---

### **Slide 3: System Architecture**

*   **Technology Stack:**
    *   **Frontend:** Next.js 14 (React, TypeScript), Tailwind CSS
    *   **Backend:** Flask (Python), JWT Authentication
    *   **Database:** MySQL with Triggers, Events, and Procedures
    *   **Communication:** RESTful API
*   **Key Components:**
    *   **Frontend:** Interactive components (`BettingForm`, `MarketCard`) and a dedicated API client layer.
    *   **Backend:** Sophisticated business logic for odds calculation, transaction management, and user analytics.
    *   **Data Layer:** Modular SQL queries, performance timing (`QueryTimer`), and strategic indexing.
*   **External Integration:**
    *   Real market data fetched from the official Polymarket API.
    *   Production data script generates 10,000 synthetic users for realistic load testing.

---

### **Slide 4: Feature Showcase: Introduction**

*   Live demonstration of the key features.
*   Focus on how users interact with the application.
*   Highlighting the sophisticated backend logic powering each feature.

---

### **Slide 5: Feature 1 - Login & Authentication**

*   **(VIDEO DEMO: Show user login and registration process)**
*   **Functionality:**
    *   Secure session management using JWT with 24-hour expiration.
    *   Handles new user registration and existing user login.
*   **SQL Complexity:**
    *   Uses `SELECT` queries with an index on `users(uname)` for fast, secure username lookup.
    *   Hashes passwords with `bcrypt` for secure storage and comparison.
*   **SQL Snippet:** (`backend/sql/auth/get_user_by_username.sql`)
    ```sql
    SELECT uid, uname, email, passwordHash, balance 
    FROM users WHERE uname = %s;
    ```

---

### **Slide 6: Feature 2 - View All Markets**

*   **(VIDEO DEMO: Show the main markets page, including "Latest" and "Trending" toggles)**
*   **Functionality:**
    *   Displays a comprehensive list of all active betting markets.
    *   Each market card shows key info: name, description, probability, volume, and end date.
*   **SQL Complexity:**
    *   Conditionally executes different SQL queries based on user login status to prevent manipulation.
    *   The SQL provides the raw `yes_volume` and `no_volume`. The backend then applies a mathematical smoothing algorithm to calculate the final odds.
*   **SQL Snippets:** (`get_market_volume_distribution...sql`)
    ```sql
    -- For logged-out users (full volume)
    SELECT SUM(...) as yes_volume, SUM(...) as no_volume 
    FROM bets WHERE mId = %s;

    -- For logged-in users (volume excluding their own)
    SELECT SUM(...) as yes_volume, SUM(...) as no_volume 
    FROM bets WHERE mId = %s AND uId != %s;
    ```

---

### **Slide 7: Feature 3 - Place a Bet**

*   **(VIDEO DEMO: Show a user clicking a market, entering a bet amount, selecting Yes/No, and placing the bet)**
*   **Functionality:**
    *   Sophisticated betting interface with real-time potential profit calculation.
    *   Supports both buying shares (positive bet amount) and selling existing holdings (negative bet amount).
*   **SQL Complexity:**
    *   The betting process is wrapped in a transaction, managed by the application layer.
    *   A `BEFORE INSERT` trigger on the `bets` table handles atomic updates to user balance and market volume.
*   **SQL Snippet:** (`backend/sql/bets/bet_trigger.sql`)
    ```sql
    -- This trigger runs automatically before every bet is inserted
    CREATE TRIGGER handleBetOnInsert
    BEFORE INSERT ON bets
    FOR EACH ROW
    BEGIN
        IF NEW.amt > 0 THEN -- Buy
            UPDATE users SET balance = balance - NEW.amt ...;
            UPDATE markets SET volume = volume + NEW.amt ...;
        ELSEIF NEW.amt < 0 THEN -- Sell
            UPDATE users SET balance = balance + ABS(NEW.amt) ...;
            UPDATE markets SET volume = volume - ABS(NEW.amt) ...;
        END IF;
    END
    ```

---

### **Slide 8: Feature 4 - Leave a Comment**

*   **(VIDEO DEMO: Show a user posting a root comment and then replying to another comment to create a nested thread)**
*   **Functionality:**
    *   Sophisticated, threaded commenting system on each market page.
    *   Supports unlimited nesting levels for rich discussions.
*   **SQL Complexity:**
    *   A `WITH RECURSIVE` Common Table Expression (CTE) efficiently fetches and reconstructs the entire comment hierarchy in a single, powerful query.
*   **SQL Snippet:** (`backend/sql/comments/get_threaded_comments.sql`)
    ```sql
    WITH RECURSIVE threaded_comments AS (
        -- Base case: select top-level comments
        SELECT c.cId, ..., 0 AS level FROM comments c ...
        WHERE c.mId = %s AND c.cId NOT IN (SELECT cCId FROM isParentOf)
    
        UNION ALL
    
        -- Recursive case: join with self to fetch replies
        SELECT child.cId, ..., tc.level + 1
        FROM isParentOf ip JOIN comments child ON ...
        JOIN threaded_comments tc ON tc.cId = ip.pCId
    )
    SELECT * FROM threaded_comments;
    ```

---

### **Slide 9: Feature 5 - View User Profile & Holdings**

*   **(VIDEO DEMO: Show the user profile page, highlighting the balance, holdings table with unrealized gains, and the global leaderboard)**
*   **Functionality:**
    *   Comprehensive analytics dashboard for each user.
    *   Displays current balance, active holdings with unrealized gains, and a global leaderboard.
*   **SQL Complexity:**
    *   A sophisticated CTE that aggregates all of a user's buy and sell transactions to calculate their exact holdings (`net_units`) and the average price they paid per share (`avg_buy_price_per_unit`).
*   **SQL Snippet:** (`backend/sql/bets/get_user_holdings.sql`)
    ```sql
    WITH user_market_holdings AS (
        SELECT 
            b.uId, b.mId, b.yes,
            -- Calculate total units bought
            SUM(CASE WHEN b.amt > 0 THEN ... END) as bought_units,
            -- Calculate total units sold
            SUM(CASE WHEN b.amt < 0 THEN ... END) as sold_units,
            -- Calculate net units (bought - sold)
            (...) as net_units,
            -- Calculate total amount invested for remaining units
            (...) as total_invested
        FROM bets b ...
        GROUP BY b.uId, b.mId, b.yes
    )
    SELECT * FROM user_market_holdings WHERE net_units > 0;
    ```

---

### **Slide 10: Database Schema & Key Relationships**

*   **Core Entities:** `users`, `markets`, `bets`, `comments`, `isParentOf`
*   **Innovative Design:** The `isParentOf` table enables infinite comment nesting by mapping parent-child relationships.
*   **Data Integrity:**
    *   `DECIMAL(12, 2)` used for all financial data to ensure precision.
    *   `UNIQUE` constraints on `username` and `email`.
    *   `ON DELETE CASCADE` on foreign keys to prevent orphaned data.

---

### **Slide 11: Backend Logic & Performance Optimizations**

*   **Our Indexing Strategy:**
    *   **Goal:** To eliminate slow, full-table scans and ensure a scalable, high-speed application.
    *   **Process:** We followed a four-step, data-driven process:
        1.  **Identify** critical query bottlenecks (e.g., login, odds calculation).
        2.  **Analyze** the queries to find the specific columns to optimize.
        3.  **Apply** B-Tree indexes to those columns for high-speed lookups.
        4.  **Verify** the impact using our custom `QueryTimer`, proving the performance gains.
*   **A Clear Example: User Login**
    *   **The Problem:** Finding one user in a table of 10,000+ is slow without an index.
    *   **The Solution:** Applying a single-column index to the `uname` column.
        ```sql
        CREATE INDEX idx_users_uname ON users(uname);
        ```
    *   **The Result:** A 10x performance improvement, with query times dropping from ~10ms to under 1ms.

---

### **Slide 12: Advanced Feature 1 - Sell Bet Trigger**

*   **Feature:** A hybrid system for safe and efficient bet selling.
*   **Approach:** A **reactive, row-level trigger** on the `bets` table.
*   **How it Works:**
    1.  The application layer validates the sell order against the user's holdings.
    2.  An `INSERT` with a negative amount is sent.
    3.  A `BEFORE INSERT` trigger automatically updates the user's balance and the market's volume.
*   **SQL Snippet:** (`backend/sql/bets/bet_trigger.sql`)
    ```sql
    CREATE TRIGGER handleBetOnInsert
    BEFORE INSERT ON bets
    FOR EACH ROW
    BEGIN
        -- This logic fires automatically on every insert
        IF NEW.amt > 0 THEN ...
        ELSEIF NEW.amt < 0 THEN ...
        END IF;
    END
    ```

---

### **Slide 13: Advanced Feature 2 - Trending Markets**

*   **Feature:** A real-time market ranking system based on recent activity.
*   **Approach:** A **declarative, set-based query** that aggregates data.
*   **How it Works:**
    1.  Combines bets and comments into a single activity stream using `UNION ALL`.
    2.  Applies different weights (bets are weighted more heavily than comments).
    3.  Uses an exponential decay function (`EXP(-0.03 * TIMESTAMPDIFF(...)`) to give more significance to recent activity.
*   **SQL Snippet:** (`backend/sql/markets/get_trending_markets.sql`)
    ```sql
    SELECT m.mid, m.name, ...
    FROM markets m
    LEFT JOIN (
        SELECT mId, SUM(weight * EXP(...)) AS trending_score
        FROM (
            SELECT mId, ..., 1.0 AS weight FROM bets
            UNION ALL
            SELECT mId, ..., 0.5 AS weight FROM comments
        ) AS activities
        GROUP BY mId
    ) AS activity_scores ON m.mid = activity_scores.mId
    ORDER BY COALESCE(activity_scores.trending_score, 0) DESC;
    ```

---

### **Slide 14: Advanced Feature 3 - Automated Market Closure**

*   **Feature:** A fully automated system for resolving markets and paying out winners.
*   **Approach:** **Proactive, time-based automation** using a server scheduler and procedural logic.
*   **How it Works:**
    1.  A daily MySQL `EVENT` calls the `resolve_markets()` stored procedure.
    2.  The procedure uses a `CURSOR` to loop through all expired markets (`WHERE end_date <= NOW()`).
    3.  For each market, it calculates the payout per winning share and distributes funds to users within a `TRANSACTION`.
*   **SQL Snippet:** (`backend/sql/procedures/resolve_markets_procedure.sql`)
    ```sql
    -- The core logic of the stored procedure
    DECLARE cur_markets CURSOR FOR 
        SELECT mid, podd FROM markets WHERE end_date <= NOW() AND volume > 0;
    
    OPEN cur_markets;
    markets_loop: LOOP
        FETCH cur_markets INTO market_id, market_podd;
        -- ...
        START TRANSACTION;
        UPDATE users u JOIN bets b ON ... SET u.balance = u.balance + ...
        COMMIT;
        -- ...
    END LOOP;
    ```

---

### **Slide 15: Advanced Feature 4 - Row-Level Locking**

*   **Feature:** A system to prevent race conditions during betting.
*   **Approach:** **Explicit, application-managed transactional control.**
*   **How it Works:**
    1.  The backend executes `SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;` at the start of the betting process.
    2.  This ensures that when a user places a bet, the relevant market row is locked until the transaction is complete (`commit` or `rollback`).
    3.  This guarantees fair, serialized updates and prevents data corruption.
*   **SQL Snippet:** (`backend/sql/transactions/set_serializable_isolation.sql`)
    ```sql
    SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
    ```

---

### **Slide 16: Advanced Feature 5 - Leaderboard**

*   **Feature:** A global leaderboard ranking all users by total profit.
*   **Approach (for presentation):** Using **modern, set-based analytical functions**.
*   **How it Works:**
    1.  A CTE first calculates each user's total realized and unrealized gains.
    2.  A `RANK()` window function is then used to assign a rank to each user based on their total profit, without needing procedural logic.
*   **SQL Snippet:** (Illustrative example for presentation)
    ```sql
    SELECT
        uname,
        total_profit,
        RANK() OVER (ORDER BY total_profit DESC) AS user_rank
    FROM (
        -- Inner query calculates total profit per user
        SELECT u.uname, SUM(b.amt * ...) AS total_profit
        FROM users u JOIN bets b ON u.uid = b.uId ...
        GROUP BY u.uname
    ) AS user_profits;
    ```

---

### **Slide 17: Team Contributions**

*   **Sanskriti Akhoury:** Led database design (E/R Diagram, relational model), documentation, and contributed to the data generation pipeline and query timer.
*   **Pearl Natalia:** Led Polymarket API research and integration, refined requirements, and applied strategic indexing for performance.
*   **Darsh Shah:** Authored all core SQL queries, developed the nested commenting system, and designed the complex user holdings and profit calculation logic.
*   **Krish Modi:** Developed the complete backend API (Python/Flask), implemented JWT authentication, and modularized the SQL query system.
*   **Akshar Barot:** Led all frontend development (Next.js/React), created UI mockups, and built all major components and interfaces.

---

### **Slide 18: Project Summary & Future Scope**

*   **Recap:**
    *   A fully functional, production-ready Polymarket clone.
    *   Built on a robust, optimized, and secure full-stack architecture.
    *   Demonstrates mastery of advanced database concepts and full-stack engineering.
*   **Future Enhancements:**
    *   Enhanced user profiles with detailed transaction history.
    *   Advanced market analytics and trend prediction.
    *   Mobile application development and real-time notifications.

---

### **Slide 19: Q&A**

*   **Title:** Thank You!
*   **Content:**
    *   Questions?
    *   GitHub Repository: https://github.com/KrishM123/348-polymarket
    *   Live Demo Available

--- 