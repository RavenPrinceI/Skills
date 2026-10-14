import React from 'react';
import {Composition,registerRoot} from 'remotion';
import rawEpisode from '../episode.json';
import {NewsFilm} from './NewsFilm';
import {episodeSchema,durationFrames} from './schema.mjs';

const episode=episodeSchema.parse(rawEpisode);
function Root(){
  return <>{(['vertical','landscape'] as const).map(format=><Composition key={format} id={format==='vertical'?'NewsVertical':'NewsLandscape'} component={NewsFilm} width={format==='vertical'?1080:1920} height={format==='vertical'?1920:1080} fps={episode.fps} durationInFrames={durationFrames(episode)} defaultProps={{episode,format}} calculateMetadata={({props})=>{
    const data=episodeSchema.parse(props.episode);return {fps:data.fps,durationInFrames:durationFrames(data)};
  }}/>)}</>;
}
registerRoot(Root);
