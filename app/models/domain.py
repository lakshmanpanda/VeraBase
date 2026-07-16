from pydantic import BaseModel, Field
from typing import List, Optional

class ExtractedFilter(BaseModel):
    field: str = Field(description="The business entity being filtered, e.g., 'customer_type', 'region'")
    operator: str = Field(description="Logical operator: '=', '!=', '>', '<', '>=', '<=', 'BETWEEN', 'IN'")
    value: str = Field(description="The value to filter by, e.g., 'new', 'south'")

class ExtractedQuery(BaseModel):
    intent: str = Field(description="The core intent, e.g., 'aggregation', 'trend', 'comparison'")
    metrics: List[str] = Field(description="List of raw metric names, e.g., ['revenue', 'sales']")
    dimensions: List[str] = Field(description="List of grouping dimensions, e.g., ['month', 'region']")
    filters: List[ExtractedFilter] = Field(description="List of applied filters")
    time_range: Optional[str] = Field(description="Explicit time range if mentioned, e.g., 'festive season', 'last 30 days'. Return null if none.")
    modifiers: List[str] = Field(description="List of metric modifiers, e.g., ['excluding refunds']. Return empty list if none.")