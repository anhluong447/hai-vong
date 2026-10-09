// Concrete dialogue overlay. The stage owns resources, input and lifecycle.
export function drawDialogueUi(stage, svg, element) {
  const scene=stage.scene, prefix=stage.deskClipId;
  svg.dataset.uiOnly='true';
  svg.dataset.lighting=String(stage.lightingEnabled);
  const defs=element('defs',{},svg);
  const paperClip=prefix+'-paper';
  const clip=element('clipPath',{id:paperClip,clipPathUnits:'userSpaceOnUse'},defs);
  const paperTransform=`translate(${scene.paperBounds[0]} ${scene.paperBounds[1]})`;
  element('path',{d:stage.manifest.paperContour,transform:paperTransform},clip);
  stage.uiShadows={};
  for(const [name,profile] of Object.entries(scene.lighting.shadows)) {
    const id=prefix+'-shadow-'+name;
    const filter=element('filter',{id,x:'-20%',y:'-40%',width:'140%',height:'180%',
      'color-interpolation-filters':'sRGB'},defs);
    element('feDropShadow',{dx:profile.dx,dy:profile.dy,stdDeviation:profile.blur,
      'flood-color':profile.color,'flood-opacity':profile.opacity},filter);
    stage.uiShadows[name]=`url(#${id})`;
  }
  const gradient=(name,wash)=>{
    const id=prefix+'-'+name;
    const node=element('linearGradient',{id,x1:0,y1:0,x2:1,y2:1},defs);
    for(const [offset,color,opacity] of wash.stops) element('stop',{offset,'stop-color':color,'stop-opacity':opacity},node);
    return `url(#${id})`;
  };
  const paperWash=gradient('paper-wash',scene.lighting.paperWash);
  const noteWash=gradient('note-wash',scene.lighting.noteWash);
  const noteMask=prefix+'-notebook-alpha';
  const mask=element('mask',{id:noteMask,maskUnits:'userSpaceOnUse',x:0,y:0,width:1672,height:941,
    style:'mask-type:alpha'},defs);
  for(const art of scene.art.filter(item=>item.component==='notebook')) stage.image(mask,art.asset,art.bounds,art);
  for(const id of scene.layerOrder) stage.groups.set(id,element('g',{'data-layer':id},svg));
  const plane=id=>stage.groups.get(id);
  const context=element('g',{'data-context':'true','pointer-events':'none'},plane('scene'));
  if(stage.view==='stage') stage.image(context,scene.context.asset,scene.context.bounds);
  else {
    const backdrop=scene.backdrops[stage.view];
    let fill=backdrop.fill;
    if(backdrop.pattern) {
      const pattern=backdrop.pattern,id=prefix+'-backdrop';
      const tile=element('pattern',{id,width:pattern.size,height:pattern.size,patternUnits:'userSpaceOnUse'},defs);
      element('rect',{width:pattern.size,height:pattern.size,fill},tile);
      element('path',{d:`M0 0H${pattern.size/2}V${pattern.size}H0Z`,fill:pattern.colors[0],opacity:pattern.opacity},tile);
      element('path',{d:`M0 0L${pattern.size} ${pattern.size}M${pattern.size} 0L0 ${pattern.size}`,stroke:pattern.colors[1],'stroke-width':2,opacity:pattern.opacity},tile);
      fill=`url(#${id})`;
    }
    element('rect',{width:1672,height:941,fill},context);
  }
  const overlay=element('g',{'data-ui-component':'dialogue-paper'},plane('paper'));
  if(stage.lightingEnabled) overlay.setAttribute('filter',stage.uiShadows.paper);
  stage.image(plane('wave'),'material.dialogue-wave',scene.paperBounds);
  stage.image(overlay,'material.dialogue-paper',scene.paperBounds);
  if(stage.lightingEnabled) {
    const [x,y,width,height]=scene.lighting.paperWash.bounds;
    element('rect',{x,y,width,height,fill:paperWash,opacity:scene.lighting.paperWash.opacity,
      'clip-path':`url(#${paperClip})`,'data-ui-light':'paper-wash','pointer-events':'none'},plane('paper'));
    element('path',{d:stage.manifest.paperEdge,transform:paperTransform,fill:'none',
      stroke:scene.lighting.paperEdge.stroke,'stroke-width':scene.lighting.paperEdge.width,
      opacity:scene.lighting.paperEdge.opacity,'data-ui-light':'paper-edge','pointer-events':'none'},plane('paper'));
  }
  // Apply a single shadow to the notebook union, including its restored edge.
  const notebook=element('g',{'data-ui-component':'notebook'},plane('foreground'));
  if(stage.lightingEnabled) notebook.setAttribute('filter',stage.uiShadows.notebook);
  for(const art of scene.art) {
    if(art.optionalLogo&&!stage.logoVisible) continue;
    const parent=art.component==='notebook'?notebook:plane(art.layer);
    const group=element('g',{'data-region':art.id,'data-ui-component':art.component??art.id,
      opacity:art.opacity,transform:art.transform,'clip-path':art.clip?`url(#${paperClip})`:undefined,
      filter:stage.lightingEnabled&&art.shadow?stage.uiShadows[art.shadow]:undefined},parent);
    stage.image(group,art.asset,art.bounds,art);
  }
  if(stage.lightingEnabled) element('path',{d:scene.lighting.noteWash.path,fill:noteWash,
    opacity:scene.lighting.noteWash.opacity,mask:`url(#${noteMask})`,
    'data-ui-light':'notebook-wash','pointer-events':'none'},plane('foreground'));
  for(const copy of scene.environmentText) stage.keyedText(plane(copy.layer),copy.key,{...copy,'data-region':copy.id});
  for(const rule of scene.rules) element('line',{...rule,stroke:rule.stroke??'#126477','stroke-width':rule.width??1.25,
    'pointer-events':'none'},plane(rule.layer??'print'));
  const arrow=scene.speakerArrow;
  element('path',{d:`M${arrow.x1} ${arrow.y1}H${arrow.x2}l-4 -2m4 2l-4 2`,fill:'none',stroke:'#126477','stroke-width':1.25,'pointer-events':'none'},plane('print'));
  for(const choice of scene.choices) stage.drawChoice(plane('print'),choice);
  const copyPlane=plane('text');copyPlane.classList.add('reading-copy');
  for(const copy of scene.text) {
    if(copy.optionalLogo&&!stage.logoVisible)continue;
    stage.keyedText(copyPlane,copy.key,{...copy,'data-region':copy.id});
  }
  for(const choice of scene.choices) stage.keyedText(copyPlane,choice.textKey,{x:choice.baseline[0],y:choice.baseline[1],...choice.font,'data-choice-copy':choice.id});
  stage.icon(copyPlane,'return',scene.returnIcon);
  stage.drawContinue(plane('print'),element);
}
