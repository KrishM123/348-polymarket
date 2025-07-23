WITH user_market_holdings AS (
    SELECT 
        b.uId,
        b.mId,
        b.yes,
        m.name as market_name,
        m.description as market_description,
        m.end_date,
        
        -- Calculate total bet units for buying
        SUM(CASE WHEN b.amt > 0 AND b.yes = 1 THEN b.amt / b.podd
                 WHEN b.amt > 0 AND b.yes = 0 THEN b.amt / (1 - b.podd)
                 ELSE 0 END) as bought_units,
        
        -- Calculate total bet units for selling
        SUM(CASE WHEN b.amt < 0 AND b.yes = 1 THEN ABS(b.amt) / b.podd
                 WHEN b.amt < 0 AND b.yes = 0 THEN ABS(b.amt) / (1 - b.podd)
                 ELSE 0 END) as sold_units,
        
        -- Calculate net bet units
        SUM(CASE WHEN b.amt > 0 AND b.yes = 1 THEN b.amt / b.podd
                 WHEN b.amt > 0 AND b.yes = 0 THEN b.amt / (1 - b.podd)
                 ELSE 0 END)
        -
        SUM(CASE WHEN b.amt < 0 AND b.yes = 1 THEN ABS(b.amt) / b.podd
                 WHEN b.amt < 0 AND b.yes = 0 THEN ABS(b.amt) / (1 - b.podd)
                 ELSE 0 END) as net_units,
        
        -- Calculate cost basis of remaining units (total cost of bought units - cost basis of sold units)
        CASE 
            WHEN SUM(CASE WHEN b.amt > 0 AND b.yes = 1 THEN b.amt / b.podd
                          WHEN b.amt > 0 AND b.yes = 0 THEN b.amt / (1 - b.podd)
                          ELSE 0 END) > 0 
            THEN 
                SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END) - 
                (SUM(CASE WHEN b.amt < 0 AND b.yes = 1 THEN ABS(b.amt) / b.podd
                          WHEN b.amt < 0 AND b.yes = 0 THEN ABS(b.amt) / (1 - b.podd)
                          ELSE 0 END) * 
                 (SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END) /
                  SUM(CASE WHEN b.amt > 0 AND b.yes = 1 THEN b.amt / b.podd
                            WHEN b.amt > 0 AND b.yes = 0 THEN b.amt / (1 - b.podd)
                            ELSE 0 END)))
            ELSE 0 
        END as total_invested,
        
        -- Calculate average buying price per unit
        CASE 
            WHEN SUM(CASE WHEN b.amt > 0 AND b.yes = 1 THEN b.amt / b.podd
                          WHEN b.amt > 0 AND b.yes = 0 THEN b.amt / (1 - b.podd)
                          ELSE 0 END) > 0 
            THEN SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END) /
                 SUM(CASE WHEN b.amt > 0 AND b.yes = 1 THEN b.amt / b.podd
                           WHEN b.amt > 0 AND b.yes = 0 THEN b.amt / (1 - b.podd)
                           ELSE 0 END)
            ELSE 0 
        END as avg_buy_price_per_unit
        
    FROM bets b
    JOIN markets m ON b.mId = m.mid
    WHERE b.uId = %s
    
    GROUP BY b.uId, b.mId, b.yes, m.name, m.description, m.end_date
)

SELECT 
    uId,
    mId,
    yes,
    market_name,
    market_description,
    end_date,
    bought_units,
    sold_units,
    net_units,
    total_invested,
    avg_buy_price_per_unit
    
FROM user_market_holdings

-- Only return markets with remaining bet units
WHERE net_units > 0

ORDER BY net_units DESC 