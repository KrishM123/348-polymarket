SELECT m.mid, m.name, m.description, m.podd, m.volume, m.end_date
FROM markets m
LEFT JOIN (
    SELECT mId, SUM(weight * EXP(-0.03 * TIMESTAMPDIFF(HOUR, activity_date, NOW()))) AS trending_score
    FROM (
        SELECT mId, createdAt AS activity_date, 1.0 AS weight FROM bets
        UNION ALL
        SELECT mId, created_at AS activity_date, 0.5 AS weight FROM comments
    ) AS activities
    GROUP BY mId
) AS activity_scores ON m.mid = activity_scores.mId
WHERE m.end_date > NOW()
ORDER BY COALESCE(activity_scores.trending_score, 0) DESC, m.mid;
