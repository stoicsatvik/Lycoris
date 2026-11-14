# Routing and traverse geometry

Responsibilities: graph definition, A*/Dijkstra baselines, terrain costs, endpoint checks, uncertainty-aware avoidance, waypoints, detours, complete returns, post-smoothing validity and failure reporting.

Inputs: terrain graph, origin and destination, mobility configuration and mission constraints. Outputs: route geometry, segment attributes, feasibility status and provenance.

Required outcomes: valid | invalid | no_path | insufficient_data. Never silently replace an unreachable route with a straight-line path.
