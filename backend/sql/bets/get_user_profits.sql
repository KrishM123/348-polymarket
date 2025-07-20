SELECT 
    u.uid,
    u.uname,
    u.balance as current_balance,
    
    -- Calculate realized gains (from sold bets - negative amounts)
    COALESCE(SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) ELSE 0 END), 0) as realized_gains,
    
    -- Calculate unrealized gains (from active bets - positive amounts)
    -- This represents the potential profit if the user were to sell their position at current market odds
    COALESCE(SUM(CASE WHEN b.amt > 0 THEN 
        CASE 
            WHEN b.yes = 1 THEN 
                -- For YES bets: (bet_amt) * (curr_podd / original_podd)
                (b.amt * (m.podd / b.podd)) - b.amt
            ELSE 
                -- For NO bets: (bet_amt) * ((1-curr_podd) / (1-original_podd))
                (b.amt * ((1 - m.podd) / (1 - b.podd))) - b.amt
        END
    ELSE 0 END), 0) as unrealized_gains,
    
    -- Total profits (realized + unrealized)
    (COALESCE(SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) ELSE 0 END), 0) + 
     COALESCE(SUM(CASE WHEN b.amt > 0 THEN 
        CASE 
            WHEN b.yes = 1 THEN 
                (b.amt * (m.podd / b.podd)) - b.amt
            ELSE 
                (b.amt * ((1 - m.podd) / (1 - b.podd))) - b.amt
        END
    ELSE 0 END), 0)) as total_profits,
    
    -- Calculate percent change from initial balance
    -- Initial balance = current_balance - realized_gains + total_bet_amounts
    CASE 
        WHEN (u.balance - COALESCE(SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) ELSE 0 END), 0) + 
              COALESCE(SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END), 0)) > 0 
        THEN 
            ((COALESCE(SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) ELSE 0 END), 0) + 
              COALESCE(SUM(CASE WHEN b.amt > 0 THEN 
                CASE 
                    WHEN b.yes = 1 THEN 
                        (b.amt * (m.podd / b.podd)) - b.amt
                    ELSE 
                        (b.amt * ((1 - m.podd) / (1 - b.podd))) - b.amt
                END
            ELSE 0 END), 0)) / 
            (u.balance - COALESCE(SUM(CASE WHEN b.amt < 0 THEN ABS(b.amt) ELSE 0 END), 0) + 
             COALESCE(SUM(CASE WHEN b.amt > 0 THEN b.amt ELSE 0 END), 0))) * 100
        ELSE 0
    END as percent_change

FROM users u
LEFT JOIN bets b ON u.uid = b.uId
LEFT JOIN markets m ON b.mId = m.mid

GROUP BY u.uid, u.uname, u.balance

ORDER BY total_profits DESC; 