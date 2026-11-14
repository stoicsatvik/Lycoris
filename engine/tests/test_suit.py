import unittest

from lycoris_engine.suit import HypotheticalSuitProfile, VirtualVerificationStatus, evaluate_hypothetical_eva_run
from lycoris_engine.unified import EVAControl, EVAEnvironment, EVAState, QualifiedRates


class HypotheticalSuitTests(unittest.TestCase):
    def setUp(self):
        self.state = EVAState(0, 0, 100, 100, 100000, 100000, 20, 0, 0, 1)
        self.control = EVAControl(1)
        self.environment = EVAEnvironment("environment-test", "terrain-test", "weather-test", "radiation-test")
        self.rates = QualifiedRates(.1, .08, 10, 5, .01, .001, .002, .01, "rate-test")
        self.profile = HypotheticalSuitProfile(65, 100, 1000, True, True, True, True, True, True, "NASA_PLSS_ROADMAP_2024")

    def test_virtual_pass_has_traceable_requirements_and_resources(self):
        result = evaluate_hypothetical_eva_run(self.profile, self.state, self.control, self.environment, self.rates, 60)
        self.assertEqual(result.status, VirtualVerificationStatus.PASS)
        self.assertEqual(result.state.oxygen_remaining_mol, 94)

    def test_virtual_fail_names_the_failed_requirement(self):
        profile = HypotheticalSuitProfile(70, 100, 1000, True, True, True, True, True, True, "test")
        result = evaluate_hypothetical_eva_run(profile, self.state, self.control, self.environment, self.rates, 60)
        self.assertEqual(result.status, VirtualVerificationStatus.FAIL)
        self.assertIn("dry_mass_over_68_04kg_target", result.failed_checks)

    def test_unbound_profile_abstains(self):
        profile = HypotheticalSuitProfile(None, 100, 1000, True, True, True, True, True, True, None)
        result = evaluate_hypothetical_eva_run(profile, self.state, self.control, self.environment, self.rates, 60)
        self.assertEqual(result.status, VirtualVerificationStatus.INSUFFICIENT_EVIDENCE)
