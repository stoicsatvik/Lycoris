# Surface elevation and terrain geometry

Responsibilities: DEM sampling, gradient, slope, aspect, roughness, relief, interpolation masks, multiscale terrain summaries, instrument alignment.

Inputs: source-validated DEM grid, pixel spacing, geographic transform and NoData mask. Outputs: terrain measurements and derived fields with effective-resolution and uncertainty caveats.

A 20 m DEM posting does not guarantee that all 20 m obstacles are resolved. Missing pixels are not flat ground.
