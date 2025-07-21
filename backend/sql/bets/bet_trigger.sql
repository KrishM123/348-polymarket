-- Unified trigger for handling both buy and sell operations
DELIMITER $$

CREATE TRIGGER handleBetOnInsert
BEFORE INSERT ON bets
FOR EACH ROW
BEGIN
    -- Handle both buy and sell cases
    IF NEW.amt > 0 THEN
        -- BUY: Deduct amount from user balance and add to market volume
        UPDATE users SET balance = balance - NEW.amt WHERE uid = NEW.uId;
        UPDATE markets SET volume = volume + NEW.amt WHERE mid = NEW.mId;
    ELSEIF NEW.amt < 0 THEN
        -- SELL: Add amount to user balance and subtract from market volume
        UPDATE users SET balance = balance + ABS(NEW.amt) WHERE uid = NEW.uId;
        UPDATE markets SET volume = volume - ABS(NEW.amt) WHERE mid = NEW.mId;
        SET NEW.amt = ABS(NEW.amt);
    END IF;
    
    -- Note: Market podd is no longer updated here since odds are calculated dynamically
    -- All odds calculations now happen in the application layer based on user context
END$$

DELIMITER ; 