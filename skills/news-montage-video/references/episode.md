# Episode data and renderer

The working project is a copy of `assets/template/`. Run commands from that project, not the installed skill. Defaults read `episode.json` and write `out/`.

## Commands

```sh
npm ci
npm run audio
npm run validate
npm test
npm run studio
node render.mjs --stills
node render.mjs --stills --frames 90,240
node render.mjs --sample 20
node render.mjs --format vertical
node render.mjs --format landscape
node render.mjs --episode another-episode.json --output out/another
node render.mjs --validate --release
npm run render
npm run verify
```

`--format` accepts `both` (default), `vertical` or `landscape`. `--sample` renders the first specified seconds. Stills default to one midpoint per scene. Both final and sample renders use H.264/AAC at the episode frame rate; audio is omitted when no audio path is set. Set `REMOTION_BROWSER_EXECUTABLE` for an existing compatible browser, and `REMOTION_GL` only when the host requires a particular supported renderer. Default concurrency is 2; `--concurrency` can change it.

`--release` checks the recorded media reuse status before rendering. It does not publish anything. It accepts owned media, cleared media with a recorded basis and media with another explicitly reviewed basis. Keep draft version labels until the real editorial/reuse review is complete.

`node scripts/make-audio.mjs another-episode.json` generates an original bed at that episode's audio path. `node scripts/verify.mjs --episode another-episode.json --output out/another` reads the last render manifest and checks each exported file's dimensions, duration, fps, expected streams and complete decoding. `FFMPEG_PATH` and `FFPROBE_PATH` can supply installed media executables; otherwise the verifier looks for Remotion's platform package and then PATH.

## Top-level fields

| Field | Purpose |
| --- | --- |
| `id` | Stable lowercase slug used in output filenames |
| `title`, `series`, `date`, `version` | Story title, header, cutoff display and draft/version label |
| `fps` | Frame rate, usually 30; durations are rounded to whole frames |
| `audio` | Optional path relative to public/; omit for silent export |
| `sources` | Original URLs, creators, dates, evidence category and review notes |
| `assets` | Local media, attribution, incident IDs, crop/trim information and reuse status |
| `claims` | Wording, source IDs, status and uncertainty |
| `scenes` | Ordered content and timings |

Sources have `id`, `title`, `author`, `url`, `date`, `checked`, `status`, `notes`. Status is `primary`, `individual-report`, `repost` or `demo`. Use `demo` only for explicitly synthetic fixtures. Unknown dates must remain unknown in notes and visual labels.

Claims have `id`, `text`, nonempty `sourceIds`, `status` (`attributed`, `reported`, `verified-scope`) and optional `uncertainty`. A schema-valid claim still requires editorial review. Do not use fixture data as research.

## Assets

Each asset has:

```json
{
  "id": "source-closeup",
  "path": "media/source.mp4",
  "kind": "video",
  "sourceId": "original-upload",
  "incidentId": "same-device-01",
  "credit": "VIDEO: ORIGINAL CREATOR · UPLOAD DATE",
  "label": "USER REPORT · UNVERIFIED PROVENANCE",
  "reuseStatus": "pending",
  "provenance": "Original URL, capture date if known, and acquisition notes",
  "duration": 42.5,
  "trimSeconds": 8,
  "fit": "contain",
  "focalPoint": {"vertical": "50% 50%", "landscape": "50% 50%"}
}
```

All paths are local and relative to `public/`; remote media and directory escapes are rejected. A video needs its measured `duration`. `trimSeconds` is source time, not scene time. When a scene has several assets, they receive equal sequential slots; duplicate an asset with another ID/trim to use a different excerpt. The final slot receives any remaining frame. Every video starts its trim at its own slot's frame zero.

`fit` defaults to `contain`, preserving the entire image or frame. Choose `cover` only with checked focal points in both layouts. A `detail` scene may set an `annotation` label; do not name a component or draw an implication the source does not support.

For `cleared` or `reviewed-basis`, include a nonempty `reuseBasis` recording what was reviewed. `pending` remains valid for a draft, with a release warning. The supplied SVG is original synthetic artwork with `owned` status, not evidence about a real product.

## Scenes

Each scene has `id`, `type`, `seconds`, `label`, `headline`, `body`, `footnote`, `claimIds`, `assetIds`, plus fields below. Headlines can contain `\n` for deliberate line breaks. Keep copy concise; shortening text is usually better than shrinking it to fit.

| Type | Visual and extra fields |
| --- | --- |
| `hook` | Source footage/image; can use `quote` for a text-only opening |
| `montage` | Sequential `assetIds`; each credit follows its asset |
| `detail` | Image/video with optional `annotation` text |
| `mechanism` | Two or three `items` with `title`, `body`; a labelled explanation/diagram |
| `statement` | `quote` summary with optional `summaryLabel`, `attribution`; use quotation marks only for a checked direct quote |
| `scope` | Two or three `items` naming material unknowns or limits |
| `close` | One to three source/reference `items`; end-card labels can be overridden with `visualTitle`, `visualFooter` |

Sources, claims, assets and scenes require unique IDs within their lists. References, scene shape, local files, video-slot duration and at-least-one-frame timing are validated. The renderer writes a manifest with input hash, media hashes, sources and expected output metadata. Keep manifests with the final episode for reproducibility.

## Output review

Review actual source excerpts and representative final frames, not just JSON. Confirm dates and source labels survive both crops, text avoids platform controls, archive/demo examples are clear and a reused clip is not implying an additional case. Inspect the source switch inside multi-asset scenes. Then render the full requested MP4s and run verification.

Create the real `research.md` and `post.md` in the working project. The fixture contains no current news or third-party claims to carry forward.
