// Constants copied from the Mars Atlas website (src/model/terrain.js, mission.js, crater.js) so this engine runs on its
// own. Keep them in step with the site if either changes.
export const SLOPE = { hard: 15, hazard: 20, noGoWalk: 30, noGoRover: 20 }; // degrees; planning assumptions
export const EVA_LIMIT_H = 8; // suit EVA duration limit, planning assumption
export const CAREER_LIMIT_MSV = 600; // NASA-STD-3001 (2022) career effective-dose limit
export const J_PER_L = 21000; // joules of metabolic heat per litre of O₂ consumed
