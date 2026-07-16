import asyncio
from sqlalchemy import text
from app.core.database import engine, AsyncSessionLocal
from app.models.schema import Base, Metric, Dimension, JoinRelationship, BusinessGlossary, Filter

async def init_models():
    async with engine.begin() as conn:
        print("🔧 Initializing database extensions...")
        # Ensure the required extensions exist in our PostgreSQL instance
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS vector;'))
        await conn.execute(text('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";'))
        
        print("🏗️ Building schema tables...")
        # Drop all tables first for a clean slate during local testing
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables based on our ORM models
        await conn.run_sync(Base.metadata.create_all)
        print("✅ Tables created successfully!")

async def seed_data():
    async with AsyncSessionLocal() as session:
        print("🌱 Seeding initial metadata...")
        
        # 1. Add our core Metric
        net_rev = Metric(
            canonical_name="net_revenue",
            description="Total revenue excluding refunds and cancellations",
            grain="order",
            base_table="order_items",
            sql_template="SUM(order_items.amount) - COALESCE(SUM(refunds.amount), 0)",
            # We will generate real vectors using Gemini in Phase 3, keeping it None for now
            embedding=None 
        )
        
        # 2. Add a Dimension
        region_dim = Dimension(
            canonical_name="region",
            column_name="users.region",
            grain="user",
            base_table="users",
            data_type="string",
            embedding=None
        )
        
        # 3. Add a strict Join Relationship graph edge
        order_to_user_join = JoinRelationship(
            source_table="orders",
            target_table="users",
            join_condition="orders.user_id = users.id",
            join_type="LEFT",
            cardinality="many_to_one"
        )

        # 4. Add a Business Glossary definition
        festive_season = BusinessGlossary(
            term="festive season",
            definition="The period between October 1st and November 15th every year.",
            term_type="time_definition",
            embedding=None
        )

        session.add_all([net_rev, region_dim, order_to_user_join, festive_season])
        await session.commit()
        print("✅ Seeding complete! Database is primed and ready.")

async def main():
    await init_models()
    await seed_data()

if __name__ == "__main__":
    asyncio.run(main())