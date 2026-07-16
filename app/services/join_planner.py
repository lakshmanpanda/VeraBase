from sqlalchemy import select
from collections import deque
from app.models.schema import JoinRelationship
from app.core.database import AsyncSessionLocal

async def build_join_graph():
    """Fetches all relationships from the DB and builds an adjacency list."""
    graph = {}
    join_details = {}

    async with AsyncSessionLocal() as session:
        result = await session.execute(select(JoinRelationship))
        relationships = result.scalars().all()

        for rel in relationships:
            # Add edges for both directions since joins can traverse either way
            if rel.source_table not in graph:
                graph[rel.source_table] = []
            if rel.target_table not in graph:
                graph[rel.target_table] = []
                
            graph[rel.source_table].append(rel.target_table)
            graph[rel.target_table].append(rel.source_table)
            
            # Store the actual SQL condition (e.g., 'orders.user_id = users.id')
            # using a consistent key format regardless of direction
            key1 = f"{rel.source_table}-{rel.target_table}"
            key2 = f"{rel.target_table}-{rel.source_table}"
            join_details[key1] = (rel.join_condition, rel.join_type)
            join_details[key2] = (rel.join_condition, rel.join_type)

    return graph, join_details

def find_shortest_path(graph, start_node, target_node):
    """Uses Breadth-First Search (BFS) to find the shortest path between two tables."""
    if start_node == target_node:
        return [start_node]
        
    visited = set()
    queue = deque([[start_node]])

    while queue:
        path = queue.popleft()
        node = path[-1]
        
        if node not in visited:
            neighbors = graph.get(node, [])
            for neighbor in neighbors:
                new_path = list(path)
                new_path.append(neighbor)
                
                if neighbor == target_node:
                    return new_path
                queue.append(new_path)
            visited.add(node)
            
    return None # No safe join path exists!