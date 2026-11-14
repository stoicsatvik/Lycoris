"""Virtual verification only for a hypothetical Mars EVA suit."""

from __future__ import annotations
from dataclasses import dataclass
from enum import StrEnum

from .simulation import MissionStatus
from .unified import EVAControl, EVAEnvironment, EVAState, QualifiedRates, advance_state


class VirtualVerificationStatus(StrEnum):
    PASS = "hypothetical_virtual_pass"
    FAIL = "hypothetical_virtual_fail"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"


@dataclass(frozen=True, slots=True)
class HypotheticalSuitProfile:
    """Notional requirements traced to evidence; not a certified design."""

    dry_mass_kg: float | None
    eva_operational_life: int | None
    dust_connector_cycles: int | None
    supports_9_torr_co2: bool | None
    atmosphere_telemetry: bool | None
    thermal_control_adjustable: bool | None
    virtual_pressure_hold_passed: bool | None
    virtual_thermal_vacuum_passed: bool | None
    virtual_human_in_loop_passed: bool | None
    evidence_id: str | None


@dataclass(frozen=True, slots=True)
class VirtualVerificationResult:
    status: VirtualVerificationStatus
    state: EVAState | None
    failed_checks: tuple[str, ...]
    disclaimer: str


def evaluate_hypothetical_eva_run(profile: HypotheticalSuitProfile, state: EVAState, control: EVAControl, environment: EVAEnvironment, rates: QualifiedRates, duration_s: float) -> VirtualVerificationResult:
    """Run a traceable virtual gate plus one unified-formula transition."""
    values = (profile.dry_mass_kg, profile.eva_operational_life, profile.dust_connector_cycles, profile.supports_9_torr_co2, profile.atmosphere_telemetry, profile.thermal_control_adjustable, profile.virtual_pressure_hold_passed, profile.virtual_thermal_vacuum_passed, profile.virtual_human_in_loop_passed)
    disclaimer = "Virtual verification only; not NASA, regulatory, medical, or flight certification."
    if not profile.evidence_id or any(value is None for value in values):
        return VirtualVerificationResult(VirtualVerificationStatus.INSUFFICIENT_EVIDENCE, None, ("unbound_suit_profile",), disclaimer)
    transition = advance_state(state, control, environment, rates, duration_s)
    if transition.status != MissionStatus.VALID_CALCULATION:
        return VirtualVerificationResult(VirtualVerificationStatus.INSUFFICIENT_EVIDENCE, transition.state, (transition.status.value,), disclaimer)
    checks = {
        "dry_mass_over_68_04kg_target": profile.dry_mass_kg <= 68.04,
        "operational_life_under_100_evas_target": profile.eva_operational_life >= 100,
        "dust_connector_cycles_under_1000_target": profile.dust_connector_cycles >= 1000,
        "mars_9_torr_co2_support_missing": profile.supports_9_torr_co2,
        "atmosphere_telemetry_missing": profile.atmosphere_telemetry,
        "adjustable_thermal_control_missing": profile.thermal_control_adjustable,
        "virtual_pressure_hold_not_passed": profile.virtual_pressure_hold_passed,
        "virtual_thermal_vacuum_not_passed": profile.virtual_thermal_vacuum_passed,
        "virtual_human_in_loop_not_passed": profile.virtual_human_in_loop_passed,
    }
    failed = tuple(name for name, passed in checks.items() if not passed)
    status = VirtualVerificationStatus.PASS if not failed else VirtualVerificationStatus.FAIL
    return VirtualVerificationResult(status, transition.state, failed, disclaimer)
