# OwlFly Polish Candidate Sequence

All candidates branch independently from sealed B1 `main` @ `50a88d5`.

Recommended verification order by current admission score and dependency risk:

1. P1 Game Feel — 98/100 — `polish-p1-game-feel`
2. P2 UI / HUD — 97/100 — `polish-p2-ui-hud`
3. P4 Obstacle Cohesion — 97/100 — `polish-p4-obstacle-cohesion`
4. P3 Audio Identity — 96/100 — `polish-p3-audio-identity`
5. B2 Rooftop Antennas — 95/100 — `living-city-b2-rooftop-antennas`

Do not stack branches before each candidate has independently passed `npm run quality` and its human gate. After individual approval, merge highest-value accepted candidates one at a time, rebase/refresh the next candidate onto the new main, and rerun quality to expose interaction regressions rather than assuming independent passes compose safely.
