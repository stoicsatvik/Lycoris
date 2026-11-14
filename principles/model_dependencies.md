# Extensible dependency graph and mission state

Variables have stable names, quantity types, units, source lineage, input dependencies, uncertainty semantics, validity domains and model versions.

Use directed dependencies for calculations that can be evaluated in order. Model physical feedback (fatigue ↔ pace ↔ time) through well-defined time-stepped state transitions rather than a circular recomputation loop.

New variables must declare what they consume, what they output, which downstream results change, and what happens when they cannot be evaluated. Cache keys include source and model versions. No node may silently invent missing inputs.
