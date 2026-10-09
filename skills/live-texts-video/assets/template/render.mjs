import {existsSync, readFileSync, mkdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {durationFrames, validateStory, FPS} from './src/story.mjs';

process.chdir(path.dirname(fileURLToPath(import.meta.url)));
const allowed = new Map([['--composition', true], ['--props', true], ['--output', true], ['--frames', true], ['--stills', false], ['--validate', false]]);
const options = {};
for (let i = 2; i < process.argv.length; i++) {
  const name = process.argv[i];
  if (!allowed.has(name)) throw new Error(`Unknown option: ${name}`);
  if (allowed.get(name)) {
    const value = process.argv[++i];
    if (!value || value.startsWith('--')) throw new Error(`${name} needs a value.`);
    options[name] = value;
  } else options[name] = true;
}
const id = options['--composition'] ?? 'LiveTextsLinkedIn';
if (!['LiveTextsLinkedIn', 'LiveTextsPortrait'].includes(id)) throw new Error(`Unknown composition: ${id}`);
if (options['--frames'] && !options['--stills']) throw new Error('--frames requires --stills.');
const inputProps = validateStory(JSON.parse(readFileSync(options['--props'] ?? 'conversation.json', 'utf8')));
const assets = [inputProps.avatar, ...inputProps.messages.flatMap(m => [m.image, m.profileUpdate?.avatar])].filter(Boolean);
if (inputProps.sound) assets.push('audio/sent.wav', 'audio/received.wav');
for (const asset of assets) {
  if (!existsSync(path.resolve('public', asset))) throw new Error(`Asset not found: public/${asset}${asset.startsWith('audio/') ? '; run npm run audio.' : ''}`);
}
const totalFrames = durationFrames(inputProps);
const previewFrames = options['--frames'] ? options['--frames'].split(',').map(Number) : [...new Set([
  0, ...inputProps.messages.map(m => Math.min(totalFrames - 1, Math.round((m.at + 0.5) * FPS))), totalFrames - 1
])];
if ((options['--frames'] && options['--frames'].split(',').some(value => !value.trim())) || previewFrames.some(frame => !Number.isInteger(frame) || frame < 0 || frame >= totalFrames)) throw new Error(`Preview frames must be integers from 0 to ${totalFrames - 1}.`);

if (options['--validate']) {
  console.log(`Valid: ${id}, ${totalFrames} frames, ${(totalFrames / FPS).toFixed(2)} seconds, ${assets.length} asset references.`);
} else {
  const {bundle} = await import('@remotion/bundler');
  const {selectComposition, renderMedia, renderStill} = await import('@remotion/renderer');
  const serveUrl = await bundle({entryPoint: path.resolve('src/index.tsx'), publicDir: path.resolve('public')});
  const shared = {serveUrl, inputProps, browserExecutable: process.env.REMOTION_BROWSER_EXECUTABLE || undefined, chromiumOptions: {disableWebSecurity: false}};
  const composition = await selectComposition({...shared, id});
  if (options['--stills']) {
    const directory = path.resolve(options['--output'] ?? 'out/stills');
    mkdirSync(directory, {recursive: true});
    for (const frame of previewFrames) {
      const output = path.join(directory, `${id}-frame-${frame}.png`);
      await renderStill({...shared, composition, output, frame});
      console.log(`Saved ${output}`);
    }
  } else {
    const output = path.resolve(options['--output'] ?? 'out/conversation.mp4');
    if (!output.toLowerCase().endsWith('.mp4')) throw new Error('Video output must end in .mp4.');
    mkdirSync(path.dirname(output), {recursive: true});
    let last = -1;
    await renderMedia({...shared, composition, codec: 'h264', outputLocation: output, crf: 18, concurrency: 2,
      onProgress: ({progress}) => {const percent = Math.floor(progress * 10) * 10; if (percent !== last) {console.log(`${percent}%`); last = percent;}}
    });
    console.log(`Rendered ${output}`);
  }
}
