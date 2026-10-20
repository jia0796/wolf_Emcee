import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
export const docker=resolve(process.env.LOCALAPPDATA,'Programs/DockerDesktop/resources/bin/docker.exe');
export function localConfig(){
 // Capture in memory ONLY. CLI status includes credentials: never print/store it.
 const cli=resolve('node_modules/@supabase/cli-windows-x64/bin/supabase.exe');
 const env={...process.env,PATH:resolve(docker,'..')+';'+process.env.PATH};
 const config=JSON.parse(execFileSync(cli,['status','-o','json'],{env,encoding:'utf8',stdio:['ignore','pipe','pipe']}));
 for(const k of ['API_URL','DB_URL']){
  if(!config[k]||!['127.0.0.1','localhost'].includes(new URL(config[k]).hostname))
   throw Error('Refusing non-loopback environment');
 }
 return config;
}
