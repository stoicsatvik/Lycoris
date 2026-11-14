"""Unit-explicit human-demand and suit-inventory integration.

Rates are inputs from an evidence-qualified model or measurement.  This module does
not derive them from heart rate, Mars gravity, or an unvalidated universal coefficient.
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum
from typing import Iterable


class MissionStatus(StrEnum):
    VALID_CALCULATION = "valid_calculation"
    INSUFFICIENT_EVIDENCE = "insufficient_evidence"
    INVALID_INPUT = "invalid_input"
    RESOURCE_EXCEEDED = "resource_exceeded"


@dataclass(frozen=True, slots=True)
class DemandRate:
    duration_s: float
    oxygen_mol_s: float | None
    carbon_dioxide_mol_s: float | None
    metabolic_heat_w: float | None
    evidence_id: str | None


@dataclass(frozen=True, slots=True)
class SuitInventory:
    initial_oxygen_mol: float
    carbon_dioxide_capacity_mol: float
    cooling_capacity_j: float
    oxygen_supply_mol: float = 0.0
    oxygen_loss_mol: float = 0.0


@dataclass(frozen=True, slots=True)
class MissionResult:
    status: MissionStatus
    oxygen_demand_mol: float | None
    carbon_dioxide_produced_mol: float | None
    metabolic_heat_j: float | None
    oxygen_remaining_mol: float | None
    carbon_dioxide_capacity_remaining_mol: float | None
    cooling_remaining_j: float | None
    reason: str | None


def integrate_mission(segments: Iterable[DemandRate], suit: SuitInventory) -> MissionResult:
    """Integrate human demand and independently account for supplied suit resources."""
    if min(suit.initial_oxygen_mol, suit.carbon_dioxide_capacity_mol, suit.cooling_capacity_j, suit.oxygen_supply_mol, suit.oxygen_loss_mol) < 0:
        return MissionResult(MissionStatus.INVALID_INPUT, None, None, None, None, None, None, "negative_inventory_input")

    oxygen = carbon_dioxide = heat = 0.0
    for segment in segments:
        if segment.duration_s < 0:
            return MissionResult(MissionStatus.INVALID_INPUT, None, None, None, None, None, None, "negative_segment_duration")
        if not segment.evidence_id or None in (segment.oxygen_mol_s, segment.carbon_dioxide_mol_s, segment.metabolic_heat_w):
            return MissionResult(MissionStatus.INSUFFICIENT_EVIDENCE, None, None, None, None, None, None, "unbound_human_demand")
        if min(segment.oxygen_mol_s, segment.carbon_dioxide_mol_s, segment.metabolic_heat_w) < 0:
            return MissionResult(MissionStatus.INVALID_INPUT, None, None, None, None, None, None, "negative_demand_rate")
        oxygen += segment.oxygen_mol_s * segment.duration_s
        carbon_dioxide += segment.carbon_dioxide_mol_s * segment.duration_s
        heat += segment.metabolic_heat_w * segment.duration_s

    oxygen_remaining = suit.initial_oxygen_mol + suit.oxygen_supply_mol - suit.oxygen_loss_mol - oxygen
    carbon_dioxide_remaining = suit.carbon_dioxide_capacity_mol - carbon_dioxide
    cooling_remaining = suit.cooling_capacity_j - heat
    status = MissionStatus.VALID_CALCULATION
    reason = None
    if min(oxygen_remaining, carbon_dioxide_remaining, cooling_remaining) < 0:
        status = MissionStatus.RESOURCE_EXCEEDED
        reason = "suit_resource_capacity_exceeded"
    return MissionResult(status, oxygen, carbon_dioxide, heat, oxygen_remaining, carbon_dioxide_remaining, cooling_remaining, reason)
