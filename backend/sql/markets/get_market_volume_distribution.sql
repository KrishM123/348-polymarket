SELECT 
    COALESCE(SUM(CASE 
        WHEN yes = 1 THEN amt 
        ELSE 0 
    END), 0) AS yes_volume,
    
    COALESCE(SUM(CASE 
        WHEN yes = 0 THEN amt 
        ELSE 0 
    END), 0) AS no_volume
FROM bets 
WHERE mId = %s 