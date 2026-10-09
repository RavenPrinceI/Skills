---
name: live-texts-video
description: Creates reusable Remotion videos of live text conversations with timed messages, typing indicators, image attachments, profile changes, and notification sounds. Use when asked to make or edit animated text-message videos, chat stories, or social-ready conversation clips.
metadata:
  hermes:
    tags: [video, remotion, chat, social]
---

# Live texts video

Create a finished MP4 from editable conversation JSON. The bundled renderer supports 4:5 (1080 × 1350) and 9:16 (1080 × 1920) at 30 fps, with frame-derived typing, bubbles, scrolling, read receipts, images, and profile updates. No service credentials are needed for rendering.

## Set up a working project

Use the terminal tool. Require Node.js 20+ and npm. Create a separate output project; keep the installed skill unchanged. In Hermes, `${HERMES_SKILL_DIR}` resolves to this skill's absolute directory. If substitution is disabled or another agent loads it, use the directory shown by the skill loader.

```sh
node "${HERMES_SKILL_DIR}/scripts/init.mjs" ./chat-video
cd ./chat-video
npm ci
npm run audio
npx remotion browser ensure
```

The initializer copies only the [generic template](assets/template/conversation.json) and reusable source; it refuses to overwrite a non-empty project. For headless Linux, install Chromium's system dependencies for the host distribution if browser launch reports missing libraries. An existing compatible browser can be supplied through `REMOTION_BROWSER_EXECUTABLE`; do not put machine-specific paths in the template.

## Create the conversation

Read [references/conversation.md](references/conversation.md) for the JSON schema, timing rules, and CLI options. Replace `conversation.json` in the working project with the requested script. Use `sent` for the viewpoint character, `received` for the contact, and `system` for notices. Keep the participant names, tone, length, and story specific to the current request.

Place requested images under the working project's `public/images/` and use relative paths such as `images/attachment.png`. Use the environment's available image-generation or editing tool when original artwork is requested; otherwise use supplied assets. Keep avatar identity consistent across profile changes and attachments. Build dashboards or other text-heavy graphics as SVG when crisp labels matter. Choose `imageFit: "contain"` to preserve a whole screenshot, or `"cover"` for a photo crop.

Allow time to read each bubble and inspect each picture before its reaction arrives. Keep individual messages short; split long passages. When writing comedy, make the picture add information and let the next reaction land without an explanatory caption. For 4:5, keep `showKeyboard: false` to leave room for the conversation. Use the keyboard in 9:16 when it helps the scene. Adjust pacing to the requested length rather than padding with typing pauses.

## Validate, preview, render

Run from the working project:

```sh
node render.mjs --validate
npm test
node render.mjs --composition LiveTextsLinkedIn --stills
node render.mjs --composition LiveTextsLinkedIn --output out/conversation.mp4
```

For portrait, use `--composition LiveTextsPortrait`. Add `--props ./another-conversation.json` for a separate script. Set `--frames 30,150,300` with `--stills` to inspect specific moments. `npm run studio` opens the editable Remotion timeline.

Inspect the rendered frames around the opening, image arrival, reaction, any profile change, and ending. Check text clipping, image crops, newest-bubble visibility, timing, and profile continuity. Render the full MP4 after fixing any problems, then confirm duration, dimensions, and audio. In constrained execution environments, browser rendering needs local server and browser-process access; resolve that through the environment's normal permission mechanism without disabling browser security.

Deliver the MP4 and its editable JSON/project paths. Use native file/media delivery or an absolute output path appropriate to the host. Preserve the original MP4 when a messaging platform compresses previews. Creating a video does not authorize posting it to a social network.

When sharing or updating this skill, include only the reusable source and generic fixture. Keep user conversations, generated portraits, reference attachments, account details, renders, and private prompts outside the skill bundle.
