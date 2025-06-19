-- Create and use the polymarket database
CREATE DATABASE IF NOT EXISTS polymarket;
USE polymarket;

-- Dropping tables if they exist to ensure a clean setup
DROP TABLE IF EXISTS isParentOf;
DROP TABLE IF EXISTS comments;
DROP TABLE IF EXISTS bets;
DROP TABLE IF EXISTS markets;
DROP TABLE IF EXISTS users;


-- Table for User Accounts
CREATE TABLE users (
    uid INT AUTO_INCREMENT PRIMARY KEY,
    uname VARCHAR(50) NOT NULL UNIQUE,
    passwordHash CHAR(60) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phoneNumber VARCHAR(20),
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0.00
);

-- Table for Prediction Markets
CREATE TABLE markets (
    mid INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    podd DECIMAL(3, 2) NOT NULL DEFAULT 0.50, -- Probability, from 0.00 to 1.00
    volume DECIMAL(15, 2) NOT NULL DEFAULT 0.00,
    end_date DATETIME NOT NULL
);

-- Table for Bets placed by Users on Markets
CREATE TABLE bets (
    bId INT AUTO_INCREMENT PRIMARY KEY,
    uId INT NOT NULL,
    mId INT NOT NULL,
    podd DECIMAL(3, 2) NOT NULL,
    amt DECIMAL(10, 2) NOT NULL,
    yes BOOLEAN NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uId) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (mId) REFERENCES markets(mid) ON DELETE CASCADE
);

-- Table for Comments made by Users on Markets
CREATE TABLE comments (
    cId INT AUTO_INCREMENT PRIMARY KEY,
    uId INT NOT NULL,
    mId INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    content TEXT NOT NULL,
    FOREIGN KEY (uId) REFERENCES users(uid) ON DELETE CASCADE,
    FOREIGN KEY (mId) REFERENCES markets(mid) ON DELETE CASCADE
);

-- Table for managing threaded comment replies
CREATE TABLE isParentOf (
    pCId INT NOT NULL, -- Parent Comment ID
    cCId INT NOT NULL, -- Child Comment ID
    PRIMARY KEY (pCId, cCId),
    FOREIGN KEY (pCId) REFERENCES comments(cId) ON DELETE CASCADE,
    FOREIGN KEY (cCId) REFERENCES comments(cId) ON DELETE CASCADE
); 