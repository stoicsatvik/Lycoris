import unittest

from lycoris_engine import DemandRate, GridPoint, RouteStatus, SuitInventory, TerrainGrid, find_path, integrate_mission
from lycoris_engine.simulation import MissionStatus


def grid(*, source_id="USGS_CTX_DEM_TEST"):
    return TerrainGrid(3, 3, 20.0, 20.0, tuple(0.0 for _ in range(9)), source_id, "0.1.0")


class RoutingTests(unittest.TestCase):
    def test_rejects_blocked_endpoint(self):
        terrain = TerrainGrid(3, 3, 20.0, 20.0, (40.0,) + tuple(0.0 for _ in range(8)), "USGS_CTX_DEM_TEST", "0.1.0")
        result = find_path(terrain, GridPoint(0, 0), GridPoint(2, 2), slope_limit_deg=30)
        self.assertEqual(result.status, RouteStatus.NO_PATH)
        self.assertEqual(result.reason, "endpoint_blocked_or_nodata")

    def test_prevents_diagonal_corner_cutting(self):
        slopes = [0.0] * 9
        slopes[1] = slopes[3] = 40.0
        terrain = TerrainGrid(3, 3, 20.0, 20.0, tuple(slopes), "USGS_CTX_DEM_TEST", "0.1.0")
        result = find_path(terrain, GridPoint(0, 0), GridPoint(2, 2), slope_limit_deg=30)
        self.assertEqual(result.status, RouteStatus.NO_PATH)

    def test_requires_provenance(self):
        result = find_path(grid(source_id=None), GridPoint(0, 0), GridPoint(2, 2), slope_limit_deg=30)
        self.assertEqual(result.status, RouteStatus.INSUFFICIENT_EVIDENCE)


class SimulationTests(unittest.TestCase):
    def test_zero_duration_consumes_nothing(self):
        result = integrate_mission(
            [DemandRate(0.0, 1.0, 0.8, 100.0, "test-model")],
            SuitInventory(10.0, 10.0, 1000.0),
        )
        self.assertEqual(result.status, MissionStatus.VALID_CALCULATION)
        self.assertEqual(result.oxygen_demand_mol, 0.0)
        self.assertEqual(result.metabolic_heat_j, 0.0)

    def test_refuses_unbound_human_demand(self):
        result = integrate_mission(
            [DemandRate(60.0, None, 0.8, 100.0, None)],
            SuitInventory(10.0, 10.0, 1000.0),
        )
        self.assertEqual(result.status, MissionStatus.INSUFFICIENT_EVIDENCE)

    def test_tracks_each_suit_inventory_independently(self):
        result = integrate_mission(
            [DemandRate(60.0, 0.1, 0.08, 10.0, "test-model")],
            SuitInventory(10.0, 10.0, 1000.0),
        )
        self.assertEqual(result.status, MissionStatus.VALID_CALCULATION)
        self.assertEqual(result.oxygen_demand_mol, 6.0)
        self.assertEqual(result.carbon_dioxide_produced_mol, 4.8)
        self.assertEqual(result.metabolic_heat_j, 600.0)
        self.assertEqual(result.oxygen_remaining_mol, 4.0)


if __name__ == "__main__":
    unittest.main()
