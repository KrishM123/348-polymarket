SELECT 
    COALESCE(SUM(CASE 
        WHEN yes = 1 AND amt > 0 THEN amt  -- Buy YES
        WHEN yes = 0 AND amt < 0 THEN ABS(amt)  -- Sell NO (increases YES volume)
        ELSE 0 
    END), 0) as yes_volume,
    COALESCE(SUM(CASE 
        WHEN yes = 0 AND amt > 0 THEN amt  -- Buy NO
        WHEN yes = 1 AND amt < 0 THEN ABS(amt)  -- Sell YES (increases NO volume)
        ELSE 0 
    END), 0) as no_volume
FROM bets 
WHERE mId = %s 