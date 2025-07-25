WITH user_market_stats AS (
    SELECT 
        u.uid,
        u.uname,
        u.balance as current_balance,
        b.mId,
        b.yes,
        
        -- Calculate total amount bet and total number of bet units for buying
        SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END) as total_bought_amount,
        SUM(CASE WHEN b.amt > 0 AND b.yes = 1 THEN b.amt / b.podd
                 WHEN b.amt > 0 AND b.yes = 0 THEN b.amt / (1 - b.podd)
                 ELSE 0 END) as total_bought_units,
        
        -- Calculate total amount sold and total number of bet units for selling
        SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) ELSE 0 END) as total_sold_amount,
        SUM(CASE WHEN b.amt < 0 AND b.yes = 1 THEN ABS(b.amt) / b.podd
                 WHEN b.amt < 0 AND b.yes = 0 THEN ABS(b.amt) / (1 - b.podd)
                 ELSE 0 END) as total_sold_units
        
    FROM users u
    LEFT JOIN bets b ON u.uid = b.uId
    
    GROUP BY u.uid, u.uname, u.balance, b.mId, b.yes
),

market_realized_gains AS (
    SELECT 
        uid,
        uname,
        current_balance,
        mId,
        yes,
        total_sold_units,
        total_bought_units,
        total_bought_amount,
        total_sold_amount,
        
        -- Calculate realized gains: amount received from selling - cost basis of units sold
        CASE 
            WHEN total_sold_units > 0 AND total_bought_units > 0 
            THEN total_sold_amount - (total_sold_units * (total_bought_amount / total_bought_units))
            ELSE 0 
        END as market_realized_gains
        
    FROM user_market_stats
),
user_realized_gains AS (
    SELECT 
        uid,
        uname,
        current_balance,
        SUM(market_realized_gains) as realized_gains
    FROM market_realized_gains
    GROUP BY uid, uname, current_balance
)
SELECT 
    uid,
    uname,
    current_balance,
    realized_gains,
    -- Window functions for leaderboard
    ROW_NUMBER() OVER (ORDER BY realized_gains DESC) as `row_number`,
    RANK() OVER (ORDER BY realized_gains DESC) as `rank`,
    SUM(realized_gains) OVER (ORDER BY realized_gains DESC ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) as `running_total`
FROM user_realized_gains
ORDER BY realized_gains DESC; 