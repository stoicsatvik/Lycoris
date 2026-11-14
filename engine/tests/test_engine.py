import unittest

from lycoris_engine import DemandRate, GridPoint, RouteStatus, SuitInventory, TerrainGrid, find_path, integrate_mission
from lycoris_engine.simulation import MissionStatus


class EngineTests(unittest.TestCase):
    def test_rejects_blocked_endpoint(self):
        grid = TerrainGrid(3, 3, 20, 20, (40,) + (0,) * 8, "test", "0")
        self.assertEqual(find_path(grid, GridPoint(0, 0), GridPoint(2, 2), slope_limit_deg=30).status, RouteStatus.NO_PATH)

    def test_prevents_diagonal_corner_cutting(self):
        slopes = [0.] * 9
        slopes[1] = slopes[3] = 40
        grid = TerrainGrid(3, 3, 20, 20, tuple(slopes), "test", "0")
        self.assertEqual(find_path(grid, GridPoint(0, 0), GridPoint(2, 2), slope_limit_deg=30).status, RouteStatus.NO_PATH)

    def test_requires_provenance(self):
        grid = TerrainGrid(3, 3, 20, 20, (0,) * 9, None, "0")
        self.assertEqual(find_path(grid, GridPoint(0, 0), GridPoint(2, 2), slope_limit_deg=30).status, RouteStatus.INSUFFICIENT_EVIDENCE)

    def test_refuses_unbound_human_demand(self):
        result = integrate_mission([DemandRate(60, None, .8, 100, None)], SuitInventory(10, 10, 1000))
        self.assertEqual(result.status, MissionStatus.INSUFFICIENT_EVIDENCE)

    def test_tracks_each_suit_inventory_independently(self):
        result = integrate_mission([DemandRate(60, .1, .08, 10, "test")], SuitInventory(10, 10, 1000))
        self.assertEqual((result.oxygen_demand_mol, result.carbon_dioxide_produced_mol, result.metabolic_heat_j, result.oxygen_remaining_mol), (6, 4.8, 600, 4))


if __name__ == "__main__":
    unittest.main()
