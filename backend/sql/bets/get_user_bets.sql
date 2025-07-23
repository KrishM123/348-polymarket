SELECT
    b.bId,
    b.mId,
    m.name as market_name,
    b.podd,
    b.amt,
    b.yes,
    b.createdAt
FROM
    bets b
JOIN
    markets m ON b.mId = m.mid
WHERE
    b.uId = %s
ORDER BY
    b.createdAt DESC