import {writeFileSync,mkdirSync} from 'node:fs';
import path from 'node:path';
import {loadEpisode} from '../src/episode.mjs';
const episode=loadEpisode(process.argv[2]??'episode.json');
if(!episode.audio)throw new Error('Set an audio path in the episode before generating music.');
const seconds=episode.scenes.reduce((sum,s)=>sum+Math.round(s.seconds*episode.fps)/episode.fps,0),rate=44100,count=Math.ceil(seconds*rate);
const out=Buffer.alloc(44+count*2);
out.write('RIFF');out.writeUInt32LE(out.length-8,4);out.write('WAVEfmt ',8);
out.writeUInt32LE(16,16);out.writeUInt16LE(1,20);out.writeUInt16LE(1,22);
out.writeUInt32LE(rate,24);out.writeUInt32LE(rate*2,28);out.writeUInt16LE(2,32);out.writeUInt16LE(16,34);
out.write('data',36);out.writeUInt32LE(count*2,40);
const cuts=[];let cursor=0;for(const scene of episode.scenes){cuts.push(cursor);cursor+=scene.seconds;}
let seed=74191;
for(let i=0;i<count;i++){
  const time=i/rate,beat=time%.75;
  seed=(1664525*seed+1013904223)>>>0;
  const noise=seed/4294967296*2-1;
  const fade=Math.min(1,time/1.1,(seconds-time)/2);
  let sample=.047*Math.sin(2*Math.PI*55*time)*Math.exp(-beat*8);
  sample+=.014*Math.sin(2*Math.PI*110*time)*Math.exp(-beat*4);
  sample+=noise*.012*Math.exp(-(time%.375)*90);
  sample+=.007*Math.sin(2*Math.PI*164.81*time)*Math.sin(Math.PI*time/6)**2;
  for(const cut of cuts){const d=time-cut;if(d>=0&&d<.6)sample+=.08*Math.sin(2*Math.PI*64*d)*Math.exp(-d*12)+noise*.015*Math.exp(-d*25);}
  out.writeInt16LE(Math.round(Math.max(-1,Math.min(1,sample*fade))*32767),44+i*2);
}
const target=path.resolve('public',episode.audio);
mkdirSync(path.dirname(target),{recursive:true});
writeFileSync(target,out);
console.log(`Original synthesized ${seconds}s news bed generated; no third-party music.`);
