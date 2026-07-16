import sqlite3
import random
from datetime import datetime, timedelta

def create_enterprise_warehouse():
    print("🏗️ Initializing Enterprise Multi-Tenant Data Warehouse...")
    conn = sqlite3.connect("data_warehouse.db")
    cursor = conn.cursor()

    print("🗑️ Clearing old architecture...")
    tables = [
        'support_tickets', 'shipping_logistics', 'refunds_and_returns', 
        'order_items', 'orders', 'ad_spend_logs', 'marketing_campaigns', 
        'products', 'categories', 'suppliers', 'customers', 'employees', 'companies'
    ]
    for t in tables:
        cursor.execute(f"DROP TABLE IF EXISTS {t}")

    print("📝 Forging Multi-Tenant Mega-Schema (13 Tables)...")
    cursor.executescript("""
        /* --- 1. SAAS IDENTITY LAYER --- */
        CREATE TABLE companies (
            id INTEGER PRIMARY KEY, name TEXT, tier TEXT
        );
        CREATE TABLE employees (
            id INTEGER PRIMARY KEY, company_id INTEGER, name TEXT, role TEXT, email TEXT
        );

        /* --- 2. CRM LAYER --- */
        CREATE TABLE customers (
            id INTEGER PRIMARY KEY, company_id INTEGER, name TEXT, segment TEXT, region TEXT
        );

        /* --- 3. SUPPLY CHAIN & CATALOG LAYER --- */
        CREATE TABLE suppliers (
            id INTEGER PRIMARY KEY, company_id INTEGER, name TEXT, reliability_score REAL
        );
        CREATE TABLE categories (
            id INTEGER PRIMARY KEY, company_id INTEGER, name TEXT
        );
        CREATE TABLE products (
            id INTEGER PRIMARY KEY, category_id INTEGER, supplier_id INTEGER, company_id INTEGER, name TEXT, price REAL, cost REAL
        );

        /* --- 4. GROWTH & MARKETING LAYER --- */
        CREATE TABLE marketing_campaigns (
            id INTEGER PRIMARY KEY, company_id INTEGER, name TEXT, platform TEXT
        );
        CREATE TABLE ad_spend_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, campaign_id INTEGER, date TIMESTAMP, spend REAL
        );

        /* --- 5. CORE REVENUE LAYER --- */
        CREATE TABLE orders (
            id INTEGER PRIMARY KEY, customer_id INTEGER, campaign_id INTEGER, company_id INTEGER, status TEXT, created_at TIMESTAMP
        );
        CREATE TABLE order_items (
            id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_id INTEGER, quantity INTEGER, price_at_time REAL
        );
        CREATE TABLE refunds_and_returns (
            id INTEGER PRIMARY KEY AUTOINCREMENT, order_item_id INTEGER, reason TEXT, amount REAL
        );

        /* --- 6. CX & FULFILLMENT LAYER --- */
        CREATE TABLE shipping_logistics (
            id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, carrier TEXT, estimated_days INTEGER, actual_days INTEGER
        );
        CREATE TABLE support_tickets (
            id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, customer_id INTEGER, issue_type TEXT, resolution_time_hours REAL
        );
    """)

    print("🌱 Injecting synthetic enterprise data (This may take a moment)...")

    # 1. Seed Companies
    companies = [(1, "TechCorp", "Enterprise"), (2, "FashionBrand", "Pro"), (3, "HomeGoods", "Growth")]
    cursor.executemany("INSERT INTO companies VALUES (?, ?, ?)", companies)

    # 2. Seed Employees (Admins & Staff)
    employees = [
        (1, 1, "Admin Alice", "admin", "alice@techcorp.com"), (2, 1, "Staff Bob", "employee", "bob@techcorp.com"),
        (3, 2, "Admin Carol", "admin", "carol@fashionbrand.com"), (4, 3, "Admin Dave", "admin", "dave@homegoods.com")
    ]
    cursor.executemany("INSERT INTO employees VALUES (?, ?, ?, ?, ?)", employees)

    # Data generation parameters
    regions = ['North America', 'Europe', 'Asia', 'South America']
    segments = ['Whale', 'Returning', 'New', 'Churn-Risk']
    platforms = ['Google Ads', 'Meta', 'LinkedIn', 'TikTok']
    carriers = ['FedEx', 'UPS', 'DHL', 'USPS']
    issue_types = ['Defective Product', 'Late Delivery', 'Wrong Item', 'Billing Issue']
    
    start_date = datetime(2025, 1, 1)

    for company_id in [1, 2, 3]:
        # 3. Customers
        customer_offset = (company_id - 1) * 2000
        customers = [(i, company_id, f"Customer_{i}", random.choice(segments), random.choice(regions)) for i in range(customer_offset + 1, customer_offset + 2001)]
        cursor.executemany("INSERT INTO customers VALUES (?, ?, ?, ?, ?)", customers)

        # 4. Suppliers & Categories
        supplier_offset = (company_id - 1) * 10
        suppliers = [(i, company_id, f"Supplier_{i}", round(random.uniform(0.7, 0.99), 2)) for i in range(supplier_offset + 1, supplier_offset + 11)]
        cursor.executemany("INSERT INTO suppliers VALUES (?, ?, ?, ?)", suppliers)

        category_offset = (company_id - 1) * 5
        categories = [(i, company_id, f"Category_{i}") for i in range(category_offset + 1, category_offset + 6)]
        cursor.executemany("INSERT INTO categories VALUES (?, ?, ?)", categories)

        # 5. Products
        product_offset = (company_id - 1) * 100
        products = []
        for i in range(product_offset + 1, product_offset + 101):
            cost = round(random.uniform(10.0, 200.0), 2)
            price = round(cost * random.uniform(1.5, 3.0), 2)
            products.append((i, random.choice(categories)[0], random.choice(suppliers)[0], company_id, f"Product_{i}", price, cost))
        cursor.executemany("INSERT INTO products VALUES (?, ?, ?, ?, ?, ?, ?)", products)

        # 6. Marketing Campaigns & Ad Spend
        campaign_offset = (company_id - 1) * 20
        campaigns = [(i, company_id, f"Campaign_{i}", random.choice(platforms)) for i in range(campaign_offset + 1, campaign_offset + 21)]
        cursor.executemany("INSERT INTO marketing_campaigns VALUES (?, ?, ?, ?)", campaigns)

        ad_spends = []
        for camp in campaigns:
            for day in range(365):
                ad_date = start_date + timedelta(days=day)
                spend = round(random.uniform(50.0, 500.0), 2)
                ad_spends.append((camp[0], ad_date.strftime("%Y-%m-%d 00:00:00"), spend))
        cursor.executemany("INSERT INTO ad_spend_logs (campaign_id, date, spend) VALUES (?, ?, ?)", ad_spends)

        # 7. Orders, Items, Returns, Logistics, Tickets
        orders, order_items, returns, logistics, tickets = [], [], [], [], []
        order_offset = (company_id - 1) * 5000
        
        for i in range(order_offset + 1, order_offset + 5001):
            cust_id = random.choice(customers)[0]
            camp_id = random.choice(campaigns)[0]
            order_date = start_date + timedelta(days=random.randint(0, 365), hours=random.randint(0, 23))
            
            orders.append((i, cust_id, camp_id, company_id, "completed", order_date.strftime("%Y-%m-%d %H:%M:%S")))
            
            # Shipping
            est_days = random.randint(2, 5)
            act_days = est_days + random.randint(-1, 3) # Sometimes late
            logistics.append((i, random.choice(carriers), est_days, act_days))

            # Support Ticket (5% chance)
            if random.random() < 0.05:
                tickets.append((i, cust_id, random.choice(issue_types), round(random.uniform(1.0, 48.0), 1)))

            # Items
            for _ in range(random.randint(1, 4)):
                prod = random.choice(products)
                qty = random.randint(1, 3)
                order_items.append((i, prod[0], qty, prod[5]))
                
                # Refund (3% chance per item)
                if random.random() < 0.03:
                    returns.append((len(order_items), random.choice(['Damaged', 'Not as described', 'Changed mind']), prod[5] * qty))

        cursor.executemany("INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?)", orders)
        cursor.executemany("INSERT INTO shipping_logistics (order_id, carrier, estimated_days, actual_days) VALUES (?, ?, ?, ?)", logistics)
        cursor.executemany("INSERT INTO support_tickets (order_id, customer_id, issue_type, resolution_time_hours) VALUES (?, ?, ?, ?)", tickets)
        cursor.executemany("INSERT INTO order_items (order_id, product_id, quantity, price_at_time) VALUES (?, ?, ?, ?)", order_items)
        cursor.executemany("INSERT INTO refunds_and_returns (order_item_id, reason, amount) VALUES (?, ?, ?)", returns)

    conn.commit()
    conn.close()
    print("✅ Mega-Schema successfully generated! 'data_warehouse.db' is ready for Phase 2.")

if __name__ == "__main__":
    create_enterprise_warehouse()