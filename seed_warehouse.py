import sqlite3
import random
from datetime import datetime, timedelta

def create_warehouse():
    print("🏗️ Connecting to SQLite Data Warehouse...")
    # This will create a file named 'data_warehouse.db' in your root folder
    conn = sqlite3.connect("data_warehouse.db")
    cursor = conn.cursor()

    print("🗑️ Dropping old tables if they exist...")
    cursor.executescript("""
        DROP TABLE IF EXISTS order_items;
        DROP TABLE IF EXISTS orders;
        DROP TABLE IF EXISTS users;
    """)

    print("📝 Creating tables...")
    cursor.executescript("""
        CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name TEXT,
            region TEXT,
            customer_type TEXT,
            created_at TIMESTAMP
        );

        CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            status TEXT,
            created_at TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );

        CREATE TABLE order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id INTEGER,
            amount REAL,
            refund_amount REAL,
            FOREIGN KEY(order_id) REFERENCES orders(id)
        );
    """)

    # --- GENERATE FAKE DATA ---
    print("🌱 Injecting thousands of fake e-commerce records...")
    
    regions = ['north', 'south', 'east', 'west']
    customer_types = ['new', 'returning']
    
    # 1. Generate Users
    users_data = []
    for i in range(1, 1001): # 1000 users
        reg = random.choice(regions)
        ctype = random.choice(customer_types)
        users_data.append((i, f"User_{i}", reg, ctype, "2025-01-01 10:00:00"))
        
    cursor.executemany("INSERT INTO users (id, name, region, customer_type, created_at) VALUES (?, ?, ?, ?, ?)", users_data)

    # 2. Generate Orders and Order Items
    orders_data = []
    order_items_data = []
    
    # Start date for orders (Jan 1, 2026)
    start_date = datetime(2026, 1, 1)
    
    for order_id in range(1, 5001): # 5000 orders
        user_id = random.randint(1, 1000)
        
        # Heavily weight dates towards October/November to test our "Festive Season" query
        if random.random() > 0.4:
            # 60% of orders happen in Oct/Nov
            random_days = random.randint(273, 318) # Roughly Oct 1 to Nov 15
        else:
            # 40% spread across the rest of the year
            random_days = random.randint(0, 365)
            
        order_date = start_date + timedelta(days=random_days)
        orders_data.append((order_id, user_id, "completed", order_date.strftime("%Y-%m-%d %H:%M:%S")))
        
        # Generate 1 to 3 items per order
        for _ in range(random.randint(1, 3)):
            amount = round(random.uniform(50.0, 500.0), 2)
            # 10% chance of a refund
            refund = round(amount * random.uniform(0.5, 1.0), 2) if random.random() > 0.9 else 0.0
            order_items_data.append((order_id, amount, refund))

    cursor.executemany("INSERT INTO orders (id, user_id, status, created_at) VALUES (?, ?, ?, ?)", orders_data)
    cursor.executemany("INSERT INTO order_items (order_id, amount, refund_amount) VALUES (?, ?, ?)", order_items_data)

    conn.commit()
    conn.close()
    print("✅ Data Warehouse seeded successfully! 'data_warehouse.db' is ready.")

if __name__ == "__main__":
    create_warehouse()