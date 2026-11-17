# Application Analysis Outcome Builder — Frontend starter

## Requirements
- Node.js 20+ recommended
- npm

## Run locally
```bash
npm install
npm run dev
```
Open the local URL printed by Vite (usually http://localhost:5173).

## Production build
```bash
npm run build
npm run preview
```

## What is included
- React + TypeScript + Vite + Tailwind CSS
- Overview and application-details form sections
- Analysis checklist
- Observations and recommendations fields
- Separate Smart Context and Finder JSON editors
- Starter rule-object detection and preview tables
- Live document-layout approximation
- Save draft / export data as JSON

## Important limitations in this first scaffold
- The JSON parsers are intentionally heuristic. They are not final schema-accurate parsers.
- Replace the sample JSON with actual Smart Context and Finder JSON before validating the output mapping.
- The preview is an approximation. It does not yet edit or preserve the original DOCX template.
- “Export data” downloads JSON, not a Word document.
- No backend or persistent database is connected yet.

## Next implementation step
Use real SC and Finder configuration samples to create exact schema-specific parsers and test the output rows against the existing outcome documents.
