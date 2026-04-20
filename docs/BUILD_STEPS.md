# Build steps

## Dev (local)
```bash
npm install
npm run dev
```

## Build bundle
Windows:
```powershell
npm run build:ps
```

Mac/Linux:
```bash
npm run build
```

This regenerates `web/game.js`.

## Tests (engine + fairness)
```bash
npm run test
```

## Eval / regression gate (recommended before release)
Create baseline once (after a “good” tuning pass):
```bash
npm run eval:baseline
```

Then, on every change, run:
```bash
npm run eval
```

If you intentionally changed difficulty, re-baseline:
```bash
npm run eval:baseline
```

To reproduce a specific run:
```bash
npm run repro
```
