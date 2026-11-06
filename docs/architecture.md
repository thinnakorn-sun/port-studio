# Architecture

## Boundaries

This project is a modular frontend, not a monorepo or a backend service. Next.js
owns routing and static delivery; the workspace runs on the client. A server
component (`app/page.tsx`) imports one client entry (`Studio`). No DOM-query based
application controller and no copied `app.js` are used.

Dependency direction:

- `domain` depends only on TypeScript and Zod; never React, Three.js or browser APIs.
- `features/studio/state` depends on domain and owns immutable edits/history.
- `rendering/three` translates domain geometry into disposable Three.js resources.
- `infrastructure` owns storage/file boundaries and uses domain validation.
- `features/studio/hooks` composes state, computation and persistence.
- UI components consume a studio controller and dispatch explicit actions.
- `app` is composition and metadata only; avoid putting engineering rules here.

## State flow

`form draft -> command -> schema validation -> reducer commit -> memoized STA -> UI`

Forms hold strings locally until submission. This permits typing incomplete
numbers without corrupting geometry. The reducer atomically validates a complete
candidate project before acceptance. Paired edits are one history entry. Invalid
imports preserve the current project. Selected IDs are repaired when a new project
has a different port inventory.

Map dragging and shape-point dragging use local preview state and commit once
on pointer release. This avoids hundreds of undo entries and repeated STA work
while a pointer is moving. Pointer capture supports mouse, pen and touch.

## Rendering

SVG owns the unwrapped map and shape editor. Positions are in millimetres and
only transformed to SVG coordinates for display. A selected port uses the same
normalized outline as STA, export and 3D.

Three.js loads in a client-only dynamic component. OrbitControls owns camera
interaction. The renderer draws on geometry/camera/resize changes; no continuous
animation loop runs when idle. ResizeObserver follows the viewport. On unmount,
geometry, material, controls, event handlers and renderer are disposed. Unsupported
WebGL displays a fallback while the 2D workflow remains usable.

The sleeve mesh uses radial cells. Solid cells receive outer/inner surfaces;
solid/empty boundaries receive reveal walls. Top and bottom rims are included.
The geometry is a preview approximation, not CAD topology guaranteed for printing.

## Files and persistence

- Native project schema: `version: 1`; legacy HTML-demo JSON is not silently migrated.
- JSON input <= 1 MB; 1–40 ports, 3–100 custom points, finite bounded dimensions.
- Crossed/degenerate polygons, invalid mirror references and duplicate IDs are rejected.
- Invalid stored data is not overwritten at startup; a subsequent accepted edit
  allows saving a new valid project.
- Storage errors appear in the UI. JSON export remains available for backups.
- XML names are escaped and CSV formula prefixes are neutralized.

## Layout

Desktop: metrics above; map/sleeve left, editor right (~60/40).
Mobile: map, editor, sleeve. The wide technical map scrolls horizontally and can
expand into an overlay workspace. Number fields have associated labels, map
polygons support keyboard selection, and error messages use an alert region.

## Changes

Put a new engineering rule in `domain` with numerical invariants. Put browser
file effects in `infrastructure`. Add a focused feature component for a panel;
keep `Studio` as composition. Do not add duplicate sources of port dimensions or
mutable global state. Keep deployment secrets and generated output out of Git.
