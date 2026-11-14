# Safety-oriented decision rules

Lycoris is a research demonstration, not flight-certified astronaut navigation or life support.

Never translate missing data into a safe verdict. Always account for a return path and modeled emergency reserves when presenting an excursion. An infeasible route must remain infeasible even when its science score is high.

Decision outputs should distinguish: feasible_under_assumptions | constraint_violation | no_route | uncertain | insufficient_evidence. Labels are model conclusions conditional on explicitly recorded assumptions, not official NASA EVA authorization.
