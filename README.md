# Deepbrush — independent surface-painting demo

**By Mirco Aurelio · [Live demo](https://deepbrush.app) · [Mapshroom page](https://mapshroom.dev/deepbrush/)**

An experimental browser editor that projects brushes, stamps, text and light onto estimated photo geometry. It opens on a draped-cloth study with a red brush. Images fit the available canvas without changing their aspect ratio.

## Independent implementation

This educational demo is inspired by the publicly observable painting behavior shown in [Adobe's Project Deep Brush presentation](https://labs.adobe.com/sneaks/deep-brush). It was implemented separately using WebGL, Depth Anything V2 Small and the author's Mapshroom geometry utilities.

“Reverse-engineered” refers here to behavioral reimplementation from public demonstrations. It does **not** mean Adobe source code was obtained, copied or decompiled. This is not Adobe software and is not affiliated with, sponsored by or endorsed by Adobe. It is not a formally audited clean-room implementation.

This demo estimates relative depth and surface normals. It does not reproduce Adobe's proprietary implementation, physical decomposition or complete feature set. Expect approximate geometry, occlusion artifacts and browser/device limits. No claim of trademark clearance or guaranteed legal compliance is made.

## Run locally

Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open http://127.0.0.1:5190 . `npm run build` creates `dist`; `npm run preview` serves an existing build. `PORT` changes the local port.

The build compiles the readable depth-worker source and copies its matching ONNX WASM runtime from pinned npm packages. The compressed sample bundles in `sample-bundles/` contain the photos and maps, plus provenance. The build verifies archive hashes before extracting them and recreates the in-app ZIP downloads. Model weights are downloaded from the pinned Hugging Face revision on first inference, not stored in this repository.

## Checks

```sh
npm run check
```

This runs input/geometry tests, builds the site, and checks sample hashes, dimensions and byte-exact combined-map packing. After starting the preview, open `/tests/browser/deepbrush-gpu.html` for seven real-WebGL regression checks. A WebGL2-capable browser is required.

## Privacy and license

Photo processing and inference run in the browser. User photos are not uploaded to an inference service. Model files load from Hugging Face and fonts from Google Fonts; those services and the site host receive ordinary network requests.

The original application code is [MIT licensed](LICENSE). Third-party libraries, models, fonts and images retain separate terms; see [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md), [ASSET_PROVENANCE.md](ASSET_PROVENANCE.md) and `public/CREDITS.txt`. The code license does not grant rights the author does not hold or assert exclusive copyright in purely generated imagery.

The public sample set includes original text-only AI compositions and credited CC0 photographs. Earlier screenshot-based recreations and the source-photo-based car were deliberately excluded, along with the private Mapshroom repository history.
