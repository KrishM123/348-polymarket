SELECT ip.pCId, ip.cCId
FROM isParentOf ip
JOIN comments c ON ip.cCId = c.cId
WHERE c.mId = %s 