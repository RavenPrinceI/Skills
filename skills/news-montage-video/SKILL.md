---
name: news-montage-video
description: Researches a news story from original posts, footage and primary statements, then assembles a sourced Remotion montage and accompanying social post. Use when asked for a news-style video, evidence-led explainer, Reddit/X clip montage, or a reusable research-to-video format.
metadata:
  hermes:
    tags: [video, remotion, research, news, social]
---

# News montage video

Turn a topic into a source pack, a concise script, a finished video and a matching post. Preserve the user's platform, duration and editorial direction. For planning-only requests, deliver the researched plan and source queue; render when video creation is requested. For an unspecified format, propose a 60–90 second text-led report; use both 1080 × 1920 and 1920 × 1080 at 30 fps when both are requested. The bundled template implements those two layouts from one episode file.

## Research the story

Read [references/research.md](references/research.md) before gathering content. Use the environment's search/browser tools to find original uploads, first-person reports, relevant research and direct company responses. Match each factual caption to supporting sources. Record dates, qualifications, contradictory evidence and acquisition failures. Give each distinct incident an ID so reposts never become additional cases.

Choose a few strong visual assets that explain the story. Watch or inspect them, record source timecodes and preserve their creator/date labels. Distinguish what a clip visibly shows from what its uploader claims. Keep unverified claims attributed; a company statement is its account, not independent verification. Recheck developing claims before final delivery.

Create `research.md` in the working project with the source review and unresolved questions. Save structured sources, claims and assets in `episode.json`. Record media provenance and reuse status; keep uncertain assets clearly marked in drafts and surface any unresolved release work with the delivery. Do not invent footage or substitute generated imagery for incident evidence.

## Start the video project

Require Node.js 20+ and npm. Create a separate working project; keep the installed skill unchanged. Hermes substitutes `${HERMES_SKILL_DIR}` with this skill's absolute directory. Other agents should use the skill directory supplied by their loader.

```sh
node "${HERMES_SKILL_DIR}/scripts/init.mjs" ./news-video
cd ./news-video
npm ci
npm run audio
npm run validate
```

The initializer copies a generic synthetic example and the renderer, refusing to overwrite a non-empty destination. It includes no Ledger claims, downloaded social clips, account data, proprietary fonts or machine-specific paths. Render the fixture only as a template demonstration; replace its copy and illustration for real reporting.

Read [references/episode.md](references/episode.md) when populating the project. Set the theme in `src/theme.ts`; set the episode's copy, evidence labels, timings, annotations, diagram steps and source credits in JSON. Keep approved media local under `public/`. Preserve complete screenshots with `fit: "contain"`; choose per-format focal points for video crops.

## Assemble the report

Use this narrative shape when it suits the story: opening visual → strongest finding → close-up evidence → simple explanation → response → unknowns → source/date closing. Let source strength determine the script. A 75-second pilot is a useful starting point, not a fixed requirement.

Keep one short headline or sentence per beat. Allow time for reading and inspecting evidence. Use clean cuts, restrained movement, a readable credit line and a limited accent palette. The video should work muted. Narration is optional; the bundled audio command creates an original restrained music bed. Label archive material, guide examples, reconstructions and synthetic diagrams where applicable.

## Preview, render and verify

```sh
npm test
npm run stills
node render.mjs --sample 20
npm run render
npm run verify
```

Inspect representative frames from **both** requested layouts for text clipping, source labels, private information, misleading crops and visual implications. Inspect selected source excerpts throughout their duration. Check pacing with sound and muted; a successful render alone does not establish editorial quality. Fix issues and render again when needed.

Remotion downloads its standard browser when needed. An existing compatible browser can be set through `REMOTION_BROWSER_EXECUTABLE`. On Linux, install the host's Chromium dependencies if launch reports missing libraries. Resolve local-process/network permissions through the host's normal mechanism; preserve browser security settings. Media verification uses available FFmpeg/FFprobe or Remotion's installed compositor tools.

## Prepare the post and deliver

Create `post.md` using the same reviewed claims as the video: concise hook, finding with attribution, material uncertainty and original source links. Put extra sources in replies or the destination's description. Check destination text limits; use the actual research cutoff date and preserve source qualifications in the post.

Deliver requested MP4s, covers or sample previews when useful, the editable project/episode, `research.md`, `post.md` and verification results. Explain any missing media or unresolved provenance without implying it was verified. Creating a report does not authorize publishing it or messaging source creators. Future runs should refresh the story's evidence rather than reuse old findings as current news.
