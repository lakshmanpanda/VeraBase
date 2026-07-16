def build_sql(query_plan: dict) -> str:
    """
    Takes the validated query plan and deterministically constructs 
    a safe, executable PostgreSQL string.
    """
    
    # 1. SELECT clause
    select_items = []
    group_by_items = []

    # Add Dimensions to SELECT
    for dim in query_plan.get("dimensions", []):
        select_items.append(f"{dim['sql']} AS {dim['name']}")
        group_by_items.append(dim['name'])

    # Add Metrics to SELECT
    for metric in query_plan.get("metrics", []):
        select_items.append(f"{metric['sql']} AS {metric['name']}")

    select_clause = "SELECT\n    " + ",\n    ".join(select_items)

    # 2. FROM clause
    # We use the first table in the required list as our anchor (the metric's base table)
    base_table = query_plan["tables_involved"][0]
    from_clause = f"FROM {base_table}"

    # 3. JOIN clause
    join_clause = ""
    if query_plan.get("validated_joins"):
        join_clause = "\n".join(query_plan["validated_joins"])

    # 4. GROUP BY clause
    group_by_clause = ""
    if group_by_items:
        # In SQL, the safest way to dynamically group is by ordinal position (1, 2, 3...)
        ordinals = [str(i+1) for i in range(len(group_by_items))]
        group_by_clause = "GROUP BY " + ", ".join(ordinals)

    # Combine all parts safely
    sql_parts = [select_clause, from_clause]
    if join_clause:
        sql_parts.append(join_clause)
    if group_by_clause:
        sql_parts.append(group_by_clause)

    final_sql = "\n".join(sql_parts)

    # Add Glossary context as a SQL comment at the top for transparency
    if query_plan.get("glossary_context"):
        context_str = "\n".join([f"-- CONTEXT APPLIED: {g}" for g in query_plan["glossary_context"]])
        final_sql = f"{context_str}\n{final_sql}"

    return final_sql + ";"