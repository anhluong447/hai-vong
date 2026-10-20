import {test,assert as a} from './harness.js';
import {menuLayout} from '../content/ui/menu-layout-data.js';
import {menuLayoutRegions,menuLayoutContract} from '../content/ui/menu-layout-regions.js';
import {validateMenuLayout} from '../src/shared/validateMenuLayout.js';

const clone=value=>JSON.parse(JSON.stringify(value));
function fixtureCandidate(fixture){
 const candidate=clone(menuLayout);
 const at=path=>{const keys=path.split('.'),key=keys.pop();return [keys.reduce((node,part)=>node[part],candidate),key];};
 for(const [path,value] of Object.entries(fixture.set??{})){const [node,key]=at(path);node[key]=value;}
 for(const path of fixture.remove??[]){const [node,key]=at(path);delete node[key];}
 for(const [path,value] of Object.entries(fixture.nonFinite??{})){const [node,key]=at(path);node[key]=Number(value);}
 return candidate;
}

test('menu layout: shared contract fixtures reject invalid imports before replacement',async()=>{
 const response=await fetch(new URL('./fixtures/menu-layout-validation.json',import.meta.url));
 a.ok(response.ok,'Validation fixtures must load');
 const fixtures=await response.json();
 for(const fixture of fixtures.cases){
  const candidate=fixtureCandidate(fixture);
  if(fixture.valid){a.equal(JSON.stringify(validateMenuLayout(candidate)),JSON.stringify(candidate));continue;}
  let error;try{validateMenuLayout(candidate);}catch(caught){error=caught;}
  a.ok(error instanceof TypeError,fixture.name);
  a.ok(error.message.includes(fixture.errorPath),`${fixture.name}: ${error.message}`);
 }
});

test('menu layout: validated imports own every nested field independently',()=>{
 const candidate=clone(menuLayout),validated=validateMenuLayout(candidate);
 validated.regions.resources.x=123;validated.stage.width=1;
 a.equal(candidate.regions.resources.x,45);a.equal(candidate.stage.width,1672);
 candidate.regions.content.width=800;a.equal(validated.regions.content.width,1200);
});

test('menu layout: malformed roots and inherited fields cannot supply contract values',()=>{
 for(const candidate of [null,[],true,1,'layout',Object.create(menuLayout)]){
  let failed=false;try{validateMenuLayout(candidate);}catch(error){failed=error instanceof TypeError;}
  a.ok(failed,'Expected malformed import rejection');
 }
});

test('menu layout: generated descriptors match the compiled data allowlist',()=>{
 a.equal(menuLayoutContract.schemaVersion,menuLayout.schemaVersion);
 a.equal(menuLayoutRegions,menuLayoutContract.regions);
 a.equal(JSON.stringify(menuLayoutRegions.map(region=>region.id)),JSON.stringify(Object.keys(menuLayout.regions)));
 for(const region of menuLayoutRegions){
  a.equal(JSON.stringify(Object.keys(region.fields)),JSON.stringify(Object.keys(menuLayout.regions[region.id])));
  for(const field of Object.values(region.fields))a.ok(/^--ml-[a-z-]+$/.test(field.css));
 }
});
