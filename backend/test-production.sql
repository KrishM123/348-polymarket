-- All Active Markets (Top 10)
SELECT mid, name, description, podd, volume, end_date
FROM markets
WHERE end_date > NOW()
ORDER BY end_date ASC
LIMIT 10;

-- All Markets Including Expired (Top 10)
SELECT mid, name, description, podd, volume, end_date
FROM markets
ORDER BY end_date DESC
LIMIT 10;

-- Market by ID (First Market)
SELECT mid, name, description, podd, volume, end_date
FROM markets
WHERE mid = 1;

-- Market Bets for Market ID 1 (Top 10)
SELECT b.bId, b.uId, b.mId, m.name as market_name, b.podd, b.amt, b.yes, b.createdAt, u.uname
FROM bets b
JOIN markets m ON b.mId = m.mid
JOIN users u ON b.uId = u.uid
WHERE b.mId = 1
ORDER BY b.createdAt DESC
LIMIT 10;

-- Volume Distribution for Market ID 1
SELECT 
    COALESCE(SUM(CASE WHEN b.yes = 1 THEN b.amt ELSE 0 END), 0) as yes_volume,
    COALESCE(SUM(CASE WHEN b.yes = 0 THEN b.amt ELSE 0 END), 0) as no_volume
FROM bets b
WHERE b.mId = 1;

-- Markets with Highest Volume (Top 10)
SELECT mid, name, description, podd, volume, end_date
FROM markets
ORDER BY volume DESC
LIMIT 10;

-- Markets with Most Bets (Top 10)
SELECT m.mid, m.name, m.description, m.podd, m.volume, COUNT(b.bId) as bet_count
FROM markets m
LEFT JOIN bets b ON m.mid = b.mId
GROUP BY m.mid, m.name, m.description, m.podd, m.volume
ORDER BY bet_count DESC
LIMIT 10;

-- Recent Betting Activity (Top 10)
SELECT b.bId, b.uId, b.mId, m.name as market_name, b.podd, b.amt, b.yes, b.createdAt, u.uname
FROM bets b
JOIN markets m ON b.mId = m.mid
JOIN users u ON b.uId = u.uid
ORDER BY b.createdAt DESC
LIMIT 10;

-- Market Statistics Summary (Top 10 by Volume)
SELECT 
    m.mid,
    m.name,
    m.podd,
    m.volume,
    m.end_date,
    COUNT(b.bId) as total_bets,
    COALESCE(SUM(CASE WHEN b.yes = 1 THEN b.amt ELSE 0 END), 0) as yes_volume,
    COALESCE(SUM(CASE WHEN b.yes = 0 THEN b.amt ELSE 0 END), 0) as no_volume,
    COUNT(DISTINCT b.uId) as unique_bettors
FROM markets m
LEFT JOIN bets b ON m.mid = b.mId
GROUP BY m.mid, m.name, m.podd, m.volume, m.end_date
ORDER BY m.volume DESC
LIMIT 10;

-- Active Markets with Recent Activity (Top 10)
SELECT 
    m.mid,
    m.name,
    m.description,
    m.podd,
    m.volume,
    m.end_date,
    MAX(b.createdAt) as last_bet_time
FROM markets m
JOIN bets b ON m.mid = b.mId
WHERE m.end_date > NOW()
GROUP BY m.mid, m.name, m.description, m.podd, m.volume, m.end_date
ORDER BY last_bet_time DESC
LIMIT 10; 