# Agent Rotation Rules

## Core rule
Do not let the Patch Engineer own two consecutive work blocks without the Runtime Verifier touching the result.

## Why this works
- it limits assumption drift
- it forces evidence capture
- it reduces local-fix / global-break behavior
- it keeps release state visible every day

## Standard 5-hour day
1. Session Conductor
2. Mapping / inspection lane
3. Patch or visual lane if phase allows
4. Runtime Verifier
5. Release Steward or Session Conductor closeout

## Escalation rule
If uncertainty is high:
- emit HALT.UNKNOWN, HALT.IMPACT, HALT.RUNTIME, or HALT.EDGE
- switch back to mapping / verification
- do not keep patching through ambiguity

## Freeze rule
When a day’s finish line is met, stop.
Do not spend the remaining time inventing a new target.

## Candidate-build rule
Once a credible internal-test candidate exists:
- Release Steward becomes the dominant agent
- only ship blockers get new hours
