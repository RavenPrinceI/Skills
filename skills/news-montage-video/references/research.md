# Research and source acquisition

## Build a useful source pack

Start with the episode question and a cutoff timestamp. Identify the relevant event, product/model, dates, actors and locations. Search for exact phrases, visible component markings and names in the strongest lead. Follow reposts to the earliest available creator upload; use reporting to locate original statements and research. Use the environment's available tools rather than assuming Codex-specific APIs exist in Hermes.

Read edits, corrections and context. Separate purchase date, capture date, upload date and date you checked the source. Preserve the original language and check translations before using them as quotations. If an original is inaccessible, record that fact and say which accessible source supports the account. Do not describe a secondary report as direct confirmation.

Give every distinct incident/device/person/event an incident ID. Match visually identical clips and photographs to it. Several angles of one device and several reposts of a clip are still one case. Similar hardware in two images does not establish a shared attacker or purchase chain.

Select enough evidence to support the story, usually a few strong assets. Stop broad searching when necessary claims have support and usable media. If a key claim lacks support, qualify or remove it; if footage is unavailable, use an attributed statement card or an original labelled diagram and disclose the limitation.

## Review claims

For each proposed factual line, record its wording, source IDs, attribution, review state and material uncertainty. Useful distinctions are direct observation, researcher finding, company statement, individual report and unresolved claim. These are evidence categories, not a numerical truth score.

The episode schema retains claim-to-source and scene-to-claim references. Its validation catches missing IDs, not misinformation. Check that the source actually supports the sentence, that the edit retains its scope, and that every pictured detail is identified by the relevant source.

Avoid common montage errors:

- An old attack, a counterfeit device and a new implant report should not silently become one incident.
- A seller's name on a receipt does not establish who altered a device.
- A successful authenticity check may establish less than the caption implies; explain the specific check using current primary material.
- Third-party loss estimates remain estimates, even when widely reposted.
- Illustrative footage placed under a geographic update can imply the footage came from that location. Use the correct clip, a clear label or a statement card.
- A creator's emotional commentary and technical conclusions are separate editorial inputs.

## Acquire local assets

Prefer source-provided downloads, browser-supported asset downloads or direct public file URLs observed in the source. Record the original URL, creator, capture/upload date, incident ID, local filename, source in/out times, media dimensions, credits, crop and reuse basis/status. Do not bundle access tokens, private URLs, cookies or account data into an episode or skill.

Inspect downloaded media instead of trusting an extension or HTTP success. A tiny MP4 may be a fragmented stream's initialization segment. Confirm real duration and codecs with FFprobe. For an accessible public HLS stream, remux the observed playlist through FFmpeg, for example:

```sh
ffmpeg -y -rw_timeout 20000000 -i "OBSERVED_PUBLIC_PLAYLIST_URL" -c copy public/media/source.mp4
ffprobe -v error -show_entries format=duration:stream=codec_name,width,height -of json public/media/source.mp4
```

Use the host's tool argument support and timeouts. Keep long downloads separate from dependent navigation, check their outcome, and switch strategy after a bounded failure. Do not loop through guessed URL variants, bypass access controls or wait repeatedly for the same failing download. Preserve useful work while trying an accessible original, supplied file or different visual.

Extract stills at useful timecodes to inspect details; watch the selected ranges when possible. Redact recovery phrases, private receipts, addresses or unrelated personal information that appears in source material. Keep an original acquisition copy and use a separate edited copy when redactions are necessary.

## Record reuse honestly

Credits and public availability alone do not establish permission. Record `owned`, `cleared`, `reviewed-basis` with the specific reviewed basis, or `pending`. Drafts may contain clearly marked pending media while the issue is resolved. `--release` validation refuses pending or unexplained use; it does not grant publishing authorization or establish a legal conclusion. Use a provided/owned visual or a labelled original diagram when source media cannot be used.

## Suggested research.md

Keep the source review short and actionable:

1. Episode question and cutoff.
2. What is established, with direct original links and attribution.
3. Individual reports and unresolved claims.
4. Which assets depict the same incident; acquisition and redaction notes.
5. Remaining source/provenance work and what changed in the latest update.

Recheck the strongest originals for edits or new findings immediately before final delivery. Keep the script, captions and post aligned with that same version of the evidence.
