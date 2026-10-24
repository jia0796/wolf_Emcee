import {BOARDS,ROLE_DATA} from './data.js';
import {createGame} from './engine.js';

// Consume only the owner-authorized, committed server deal. Never shuffle here.
export function createDealtGame(config,receipt){
 const board=BOARDS[config.boardId];
 if(!board||receipt.boardId!==config.boardId||receipt.status!=='dealt'||!receipt.dealId||!Array.isArray(receipt.hostRoles)||receipt.hostRoles.length!==board.playerCount)throw Error('發牌身分尚未完整同步，請重新連線');
 const seen=new Set(),counts={};
 for(const {seat,role} of receipt.hostRoles){if(!Number.isInteger(seat)||seat<1||seat>board.playerCount||seen.has(seat)||!ROLE_DATA[role])throw Error('發牌身分資料不一致');seen.add(seat);counts[role]=(counts[role]||0)+1;}
 if(JSON.stringify(Object.entries(counts).sort())!==JSON.stringify(Object.entries(board.roles).sort()))throw Error('發牌角色配置不一致');
 const game=createGame(config.boardId,config.rules);for(const p of game.players)if(p.active)p.role=receipt.hostRoles.find(r=>r.seat===p.id).role;
 game.rolesConfirmed=true;return game;
}

// The recap renderer needs these fields, not the host's nested undo snapshots.
const recapKeys=['version','recapVersion','legacyRecap','boardId','step','night','players','winner','winnerReason','nightRecords','dayEvents','nightState','nightResolution','infection','gargoyle','mechanical','blood','awb'];
export function recapSnapshot(game){
 if(game?.step!=='finished'||!game.winner)throw Error('尚未正式終局');
 const snapshot=Object.fromEntries(recapKeys.filter(k=>game[k]!==undefined).map(k=>[k,structuredClone(game[k])]));
 return validateRecap(snapshot);
}
export function validateRecap(snapshot){
 const b=BOARDS[snapshot?.boardId];
 if(!b||snapshot.step!=='finished'||!['好人陣營','狼人陣營'].includes(snapshot.winner)||!Array.isArray(snapshot.players)||snapshot.players.length!==12||!Array.isArray(snapshot.nightRecords)||!Array.isArray(snapshot.dayEvents))throw Error('復盤資料尚未完整同步');
 const ids=new Set();for(const p of snapshot.players){if(!Number.isInteger(p.id)||p.id<1||p.id>12||ids.has(p.id)||typeof p.active!=='boolean'||p.active!==(p.id<=b.playerCount)||typeof p.alive!=='boolean'||p.active&&!ROLE_DATA[p.role])throw Error('復盤身分資料不一致');ids.add(p.id);}
 if(!Number.isInteger(snapshot.night)||snapshot.night<1)throw Error('復盤時間資料不一致');
 // Person artwork always comes from local approved assets, never a remote payload URL.
 const safe=structuredClone(snapshot);for(const record of [...safe.nightRecords,...safe.dayEvents]){
  const events=Array.isArray(record.events)?record.events:[record];for(const event of events)for(const key of ['actorSnapshots','targetSnapshots','rawTargetSnapshots'])if(Array.isArray(event[key]))event[key]=event[key].map(p=>p?{...p,image:ROLE_DATA[p.role]?.image||null}:p);
 }
 return safe;
}
