# Upload-to-registry contract

When datasets arrive, map every product to the canonical declarations:

| Source | Intended domain | Mandatory validation before binding |
|---|---|---|
| NASA NSSDCA Mars Fact Sheet | `constants/mars_nasa_2025.json` | published reference values, not Mars-site time series |
| USGS Jezero science CTX DEM GeoTIFF | `geodesy`, `terrain` | actual raster CRS/transform, geodetic datum, vertical reference, NoData, resolution and checksum |
| USGS Jezero TRN CTX DEM GeoTIFF | `geodesy`, `terrain` | separate product/transform and registration before comparative sampling |
| NASA PDS Perseverance MEDA CSV + PDS4 XML | `atmosphere`, `illumination` | individual sensor/RDR type, exact column, flags, units, sol and time basis |
| NASA PDS MSL Curiosity RAD RDR | `radiation` | dose type (Gy/Sv), measurement level, archival context: Gale not Jezero |
| Mars Trek imagery, MRO CTX or HiRISE orthomosaic | `imagery_geology` | imagery layer identity, geospatial transform, source image time/geometry and resolution |
| SPICE ephemerides/kernels | `illumination`, `geodesy` | kernel IDs, observation epoch, time conversions and frame conventions |

**Rules:** Nothing in the `constants/` folder substitutes for high-resolution source measurements; an undefined or unavailable value remains `null` with explicit quality status. Original PDS4 XML labels have precedence over guessed columns. Track a formal dataset adapter in the future but do not write ingestion code in this step.
