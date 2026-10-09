export const FPS = 30;
function validateAssetPath(value, label) {
  if (typeof value !== 'string' || !value.trim() || /^(?:[a-z]+:|\/|\\)/i.test(value) || value.split(/[\\/]/).includes('..')) throw new Error(`${label} must be a relative file path inside public/.`);
}
function validateProfile(profile) {
  for (const key of ['contact', 'initials']) if (typeof profile[key] !== 'string' || !profile[key].trim()) throw new Error(`Profile ${key} must be a non-empty string.`);
  if (profile.handle !== undefined && (typeof profile.handle !== 'string' || !profile.handle.trim())) throw new Error('Profile handle must be a non-empty string.');
  if (profile.avatar !== undefined) validateAssetPath(profile.avatar, 'Profile avatar');
}
export function validateStory(story) {
  if (!story || typeof story !== 'object') throw new Error('Conversation must be an object.');
  for (const key of ['contact', 'initials', 'clock', 'dateLabel', 'accentColor']) {
    if (typeof story[key] !== 'string' || !story[key].trim()) throw new Error(`${key} must be a non-empty string.`);
  }
  if (!/^#[0-9a-f]{6}$/i.test(story.accentColor)) throw new Error('accentColor must be a six-digit hex color.');
  validateProfile(story);
  for (const key of ['showKeyboard', 'sound']) if (typeof story[key] !== 'boolean') throw new Error(`${key} must be boolean.`);
  if (!Number.isFinite(story.endHold) || story.endHold < 1) throw new Error('endHold must be at least 1 second.');
  if (!Array.isArray(story.messages) || !story.messages.length) throw new Error('Add at least one message.');
  let previous = -1;
  for (const [i, message] of story.messages.entries()) {
    const fail = (reason) => { throw new Error(`Message ${i + 1}: ${reason}`); };
    if (!message || typeof message !== 'object') fail('must be an object.');
    if (!Number.isFinite(message.at) || message.at < 0 || message.at < previous + 0.6) fail('at must be non-negative and at least 0.6 seconds after the previous message.');
    if (!['sent', 'received', 'system'].includes(message.side)) fail('side must be sent, received, or system.');
    if ((typeof message.text === 'string' && message.text.trim() ? 1 : 0) + (typeof message.image === 'string' && message.image.trim() ? 1 : 0) !== 1) fail('provide exactly one of text or image.');
    if (message.text && [...message.text].length > 200) fail('split text over 200 characters into separate messages.');
    if (message.text && message.text.split('\n').length > 8) fail('split text over 8 lines into separate messages.');
    if (message.typing !== undefined && (!Number.isFinite(message.typing) || message.typing < 0 || message.typing > message.at - Math.max(0, previous))) fail('typing must fit between the previous message and this arrival.');
    if (message.readAfter !== undefined && (!Number.isFinite(message.readAfter) || message.readAfter < 0)) fail('readAfter must be non-negative.');
    if (message.imageFit && !['contain', 'cover'].includes(message.imageFit)) fail('imageFit must be contain or cover.');
    if (message.image) validateAssetPath(message.image, `Message ${i + 1} image`);
    if (message.side === 'system' && (message.image || message.typing || message.readAfter !== undefined)) fail('system notices support text without typing or read receipts.');
    if (message.profileUpdate !== undefined) {
      if (message.side !== 'system') fail('profileUpdate requires a system notice.');
      if (!message.profileUpdate || typeof message.profileUpdate !== 'object') fail('profileUpdate must be an object.');
      validateProfile(message.profileUpdate);
    }
    previous = message.at;
  }
  return story;
}
export function durationFrames(story) {
  return Math.ceil((Math.max(...story.messages.map(m => m.at + (m.readAfter ?? 0))) + story.endHold) * FPS);
}
export function activeTyping(story, time) {
  return story.messages.find(m => m.typing > 0 && time >= m.at - m.typing && time < m.at);
}
export function profileAt(story, time) {
  let profile = {contact: story.contact, initials: story.initials, handle: story.handle, avatar: story.avatar};
  for (const message of story.messages) {
    if (message.at > time) break;
    if (message.profileUpdate) profile = {...profile, ...message.profileUpdate};
  }
  return profile;
}
