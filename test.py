import mysql.connector

# Connect to the local MySQL server
conn = mysql.connector.connect(
    host="127.0.0.1",
    user="polymarket",
    password="YourStrongPassword!"
)

cursor = conn.cursor()

# Create a test database
cursor.execute("CREATE DATABASE IF NOT EXISTS testdb;")
cursor.execute("USE testdb;")

# Create a table
cursor.execute("""
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100)
);
""")

# Insert data
cursor.execute("INSERT INTO users (name, email) VALUES (%s, %s)", ("Alice", "alice@example.com"))
cursor.execute("INSERT INTO users (name, email) VALUES (%s, %s)", ("Bob", "bob@example.com"))

# Commit the inserts
conn.commit()

# Query data
cursor.execute("SELECT * FROM users;")
for (id, name, email) in cursor.fetchall():
    print(f"User {id}: {name} ({email})")

# Cleanup
cursor.close()
conn.close()
