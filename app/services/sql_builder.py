# A map of tables in our schema that contain the tenant identifier
TENANT_TABLES = [
    "companies", "employees", "customers", "suppliers", 
    "categories", "products", "marketing_campaigns", "orders"
]

# Time-series dimension keywords → their SQLite strftime grouping expressions
# These are detected when the user asks for monthly/yearly trends
TIME_DIMENSION_MAP = {
    "month":       "strftime('%Y-%m', orders.created_at)",
    "order_month": "strftime('%Y-%m', orders.created_at)",
    "year":        "strftime('%Y', orders.created_at)",
    "order_year":  "strftime('%Y', orders.created_at)",
    "date":        "date(orders.created_at)",
    "day":         "date(orders.created_at)",
    "week":        "strftime('%Y-W%W', orders.created_at)",
    "quarter":     "strftime('%Y-Q', orders.created_at)",
    "ad_date":     "strftime('%Y-%m', ad_spend_logs.date)",
    "spend_month": "strftime('%Y-%m', ad_spend_logs.date)",
}


def _resolve_dimension_sql(dim_name: str, dim_sql: str) -> str:
    """
    Returns the correct SQL expression for a dimension:
    1. If the name is a known time keyword → use TIME_DIMENSION_MAP strftime()
    2. If dim_sql is already a function call (synthetic dim) → return as-is
    3. Otherwise → return the table-prefixed column name (e.g., customers.segment)
    """
    key = dim_name.lower()
    if key in TIME_DIMENSION_MAP:
        return TIME_DIMENSION_MAP[key]
    # Already a full expression (contains a paren) — don't prefix again
    if "(" in dim_sql:
        return dim_sql
    return dim_sql  # Already table-qualified by resolver (e.g., "customers.segment")


def build_sql(query_plan: dict, company_id: int) -> str:
    """
    Takes the validated query plan and deterministically constructs 
    a safe, executable SQLite string, injecting Row-Level Security.
    """
    
    # 1. SELECT clause
    select_items = []
    group_by_items = []
    order_by_clause = ""

    for dim in query_plan.get("dimensions", []):
        resolved_sql = _resolve_dimension_sql(dim['name'], dim['sql'])
        select_items.append(f"{resolved_sql} AS {dim['name']}")
        group_by_items.append(dim['name'])

    for metric in query_plan.get("metrics", []):
        select_items.append(f"{metric['sql']} AS {metric['name']}")

    if not select_items:
        raise ValueError("Query plan has no metrics or dimensions to SELECT.")

    select_clause = "SELECT\n    " + ",\n    ".join(select_items)

    # 2. FROM clause — use the first table from the plan
    base_table = query_plan["tables_involved"][0]
    from_clause = f"FROM {base_table}"

    # 3. JOIN clause
    join_clause = ""
    if query_plan.get("validated_joins"):
        join_clause = "\n".join(query_plan["validated_joins"])

    # 4. INJECT SECURITY (Multi-Tenant Bouncer)
    # Find a table involved in this query that has a company_id column, and lock it down.
    security_filter = ""
    for table in query_plan["tables_involved"]:
        if table in TENANT_TABLES:
            security_filter = f"WHERE {table}.company_id = {company_id}"
            break

    # 5. GROUP BY clause (use ordinal positions for SQLite compatibility)
    group_by_clause = ""
    if group_by_items:
        ordinals = [str(i + 1) for i in range(len(group_by_items))]
        group_by_clause = "GROUP BY " + ", ".join(ordinals)
        
        # If the first dimension looks like a time field, order by it for line charts
        first_dim_name = query_plan["dimensions"][0]["name"].lower() if query_plan.get("dimensions") else ""
        if any(t in first_dim_name for t in ["month", "year", "date", "week", "quarter", "day"]):
            order_by_clause = "ORDER BY 1 ASC"

    # Combine all parts safely
    sql_parts = [select_clause, from_clause]
    if join_clause:
        sql_parts.append(join_clause)
    if security_filter:
        sql_parts.append(security_filter)
    if group_by_clause:
        sql_parts.append(group_by_clause)
    if order_by_clause:
        sql_parts.append(order_by_clause)

    final_sql = "\n".join(sql_parts)

    if query_plan.get("glossary_context"):
        context_str = "\n".join([f"-- CONTEXT APPLIED: {g}" for g in query_plan["glossary_context"]])
        final_sql = f"{context_str}\n{final_sql}"

    return final_sql + ";"