from app.models.schema import Metric, Dimension
from app.services.join_planner import build_join_graph, find_shortest_path

# ── Synthetic Time Dimensions ─────────────────────────────────────────────────
# When a user asks "by month" or "by year", these keywords won't be in the
# vector DB — so we inject them synthetically instead of failing.
TIME_DIM_KEYWORDS = {
    "month":       ("strftime('%Y-%m', orders.created_at)", "orders"),
    "order_month": ("strftime('%Y-%m', orders.created_at)", "orders"),
    "year":        ("strftime('%Y', orders.created_at)", "orders"),
    "order_year":  ("strftime('%Y', orders.created_at)", "orders"),
    "date":        ("date(orders.created_at)", "orders"),
    "day":         ("date(orders.created_at)", "orders"),
    "week":        ("strftime('%Y-W%W', orders.created_at)", "orders"),
    "quarter":     ("strftime('%Y-%m', orders.created_at)", "orders"),
    "spend_month": ("strftime('%Y-%m', ad_spend_logs.date)", "ad_spend_logs"),
}


class SyntheticDimension:
    """
    Lightweight stand-in for a Dimension ORM object when a time keyword
    (month/year/day) is requested but not found in the vector store.
    """
    def __init__(self, name: str, sql_expr: str, base_table: str):
        self.canonical_name = name
        self.column_name    = sql_expr   # Already the full strftime() expression
        self.base_table     = base_table
        self.is_synthetic   = True


async def generate_validated_plan(retrieved_objects, requested_dimensions=None):
    """
    Takes the messy list of retrieved DB objects and structures them into a
    validated, safe query plan ready for SQL generation.
    
    `requested_dimensions`: the raw dimension strings from LLM extraction,
    used to inject synthetic time dimensions that the vector DB may not contain.
    """
    metrics      = []
    dimensions   = []
    glossary_terms = []

    # 1. Sort retrieved objects into typed buckets
    for obj in retrieved_objects:
        if isinstance(obj, Metric):
            metrics.append(obj)
        elif isinstance(obj, Dimension):
            dimensions.append(obj)
        else:
            glossary_terms.append(obj)

    # 2. Inject synthetic time dimensions that weren't found by vector search
    if requested_dimensions:
        resolved_names = {d.canonical_name.lower() for d in dimensions}
        for req_dim in requested_dimensions:
            key = req_dim.lower()
            if key in TIME_DIM_KEYWORDS and key not in resolved_names:
                sql_expr, base_table = TIME_DIM_KEYWORDS[key]
                dimensions.append(SyntheticDimension(req_dim, sql_expr, base_table))

    # 3. Determine all required tables
    required_tables = set()

    for m in metrics:
        required_tables.add(m.base_table)
        if m.dependencies and isinstance(m.dependencies, list):
            for extra_table in m.dependencies:
                required_tables.add(extra_table)

    for dim in dimensions:
        required_tables.add(dim.base_table)

    required_tables = list(required_tables)

    # 4. BFS: Calculate safe join paths
    resolved_joins = []
    if len(required_tables) > 1:
        graph, join_details = await build_join_graph()
        base = required_tables[0]

        for target in required_tables[1:]:
            path = find_shortest_path(graph, base, target)
            if path:
                for i in range(len(path) - 1):
                    t1, t2 = path[i], path[i + 1]
                    condition, join_type = join_details[f"{t1}-{t2}"]
                    join_type = join_type or "LEFT"
                    join_str = f"{join_type} JOIN {t2} ON {condition}"
                    if join_str not in resolved_joins:
                        resolved_joins.append(join_str)
            else:
                raise ValueError(
                    f"🚨 SECURITY HALT: No valid join path between '{base}' and '{target}'. "
                    "Cartesian join prevented."
                )

    # 5. Build the final plan object
    #    KEY FIX: prefix every dimension's column name with its base table
    #    (e.g., "name" → "categories.name") to prevent ambiguous column errors
    #    when multiple joined tables share a column name.
    dim_plan = []
    for d in dimensions:
        if isinstance(d, SyntheticDimension):
            # Already a full expression like strftime(…) — don't prefix
            dim_sql = d.column_name
        else:
            # Qualify with table name to avoid ambiguity in multi-table JOINs
            dim_sql = f"{d.base_table}.{d.column_name}"
        dim_plan.append({"name": d.canonical_name, "sql": dim_sql})

    return {
        "metrics":          [{"name": m.canonical_name, "sql": m.sql_template} for m in metrics],
        "dimensions":       dim_plan,
        "glossary_context": [g.definition for g in glossary_terms],
        "tables_involved":  required_tables,
        "validated_joins":  resolved_joins,
    }