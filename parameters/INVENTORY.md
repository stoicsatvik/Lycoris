# Declared Mars and mission parameter inventory

**Snapshot:** initial declarations (not ingested scientific measurements).

- **39** published NASA Mars reference values, including planetary shape, gravitation, orbit, timing, solar radiation, and global atmospheric reference statistics/composition.
- **10** USGS Jezero science CTX DEM metadata properties.
- **297** Lycoris canonical fields across **12** domains.
- **0** imported or validated dataset observations. **0** astronaut/suit parameters presented as NASA-certified specifications.

## Canonical domains

| Domain | Declared fields | Data family |
|---|---:|---|
| `geodesy` | 24 | Mars physical observations and derived fields |
| `terrain` | 24 | Mars physical observations and derived fields |
| `atmosphere` | 26 | Mars physical observations and derived fields |
| `radiation` | 18 | Mars physical observations and derived fields |
| `illumination` | 17 | Mars physical observations and derived fields |
| `imagery_geology` | 22 | Orbital optical/geology source candidates |
| `astronaut` | 26 | Scenario and coupled simulations |
| `life_support` | 38 | Scenario and coupled simulations |
| `mission_navigation` | 38 | Scenario and coupled simulations |
| `science` | 17 | Scenario and coupled simulations |
| `uncertainty` | 19 | Statistical model metadata |
| `evidence` | 28 | Source labels and provenance |

## What "official" means here

NASA/NSSDCA numerical reference values and USGS dataset metadata have verifiable published sources. **Canonical fields** are our software definitions for quantities expected from NASA/USGS products, mathematical transformations, or scenario settings, not official column names. Exact archive column names must be taken from actual PDS4 labels or supplied GeoTIFF metadata.

Mean pressure (636 Pa at mean radius in NASA's summary), mean temperature (214 K), and solar irradiance (586.2 W/m² reference) are **not valid substitutes** for measurements at a selected Jezero coordinate and time.

## What will happen after datasets arrive

1. Preserve raw files without altering their bytes; calculate hashes.
2. Read original PDS4 XML/GeoTIFF metadata and locate native fields.
3. Bind each native field to exactly defined canonical IDs with unit/time/CRS transformations.
4. Preserve NoData and instrument flags; compare registered products with independent checks.
5. Mark only defensibly validated values as available for route and mission calculations.
