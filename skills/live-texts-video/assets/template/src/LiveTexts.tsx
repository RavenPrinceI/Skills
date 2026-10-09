import React, {useLayoutEffect, useMemo, useRef, useState} from 'react';
import {AbsoluteFill, Audio, Img, Sequence, continueRender, delayRender, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {activeTyping, FPS, profileAt} from './story.mjs';

type Profile = {contact: string; initials: string; handle?: string; avatar?: string};
type Message = {at: number; side: 'sent' | 'received' | 'system'; text?: string; image?: string; imageAlt?: string; imageFit?: 'contain' | 'cover'; typing?: number; readAfter?: number; profileUpdate?: Profile};
export type Story = Profile & {headline?: string; clock: string; dateLabel: string; accentColor: string; showKeyboard: boolean; sound: boolean; endHold: number; messages: Message[]};
const ease = (value: number) => 1 - Math.pow(1 - Math.max(0, Math.min(1, value)), 4);
const font = 'Arial, "Segoe UI Emoji", sans-serif';
const frameAt = (seconds: number) => Math.round(seconds * FPS);

function Dots({frame}: {frame: number}) {
  return <div style={{display: 'flex', gap: 4, padding: '12px 13px', borderRadius: 18, background: '#e9e9eb', width: 52}}>
    {[0, 1, 2].map(i => <div key={i} style={{width: 6, height: 6, borderRadius: '50%', background: '#959599', opacity: 0.45 + 0.5 * (0.5 + 0.5 * Math.sin(frame / 5 - i * 1.2)), transform: `translateY(${-1.8 * Math.max(0, Math.sin(frame / 5 - i * 1.2))}px)`}} />)}
  </div>;
}

function Bubble({message, color}: {message: Message; color: string}) {
  if (message.side === 'system') return <div style={{maxWidth: 340, padding: '8px 12px', borderRadius: 12, fontSize: 12, lineHeight: '17px', color: '#62626b', background: '#f2f2f5', textAlign: 'center'}}>{message.text}</div>;
  const sent = message.side === 'sent';
  return <div style={{maxWidth: 292, width: message.image ? 248 : 'max-content', borderRadius: 18, borderBottomRightRadius: sent ? 5 : 18, borderBottomLeftRadius: sent ? 18 : 5, background: message.image ? '#ede9e2' : sent ? color : '#e9e9eb', color: sent ? '#ffffff' : '#161618', overflow: 'hidden'}}>
    {message.image ? <Img src={staticFile(message.image)} alt={message.imageAlt ?? 'Photo attachment'} style={{width: 248, height: 186, objectFit: message.imageFit ?? 'cover', display: 'block'}} /> : <div style={{padding: '8px 12px', fontSize: 17, lineHeight: '21px', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere'}}>{message.text}</div>}
  </div>;
}

function Keyboard({character, active}: {character?: string; active: boolean}) {
  const rows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];
  return <div style={{height: 210, flexShrink: 0, background: '#d2d5db', padding: '0 4px', boxSizing: 'border-box'}}>
    <div style={{display: 'flex', height: 33, alignItems: 'center', justifyContent: 'space-around', color: '#383a40', fontSize: 14}}><span>I</span><span style={{borderLeft: '1px solid #bcc0c6', borderRight: '1px solid #bcc0c6', width: '34%', textAlign: 'center'}}>The</span><span>I'm</span></div>
    {rows.map((row, rowIndex) => <div key={row} style={{display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 7}}>
      {rowIndex === 2 && <div style={{...keyStyle, background: '#afb4bf', width: 42, marginRight: 8}}>⇧</div>}
      {[...row].map(letter => <div key={letter} style={{...keyStyle, background: active && character?.toUpperCase() === letter ? '#aab6c9' : '#fcfcfd'}}>{letter}</div>)}
      {rowIndex === 2 && <div style={{...keyStyle, background: '#afb4bf', width: 42, marginLeft: 8, fontSize: 18}}>⌫</div>}
    </div>)}
    <div style={{display: 'flex', gap: 6, height: 32}}><div style={{...keyStyle, width: 86, background: '#afb4bf', fontSize: 14}}>123</div><div style={{...keyStyle, flex: 1, fontSize: 14}}>space</div><div style={{...keyStyle, width: 86, background: '#afb4bf', fontSize: 14}}>return</div></div>
  </div>;
}
const keyStyle: React.CSSProperties = {width: 33, height: 33, borderRadius: 4, background: '#fcfcfd', boxShadow: '0 1px 0 #969ba4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22};

export function LiveTexts(story: Story) {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const screenHeight = height / (width / 390);
  const time = frame / FPS;
  const profile = profileAt(story, time) as Profile;
  const rows = useRef<Array<HTMLDivElement | null>>([]);
  const [heights, setHeights] = useState<number[]>([]);
  const [ready] = useState(() => delayRender('Measure conversation bubbles'));
  const signature = JSON.stringify(story.messages);
  useLayoutEffect(() => {
    setHeights(rows.current.slice(0, story.messages.length).map(row => row?.offsetHeight ?? 0));
    continueRender(ready);
  }, [signature, ready]);
  const viewportHeight = screenHeight - (story.headline ? 62 : 34) - 70 - 56 - (story.showKeyboard ? 210 : 0) - 28;
  const typing = activeTyping(story, time) as Message | undefined;
  const positions = useMemo(() => {
    let top = 36;
    return story.messages.map((message, i) => {
      const y = top;
      top += (heights[i] ?? 45) + 9;
      return {y, bottom: top - 9};
    });
  }, [heights, signature]);
  // A single frame-derived camera makes seeking and parallel rendering deterministic.
  const scrollEvents = useMemo(() => {
    const events: Array<{at: number; target: number}> = [];
    story.messages.forEach((message, i) => {
      if (message.side === 'received' && message.typing) {
        const previousBottom = i ? positions[i - 1].bottom : 28;
        events.push({at: message.at - message.typing, target: Math.max(0, previousBottom + 46 - viewportHeight)});
      }
      events.push({at: message.at, target: Math.max(0, positions[i].bottom + 24 - viewportHeight)});
    });
    return events.sort((a, b) => a.at - b.at);
  }, [positions, signature, viewportHeight]);
  let lastAt = 0;
  let from = 0;
  let target = 0;
  for (const event of scrollEvents) {
    if (event.at > time) break;
    from = from + (target - from) * ease((event.at - lastAt) / 0.38);
    target = event.target;
    lastAt = event.at;
  }
  const scroll = from + (target - from) * ease((time - lastAt) / 0.38);
  const outgoing = typing?.side === 'sent' ? typing : undefined;
  const letters = Array.from(outgoing?.text ?? '');
  const typingProgress = outgoing ? Math.min(1, (time - outgoing.at + (outgoing.typing ?? 0)) / Math.max(0.01, (outgoing.typing ?? 0) * 0.87)) : 0;
  const typedCount = Math.floor(letters.length * typingProgress);
  const draft = letters.slice(0, typedCount).join('');
  const arrived = story.messages.map((m, i) => ({...m, index: i})).filter(m => time >= m.at);
  const latest = arrived.at(-1);
  const receipt = latest?.side === 'sent' ? (latest.readAfter !== undefined && time >= latest.at + latest.readAfter ? 'Read' : 'Delivered') : '';

  return <AbsoluteFill style={{background: '#fff', fontFamily: font}}>
    <div style={{width: 390, height: screenHeight, transform: `scale(${width / 390})`, transformOrigin: 'top left', display: 'flex', flexDirection: 'column', overflow: 'hidden', color: '#151518', background: '#fff'}}>
      {story.headline ? <div style={{height: 62, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 12px', boxSizing: 'border-box', background: '#f4f1eb', color: '#25241f', fontSize: 22, fontWeight: 700, letterSpacing: -0.7}}>{story.headline}</div> : <>
      <div style={{height: 34, padding: '10px 23px 0', display: 'flex', justifyContent: 'space-between', boxSizing: 'border-box', fontSize: 14, fontWeight: 700, flexShrink: 0}}><span>{story.clock}</span><div style={{display: 'flex', gap: 6, alignItems: 'center', height: 15}}><svg width="17" height="12" viewBox="0 0 17 12"><path d="M1 12V8H4V12ZM5 12V6H8V12ZM9 12V3H12V12ZM13 12V0H16V12Z" fill="currentColor"/></svg><svg width="16" height="12" viewBox="0 0 16 12"><path d="M1 3Q8 -2 15 3M3.5 6Q8 2 12.5 6M6 9Q8 7 10 9" fill="none" stroke="currentColor" strokeWidth="2"/><circle cx="8" cy="11" r="1"/></svg><div style={{width: 23, height: 10, border: '1px solid #85858a', borderRadius: 3, padding: 1}}><div style={{width: '85%', height: '100%', background: '#232326', borderRadius: 1}}/></div></div></div>
      </>}
      <div style={{height: 70, position: 'relative', flexShrink: 0, borderBottom: '1px solid #e5e5e9', background: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4}}>
        <div style={{position: 'absolute', left: 17, top: 23, color: story.accentColor, fontSize: 33, lineHeight: '25px'}}>‹</div>
        <div style={{width: 35, height: 35, borderRadius: '50%', background: '#a4a7af', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, overflow: 'hidden', flexShrink: 0}}>{profile.avatar ? <Img src={staticFile(profile.avatar)} alt={profile.contact} style={{width: 35, height: 35, objectFit: 'cover', objectPosition: '50% 30%'}}/> : profile.initials.slice(0, 2)}</div>
        <div style={{fontSize: 12, maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis'}}>{profile.contact} <span style={{color: '#a2a2a7'}}>›</span></div>
        {profile.handle && <div style={{fontSize: 9, lineHeight: '10px', color: '#777780', marginTop: -3}}>{profile.handle}</div>}
        <svg style={{position: 'absolute', right: 20, top: 28}} width="25" height="18" viewBox="0 0 25 18"><rect width="17" height="18" rx="4" fill={story.accentColor}/><path d="M18 5L25 1V17L18 13Z" fill={story.accentColor}/></svg>
      </div>
      <div style={{height: viewportHeight, overflow: 'hidden', position: 'relative', flexShrink: 0}}>
        <div style={{position: 'absolute', inset: 0, transform: `translateY(${-scroll}px)`}}>
          <div style={{position: 'absolute', top: 14, width: '100%', fontSize: 11, color: '#89898f', textAlign: 'center'}}>{story.dateLabel}</div>
          {story.messages.map((message, i) => {
            const progress = ease((time - message.at) / 0.3);
            return <div key={i} style={{position: 'absolute', top: positions[i].y, left: 13, right: 13, opacity: time >= message.at ? progress : 0, display: 'flex', justifyContent: message.side === 'system' ? 'center' : message.side === 'sent' ? 'flex-end' : 'flex-start', transform: `translateY(${(1 - progress) * 13}px) scale(${0.95 + progress * 0.05})`, transformOrigin: message.side === 'sent' ? 'right bottom' : 'left bottom'}}>
              <div ref={el => {rows.current[i] = el;}}><Bubble message={message} color={story.accentColor}/></div>
            </div>;
          })}
          {typing?.side === 'received' && <div style={{position: 'absolute', top: latest ? positions[latest.index].bottom + 9 : 36, left: 13}}><Dots frame={frame}/></div>}
          {latest && receipt && <div style={{position: 'absolute', top: positions[latest.index].bottom + 5, right: 16, fontSize: 10, color: '#909097'}}>{receipt}</div>}
        </div>
      </div>
      <div style={{height: 56, padding: '8px 12px', display: 'flex', alignItems: 'center', gap: 10, boxSizing: 'border-box', flexShrink: 0, background: '#fafafa', borderTop: '1px solid #f2f2f5'}}>
        <div style={{width: 27, height: 27, borderRadius: '50%', background: '#e8e8ed', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#82828a', fontSize: 26, fontWeight: 300}}>+</div>
        <div style={{height: 36, border: '1px solid #d7d7dc', borderRadius: 20, flex: 1, padding: '0 5px 0 12px', display: 'flex', alignItems: 'center', minWidth: 0, overflow: 'hidden'}}>
          <div style={{flex: 1, minWidth: 0, fontSize: 15, color: outgoing ? '#161618' : '#a0a0a7', overflow: 'hidden', whiteSpace: 'nowrap', textAlign: draft.length > 31 ? 'right' : 'left'}}>{outgoing?.image ? 'Photo ready to send' : draft || 'Message'}{outgoing && <span style={{borderRight: `1.5px solid ${story.accentColor}`, marginLeft: 1, opacity: frame % 30 < 20 ? 1 : 0}}/>}</div>
          {outgoing ? <div style={{height: 26, width: 26, borderRadius: '50%', background: story.accentColor, color: '#fff', textAlign: 'center', lineHeight: '25px', marginLeft: 5, fontSize: 23}}>↑</div> : <svg width="18" height="22" viewBox="0 0 18 22" style={{marginLeft: 5}}><rect x="6" y="2" width="6" height="12" rx="3" fill="#a4a4ab"/><path d="M3 10V12A6 6 0 0 0 15 12V10M9 18V21M6 21H12" fill="none" stroke="#a4a4ab" strokeWidth="1.5"/></svg>}
        </div>
      </div>
      {story.showKeyboard && <Keyboard character={letters[typedCount - 1]} active={!!outgoing && typingProgress < 1}/>}
      <div style={{flex: 1, minHeight: 28, background: story.showKeyboard ? '#d2d5db' : '#fafafa', position: 'relative'}}><div style={{position: 'absolute', bottom: 7, width: 124, height: 4, borderRadius: 5, background: '#171719', left: 133}}/></div>
    </div>
    {story.sound && story.messages.map((message, i) => message.side === 'system' ? null : <Sequence key={i} from={frameAt(message.at)} durationInFrames={15}><Audio src={staticFile(`audio/${message.side}.wav`)} volume={0.38}/></Sequence>)}
  </AbsoluteFill>;
}
