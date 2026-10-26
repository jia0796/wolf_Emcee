import {ROLE_DATA} from './data.js';
import {realWolf} from './identity.js';

// Presentation only. Never change saved skill IDs, marker order or event data.
export const SKILL_ART_V2 = {
  'wolf-attack':'icon-wolf-attack-v2.svg', antidote:'icon-antidote-v1.svg',
  poison:'icon-poison-v1.svg', inspect:'icon-inspect-v1.svg',
  'wolf-inspect':'icon-wolf-inspect-v2.svg', gun:'icon-gun-v1.svg',
  'wolf-gun':'icon-wolf-gun-v1.svg', 'role-model':'icon-role-model-v1.svg',
  charm:'icon-charm-v2.svg', heartbreak:'icon-heartbreak-v2.svg',
  duel:'icon-duel-v1.svg', swap:'icon-swap-v1.svg', shield:'icon-shield-v1.svg',
  sleep:'icon-sleep-v1.svg', gravekeeper:'icon-gravekeeper-v1.svg',
  'evil-knight-reflect':'icon-evil-knight-reflect-v1.svg', hunt:'icon-hunt-v1.svg',
  fear:'icon-fear-v2.svg', learn:'icon-learn-v1.svg',
  'blood-blade':'icon-blood-blade-v2.svg', 'revenge-blade':'icon-revenge-blade-v1.svg',
  transform:'icon-transform-v1.svg', infect:'icon-infect-v1.svg',
  trade:'icon-trade-v2.svg', mask:'icon-mask-v1.svg', dance:'icon-dance-v1.svg',
  bond:'icon-bond-v1.svg', 'wolf-king-bestow':'icon-wolf-king-bestow-v1.svg'
};
const legacyOnly = new Set(['sheriff-badge','vote']);
const fallbackSkill = {'wolf-gun':'gun','blood-blade':'wolf-attack','revenge-blade':'wolf-attack','wolf-king-bestow':'gun'};
export function skillArtSource(skill) {
  return Object.hasOwn(SKILL_ART_V2,skill) ? 'skills/v2/'+SKILL_ART_V2[skill] : legacyOnly.has(skill) ? 'skills/icon-'+skill+'.svg' : null;
}
export function applySkillArt(image,skill) {
  const source=skillArtSource(skill);if(!source)return image;
  image.src=source;
  image.onerror=source.startsWith('skills/v2/')?()=>{image.onerror=null;image.src='skills/icon-'+(fallbackSkill[skill]||skill)+'.svg';}:null;
  return image;
}
export function resolveSkillArt(skill,{key,type,actorRole,actorCamp,skillSource}={}) {
  if(skill==='wolf-attack') {
    if(key==='lastBlade'||type==='lastBlade')return 'blood-blade';
    if(key==='revenge'||type==='revenge')return 'revenge-blade';
  }
  const wolf=actorCamp!=null?actorCamp==='wolf':ROLE_DATA[actorRole]?.kind==='wolf';
  if(skill==='inspect'&&wolf)return 'wolf-inspect';
  if(skill==='gun'&&skillSource!=='lucky'&&wolf)return 'wolf-gun';
  return skill;
}
export function eventSkillArt(event) {
  const actor=event.actorSnapshots?.[0];
  return resolveSkillArt(event.skill,{key:event.key,type:event.type,actorRole:actor?.role||event.actorRole,
    actorCamp:actor?.camp,skillSource:event.displayRole==='lucky'?'lucky':event.skillSource});
}
export function operationSkillArt(skill,state) {
  const step=state.step;
  const role=skill==='gun'?state.players.find(p=>p.id===state.queue?.[0]?.id)?.role:
    ['mechanicalAction','mechanicalSkill'].includes(step)?'mechanical':
    ({inspect:'seer',mediumInspect:'medium',awakenedInspect:'awakenedSeer',luckyAction:state.players.find(p=>p.id===state.lucky?.seat)?.role})[step];
  const actor=state.players.find(p=>p.role===role);
  return resolveSkillArt(skill,{key:step,actorRole:role,actorCamp:actor?(realWolf(state,actor)?'wolf':ROLE_DATA[role]?.kind):undefined,
    skillSource:step==='luckyAction'||skill==='gun'&&state.operation==='lucky'?'lucky':state.operation});
}
export function markerSkillArt(marker,state) {
  const role=({mechanicalInspect:'mechanical',inspect:'seer',mediumInspect:'medium',luckyInspect:state.players.find(p=>p.id===state.lucky?.seat)?.role})[marker.key]||
    (marker.key?.startsWith('awakened')?'awakenedSeer':undefined);
  const actor=state.players.find(p=>p.role===role);
  return resolveSkillArt(marker.type,{key:marker.key,actorRole:role,actorCamp:actor?(realWolf(state,actor)?'wolf':ROLE_DATA[role]?.kind):undefined,
    skillSource:marker.key==='luckyInspect'?'lucky':undefined});
}
