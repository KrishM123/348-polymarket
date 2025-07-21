SELECT mid, name, description, podd, volume, end_date 
FROM markets 
WHERE volume > 0
ORDER BY end_date DESC; 