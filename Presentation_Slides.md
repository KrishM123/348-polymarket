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
    *   Validates against existing usernames and emails before insertion.

---

### **Slide 6: Feature 2 - View All Markets**

*   **(VIDEO DEMO: Show the main markets page, including "Latest" and "Trending" toggles)**
*   **Functionality:**
    *   Displays a comprehensive list of all active betting markets.
    *   Each market card shows key info: name, description, probability, volume, and end date.
*   **SQL Complexity:**
    *   Dynamically calculates odds based on user status:
        *   **Logged-in:** Excludes the user's own volume to prevent manipulation.
        *   **Logged-out:** Shows the full market odds.
    *   Uses a smoothing factor algorithm to ensure odds are stable and realistic (between 0.01 and 0.99).

---

### **Slide 7: Feature 3 - Place a Bet**

*   **(VIDEO DEMO: Show a user clicking a market, entering a bet amount, selecting Yes/No, and placing the bet)**
*   **Functionality:**
    *   Sophisticated betting interface with real-time potential profit calculation.
    *   Supports both buying shares (positive bet amount) and selling existing holdings (negative bet amount).
*   **SQL Complexity:**
    *   A transactional process that validates market status, checks user balance, and inserts the bet.
    *   A `BEFORE INSERT` trigger automatically updates user balance and market volume.
    *   Application layer validates sell orders against the user's current market value to prevent over-selling.

---

### **Slide 8: Feature 4 - Leave a Comment**

*   **(VIDEO DEMO: Show a user posting a root comment and then replying to another comment to create a nested thread)**
*   **Functionality:**
    *   Sophisticated, threaded commenting system on each market page.
    *   Supports unlimited nesting levels for rich discussions.
*   **SQL Complexity:**
    *   A `WITH RECURSIVE` Common Table Expression (CTE) efficiently fetches and reconstructs the entire comment hierarchy in a single query.
    *   Optimized with indexes on `comments(mId)` for fast lookups.

---

### **Slide 9: Feature 5 - View User Profile & Holdings**

*   **(VIDEO DEMO: Show the user profile page, highlighting the balance, holdings table with unrealized gains, and the global leaderboard)**
*   **Functionality:**
    *   Comprehensive analytics dashboard for each user.
    *   Displays current balance, active holdings with unrealized gains, and a global leaderboard.
*   **SQL Complexity:**
    *   A sophisticated CTE calculates user holdings by tracking `bought_units`, `sold_units`, `net_units`, and `total_invested`.
    *   Unrealized gains are calculated in real-time by comparing the user's average buy price to the current market odds.

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

*   **Systematic Optimization Strategy:**
    *   **Goal:** Ensure the platform is fast, scalable, and responsive.
    *   **Method:** Applied strategic single-column and composite indexes to accelerate frequent query patterns (e.g., in `WHERE` clauses and `JOINs`).
    *   **Verification:** Used a custom `QueryTimer` class to scientifically measure and prove the performance gains of each index.
*   **Key Optimizations:**
    *   `idx_users_uname`: Reduced login query time from ~10ms to <1ms.
    *   `idx_bets_mId`: Dramatically accelerated odds calculation.
    *   `idx_comments_mId`: Optimized the loading of discussion threads.

---

### **Slide 12: Advanced Feature 1 - Sell Bet Trigger**

*   **Feature:** A hybrid system for safe and efficient bet selling.
*   **Approach:** A **reactive, row-level trigger** on the `bets` table.
*   **How it Works:**
    1.  The application layer validates the sell order against the user's holdings.
    2.  An `INSERT` with a negative amount is sent.
    3.  A `BEFORE INSERT` trigger automatically updates the user's balance and the market's volume.
*   **SQL Snippet:** `backend/sql/bets/bet_trigger.sql`

---

### **Slide 13: Advanced Feature 2 - Trending Markets**

*   **Feature:** A real-time market ranking system based on recent activity.
*   **Approach:** A **declarative, set-based query** that aggregates data.
*   **How it Works:**
    1.  Combines bets and comments into a single activity stream.
    2.  Applies different weights (bets are weighted more heavily than comments).
    3.  Uses an exponential decay function to give more significance to recent activity.
*   **SQL Snippet:** `backend/sql/markets/get_trending_markets.sql`

---

### **Slide 14: Advanced Feature 3 - Automated Market Closure**

*   **Feature:** A fully automated system for resolving markets and paying out winners.
*   **Approach:** **Proactive, time-based automation** using a server scheduler and procedural logic.
*   **How it Works:**
    1.  A daily MySQL `EVENT` calls a stored procedure.
    2.  The procedure uses a `CURSOR` to loop through all expired markets.
    3.  For each market, it calculates the payout per winning share and distributes funds to users within a `TRANSACTION`.
*   **SQL Snippet:** `backend/sql/procedures/resolve_markets_procedure.sql`

---

### **Slide 15: Advanced Feature 4 - Row-Level Locking**

*   **Feature:** A system to prevent race conditions during betting.
*   **Approach:** **Explicit, application-managed transactional control.**
*   **How it Works:**
    1.  The backend sets the transaction isolation level to `SERIALIZABLE`, the strictest level.
    2.  This ensures that when a user places a bet, the relevant market row is locked until the transaction is complete (`commit` or `rollback`).
    3.  This guarantees fair, serialized updates and prevents data corruption.
*   **SQL Snippet:** `backend/sql/transactions/set_serializable_isolation.sql`

---

### **Slide 16: Advanced Feature 5 - Leaderboard**

*   **Feature:** A global leaderboard ranking all users by total profit.
*   **Approach (for presentation):** Using **modern, set-based analytical functions**.
*   **How it Works:**
    1.  A CTE first calculates each user's total realized and unrealized gains.
    2.  A `RANK()` or `ROW_NUMBER()` window function is then used to assign a rank to each user based on their total profit, without needing procedural logic.
*   **SQL Snippet:** (Illustrative example for presentation)

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