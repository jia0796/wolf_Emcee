import test from 'node:test';
import assert from 'node:assert/strict';
import {openingEligible} from '../public/b3-ui.js';
const fresh={navigation:'navigate',seen:null,previousScreen:null,screen:'home',roomLink:false,onlineRecovery:false,reduced:false,visible:true};
test('OPEN fresh home tab is eligible, without a cross-tab localStorage flag',()=>assert.equal(openingEligible(fresh),true));
for(const [name,patch]of Object.entries({reload:{navigation:'reload'},backForward:{navigation:'back_forward'},unknown:{navigation:undefined},seenTab:{seen:'seen'},restoredHome:{previousScreen:'home'},restoredHost:{screen:'host'},invite:{roomLink:true},onlineHost:{onlineRecovery:true},reduceMotion:{reduced:true},background:{visible:false},uncertain:{reliable:false}}))test('OPEN skips '+name,()=>assert.equal(openingEligible({...fresh,...patch}),false));
