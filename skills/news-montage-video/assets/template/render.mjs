import {bundle} from '@remotion/bundler';
import {openBrowser,renderMedia,renderStill,selectComposition} from '@remotion/renderer';
import {createHash} from 'node:crypto';
import {mkdirSync,readFileSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {loadEpisode,validateLocalFiles,durationFrames} from './src/episode.mjs';
import {parseArgs} from './src/cli.mjs';
import {probeMedia} from './src/media-tools.mjs';

const options=parseArgs(process.argv.slice(2));
const episode=loadEpisode(options.episode,{release:options.release});
validateLocalFiles(episode);
for(const asset of episode.assets.filter(asset=>asset.kind==='video')){
  const metadata=probeMedia(path.resolve('public',asset.path));
  if(!metadata.streams.some(stream=>stream.codec_type==='video'))throw new Error(`No video stream: ${asset.id}`);
  if(Math.abs(Number(metadata.format.duration)-asset.duration)>.15)throw new Error(`Measured duration disagrees for ${asset.id}`);
}
console.log(`${episode.id}: ${episode.scenes.length} scenes, ${durationFrames(episode)/episode.fps}s; references and local media valid.`);
const pending=episode.assets.filter(asset=>asset.reuseStatus==='pending');
if(pending.length)console.log(`Draft has ${pending.length} media assets with pending reuse review.`);
if(!options.validate){
  mkdirSync(options.output,{recursive:true});
  const serveUrl=await bundle({entryPoint:path.resolve('src/index.tsx'),publicDir:path.resolve('public')});
  const chromiumOptions=process.env.REMOTION_GL?{gl:process.env.REMOTION_GL}:{};
  const browser=await openBrowser('chrome',{browserExecutable:process.env.REMOTION_BROWSER_EXECUTABLE??null,chromiumOptions});
  const exports=[];
  try{
    for(const format of options.format==='both'?['vertical','landscape']:[options.format]){
      const inputProps={episode,format};
      const composition=await selectComposition({serveUrl,id:format==='vertical'?'NewsVertical':'NewsLandscape',inputProps,puppeteerInstance:browser,chromiumOptions});
      if(options.stills){
        let cursor=0;
        const midpoints=episode.scenes.map(scene=>{const frames=Math.round(scene.seconds*episode.fps);const middle=cursor+Math.floor(frames/2);cursor+=frames;return middle;});
        for(const frame of options.frames??midpoints){
          if(frame>=composition.durationInFrames)throw new Error(`Frame ${frame} is outside this episode`);
          await renderStill({serveUrl,composition,inputProps,frame,output:path.resolve(options.output,`${episode.id}-${format}-${frame}.png`),puppeteerInstance:browser,chromiumOptions});
          console.log(`${format}: saved frame ${frame}`);
        }
      }else{
        const frames=options.sample?Math.min(composition.durationInFrames,Math.max(1,Math.round(options.sample*episode.fps))):composition.durationInFrames;
        const file=`${episode.id}-${format}${options.sample?'-sample':''}.mp4`;
        let last=-1;
        await renderMedia({serveUrl,composition,inputProps,outputLocation:path.resolve(options.output,file),codec:'h264',crf:19,pixelFormat:'yuv420p',audioCodec:'aac',audioBitrate:'192k',concurrency:options.concurrency,puppeteerInstance:browser,chromiumOptions,frameRange:[0,frames-1],onProgress:({progress})=>{const n=Math.floor(progress*10)*10;if(n!==last){last=n;console.log(`${format}: ${n}%`);}}});
        exports.push({file,format,width:composition.width,height:composition.height,frames,fps:episode.fps,audio:Boolean(episode.audio)});
      }
    }
  }finally{await browser.close({silent:true});}
  if(exports.length){
    const hash=data=>createHash('sha256').update(data).digest('hex');
    const assets=episode.assets.map(asset=>({...asset,sha256:hash(readFileSync(path.resolve('public',asset.path)))}));
    writeFileSync(path.resolve(options.output,'render-manifest.json'),JSON.stringify({episodeId:episode.id,inputSha256:hash(readFileSync(options.episode)),sources:episode.sources,assets,exports},null,2)+'\n');
  }
}
