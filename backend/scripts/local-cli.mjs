import {spawnSync} from 'node:child_process';
import {existsSync,writeFileSync} from 'node:fs';
import {resolve,dirname} from 'node:path';
import {docker} from './local-env.mjs';
const command=process.argv[2];
const choices={start:['start'],stop:['stop'],reset:['db','reset','--local','--yes'],dbtest:['test','db'],advisors:['db','lint','--local']};
if(!choices[command]||existsSync('supabase/.temp/project-ref'))throw Error('Refusing unsupported or linked operation');
const result=spawnSync(resolve('node_modules/@supabase/cli-windows-x64/bin/supabase.exe'),choices[command],{
 encoding:'utf8',env:{...process.env,PATH:dirname(docker)+';'+process.env.PATH},maxBuffer:16*1024*1024});
// Filter rather than dump status: CLI output contains generated local keys.
const lines=((result.stdout||'')+'\n'+(result.stderr||'')).split('\n')
 .filter(s=>/^(Starting|Waiting|Resetting|Recreating|Initialising|Applying migration|Seeding|Restarting|Finished|Stopped|Stopping|Checking|Linting|ERROR:|error:)/.test(s))
 .filter(s=>!/(key|secret|password|token|eyJ)/i.test(s));
const report={command:choices[command],exitCode:result.status,lines};
writeFileSync(`reports/cli-${command}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
process.exit(result.status??1);
