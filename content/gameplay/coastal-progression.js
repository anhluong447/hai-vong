export const slots=['head','body','hand','feet','accessory1','accessory2'];
export const branches=['interview','investigation','photo','documents','empathy','courage'];
// Provisional progression data; these values can be tuned without changing views.
export const skillNodes=branches.flatMap((stat,column)=>Array.from({length:5},(_,rank)=>({
  id:`${stat}-${rank+1}`,stat,rank:rank+1,column,cost:1,bonus:.5,
  prerequisite:rank?`${stat}-${rank}`:null
})));
export const equipmentItems=[
  {id:'cap',slot:'head',stat:'investigation',bonus:1},
  {id:'shirt',slot:'body',stat:'courage',bonus:1},
  {id:'watch',slot:'hand',stat:'interview',bonus:1},
  {id:'shoes',slot:'feet',stat:'courage',bonus:1},
  {id:'notebook',slot:'accessory',stat:'empathy',bonus:1},
  {id:'recorder',slot:'accessory',stat:'interview',bonus:1},
  {id:'camera',slot:'accessory',stat:'photo',bonus:1}
];
