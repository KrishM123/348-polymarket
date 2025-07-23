CREATE PROCEDURE `resolve_markets`()
BEGIN
    DECLARE done INT DEFAULT FALSE;
    DECLARE market_id INT;
    DECLARE market_podd DECIMAL(3, 2);
    DECLARE winning_outcome BOOLEAN;
    DECLARE total_winning_units DECIMAL(15, 2) DEFAULT 0;
    DECLARE total_losing_volume DECIMAL(15, 2) DEFAULT 0;
    DECLARE payout_per_unit DECIMAL(15, 2) DEFAULT 0;
    
    -- Cursor to select all expired markets that have not been resolved
    DECLARE cur_markets CURSOR FOR 
        SELECT mid, podd FROM markets WHERE end_date <= NOW() AND volume > 0;
    
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

    OPEN cur_markets;

    markets_loop: LOOP
        FETCH cur_markets INTO market_id, market_podd;
        IF done THEN
            LEAVE markets_loop;
        END IF;

        -- Determine the winning outcome
        -- If podd is exactly 0.50, we can consider it a push or handle as per business rules.
        SET winning_outcome = (market_podd >= 0.50);

        -- Reset variables for each market
        SET total_winning_units = 0;
        SET total_losing_volume = 0;
        SET payout_per_unit = 0;

        -- Calculate total losing volume and total winning units
        SELECT 
            SUM(CASE WHEN yes != winning_outcome THEN amt ELSE 0 END),
            SUM(CASE WHEN yes = winning_outcome THEN amt / podd ELSE 0 END)
        INTO total_losing_volume, total_winning_units
        FROM bets
        WHERE mId = market_id;

        -- Proceed only if there are winners and losers
        IF total_winning_units > 0 AND total_losing_volume > 0 THEN
            SET payout_per_unit = total_losing_volume / total_winning_units;

            -- Start transaction
            START TRANSACTION;

            -- Payout to all winners
            UPDATE users u
            JOIN bets b ON u.uid = b.uId
            SET u.balance = u.balance + ((b.amt / b.podd) * payout_per_unit)
            WHERE b.mId = market_id AND b.yes = winning_outcome;

            -- Mark the market as resolved
            UPDATE markets SET volume = 0 WHERE mid = market_id;
            
            COMMIT;

        ELSE
            -- If there's no winners or losers, just mark the market as resolved.
            UPDATE markets SET volume = 0 WHERE mid = market_id;
        END IF;

    END LOOP;

    CLOSE cur_markets;

END$