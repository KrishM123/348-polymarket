SELECT mid, name, description, podd, volume, end_date 
FROM markets 
WHERE end_date > NOW()
ORDER BY end_date ASC 