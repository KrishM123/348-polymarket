DELIMITER $$

CREATE TRIGGER handleSellBetOnInsert
BEFORE INSERT ON bets
REFERENCING NEW ROW AS newBet
FOR EACH ROW
BEGIN
    -- Check if the bet is sell (if amount is negative)
    IF newBet.amt < 0 THEN
        -- Add bet amount to balance of the user
        UPDATE users SET balance = balance + ABS(newBet.amt) WHERE uid = newBet.uId;
        
        -- Update market volume
        UPDATE markets SET volume = volume - ABS(newBet.amt) WHERE mid = newBet.mId;
        
        SET newBet.amt = ABS(newBet.amt);
        
        -- Recalculate market podd
        BEGIN
            DECLARE yesVolume DECIMAL(15, 2);
            DECLARE noVolume DECIMAL(15, 2);
            DECLARE totalVolume DECIMAL(15, 2);
            DECLARE newPodd DECIMAL(3, 2);
            DECLARE smoothingFactor DECIMAL(2, 1) DEFAULT 1.0;
            
            SELECT 
                COALESCE(
                    SUM(CASE WHEN yes = 1 THEN amt ELSE 0 END), 0
                ),
                COALESCE(
                    SUM(CASE WHEN yes = 0 THEN amt ELSE 0 END), 0
                )
            INTO yesVolume, noVolume
            FROM bets
            WHERE mId = newBet.mId;
            
            -- Similar to backend/app.py functionality for calculating podd
            SET totalVolume = yesVolume + noVolume;
            
            IF totalVolume > 0 THEN
                SET newPodd = (yesVolume + smoothingFactor) / (totalVolume + 2 * smoothingFactor);
            ELSE
                SET newPodd = 0.50;
            END IF;
            
            -- Ensure odds are within reasonable bounds (0.01 to 0.99)
            IF newPodd > 0.99 THEN
                SET newPodd = 0.99;
            ELSEIF newPodd < 0.01 THEN
                SET newPodd = 0.01;
            END IF;

            UPDATE markets SET podd = newPodd WHERE mid = newBet.mId;
        END;
    END IF;
END$$

DELIMITER ; 