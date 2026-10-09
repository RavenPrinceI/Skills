# Conversation schema and rendering

All times are seconds from the start. The video uses 30 fps; duration is the last arrival/read-receipt time plus `endHold`. The renderer takes the JSON object directly as Remotion props.

## Story fields

| Field | Meaning |
| --- | --- |
| `contact`, `initials` | Required non-empty strings for the other participant; initials are the fallback avatar (first two characters). |
| `handle` | Optional non-empty string displayed under the contact. |
| `avatar` | Optional image path relative to `public/`; a circular crop appears in the header. |
| `headline` | Optional brief title replacing the phone status bar; keep it short and inspect the render. Omit for a plain phone view. |
| `clock`, `dateLabel` | Required display strings; these are labels, not timestamps used for animation. |
| `accentColor` | Required six-digit hex color such as `#2878E7`; controls outgoing bubbles and icons. |
| `showKeyboard` | Required boolean. Prefer false in 4:5; optionally true in 9:16. |
| `sound` | Required boolean. When true, use the generated notification WAV files. |
| `endHold` | Required number, at least 1 second. Usually 2–4 seconds lets the ending breathe. |
| `messages` | Required non-empty array, in arrival order. |

## Message fields

| Field | Meaning |
| --- | --- |
| `at` | Required non-negative arrival time; at least 0.6 seconds after the previous arrival. |
| `side` | Required `sent`, `received`, or `system`. |
| `text` / `image` | Exactly one. Text is at most 200 Unicode characters and eight lines. Image is a relative path under `public/`. |
| `imageAlt` | Optional descriptive string for the image. |
| `imageFit` | Optional `cover` (default; crop to fill) or `contain` (whole image). Attachment area is 4:3. |
| `typing` | Optional number of seconds before arrival. Must fit entirely after the previous arrival (or start of video). Incoming text shows dots; outgoing text types in the composer. |
| `readAfter` | Optional non-negative seconds after arrival. For the latest outgoing message, changes Delivered to Read. |
| `profileUpdate` | Optional object on a `system` notice only; requires non-empty `contact` and `initials`, with optional `handle` and `avatar`. Takes effect at the notice's arrival. |

System notices support text only, with no typing or read receipt. A profile update preserves any omitted optional profile fields. Profiles follow the playhead, including when seeking backward.

For example, to change a contact's display name and handle:

```json
{
  "at": 12,
  "side": "system",
  "text": "Team updated its profile",
  "profileUpdate": {
    "contact": "Design team",
    "initials": "DT",
    "handle": "@design",
    "avatar": "images/new-avatar.png"
  }
}
```

Provide that avatar in the working project's `public/images/`, or omit the field. Neither remote URLs nor absolute paths nor `..` path traversal are accepted. All initial avatars, updated avatars, and attachment files are checked before bundling. The bundled SVG is just a neutral layout fixture; replace it with the current project's assets.

## Pacing and visual checks

For a 30–45 second clip, start with roughly 8–12 brief messages, then adjust to actual reading time. This is guidance, not a fixed limit. Give a picture 3–5 seconds before a reaction when the viewer must notice detail. An arrival's `typing` occupies the end of its gap; it does not add extra runtime. Leave short silent beats where they help the joke.

Scrolling follows measured bubble heights and frame-based easing. Preserve this approach when changing the layout: do not use wall-clock timers, CSS transitions, or stateful scrolling to animate the chat. Those can differ between preview, seeking, and parallel rendering. If text or a headline wraps badly, shorten it or adjust the layout and inspect again.

## Commands

Run from the generated project. Relative props/output paths resolve against that project's directory, even when the renderer is invoked from elsewhere.

```sh
npm run audio
node render.mjs --props conversation.json --validate
npm test
node render.mjs --composition LiveTextsLinkedIn --props conversation.json --stills
node render.mjs --composition LiveTextsPortrait --props conversation.json --stills --frames 30,165,285 --output out/portrait-stills
node render.mjs --composition LiveTextsLinkedIn --props conversation.json --output out/conversation.mp4
npm run studio
```

| Option | Behavior |
| --- | --- |
| `--composition` | `LiveTextsLinkedIn` (default, 1080 × 1350) or `LiveTextsPortrait` (1080 × 1920). Both use 30 fps. |
| `--props` | JSON file; defaults to `conversation.json`. |
| `--validate` | Check story, assets, and frame selections without launching a browser. |
| `--stills` | Render PNG previews: start, each arrival + 0.5 seconds, and final frame by default. |
| `--frames` | Comma-separated integer frame numbers; requires `--stills`. All must be inside the video's duration. |
| `--output` | MP4 file for video; directory for stills. Defaults to `out/conversation.mp4` or `out/stills`. |

`sound: false` produces a silent video and needs no WAV files. `npm run audio` synthesizes two original tones locally. The renderer encodes H.264 at CRF 18, with audio when enabled, and limits rendering concurrency to two frames.

## Host setup and delivery

`npm ci` uses the pinned lockfile; all Remotion packages must stay on the same version. `npx remotion browser ensure` installs its compatible headless browser. If using an existing browser, set the optional `REMOTION_BROWSER_EXECUTABLE` environment variable for that host only. Keep credentials and local paths out of source files. On Linux, resolve browser library errors using that distribution's Chromium dependencies. The render requires a browser process and a local HTTP server; a sandbox can block them even if validation succeeds.

Inspect actual rendered images, then play the MP4 to check typing, scrolling, cuts, and sound. If available, `ffprobe` can confirm H.264, expected dimensions, 30 fps, and duration. Do not describe an export as complete until it exists and its media can be opened or verified. Return the editable project and output paths; upload or post only when requested.

Hermes loads ordinary `SKILL.md` folders and replaces `${HERMES_SKILL_DIR}` in the loaded skill body. Install this bundle using its full GitHub directory path; a single-file download may omit the template. See the official [skill authoring guide](https://hermes-agent.nousresearch.com/docs/developer-guide/creating-skills/) and [GitHub installation guide](https://hermes-agent.nousresearch.com/docs/user-guide/features/skills/).
