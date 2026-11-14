"""Evidence-qualified implementation of the unified EVA transition."""

from __future__ import annotations
from dataclasses import dataclass
from .simulation import MissionStatus


@dataclass(frozen=True, slots=True)
class EVAState:
    elapsed_s: float
    distance_m: float
    oxygen_remaining_mol: float
    carbon_dioxide_capacity_remaining_mol: float
    cooling_remaining_j: float
    battery_remaining_j: float
    water_remaining_kg: float
    cumulative_dose_sv: float
    fatigue_index: float
    navigation_confidence: float


@dataclass(frozen=True, slots=True)
class EVAControl:
    speed_m_s: float
    action: str = "continue"


@dataclass(frozen=True, slots=True)
class EVAEnvironment:
    source_id: str | None
    terrain_context_id: str | None
    weather_context_id: str | None
    radiation_context_id: str | None


@dataclass(frozen=True, slots=True)
class QualifiedRates:
    oxygen_mol_s: float | None
    carbon_dioxide_mol_s: float | None
    metabolic_heat_w: float | None
    battery_w: float | None
    water_kg_s: float | None
    dose_sv_s: float | None
    fatigue_index_s: float | None
    navigation_confidence_loss_s: float | None
    evidence_id: str | None


@dataclass(frozen=True, slots=True)
class StateTransitionResult:
    status: MissionStatus
    state: EVAState | None
    reason: str | None


def advance_state(state: EVAState, control: EVAControl, environment: EVAEnvironment, rates: QualifiedRates, duration_s: float) -> StateTransitionResult:
    """Advance the unified state equation one step."""
    state_values = (state.elapsed_s, state.distance_m, state.oxygen_remaining_mol, state.carbon_dioxide_capacity_remaining_mol, state.cooling_remaining_j, state.battery_remaining_j, state.water_remaining_kg, state.cumulative_dose_sv, state.fatigue_index, state.navigation_confidence)
    rate_values = (rates.oxygen_mol_s, rates.carbon_dioxide_mol_s, rates.metabolic_heat_w, rates.battery_w, rates.water_kg_s, rates.dose_sv_s, rates.fatigue_index_s, rates.navigation_confidence_loss_s)
    if duration_s < 0 or control.speed_m_s < 0 or min(state_values) < 0:
        return StateTransitionResult(MissionStatus.INVALID_INPUT, None, "negative_state_or_control")
    if not rates.evidence_id or not environment.source_id or None in rate_values or not all((environment.terrain_context_id, environment.weather_context_id, environment.radiation_context_id)):
        return StateTransitionResult(MissionStatus.INSUFFICIENT_EVIDENCE, None, "unbound_transition_input")
    if min(rate_values) < 0:
        return StateTransitionResult(MissionStatus.INVALID_INPUT, None, "negative_transition_rate")
    next_state = EVAState(
        state.elapsed_s + duration_s, state.distance_m + control.speed_m_s * duration_s,
        state.oxygen_remaining_mol - rates.oxygen_mol_s * duration_s,
        state.carbon_dioxide_capacity_remaining_mol - rates.carbon_dioxide_mol_s * duration_s,
        state.cooling_remaining_j - rates.metabolic_heat_w * duration_s,
        state.battery_remaining_j - rates.battery_w * duration_s,
        state.water_remaining_kg - rates.water_kg_s * duration_s,
        state.cumulative_dose_sv + rates.dose_sv_s * duration_s,
        state.fatigue_index + rates.fatigue_index_s * duration_s,
        max(0.0, state.navigation_confidence - rates.navigation_confidence_loss_s * duration_s),
    )
    resources = (next_state.oxygen_remaining_mol, next_state.carbon_dioxide_capacity_remaining_mol, next_state.cooling_remaining_j, next_state.battery_remaining_j, next_state.water_remaining_kg)
    if min(resources) < 0:
        return StateTransitionResult(MissionStatus.RESOURCE_EXCEEDED, next_state, "resource_capacity_exceeded")
    return StateTransitionResult(MissionStatus.VALID_CALCULATION, next_state, None)
