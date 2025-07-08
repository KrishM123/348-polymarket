SELECT 
    c.cId,
    c.content,
    c.created_at,
    c.uId,
    u.uname
FROM comments c
JOIN users u ON c.uId = u.uid
WHERE c.mId = %s
ORDER BY c.created_at 