import {existsSync,readFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import {parseEpisode} from './schema.mjs';
export {episodeSchema,durationFrames,assetSlots,validateReferences,parseEpisode} from './schema.mjs';

export function loadEpisode(file='episode.json',options){return parseEpisode(JSON.parse(readFileSync(file,'utf8')),options);}

export function validateLocalFiles(episode,publicDirectory='public'){
  const root=realpathSync(publicDirectory);
  const files=[...episode.assets.map(a=>a.path),...(episode.audio?[episode.audio]:[])];
  for(const file of files){
    const target=path.resolve(root,file);
    if(!existsSync(target))throw new Error(`Missing local media: ${file}`);
    const relative=path.relative(root,realpathSync(target));
    if(relative==='..'||relative.startsWith(`..${path.sep}`)||path.isAbsolute(relative))throw new Error(`Media escapes public/: ${file}`);
  }
}
