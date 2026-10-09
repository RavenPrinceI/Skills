import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateStory, durationFrames, activeTyping, profileAt} from './story.mjs';

const sample = JSON.parse(readFileSync(new URL('../conversation.json', import.meta.url), 'utf8'));

test('duration includes a late read receipt and the ending hold', () => {
  const story = structuredClone(sample);
  story.messages.at(-1).readAfter = 2;
  validateStory(story);
  assert.equal(durationFrames(story), 420);
});

test('typing starts before arrival and stops exactly at arrival', () => {
  assert.equal(activeTyping(sample, 2.49), undefined);
  assert.equal(activeTyping(sample, 2.5).side, 'received');
  assert.equal(activeTyping(sample, 3.5), undefined);
});

test('reject ambiguous content, unordered messages, and overlapping typing', () => {
  for (const edit of [m => m.image = 'images/layout.svg', m => m.at = 1, m => m.typing = 3]) {
    const story = structuredClone(sample);
    edit(story.messages[1]);
    assert.throws(() => validateStory(story));
  }
});

test('reject assets outside the public directory in messages and profiles', () => {
  for (const asset of ['../private.png', '/private.png', 'https://example.com/image.png', 'C:\\private.png']) {
    const story = structuredClone(sample);
    story.messages[2].image = asset;
    assert.throws(() => validateStory(story), /relative file path/);
    story.messages[2].image = 'images/layout.svg';
    story.avatar = asset;
    assert.throws(() => validateStory(story), /relative file path/);
  }
});

test('profile changes are deterministic across forward and backward seeks', () => {
  const story = structuredClone(sample);
  story.messages.push({at: 12, side: 'system', text: 'Profile updated', profileUpdate: {contact: 'Design team', initials: 'DT', handle: '@design', avatar: 'images/new-avatar.png'}});
  validateStory(story);
  assert.equal(profileAt(story, 11.99).contact, 'Team');
  assert.equal(profileAt(story, 12).handle, '@design');
  assert.equal(profileAt(story, 30).avatar, 'images/new-avatar.png');
  assert.equal(profileAt(story, 2).handle, '@team');
  assert.equal(profileAt(story, 2).avatar, undefined);
  story.messages.at(-1).side = 'received';
  assert.throws(() => validateStory(story), /system notice/);
});

test('system notices cannot type or show read receipts', () => {
  for (const extra of [{typing: 0.5}, {readAfter: 0}]) {
    const story = structuredClone(sample);
    story.messages.push({at: 12, side: 'system', text: 'Profile updated', ...extra});
    assert.throws(() => validateStory(story), /system notices/);
  }
});
