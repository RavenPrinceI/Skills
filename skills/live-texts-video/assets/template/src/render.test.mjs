import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

test('CLI validates a standalone silent project and rejects missing attachments and invalid frames', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'live-texts-cli-'));
  const template = fileURLToPath(new URL('../', import.meta.url));
  try {
    for (const item of ['render.mjs', 'src', 'public', 'conversation.json']) {
      cpSync(path.join(template, item), path.join(directory, item), {recursive: true});
    }
    const storyFile = path.join(directory, 'conversation.json');
    const story = JSON.parse(readFileSync(storyFile, 'utf8'));
    story.sound = false;
    writeFileSync(storyFile, JSON.stringify(story));
    const run = (...args) => spawnSync(process.execPath, [path.join(directory, 'render.mjs'), ...args], {encoding: 'utf8'});
    const valid = run('--validate');
    assert.equal(valid.status, 0, valid.stderr);
    assert.match(valid.stdout, /378 frames/);
    const invalidFrame = run('--validate', '--stills', '--frames', '378');
    assert.notEqual(invalidFrame.status, 0);
    assert.match(invalidFrame.stderr, /Preview frames/);
    story.messages[2].image = 'images/missing.png';
    writeFileSync(storyFile, JSON.stringify(story));
    const missing = run('--validate');
    assert.notEqual(missing.status, 0);
    assert.match(missing.stderr, /Asset not found/);
  } finally {
    rmSync(directory, {recursive: true, force: true});
  }
});
