WITH RECURSIVE threaded_comments AS (
    -- Base case: top-level comments
    SELECT
        c.cId,
        c.content,
        c.created_at,
        c.uId,
        u.uname,
        CAST(NULL AS SIGNED) AS parent_id,
        0     AS level
    FROM comments c
    JOIN users u ON c.uId = u.uid
    WHERE c.mId = %s
      AND c.cId NOT IN (SELECT cCId FROM isParentOf)

    UNION ALL

    -- Recursive case: fetch replies to the previous level
    SELECT
        child.cId,
        child.content,
        child.created_at,
        child.uId,
        u.uname,
        ip.pCId AS parent_id,
        tc.level + 1 AS level
    FROM isParentOf ip
    JOIN comments child ON child.cId = ip.cCId
    JOIN users u ON child.uId = u.uid
    JOIN threaded_comments tc ON tc.cId = ip.pCId
    WHERE child.mId = %s
)
SELECT
    cId,
    content,
    created_at,
    uId,
    uname,
    parent_id,
    level
FROM threaded_comments
ORDER BY level, created_at; 