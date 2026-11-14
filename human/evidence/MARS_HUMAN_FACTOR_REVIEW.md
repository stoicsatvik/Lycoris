# Mars-relevant human-factor evidence map

**Status:** evidence-discovery map, not a calibrated human-Mars model.  
**Reviewed:** 2026-11-14  
**Scope:** identifies factor families relevant to crew health and EVA performance, connects them to the declared registry, and records the evidence-transfer limit. It adds no physiological values, diagnostic rules, treatment instructions, or GO/NO-GO thresholds.

## Evidence use rules

1. NASA's five-hazard framework is the organizing lens: radiation, isolation/confinement, distance from Earth, altered gravity, and hostile/closed environments.
2. Direct human Mars surface evidence does not exist. ISS, lunar, Earth-analog, laboratory, animal, and simulation findings are distinct evidence contexts.
3. A documentary or explainer can identify a subject, but cannot establish a parameter meaning, coefficient, clinical threshold, or causal model. The official NASA video catalog is retained only as context in `NASA_HRP_VIDEO`.
4. A declared field remains `declared_unbound` until a separate observation or model binding records method, uncertainty, consent/privacy controls, provenance, population, mission phase, and validity domain.
5. Coupled hazards must not be converted into independent multipliers. For example, sleep loss, workload, thermal strain, altered gravity, and suit resistance can jointly affect performance and metabolism.

## Factor-family coverage

| Factor family | Registry domains | Evidence posture |
| --- | --- | --- |
| Altered gravity, fluid shift, deconditioning, sensorimotor recovery | `space_exposure/gravity_transition`, `anatomy/skeletal_bone`, `anatomy/muscular_system`, `physiology/cardiac_function`, `neuroscience/vestibular_balance` | ISS and ground analogue evidence; long-duration 0.38g transfer unknown. |
| Ocular/brain-fluid changes (SANS-related observations) | `neuroscience/vision_ocular`, `neuroscience/brain_structure_cerebrospinal` | Long-duration ISS observations. Peripapillary total retinal thickness is added as an imaging observation; no Mars threshold is asserted. |
| Radiation effects | `space_exposure/radiation_biology`, `physiology/hematology_erythropoiesis`, `physiology/immune_cellular` | Dose and quality must be tied to a dosimetry source. Individual cancer, CNS, cardiovascular, and reproductive predictions remain research-only. |
| Immune, viral, microbiome, infection, closed habitat | `physiology/immune_cellular`, `physiology/gut_oral_microbiome`, `physiology/inflammatory_signaling`, `space_exposure/respiratory_habitat` | Mixed human-spaceflight, analogue, and preclinical evidence. No individual susceptibility model is justified. |
| Bone turnover and renal-stone pathway | `anatomy/skeletal_bone`, `physiology/renal_urinary`, `physiology/fluid_electrolyte`, `physiology/nutrition_micronutrients` | ISS human data support measurement relationships; partial-gravity trajectory and countermeasure effectiveness are not established. |
| Atmospheric, pressure, CO2, hypoxia, decompression, dust, contaminants | `space_exposure/respiratory_habitat`, `space_exposure/dust_toxicology`, `physiology/gas_exchange`, `physiology/respiratory_mechanics`, `operations/medical_events` | Inputs must come from a habitat or suit boundary model with unit, time, and sensor-quality metadata. No exposure limit is encoded here. |
| Sleep, circadian timing, cognition, behavior, team function | `psychology/sleep_circadian`, `neuroscience/cognitive_function`, `psychology/crew_team_dynamics`, `psychology/social_isolation`, `operations/workload_fatigue` | Human analogue and operational evidence; not diagnostic or predictive of an individual's psychiatric outcome. |
| Injury, medication, autonomy, communication delay, medical care | `anatomy/pain_injury`, `operations/medical_events`, `operations/medical_treatment_pharmacology`, `operations/task_performance` | Mission design and operations factors; medication efficacy and treatment response require drug-, condition-, and individual-specific evidence. |

## New evidence leads added in this review

- NASA Human Research Roadmap evidence portal: `NASA_HRP_EVIDENCE`
- NASA Human System Risk Management Plan: `NASA_HSRMP_2020`
- NASA Human Health Countermeasures risk overview: `NASA_HHC_SPACEFLIGHT_RISKS`
- ISS bone/renal-stone study: `PUBMED_BONE_RENAL_2015`
- ISS ocular-structure/SANS cohort study: `PUBMED_SANS_OCULAR_2020`
- Space Omics and Medical Atlas: `PUBMED_SOMA_2024`
- Astroimmunology review: `PUBMED_ASTROIMMUNOLOGY_2025`
- Medical-treatment/behavioral-performance assessment: `PUBMED_BHP_MEDICAL_2021`
- Neurobehavioral multi-stressor review: `PUBMED_NEURO_STRESSORS_2022`

## Research gap remains

The factor inventory is intentionally much broader than any executable model. Before any field affects an EVA or health decision, its use needs a model specification with input/output definitions, evidence class, method, uncertainty, identifiability argument, population and gravity domain, validation case, and explicit abstention conditions.
