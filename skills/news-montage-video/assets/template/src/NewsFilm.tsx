import React from 'react';
import {AbsoluteFill, Audio, Img, OffthreadVideo, Sequence, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {theme as t} from './theme';
import {assetSlots} from './schema.mjs';

type Source = {id:string; author:string; url:string};
type Asset = {id:string; path:string; kind:'image'|'video'; credit:string; label:string; sourceId:string; trimSeconds:number; fit:'cover'|'contain'; focalPoint?:{vertical:string;landscape:string}};
type Scene = {id:string; type:string; seconds:number; label:string; headline:string; body:string; footnote:string; assetIds:string[]; quote?:string; annotation?:string; summaryLabel?:string; attribution?:string; visualTitle?:string; visualFooter?:string; items?:{title:string;body:string}[]};
export type Episode = {id:string; title:string; series:string; date:string; version:string; fps:number; audio?:string; scenes:Scene[]; assets:Asset[]; sources:Source[]};
export type FilmProps = {episode:Episode; format:'vertical'|'landscape'};

const line:React.CSSProperties = {fontFamily:t.font, fontWeight:500, letterSpacing:3, fontSize:22};

function Grid() {
  return <AbsoluteFill style={{backgroundColor:t.background, backgroundImage:'linear-gradient(#ffffff04 1px, transparent 1px),linear-gradient(90deg,#ffffff04 1px,transparent 1px)',backgroundSize:'72px 72px'}}/>;
}

function Header({episode,wide}:{episode:Episode;wide:boolean}) {
  return <div style={{position:'absolute',left:wide?80:70,right:wide?80:100,top:wide?48:104,display:'flex',alignItems:'center',justifyContent:'space-between',...line}}>
    <div style={{display:'flex',alignItems:'center',gap:16}}><span style={{height:14,width:14,background:t.amber}}/>{episode.series}</div>
    <div style={{fontSize:18,color:t.muted}}>{episode.date}</div>
  </div>;
}

function Footer({episode,scene,index,wide}:{episode:Episode;scene:Scene;index:number;wide:boolean}) {
  return <div style={{position:'absolute',left:wide?80:70,right:wide?80:100,bottom:wide?50:170,borderTop:`1px solid ${t.line}`,paddingTop:22,display:'flex',gap:28,alignItems:'flex-start'}}>
    <div style={{color:t.amber,...line,fontSize:18,whiteSpace:'nowrap'}}>{String(index+1).padStart(2,'0')} / {String(episode.scenes.length).padStart(2,'0')}</div>
    <div style={{fontSize:wide?21:23,color:t.muted,lineHeight:1.4,flex:1}}>{scene.footnote}</div>
    <div style={{color:t.muted,...line,fontSize:16,whiteSpace:'nowrap'}}>{episode.version}</div>
  </div>;
}

function Copy({scene,wide,compact=false}:{scene:Scene;wide:boolean;compact?:boolean}) {
  const frame=useCurrentFrame();
  const enter=interpolate(frame,[0,14],[0,1],{extrapolateRight:'clamp'});
  return <div style={{opacity:enter,transform:`translateY(${(1-enter)*22}px)`}}>
    <div style={{...line,color:t.amber,marginBottom:30,fontSize:wide?21:23}}>{scene.label}</div>
    <div style={{whiteSpace:'pre-line',fontSize:wide?(compact?76:104):(compact?78:96),fontWeight:650,letterSpacing:-3.5,lineHeight:1.02,marginBottom:wide?32:38}}>{scene.headline}</div>
    <div style={{fontSize:wide?(compact?30:34):35,lineHeight:1.42,color:t.muted,maxWidth:wide?860:820}}>{scene.body}</div>
  </div>;
}

function EvidenceMedia({scene,asset,frames,wide}:{scene:Scene;asset:Asset;frames:number;wide:boolean}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const scale=asset.fit==='contain'?1:interpolate(frame,[0,frames],[1,1.045]);
  const mediaStyle:React.CSSProperties={height:'100%',width:'100%',objectFit:asset.fit,objectPosition:asset.focalPoint?.[wide?'landscape':'vertical']??'50% 50%'};
  return <div style={{position:'relative',height:'100%',width:'100%',overflow:'hidden',background:'#202724',border:`1px solid ${t.line}`}}>
    <div style={{position:'absolute',inset:0,transform:`scale(${scale})`}}>
      {asset.kind==='video'?<OffthreadVideo src={staticFile(asset.path)} muted trimBefore={Math.round(asset.trimSeconds*fps)} style={mediaStyle}/>:<Img src={staticFile(asset.path)} style={mediaStyle}/>}
    </div>
    <div style={{position:'absolute',inset:0,background:'linear-gradient(0deg,#000b,transparent 28%)'}}/>
    <div style={{position:'absolute',top:24,left:24,right:24,padding:'12px 16px',background:t.background,color:t.amber,...line,fontSize:18,lineHeight:1.4}}>{asset.label}</div>
    <div style={{position:'absolute',bottom:26,left:26,right:26,fontSize:wide?17:20,lineHeight:1.4,letterSpacing:1.4,color:'white'}}>{asset.credit}</div>
    {scene.annotation?<div style={{position:'absolute',right:28,top:100,border:`2px solid ${t.amber}`,padding:'10px 18px',fontSize:20,color:t.amber,background:'#101415e8'}}>{scene.annotation}</div>:null}
  </div>;
}

function Evidence({scene,episode,wide}:{scene:Scene;episode:Episode;wide:boolean}) {
  const slots=assetSlots(scene,episode.fps);
  return <div style={{height:'100%',position:'relative'}}>{slots.map((slot:{id:string;from:number;frames:number},index:number)=>{
    const asset=episode.assets.find(item=>item.id===slot.id)!;
    return <Sequence key={`${slot.id}-${index}`} from={slot.from} durationInFrames={slot.frames} layout="none"><EvidenceMedia scene={scene} asset={asset} frames={slot.frames} wide={wide}/></Sequence>;
  })}</div>;
}

function Mechanism({scene,wide}:{scene:Scene;wide:boolean}) {
  const frame=useCurrentFrame();
  const {fps}=useVideoConfig();
  const steps=(scene.items??[]).map((item,i)=>[String(i+1).padStart(2,'0'),item.title,item.body]);
  return <div style={{display:'flex',flexDirection:wide?'row':'column',gap:wide?20:22,height:'100%',justifyContent:'center',alignItems:wide?'center':'stretch'}}>
    {steps.map(([n,title,body],i)=>{
      const active=frame>=i*scene.seconds*fps/Math.max(steps.length,1)*.6;
      return <div key={n} style={{flex:wide?1:undefined,height:wide?380:undefined,display:'flex',flexDirection:wide?'column':'row',alignItems:wide?'flex-start':'center',gap:wide?24:30,padding:wide?'40px 32px':'28px 34px',border:`1px solid ${active?t.amber:t.line}`,background:active?'#21251d':t.panel,opacity:active?1:.4}}>
        <div style={{fontSize:wide?66:56,color:t.amber,fontWeight:300}}>{n}</div>
        <div><div style={{...line,fontSize:wide?25:27,marginBottom:12}}>{title}</div><div style={{fontSize:wide?26:28,color:t.muted,lineHeight:1.35}}>{body}</div></div>
      </div>;
    })}
  </div>;
}

function Statement({scene,wide}:{scene:Scene;wide:boolean}) {
  return <div style={{height:'100%',borderTop:`2px solid ${t.amber}`,borderBottom:`1px solid ${t.line}`,padding:wide?'40px 20px':'42px 20px',display:'flex',flexDirection:'column',justifyContent:'center'}}>
    <div style={{...line,color:t.amber,marginBottom:28,fontSize:20}}>{scene.summaryLabel??'SOURCE SUMMARY'}</div>
    <div style={{fontSize:wide?48:57,lineHeight:1.16,fontWeight:400,letterSpacing:-1.5}}>{scene.quote}</div>
    <div style={{color:t.muted,fontSize:23,marginTop:32}}>{scene.attribution??'Editorial summary · see the cited source'}</div>
  </div>;
}

function Scope({scene,wide}:{scene:Scene;wide:boolean}) {
  const items=(scene.items??[]).map(item=>[item.title,item.body]);
  return <div style={{display:'flex',flexDirection:'column',justifyContent:'center',height:'100%'}}>{items.map(([title,body])=><div key={title} style={{padding:wide?'28px 0':'32px 0',borderTop:`1px solid ${t.line}`}}><div style={{...line,color:t.amber,fontSize:20,marginBottom:12}}>{title}</div><div style={{fontSize:wide?36:41,lineHeight:1.15}}>{body}</div></div>)}</div>;
}

function Closing({scene,wide}:{scene:Scene;wide:boolean}) {
  return <div style={{display:'flex',height:'100%',flexDirection:'column',justifyContent:'center',gap:wide?25:30}}>
    <div style={{fontSize:wide?105:142,letterSpacing:-6,color:t.amber,fontWeight:300,lineHeight:1}}>{scene.visualTitle??'SOURCES'}</div>
    <div style={{height:2,background:t.amber,width:100}}/>
    <div style={{fontSize:wide?26:29,color:t.muted,lineHeight:1.7}}>{(scene.items??[]).map(item=><div key={item.title}>{item.title}<span style={{fontSize:22}}> {item.body}</span></div>)}</div>
    <div style={{...line,color:t.amber,fontSize:20}}>{scene.visualFooter??'LINKS IN THE ACCOMPANYING POST'}</div>
  </div>;
}

function NewsScene({episode,scene,index,wide}:{episode:Episode;scene:Scene;index:number;wide:boolean}) {
  let visual:React.ReactNode;
  if(scene.assetIds.length) visual=<Evidence episode={episode} scene={scene} wide={wide}/>;
  else if(scene.type==='mechanism') visual=<Mechanism scene={scene} wide={wide}/>;
  else if(scene.type==='statement'||scene.type==='hook') visual=<Statement scene={scene} wide={wide}/>;
  else if(scene.type==='scope') visual=<Scope scene={scene} wide={wide}/>;
  else visual=<Closing scene={scene} wide={wide}/>;
  return <AbsoluteFill style={{fontFamily:t.font,color:t.paper}}>
    <Grid/>
    <Header episode={episode} wide={wide}/>
    {wide?<div style={{position:'absolute',left:80,right:80,top:164,bottom:170,display:'grid',gridTemplateColumns:scene.type==='mechanism'?'0.9fr 1.2fr':'0.9fr 1.05fr',gap:72,alignItems:'center'}}>
      <Copy scene={scene} wide compact/>
      <div style={{height:scene.assetIds.length?690:620,minWidth:0}}>{visual}</div>
    </div>:<>
      <div style={{position:'absolute',left:70,right:100,top:235}}><Copy scene={scene} wide={false} compact={scene.type==='detail'||scene.type==='statement'}/></div>
      <div style={{position:'absolute',left:70,right:100,top:scene.assetIds.length?775:800,height:scene.assetIds.length?790:720}}>{visual}</div>
    </>}
    <Footer episode={episode} scene={scene} index={index} wide={wide}/>
  </AbsoluteFill>;
}

export function NewsFilm({episode,format}:FilmProps) {
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  let start=0;
  return <AbsoluteFill style={{background:t.background}}>
    <style>{'*{box-sizing:border-box}'}</style>
    {episode.audio?<Audio src={staticFile(episode.audio)} volume={.65}/>:null}
    {episode.scenes.map((scene,index)=>{
      const from=start;
      const duration=Math.round(scene.seconds*episode.fps);
      start+=duration;
      return <Sequence key={scene.id} from={from} durationInFrames={duration}><NewsScene episode={episode} scene={scene} index={index} wide={format==='landscape'}/></Sequence>;
    })}
    <div style={{position:'absolute',bottom:0,left:0,height:5,width:`${100*frame/(durationInFrames-1)}%`,background:t.amber}}/>
  </AbsoluteFill>;
}
