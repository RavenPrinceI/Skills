import React from 'react';
import {Composition, registerRoot} from 'remotion';
import conversation from '../conversation.json';
import {LiveTexts} from './LiveTexts';
import type {Story} from './LiveTexts';
import {durationFrames, FPS, validateStory} from './story.mjs';

const metadata = ({props}: {props: Story}) => {
  validateStory(props);
  return {durationInFrames: durationFrames(props)};
};
const Root = () => <>
  <Composition id="LiveTextsLinkedIn" component={LiveTexts} width={1080} height={1350} fps={FPS} durationInFrames={durationFrames(conversation)} defaultProps={conversation as Story} calculateMetadata={metadata}/>
  <Composition id="LiveTextsPortrait" component={LiveTexts} width={1080} height={1920} fps={FPS} durationInFrames={durationFrames(conversation)} defaultProps={conversation as Story} calculateMetadata={metadata}/>
</>;
registerRoot(Root);
