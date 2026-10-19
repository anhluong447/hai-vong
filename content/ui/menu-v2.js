export const tabs=['cases','skills','equipment','team','map','settings'];
export const groups=['main','side','general'];
export {slots,branches} from '../gameplay/coastal-progression.js';
export const mapPlaces=[
  {id:'school',map:'yard',x:20,y:19,marker:'quest'},
  {id:'club',map:'newsroom',x:32,y:33,marker:'quest'},
  {id:'home',map:'home',x:22,y:70},
  {id:'library',map:'street',position:{x:14,y:10},x:48,y:31,marker:'quest'},
  {id:'shop',map:'street',position:{x:10,y:21},x:64,y:38},
  {id:'cafe',map:'street',position:{x:25,y:10},x:62,y:59,marker:'bond'},
  {id:'job',map:'street',position:{x:25,y:19},x:48,y:78,marker:'job'},
  {id:'waterfront',map:'street',position:{x:28,y:23},x:87,y:77}
];
export const motion={waveAmplitude:8,wavePeriod:12000,foliageDegrees:1.2,foliagePeriod:8200,particleCount:18};
