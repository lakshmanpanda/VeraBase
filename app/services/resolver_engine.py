from app.models.schema import Metric, Dimension
from app.services.join_planner import build_join_graph, find_shortest_path

async def generate_validated_plan(retrieved_objects):
    """
    Takes the messy list of retrieved DB objects and structures them into a 
    validated, safe query plan ready for SQL generation.
    """
    metrics = []
    dimensions = []
    glossary_terms = []

    # 1. Sort the retrieved objects into their buckets
    for obj in retrieved_objects:
        if isinstance(obj, Metric):
            metrics.append(obj)
        elif isinstance(obj, Dimension):
            dimensions.append(obj)
        else:
            glossary_terms.append(obj)

    # 2. Determine required tables
    required_tables = set()
    if metrics:
        required_tables.add(metrics[0].base_table)
    for dim in dimensions:
        required_tables.add(dim.base_table)

    required_tables = list(required_tables)
    
    # 3. Calculate safe Join Paths using BFS
    resolved_joins = []
    if len(required_tables) > 1:
        graph, join_details = await build_join_graph()
        base = required_tables[0]
        
        for target in required_tables[1:]:
            path = find_shortest_path(graph, base, target)
            if path:
                # Convert the node path (e.g., [order_items, orders, users]) into actual SQL JOIN strings
                for i in range(len(path) - 1):
                    t1, t2 = path[i], path[i+1]
                    condition, join_type = join_details[f"{t1}-{t2}"]
                    join_type = join_type or "LEFT" # Fallback to LEFT if database value is null
                    join_str = f"{join_type} JOIN {t2} ON {condition}"
                    if join_str not in resolved_joins:
                        resolved_joins.append(join_str)
            else:
                raise ValueError(f"🚨 SECURITY HALT: No valid join path between {base} and {target}. Cartesian join prevented.")

    # 4. Return the final structured brain object
    return {
        "metrics": [{"name": m.canonical_name, "sql": m.sql_template} for m in metrics],
        "dimensions": [{"name": d.canonical_name, "sql": d.column_name} for d in dimensions],
        "glossary_context": [g.definition for g in glossary_terms],
        "tables_involved": required_tables,
        "validated_joins": resolved_joins
    }