import {createRequire} from 'node:module';
import {existsSync,readdirSync} from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const require=createRequire(import.meta.url);

export function mediaTool(name){
  const override=process.env[`${name.toUpperCase()}_PATH`];
  if(override)return override;
  const scope=path.dirname(path.dirname(require.resolve('@remotion/renderer/package.json')));
  const prefix=`compositor-${process.platform}-${process.arch}`;
  for(const item of readdirSync(scope).filter(item=>item.startsWith(prefix))){
    const executable=path.join(scope,item,`${name}${process.platform==='win32'?'.exe':''}`);
    if(existsSync(executable))return executable;
  }
  return name;
}

export function runMediaTool(name,args){
  const result=spawnSync(mediaTool(name),args,{encoding:'utf8',windowsHide:true,maxBuffer:8*1024*1024});
  if(result.error)throw new Error(`${name}: ${result.error.message}. Install it or set ${name.toUpperCase()}_PATH.`);
  if(result.status!==0)throw new Error(`${name}: ${result.stderr||`exit ${result.status}`}`);
  return result;
}

export function probeMedia(file){return JSON.parse(runMediaTool('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_name,codec_type,width,height,r_frame_rate','-of','json',file]).stdout);}
