import unittest

from lycoris_engine.simulation import MissionStatus
from lycoris_engine.unified import EVAControl, EVAEnvironment, EVAState, QualifiedRates, advance_state


class UnifiedStateTests(unittest.TestCase):
    def setUp(self):
        self.state = EVAState(0, 0, 10, 10, 1000, 1000, 5, 0, 0, 1)
        self.control = EVAControl(2)
        self.environment = EVAEnvironment("source", "terrain", "weather", "radiation")
        self.rates = QualifiedRates(.1, .08, 10, 5, .01, .001, .002, .01, "model")

    def test_advances_each_state_component(self):
        result = advance_state(self.state, self.control, self.environment, self.rates, 60)
        self.assertEqual((result.status, result.state.distance_m, result.state.oxygen_remaining_mol, result.state.battery_remaining_j), (MissionStatus.VALID_CALCULATION, 120, 4, 700))
        self.assertAlmostEqual(result.state.cumulative_dose_sv, .06)

    def test_refuses_unbound_context(self):
        result = advance_state(self.state, self.control, EVAEnvironment(None, "terrain", "weather", "radiation"), self.rates, 60)
        self.assertEqual(result.status, MissionStatus.INSUFFICIENT_EVIDENCE)

    def test_reports_resource_exhaustion(self):
        result = advance_state(self.state, self.control, self.environment, self.rates, 120)
        self.assertEqual((result.status, result.reason), (MissionStatus.RESOURCE_EXCEEDED, "resource_capacity_exceeded"))


if __name__ == "__main__":
    unittest.main()
