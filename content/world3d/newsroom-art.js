// Small procedural asset recipes. Mesh construction consumes these meter units.
const box=(material,size,position,extra={})=>({kind:'box',args:size,material,position,...extra});
const cylinder=(material,args,position,extra={})=>({kind:'cylinder',args,material,position,...extra});
const sphere=(material,radius,position,extra={})=>({kind:'sphere',args:[radius,8,5],material,position,...extra});
const books=Array.from({length:8},(_,i)=>box(i%2?'bookRed':'bookBlue',[.12,.3+(i%3)*.05,.24],[-.65+i*.18,.95,-.13],{rotation:[0,0,(i%3-1)*.04]}));
const desk=[box('woodLight',[2.2,.12,1.1],[0,.83,0]),box('woodDark',[1.9,.18,.08],[0,.65,-.4]),...[-.93,.93].flatMap(x=>[-.4,.4].map(z=>box('woodDark',[.09,.77,.09],[x,.385,z]))),box('paper',[.38,.018,.29],[-.4,.9,.06],{rotation:[0,.15,0]}),box('tealDark',[.42,.06,.31],[.25,.92,-.18]),cylinder('terra',[.07,.06,.13,8],[.77,.95,.21]),box('ink',[.22,.025,.06],[-.15,.91,.24],{rotation:[0,.2,0]})];
const chair=[box('teal',[.53,.1,.52],[0,.47,0]),box('teal',[.53,.45,.08],[0,.76,-.23]),...[-.21,.21].flatMap(x=>[-.2,.2].map(z=>box('woodDark',[.065,.43,.065],[x,.215,z])))];
const shelf=[box('woodDark',[1.85,2.0,.12],[0,1,-.27]),...[-.93,.93].map(x=>box('wood',[.09,2,.65],[x,1,0])),...[.08,.72,1.36,1.95].map(y=>box('woodLight',[1.85,.07,.65],[0,y,0])),...books.map(p=>({...p,position:[p.position[0],p.position[1]-.21,p.position[2]]})),...books.slice(0,6).map(p=>({...p,position:[p.position[0],p.position[1]+.43,p.position[2]]}))];
const plant=[cylinder('terra',[.23,.17,.37,9],[0,.185,0]),cylinder('woodDark',[.2,.2,.03,9],[0,.38,0]),...Array.from({length:7},(_,i)=>{const angle=i*Math.PI*2/7;return sphere(i%2?'leaf':'leafLight',.22,[Math.sin(angle)*.19,.67+(i%2)*.13,Math.cos(angle)*.19],{scale:[.55,1.75,.55],rotation:[Math.cos(angle)*.55,angle,Math.sin(angle)*.55]});})];
const lamp=[cylinder('ink',[.23,.26,.055,12],[0,.0275,0]),cylinder('gold',[.025,.025,1.7,8],[0,.87,0]),cylinder('cream',[.2,.38,.4,10],[0,1.65,0]),sphere('lamp',.1,[0,1.48,0],{castShadow:false})];
const board=[box('wood',[2.1,1.25,.1],[0,1.65,0]),box('tealDark',[1.94,1.09,.025],[0,1.65,.065]),...[-.55,0,.55].map((x,i)=>box('paper',[.4,.53,.02],[x,1.7+i%2*.08,.09],{rotation:[0,0,(i-1)*.06]}))];
const room=[
 box('woodDark',[12.45,.22,10.45],[0,-.16,0]),
 ...Array.from({length:25},(_,i)=>box(i%3?'woodLight':'wood',[.47,.04,10],[i*.48-5.76,-.02,0])),
 box('wall',[.2,2.8,10.2],[-6.1,1.4,0]),box('cream',[.08,.16,10],[-5.97,.1,0]),
 box('wall',[12.2,.85,.2],[0,.425,-5.1]),box('wall',[12.2,.38,.2],[0,2.61,-5.1]),
 ...[-6,-1.3,2.9,6].map(x=>box('wall',[.22,1.6,.2],[x,1.65,-5.1])),
 ...[[-3.65,4.4],[.8,3.9],[4.45,2.8]].flatMap(([x,w])=>[
  box('sky',[w,1.6,.04],[x,1.65,-5.08],{castShadow:false}),box('woodLight',[w+.12,.12,.38],[x,.85,-4.96]),
  box('cream',[.065,1.6,.075],[x,1.65,-4.99]),box('cream',[w,.055,.075],[x,1.65,-4.99])]),
 box('cream',[12.2,.14,.12],[0,2.85,-5.1]),
 box('rug',[4.5,.012,2.8],[0,.008,1.7],{castShadow:false}),
 box('mint',[4.3,.013,.035],[0,.011,.4],{castShadow:false}),box('mint',[4.3,.013,.035],[0,.011,3],{castShadow:false}),
 // Stylized sunlight patches are physical geometry, not an image backdrop.
 ...[-3.4,.9,4.4].map(x=>box('paper',[1.4,.005,1.9],[x,.012,-3.3],{rotation:[0,-.3,0],castShadow:false})),
 box('wood',[.12,.08,10.4],[-6.17,2.85,0]),
 box('tealDark',[.09,.25,1.4],[-5.96,1.4,1.4]),
 box('paper',[.015,.58,.43],[-5.9,1.43,1.4],{castShadow:false})
];
const rig=[
 {id:'body',position:[0,0,0],parts:[box('shirt',[.43,.52,.25],[0,.96,0]),box('pants',[.36,.16,.24],[0,.65,0]),box('skin',[.12,.12,.12],[0,1.265,0])]},
 {id:'head',position:[0,0,0],parts:[box('skin',[.29,.31,.28],[0,1.415,0]),box('hair',[.34,.18,.31],[0,1.56,-.015]),box('hair',[.32,.2,.08],[0,1.43,-.14]),...[-.07,.07].map(x=>box('ink',[.028,.025,.012],[x,1.44,.145]))]},
 ...[-1,1].map((sign,i)=>({id:sign<0?'arm-left':'arm-right',position:[sign*.3,1.17,0],animated:true,phase:i?Math.PI:0,parts:[box('shirt',[.14,.39,.17],[0,-.17,0]),sphere('skin',.067,[0,-.41,0])]})),
 ...[-1,1].map((sign,i)=>({id:sign<0?'leg-left':'leg-right',position:[sign*.12,.61,0],animated:true,phase:i?0:Math.PI,parts:[box('pants',[.16,.47,.18],[0,-.22,0]),box('shoes',[.18,.14,.28],[0,-.54,.04])]}))
];
export const newsroomArt={room,recipes:{desk,chair,bookshelf:shelf,plant,lamp,board},rig};
