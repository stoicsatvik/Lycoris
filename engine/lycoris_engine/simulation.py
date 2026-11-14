"""Unit-explicit human-demand and suit-inventory integration."""

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
    """Integrate evidence-qualified demand and independently account for suit resources."""
    inventories = (suit.initial_oxygen_mol, suit.carbon_dioxide_capacity_mol, suit.cooling_capacity_j, suit.oxygen_supply_mol, suit.oxygen_loss_mol)
    if min(inventories) < 0:
        return MissionResult(MissionStatus.INVALID_INPUT, None, None, None, None, None, None, "negative_inventory_input")
    oxygen = carbon_dioxide = heat = 0.0
    for segment in segments:
        if segment.duration_s < 0:
            return MissionResult(MissionStatus.INVALID_INPUT, None, None, None, None, None, None, "negative_segment_duration")
        values = (segment.oxygen_mol_s, segment.carbon_dioxide_mol_s, segment.metabolic_heat_w)
        if not segment.evidence_id or None in values:
            return MissionResult(MissionStatus.INSUFFICIENT_EVIDENCE, None, None, None, None, None, None, "unbound_human_demand")
        if min(values) < 0:
            return MissionResult(MissionStatus.INVALID_INPUT, None, None, None, None, None, None, "negative_demand_rate")
        oxygen += segment.oxygen_mol_s * segment.duration_s
        carbon_dioxide += segment.carbon_dioxide_mol_s * segment.duration_s
        heat += segment.metabolic_heat_w * segment.duration_s
    remaining = (suit.initial_oxygen_mol + suit.oxygen_supply_mol - suit.oxygen_loss_mol - oxygen, suit.carbon_dioxide_capacity_mol - carbon_dioxide, suit.cooling_capacity_j - heat)
    status = MissionStatus.VALID_CALCULATION if min(remaining) >= 0 else MissionStatus.RESOURCE_EXCEEDED
    reason = None if status == MissionStatus.VALID_CALCULATION else "suit_resource_capacity_exceeded"
    return MissionResult(status, oxygen, carbon_dioxide, heat, *remaining, reason)
