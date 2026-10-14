import {readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {parseArgs} from '../src/cli.mjs';
import {loadEpisode} from '../src/episode.mjs';
import {probeMedia,runMediaTool} from '../src/media-tools.mjs';
import {createHash} from 'node:crypto';

const options=parseArgs(process.argv.slice(2)),episode=loadEpisode(options.episode);
const manifest=JSON.parse(readFileSync(path.resolve(options.output,'render-manifest.json'),'utf8'));
const inputHash=createHash('sha256').update(readFileSync(options.episode)).digest('hex');
if(manifest.episodeId!==episode.id||manifest.inputSha256!==inputHash)throw new Error('Episode changed after rendering; render the current data first.');
const results=[];
for(const expected of manifest.exports){
  const file=path.resolve(options.output,expected.file),metadata=probeMedia(file);
  const video=metadata.streams.find(s=>s.codec_type==='video'),audio=metadata.streams.find(s=>s.codec_type==='audio');
  if(video?.width!==expected.width||video?.height!==expected.height)throw new Error(`Resolution mismatch: ${file}`);
  const duration=Number(metadata.format.duration);
  if(!Number.isFinite(duration)||Math.abs(duration-expected.frames/expected.fps)>.15)throw new Error(`Duration mismatch: ${file}`);
  const [n,d]=video.r_frame_rate.split('/').map(Number);
  if(Math.abs(n/d-expected.fps)>.001||video.codec_name!=='h264'||(expected.audio&&audio?.codec_name!=='aac'))throw new Error(`Unexpected streams: ${file}`);
  const decode=runMediaTool('ffmpeg',['-v','error','-i',file,'-c:v','rawvideo','-c:a','pcm_s16le','-f','null','-']);
  if(decode.stderr.trim())throw new Error(`Decode errors: ${file}\n${decode.stderr}`);
  results.push({file:expected.file,width:video.width,height:video.height,duration,fps:expected.fps,fullDecode:'passed'});
}
if(!results.length)throw new Error('No exports to verify');
writeFileSync(path.resolve(options.output,'verification.json'),JSON.stringify({episodeId:episode.id,exports:results},null,2)+'\n');
console.log(JSON.stringify(results,null,2));
