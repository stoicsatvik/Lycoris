"""Fail-closed grid routing over an already validated terrain product.

This module intentionally does not infer terrain safety from imagery.  A caller must
provide a grid whose slope, NoData mask, CRS, and provenance have already been bound.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from heapq import heappop, heappush
from math import hypot
from typing import Iterable


class RouteStatus(StrEnum):
    VALID = "valid"
    NO_PATH = "no_path"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    INVALID_INPUT = "invalid_input"


@dataclass(frozen=True, slots=True)
class GridPoint:
    column: int
    row: int


@dataclass(frozen=True, slots=True)
class TerrainGrid:
    """A terrain grid with one slope value and a validity mask per cell.

    Slope is degrees.  Invalid cells include NoData and must never be traversed.
    """

    columns: int
    rows: int
    cell_width_m: float
    cell_height_m: float
    slope_deg: tuple[float | None, ...]
    source_id: str | None
    model_version: str

    def __post_init__(self) -> None:
        if self.columns <= 0 or self.rows <= 0 or self.cell_width_m <= 0 or self.cell_height_m <= 0:
            raise ValueError("grid dimensions and cell sizes must be positive")
        if len(self.slope_deg) != self.columns * self.rows:
            raise ValueError("slope array does not match grid dimensions")

    def contains(self, point: GridPoint) -> bool:
        return 0 <= point.column < self.columns and 0 <= point.row < self.rows

    def index(self, point: GridPoint) -> int:
        return point.row * self.columns + point.column

    def slope_at(self, point: GridPoint) -> float | None:
        return self.slope_deg[self.index(point)] if self.contains(point) else None


@dataclass(frozen=True, slots=True)
class RouteResult:
    status: RouteStatus
    points: tuple[GridPoint, ...]
    distance_m: float | None
    reason: str | None
    terrain_source_id: str | None
    model_version: str


_DIRECTIONS: tuple[tuple[int, int], ...] = (
    (1, 0), (-1, 0), (0, 1), (0, -1),
    (1, 1), (1, -1), (-1, 1), (-1, -1),
)


def _traversable(grid: TerrainGrid, point: GridPoint, slope_limit_deg: float) -> bool:
    slope = grid.slope_at(point)
    return slope is not None and 0 <= slope <= slope_limit_deg


def _neighbors(grid: TerrainGrid, point: GridPoint, slope_limit_deg: float) -> Iterable[GridPoint]:
    for dx, dy in _DIRECTIONS:
        next_point = GridPoint(point.column + dx, point.row + dy)
        if not _traversable(grid, next_point, slope_limit_deg):
            continue
        # A diagonal cannot pass through the corner between two blocked cells.
        if dx and dy:
            if not _traversable(grid, GridPoint(point.column + dx, point.row), slope_limit_deg):
                continue
            if not _traversable(grid, GridPoint(point.column, point.row + dy), slope_limit_deg):
                continue
        yield next_point


def _distance(grid: TerrainGrid, first: GridPoint, second: GridPoint) -> float:
    return hypot(
        (first.column - second.column) * grid.cell_width_m,
        (first.row - second.row) * grid.cell_height_m,
    )


def find_path(
    grid: TerrainGrid,
    start: GridPoint,
    goal: GridPoint,
    *,
    slope_limit_deg: float,
) -> RouteResult:
    """Find a least-distance traversable path or return an explicit non-success status."""
    if not 0 < slope_limit_deg <= 90:
        return RouteResult(RouteStatus.INVALID_INPUT, (), None, "invalid_slope_limit", grid.source_id, grid.model_version)
    if not grid.source_id:
        return RouteResult(RouteStatus.INSUFFICIENT_EVIDENCE, (), None, "missing_terrain_source_id", None, grid.model_version)
    if not grid.contains(start) or not grid.contains(goal):
        return RouteResult(RouteStatus.INVALID_INPUT, (), None, "endpoint_outside_grid", grid.source_id, grid.model_version)
    if not _traversable(grid, start, slope_limit_deg) or not _traversable(grid, goal, slope_limit_deg):
        return RouteResult(RouteStatus.NO_PATH, (), None, "endpoint_blocked_or_nodata", grid.source_id, grid.model_version)

    frontier: list[tuple[float, int, GridPoint]] = []
    sequence = 0
    heappush(frontier, (0.0, sequence, start))
    costs: dict[GridPoint, float] = {start: 0.0}
    previous: dict[GridPoint, GridPoint] = {}

    while frontier:
        _, _, current = heappop(frontier)
        if current == goal:
            points = [goal]
            while points[-1] != start:
                points.append(previous[points[-1]])
            points.reverse()
            return RouteResult(RouteStatus.VALID, tuple(points), costs[goal], None, grid.source_id, grid.model_version)

        for neighbor in _neighbors(grid, current, slope_limit_deg):
            candidate = costs[current] + _distance(grid, current, neighbor)
            if candidate >= costs.get(neighbor, float("inf")):
                continue
            costs[neighbor] = candidate
            previous[neighbor] = current
            sequence += 1
            heappush(frontier, (candidate + _distance(grid, neighbor, goal), sequence, neighbor))

    return RouteResult(RouteStatus.NO_PATH, (), None, "blocked_or_untraversable_corridor", grid.source_id, grid.model_version)
