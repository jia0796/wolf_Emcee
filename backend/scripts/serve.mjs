import {spawn} from 'node:child_process';
import {resolve,dirname} from 'node:path';
import {docker} from './local-env.mjs';
const child=spawn(resolve('node_modules/@supabase/cli-windows-x64/bin/supabase.exe'),['functions','serve'],{
 env:{...process.env,PATH:dirname(docker)+';'+process.env.PATH},stdio:['ignore','pipe','pipe']});
// Do not persist runtime output: it can include local URLs/config details.
child.stdout.on('data',()=>{});child.stderr.on('data',()=>{});
child.on('spawn',()=>console.log('Local Edge function server started; output suppressed.'));
child.on('exit',code=>{console.log('Local Edge server exited',code);process.exit(code??1);});
process.on('SIGINT',()=>child.kill());
