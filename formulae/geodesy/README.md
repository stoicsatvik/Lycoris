# Mars geodesy and coordinate systems

Responsibilities: planetocentric vs planetographic latitude, east-positive longitude, wraparound, relevant Mars body radius/ellipsoid assumptions, projection transforms, spatial footprint containment, vertical reference, distance and pixel-to-ground conversion.

Inputs: source CRS/transform and geodetic position. Outputs: validated positions and geometries with spatial uncertainty.

Never transfer pixel indices between different Jezero CTX products without an explicit reprojection and registration test.
