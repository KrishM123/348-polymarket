SELECT b.bId, b.uId, b.mId, b.podd, b.amt, b.yes, b.createdAt, u.uname
FROM bets b
JOIN users u ON b.uId = u.uid
WHERE b.mId = %s
ORDER BY b.createdAt DESC 