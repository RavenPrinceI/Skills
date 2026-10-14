import {cpSync, existsSync, mkdirSync, readdirSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const args = process.argv.slice(2);
if (args.length !== 1 || args[0].startsWith('--')) {
  console.error('Usage: node scripts/init.mjs <new-project-directory>');
  process.exit(1);
}
const template = fileURLToPath(new URL('../assets/template/', import.meta.url));
const destination = path.resolve(args[0]);
const skillRoot = fileURLToPath(new URL('../', import.meta.url));
const relative = path.relative(skillRoot, destination);
if (!relative || (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))) {
  throw new Error('Choose a project directory outside the installed skill.');
}
if (existsSync(destination) && readdirSync(destination).length) {
  throw new Error('Destination is not empty. Choose a new directory; existing files will not be overwritten.');
}
mkdirSync(destination, {recursive: true});
cpSync(template, destination, {recursive: true, force: false, errorOnExist: true});
console.log(`Created ${destination}`);
console.log('Next: cd into that directory, then run npm ci, npm run audio, and npx remotion browser ensure.');
