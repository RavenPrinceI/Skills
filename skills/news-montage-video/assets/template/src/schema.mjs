import {z} from 'zod';

const text=z.string().trim().min(1);
const relativePath=text.refine(value=>!value.startsWith('/')&&!/^[a-z]:/i.test(value)&&!value.includes('\\')&&!value.includes(':')&&!value.split('/').includes('..'),'Use a local path relative to public/');
export const episodeSchema=z.object({
  id:z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),title:text,series:text,date:text,version:text,
  fps:z.number().int().min(1).max(120),audio:relativePath.optional(),
  sources:z.array(z.object({id:text,title:text,author:text,url:z.string().url(),date:text,checked:text,status:z.enum(['primary','individual-report','repost','demo']),notes:text})),
  assets:z.array(z.object({id:text,path:relativePath,kind:z.enum(['image','video']),sourceId:text,incidentId:text,credit:text,label:text,
    reuseStatus:z.enum(['pending','cleared','reviewed-basis','owned']),reuseBasis:text.optional(),provenance:text,
    duration:z.number().positive().optional(),trimSeconds:z.number().nonnegative().default(0),fit:z.enum(['cover','contain']).default('contain'),
    focalPoint:z.object({vertical:text,landscape:text}).optional(),
  })),
  claims:z.array(z.object({id:text,text,sourceIds:z.array(text).min(1),status:z.enum(['attributed','reported','verified-scope']),uncertainty:text.optional()})),
  scenes:z.array(z.object({id:text,type:z.enum(['hook','montage','detail','mechanism','statement','scope','close']),seconds:z.number().positive(),label:text,headline:text,body:text,footnote:text,claimIds:z.array(text),assetIds:z.array(text),quote:text.optional(),annotation:text.optional(),summaryLabel:text.optional(),attribution:text.optional(),visualTitle:text.optional(),visualFooter:text.optional(),items:z.array(z.object({title:text,body:text})).max(3).optional()})).min(1),
});

export const durationFrames=episode=>episode.scenes.reduce((total,scene)=>total+Math.round(scene.seconds*episode.fps),0);

export function assetSlots(scene,fps){
  const total=Math.round(scene.seconds*fps),count=scene.assetIds.length;
  return scene.assetIds.map((id,index)=>{
    const from=Math.floor(index*total/count);
    return {id,from,frames:Math.floor((index+1)*total/count)-from};
  });
}

export function validateReferences(episode,{release=false}={}){
  for(const [label,items] of [['source',episode.sources],['asset',episode.assets],['claim',episode.claims],['scene',episode.scenes]]){
    if(new Set(items.map(item=>item.id)).size!==items.length)throw new Error(`Duplicate ${label} ID`);
  }
  const sources=new Set(episode.sources.map(s=>s.id)),assets=new Map(episode.assets.map(a=>[a.id,a])),claims=new Set(episode.claims.map(c=>c.id));
  for(const asset of episode.assets){
    if(!sources.has(asset.sourceId))throw new Error(`Unknown source on asset ${asset.id}`);
    if(asset.kind==='video'&&!asset.duration)throw new Error(`Measure video duration for ${asset.id}`);
    if(release&&(asset.reuseStatus==='pending'||(['cleared','reviewed-basis'].includes(asset.reuseStatus)&&!asset.reuseBasis)))throw new Error(`Unresolved reuse status/basis on ${asset.id}`);
  }
  for(const claim of episode.claims)if(claim.sourceIds.some(id=>!sources.has(id)))throw new Error(`Unknown source on claim ${claim.id}`);
  for(const scene of episode.scenes){
    if(Math.round(scene.seconds*episode.fps)<1)throw new Error(`Scene ${scene.id} has no frames`);
    if(scene.claimIds.some(id=>!claims.has(id)))throw new Error(`Unknown claim on scene ${scene.id}`);
    if(scene.assetIds.some(id=>!assets.has(id)))throw new Error(`Unknown asset on scene ${scene.id}`);
    if(['montage','detail'].includes(scene.type)&&!scene.assetIds.length)throw new Error(`Scene ${scene.id} needs media`);
    if(['hook','statement'].includes(scene.type)&&!scene.assetIds.length&&!scene.quote)throw new Error(`Scene ${scene.id} needs media or a summary`);
    if(['mechanism','scope','close'].includes(scene.type)&&!scene.items?.length)throw new Error(`Scene ${scene.id} needs items`);
    for(const slot of assetSlots(scene,episode.fps)){
      const asset=assets.get(slot.id);
      if(slot.frames<1)throw new Error(`Too many assets in scene ${scene.id}`);
      if(asset.kind==='video'&&Math.round(asset.trimSeconds*episode.fps)+slot.frames>Math.floor(asset.duration*episode.fps)+1)throw new Error(`Video ${asset.id} is too short for its slot in ${scene.id}`);
    }
  }
  return episode;
}

export function parseEpisode(data,options){return validateReferences(episodeSchema.parse(data),options);}
