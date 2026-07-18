import os
import asyncio
import uuid
import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text
from dotenv import load_dotenv
from google import genai
from google.genai import types

print("🧠 Initializing True Enterprise Semantic Layer Build...")

# 1. Setup Connections
load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

DB_URL = os.getenv("DATABASE_URL")
if not DB_URL or "asyncpg" not in DB_URL:
    DB_URL = "postgresql+asyncpg://postgres:postgres@localhost:5433/verabase"

engine = create_async_engine(DB_URL)

def get_embedding(content):
    response = client.models.embed_content(
        model="models/gemini-embedding-001",
        contents=content,
        config=types.EmbedContentConfig(output_dimensionality=768)
    )
    return response.embeddings[0].values

# 2. Define the Enterprise Lexicon (Mapped strictly to your schema.py)
METRICS = [
    {
        "name": "total_revenue", 
        "sql": "SUM(order_items.price_at_time * order_items.quantity)", 
        "desc": "Gross total revenue from items sold", 
        "grain": "order_item", 
        "base_table": "order_items",
        "dependencies": []
    },
    {
        "name": "net_revenue", 
        "sql": "SUM(order_items.price_at_time * order_items.quantity) - COALESCE(SUM(refunds_and_returns.amount), 0)", 
        "desc": "True net revenue calculated as total sales minus refunds and returns", 
        "grain": "order_item", 
        "base_table": "order_items",
        "dependencies": ["refunds_and_returns"] 
    },
    {
        "name": "total_refunds", 
        "sql": "SUM(refunds_and_returns.amount)", 
        "desc": "Total monetary value of refunds and returns", 
        "grain": "refund", 
        "base_table": "refunds_and_returns",
        "dependencies": []
    },
    {
        "name": "average_resolution_time", 
        "sql": "AVG(support_tickets.resolution_time_hours)", 
        "desc": "Average time taken to resolve customer support tickets in hours", 
        "grain": "ticket", 
        "base_table": "support_tickets",
        "dependencies": []
    },
    {
        "name": "average_delivery_days", 
        "sql": "AVG(shipping_logistics.actual_days)", 
        "desc": "Average number of days taken to deliver a physical order", 
        "grain": "shipment", 
        "base_table": "shipping_logistics",
        "dependencies": []
    },
    {
        "name": "total_ad_spend", 
        "sql": "SUM(ad_spend_logs.spend)", 
        "desc": "Total money spent on marketing campaigns and advertisements", 
        "grain": "daily_spend", 
        "base_table": "ad_spend_logs",
        "dependencies": []
    },
    {
        "name": "return_on_ad_spend",
        "sql": "ROUND(SUM(order_items.price_at_time * order_items.quantity) / NULLIF(SUM(ad_spend_logs.spend), 0), 2)",
        "desc": "Return on Ad Spend (ROAS): total revenue generated per dollar spent on advertising campaigns. A ROAS of 4 means $4 revenue per $1 spent.",
        "grain": "campaign",
        "base_table": "order_items",
        "dependencies": ["orders", "marketing_campaigns", "ad_spend_logs"]
    },
    {
        "name": "customer_acquisition_cost",
        "sql": "ROUND(SUM(ad_spend_logs.spend) / NULLIF(COUNT(DISTINCT orders.customer_id), 0), 2)",
        "desc": "Customer Acquisition Cost (CAC): total advertising spend divided by number of unique customers who placed orders. Lower is better.",
        "grain": "customer",
        "base_table": "ad_spend_logs",
        "dependencies": ["marketing_campaigns", "orders"]
    },
    {
        "name": "supplier_defect_rate",
        "sql": "ROUND(CAST(COUNT(refunds_and_returns.id) AS REAL) / NULLIF(COUNT(order_items.id), 0) * 100, 2)",
        "desc": "Supplier Defect Rate: percentage of order items that were returned or refunded, grouped by supplier. Indicates product quality issues from a specific vendor.",
        "grain": "order_item",
        "base_table": "order_items",
        "dependencies": ["refunds_and_returns", "products", "suppliers"]
    },
    {
        "name": "total_orders",
        "sql": "COUNT(DISTINCT orders.id)",
        "desc": "Total number of unique orders placed",
        "grain": "order",
        "base_table": "orders",
        "dependencies": []
    },
    {
        "name": "average_order_value",
        "sql": "ROUND(SUM(order_items.price_at_time * order_items.quantity) / NULLIF(COUNT(DISTINCT order_items.order_id), 0), 2)",
        "desc": "Average Order Value (AOV): the mean revenue generated per order. Key indicator of purchase behavior.",
        "grain": "order",
        "base_table": "order_items",
        "dependencies": []
    },
    {
        "name": "total_customers",
        "sql": "COUNT(DISTINCT customers.id)",
        "desc": "Total number of unique customers",
        "grain": "customer",
        "base_table": "customers",
        "dependencies": []
    }
]

DIMENSIONS = [
    {"name": "customer_segment", "col": "segment", "desc": "Classification of the customer (e.g., Whale, New, Returning, Churn-Risk)", "grain": "customer", "base_table": "customers", "type": "VARCHAR"},
    {"name": "region", "col": "region", "desc": "Geographic region of the customer", "grain": "customer", "base_table": "customers", "type": "VARCHAR"},
    {"name": "campaign_platform", "col": "platform", "desc": "The platform where the ad campaign ran (e.g., Google Ads, Meta, TikTok)", "grain": "campaign", "base_table": "marketing_campaigns", "type": "VARCHAR"},
    {"name": "product_category", "col": "name", "desc": "The category grouping of the product", "grain": "category", "base_table": "categories", "type": "VARCHAR"},
    {"name": "supplier_name", "col": "name", "desc": "The name of the vendor or supplier providing the product", "grain": "supplier", "base_table": "suppliers", "type": "VARCHAR"},
    {"name": "issue_type", "col": "issue_type", "desc": "The category of the customer support ticket", "grain": "ticket", "base_table": "support_tickets", "type": "VARCHAR"}
]

JOINS = [
    ("orders", "customers", "orders.customer_id = customers.id", "LEFT", "MANY_TO_ONE"),
    ("orders", "marketing_campaigns", "orders.campaign_id = marketing_campaigns.id", "LEFT", "MANY_TO_ONE"),
    ("order_items", "orders", "order_items.order_id = orders.id", "LEFT", "MANY_TO_ONE"),
    ("order_items", "products", "order_items.product_id = products.id", "LEFT", "MANY_TO_ONE"),
    ("products", "categories", "products.category_id = categories.id", "LEFT", "MANY_TO_ONE"),
    ("products", "suppliers", "products.supplier_id = suppliers.id", "LEFT", "MANY_TO_ONE"),
    ("refunds_and_returns", "order_items", "refunds_and_returns.order_item_id = order_items.id", "LEFT", "ONE_TO_ONE"),
    ("shipping_logistics", "orders", "shipping_logistics.order_id = orders.id", "LEFT", "ONE_TO_ONE"),
    ("support_tickets", "orders", "support_tickets.order_id = orders.id", "LEFT", "MANY_TO_ONE"),
    ("ad_spend_logs", "marketing_campaigns", "ad_spend_logs.campaign_id = marketing_campaigns.id", "LEFT", "MANY_TO_ONE"),
    
    # Core Multi-Tenant Links
    ("orders", "companies", "orders.company_id = companies.id", "INNER", "MANY_TO_ONE"),
    ("customers", "companies", "customers.company_id = companies.id", "INNER", "MANY_TO_ONE"),
    ("products", "companies", "products.company_id = companies.id", "INNER", "MANY_TO_ONE")
]

async def seed_database():
    async with engine.begin() as conn:
        print("🔨 Self-Healing: Rebuilding schema matching your exact MVP UUID structure...")
        
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        await conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
        
        # Drop everything cleanly to eliminate drift
        await conn.execute(text("DROP TABLE IF EXISTS metrics, dimensions, join_relationships, business_glossary, metric_synonyms, filters CASCADE;"))
        
        # 1. Metrics Table (Matching your schema.py precisely)
        await conn.execute(text("""
            CREATE TABLE metrics (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                canonical_name VARCHAR(255) UNIQUE NOT NULL,
                description TEXT,
                grain VARCHAR(50) NOT NULL,
                base_table VARCHAR(100) NOT NULL,
                sql_template TEXT NOT NULL,
                dependencies JSONB DEFAULT '[]'::jsonb,
                embedding vector(768),
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE
            );
        """))
        
        # 2. Dimensions Table (Matching your schema.py precisely)
        await conn.execute(text("""
            CREATE TABLE dimensions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                canonical_name VARCHAR(255) UNIQUE NOT NULL,
                column_name VARCHAR(255) NOT NULL,
                grain VARCHAR(50) NOT NULL,
                base_table VARCHAR(100) NOT NULL,
                data_type VARCHAR(50) NOT NULL,
                embedding vector(768),
                is_active BOOLEAN DEFAULT TRUE
            );
        """))
        
        # 3. Join Relationships Table (Matching your schema.py precisely)
        await conn.execute(text("""
            CREATE TABLE join_relationships (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                source_table VARCHAR(100) NOT NULL,
                target_table VARCHAR(100) NOT NULL,
                join_condition TEXT NOT NULL,
                join_type VARCHAR(20) DEFAULT 'LEFT',
                cardinality VARCHAR(50) NOT NULL
            );
        """))
        
        print("🚀 Seeding Enterprise Metrics with AI Embeddings...")
        for m in METRICS:
            emb_str = str(get_embedding(f"{m['name']}: {m['desc']}"))
            await conn.execute(text("""
                INSERT INTO metrics (canonical_name, description, grain, base_table, sql_template, dependencies, embedding) 
                VALUES (:name, :desc, :grain, :base, :sql, CAST(:deps AS JSONB), :emb);
            """), {
                "name": m['name'], 
                "desc": m['desc'], 
                "grain": m['grain'], 
                "base": m['base_table'], 
                "sql": m['sql'], 
                "deps": json.dumps(m['dependencies']),
                "emb": emb_str
            })
            
        print("🚀 Seeding Enterprise Dimensions with AI Embeddings...")
        for d in DIMENSIONS:
            emb_str = str(get_embedding(f"{d['name']}: {d['desc']}"))
            await conn.execute(text("""
                INSERT INTO dimensions (canonical_name, column_name, grain, base_table, data_type, embedding) 
                VALUES (:name, :col, :grain, :base, :dtype, :emb);
            """), {
                "name": d['name'], 
                "col": d['col'], 
                "grain": d['grain'], 
                "base": d['base_table'], 
                "dtype": d['type'], 
                "emb": emb_str
            })
            
        print("🕸️ Seeding Graph Relationships (BFS Edges)...")
        for src, tgt, cond, jtype, card in JOINS:
            await conn.execute(text("""
                INSERT INTO join_relationships (source_table, target_table, join_condition, join_type, cardinality) 
                VALUES (:src, :tgt, :cond, :jtype, :card);
            """), {"src": src, "tgt": tgt, "cond": cond, "jtype": jtype, "card": card})

        print("✅ True Enterprise UUID Schema successfully injected into PostgreSQL!")

if __name__ == "__main__":
    asyncio.run(seed_database())