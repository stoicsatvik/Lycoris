# Verification, validation and consent test plan

## Structural validation
- Every variable has stable unique ID, unit, method, state/observation category and source lead.
- Any duplicated anatomical measurement is represented by a declared anatomical index (left/right/segment), not invented independent equations.
- All mission-stage and context labels are permitted; no Mars-direct-human evidence claim.
- Units can be converted only with justified assay/method rules, and data label takes precedence.

## Physics sanity checks
- Body-mass and energy bookkeeping are dimensionally valid; physiologic human O2 demand must never equal suit O2 inventory by definition.
- Energy demand and duration are nonnegative under model validity conditions.
- Activities at zero duration do not create artificially accumulated oxygen usage or radiation dose.
- Changes in gravity or exertion cannot trigger ungrounded universal multiplier coefficients.

## Statistical scientific validation
- Independent research observations in comparable populations and regimes;
- uncertainty calibration, confounding evaluation and individual variability;
- sensitivity to priors and measurement error;
- source-provenance checks;
- explicit abstention on unmeasured chemistry, neurobiology and psychological traits.

## Privacy and ethics
- No actual personal medical information in public repos.
- No mental health diagnosis from biometric proxies.
- Any future participant-specific dataset requires informed consent and appropriate retention/access controls.
- Synthetic demo crew data must be unmistakably labeled synthetic.
