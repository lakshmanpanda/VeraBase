from sqlalchemy import Column, String, Text, Boolean, JSON, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from pgvector.sqlalchemy import Vector
from app.core.database import Base

class Metric(Base):
    __tablename__ = "metrics"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_name = Column(String(255), unique=True, nullable=False)
    description = Column(Text)
    grain = Column(String(50), nullable=False)
    base_table = Column(String(100), nullable=False)
    sql_template = Column(Text, nullable=False)
    dependencies = Column(JSON, default=[])
    # 768 dimensions for Gemini embeddings
    embedding = Column(Vector(768)) 
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    synonyms = relationship("MetricSynonym", back_populates="metric", cascade="all, delete-orphan")

class MetricSynonym(Base):
    __tablename__ = "metric_synonyms"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    metric_id = Column(UUID(as_uuid=True), ForeignKey("metrics.id", ondelete="CASCADE"))
    synonym = Column(String(255), nullable=False)

    metric = relationship("Metric", back_populates="synonyms")

class Dimension(Base):
    __tablename__ = "dimensions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_name = Column(String(255), unique=True, nullable=False)
    column_name = Column(String(255), nullable=False)
    grain = Column(String(50), nullable=False)
    base_table = Column(String(100), nullable=False)
    data_type = Column(String(50), nullable=False)
    embedding = Column(Vector(768))
    is_active = Column(Boolean, default=True)

class Filter(Base):
    __tablename__ = "filters"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    canonical_name = Column(String(255), unique=True, nullable=False)
    sql_condition = Column(Text, nullable=False)
    base_table = Column(String(100), nullable=False)
    embedding = Column(Vector(768))
    is_active = Column(Boolean, default=True)

class BusinessGlossary(Base):
    __tablename__ = "business_glossary"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    term = Column(String(255), unique=True, nullable=False)
    definition = Column(Text, nullable=False)
    term_type = Column(String(50))
    embedding = Column(Vector(768))
    is_active = Column(Boolean, default=True)

class JoinRelationship(Base):
    __tablename__ = "join_relationships"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_table = Column(String(100), nullable=False)
    target_table = Column(String(100), nullable=False)
    join_condition = Column(Text, nullable=False)
    join_type = Column(String(20), default="LEFT")
    cardinality = Column(String(50), nullable=False)