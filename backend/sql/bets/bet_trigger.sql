CREATE TRIGGER handleBetOnInsert
BEFORE INSERT ON bets
FOR EACH ROW
BEGIN
    IF NEW.amt > 0 THEN

        UPDATE users SET balance = balance - NEW.amt WHERE uid = NEW.uId;
        UPDATE markets SET volume = volume + NEW.amt WHERE mid = NEW.mId;

        ELSEIF NEW.amt < 0 THEN

        UPDATE users SET balance = balance + ABS(NEW.amt) WHERE uid = NEW.uId;
        UPDATE markets SET volume = volume - ABS(NEW.amt) WHERE mid = NEW.mId;

    END IF;
END