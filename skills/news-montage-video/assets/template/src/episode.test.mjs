import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {parseEpisode,assetSlots,durationFrames,validateLocalFiles} from './episode.mjs';
import {parseArgs} from './cli.mjs';
const fixture=()=>JSON.parse(readFileSync(new URL('../episode.json',import.meta.url),'utf8'));

test('synthetic fixture validates without media acquisition',()=>{
  const episode=parseEpisode(fixture());
  assert.equal(durationFrames(episode),1080);
  validateLocalFiles({...episode,audio:undefined},fileURLToPath(new URL('../public/',import.meta.url)));
});

test('missing source and claim references are rejected',()=>{
  const source=fixture();source.assets[0].sourceId='missing';
  assert.throws(()=>parseEpisode(source),/Unknown source/);
  const claim=fixture();claim.scenes[0].claimIds=['missing'];
  assert.throws(()=>parseEpisode(claim),/Unknown claim/);
});

test('release checks distinguish draft assets and recorded reuse bases',()=>{
  const data=fixture();data.assets[0].reuseStatus='pending';
  assert.doesNotThrow(()=>parseEpisode(data));
  assert.throws(()=>parseEpisode(data,{release:true}),/reuse status/);
  data.assets[0].reuseStatus='reviewed-basis';
  assert.throws(()=>parseEpisode(data,{release:true}),/reuse status/);
  data.assets[0].reuseBasis='Explicitly reviewed basis recorded for this test';
  assert.doesNotThrow(()=>parseEpisode(data,{release:true}));
});

test('media paths cannot escape public or point to live URLs',()=>{
  for(const file of ['../secret.txt','/tmp/private','C:/private.txt','https://example.com/clip.mp4','..\\private']){
    const data=fixture();data.assets[0].path=file;
    assert.throws(()=>parseEpisode(data));
  }
});

test('video trims are checked against their own sequential slots',()=>{
  const data=fixture();
  const base={...data.assets[0],kind:'video',duration:3,trimSeconds:1};
  data.assets=[{...base,id:'one'},{...base,id:'two'}];
  data.scenes=[{...data.scenes[0],type:'montage',seconds:4,assetIds:['one','two']}];
  assert.doesNotThrow(()=>parseEpisode(data));
  assert.deepEqual(assetSlots(data.scenes[0],30),[{id:'one',from:0,frames:60},{id:'two',from:60,frames:60}]);
  data.assets[1].trimSeconds=2;
  assert.throws(()=>parseEpisode(data),/too short/);
});

test('odd frame counts preserve the scene duration without gaps',()=>{
  const slots=assetSlots({seconds:1.01,assetIds:['a','b','c']},30);
  assert.equal(slots.reduce((sum,slot)=>sum+slot.frames,0),30);
  for(let i=1;i<slots.length;i++)assert.equal(slots[i].from,slots[i-1].from+slots[i-1].frames);
  const data=fixture();data.scenes[0].seconds=.001;
  assert.throws(()=>parseEpisode(data),/no frames/);
});

test('CLI rejects unsupported or incomplete options',()=>{
  assert.throws(()=>parseArgs(['--format','square']),/Format/);
  assert.throws(()=>parseArgs(['--episode']),/Missing value/);
  assert.throws(()=>parseArgs(['--sample','NaN']),/Sample/);
  assert.throws(()=>parseArgs(['--unknown']),/Unknown/);
  assert.equal(parseArgs(['--sample','8','--format','landscape']).sample,8);
});
