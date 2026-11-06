# Mathematical provenance and limits

## What was actually observed

On 2026-11-06 the publicly delivered JavaScript at
https://gilded-croissant-387390.pages.dev/ was read statically. The Pro interface
was not unlocked, and its live behavior/results were not tested. These are source
observations, not proof that every code path runs in the paid interface:

| Method                                      | Public-source observation                                                                             | This project's implementation                                  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Slider-crank position                       | `pistonPos` contains the slider-crank displacement expression                                         | Independent typed function in `domain/engine/kinematics.ts`    |
| Polygon area                                | `polygonArea` uses the shoelace sum                                                                   | Independent pure geometry function                             |
| Open port area                              | `geometricPortAreaAt`/`portAreaAt` relate port shape to piston position                               | Polygon clipping to the piston crown, then shoelace area       |
| Time-area integration                       | `allTimeArea` uses 720 intervals, half endpoint weights, `60 / RPM / N`, and `100 * ccOne` as divisor | Independent trapezoidal integration with 720 default intervals |
| Manual-area mode                            | Public source also contains manual-area factors                                                       | Not implemented; this app uses drawn geometry only             |
| Chord/arc conversion                        | NOT verified as the original site's exact method                                                      | Standard minor-arc geometry, explicitly bounded                |
| Three.js / OrbitControls                    | NOT verified as the original site's technology                                                        | Our chosen rendering stack                                     |
| 3D hole generation                          | Original implementation NOT verified                                                                  | Our radial grid with inner/outer surfaces and reveal walls     |
| Default shape presets and STA target values | Not claimed to reproduce original defaults                                                            | New illustrative presets/values                                |

The earlier conversational description mixed observed facts with suggested
implementation details. This table is the authoritative distinction. No source
parity or numeric parity with Pro is claimed.

## Units and equations

Let D = Bore (mm), S = Stroke (mm), L = conrod centre distance (mm), r = S/2,
and theta = crank angle in radians.

- Circumference: C = pi * D (mm).
- Displacement per cylinder: V = pi * D² * S / 4000 (cm³).
- Piston position below TDC:
  s = r * (1 - cos(theta)) + L - sqrt(L² - r² * sin²(theta)).
- Minor arc width from chord c: w = D * asin(c / D).
- Chord from minor arc w: c = D * sin(w / D), 0 <= w <= pi*D/2.
- Angular location of a port-map X coordinate: angle = 360 * X / C.

Y increases downwards from TDC. At angle theta, the open port is the portion of
its polygon at Y <= s(theta). For N=720 equally spaced intervals:

STA = sum(open_area_mm2 * trapezoid_weight) * (60 / RPM / N) / (100 * V).

The factor 100 converts mm² to cm². STA has units cm²*s/cm³. Transfer STA includes
Transfer and Boost ports. Each port is counted independently; overlapping regions
are not unioned. Open area is geometric area, without a discharge coefficient.

Target-equivalent RPM = current RPM * calculated STA / target STA.
Reference RPM = min(exhaust-equivalent RPM, transfer-equivalent RPM).
This minimum is an explicit application convention, not an experimentally
validated engine-performance model.

## What has NOT been validated

No back-to-back comparison with Pro, dynamometer data, flowbench data, pressure
model, exhaust resonance, combustion, heat, ring support, safe mechanical RPM or
manufacturing tolerances. Passing tests verifies mathematical invariants and
software behavior, not suitability of a port design for cutting a real cylinder.

## Verification

Tests cover dead centres and piston symmetry, known rectangular areas and clipping,
cm³ conversion, chord/arc round-trip, STA's inverse RPM scaling, input rejection,
paired changes and outward preview normals. These are independent expected
properties, not assertions copied from the implementation's output.
