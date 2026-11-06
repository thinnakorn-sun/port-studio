# Port Studio

A Next.js + React + TypeScript workspace for two-stroke cylinder port design.
The navy/orange design is preserved, with SVG port maps, editable polygon shapes,
Three.js sleeve visualization, time-area calculations, project files and exports.

## Run locally

Use Node.js 24 LTS (Node.js 22+ is supported).

```bash
npm ci
npm run dev
```

Open http://localhost:3000. For production:

```bash
npm run check
npm start
```

`npm run build` also generates a static deployment in `out/` because
`next.config.ts` enables `output: 'export'`. Serve that folder with a static host;
for the static-export configuration use `npx serve out` instead of `npm start`.
No API keys, database or account are required.

## Architecture

| Directory | Owns |
| --- | --- |
| `src/app` | Next.js App Router entry points, metadata, global tokens/reset |
| `src/domain/engine` | Pure kinematics and time-area mathematics |
| `src/domain/ports` | Port/project types, outlines, validation and defaults |
| `src/features/studio/components` | React workspace and focused UI panels |
| `src/features/studio/state` | Pure commands, reducer, undo/redo |
| `src/features/studio/hooks` | React state orchestration and persistence lifecycle |
| `src/rendering/three` | Three.js mesh adapter; no UI or file access |
| `src/infrastructure/projects` | Browser storage and validated file import |
| `src/infrastructure/export` | SVG/CSV/JSON serialization and browser download |
| `src/shared/ui` | Reusable number field and display formatting |
| `tests` | Engineering invariants, validation, state and export checks |
| `docs` | Architecture rules and mathematical provenance/limits |

See [architecture](docs/architecture.md) and [mathematics](docs/mathematics.md).

## Workflow

1. Configure Bore/Stroke/Conrod/RPM in **คำนวณเครื่องยนต์**.
2. Select a port in the SVG map or the dropdown. Drag horizontally to reposition.
3. Edit coordinates and dimensions, then press **ใช้ค่าที่กรอก**.
4. Choose a preset or drag an outline point. Crossed polygons are rejected.
5. Toggle paired edits; inspect the actual openings in the Three.js preview.
6. Export SVG/CSV, or save JSON to reopen the complete project.

All dimensions are millimetres. Custom outline points are normalized to [0,1].
The JSON schema is versioned (`version: 1`). Values are validated before entering
application state; invalid edits do not replace the current project. Undo/redo
retains the last 30 accepted edits. Autosave stays on the current browser/device;
use JSON for backups and transferring between devices.

## Scope and verification

- `npm test`: 13 tests covering dead centres, unit conversion, clipping, STA/RPM
  scaling, polygon validity, import validation, symmetry, undo/redo, exports and mesh normals.
- `npm run typecheck`: strict TypeScript.
- `npm run build`: Next.js production compilation and static export.
- CI runs these checks for `main` pushes and pull requests.

This is a new implementation, not the original site's source or a Pro unlock.
Some mathematical methods were observed in publicly delivered JavaScript;
[mathematics.md](docs/mathematics.md) distinguishes those observations from our
own implementations. Results have not been benchmarked against the gated Pro UI.

The 3D mesh approximates boundaries on a grid; it has actual openings and side
walls, but is not a manufacturing/CAD model. No STL export is offered. STA targets
are editable example values, not recommendations or validated safe engine limits.
Overlapping port regions are summed separately by the STA estimator; avoid
geometric overlaps when using the numerical results.
