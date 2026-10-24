/** I/O only: caller owns shared domain validation. Paths come from project/pack manifests. */
export async function loadProject(projectUrl,fetcher=fetch,{includeAuthoring=true}={}) {
 const read=async url=>{const r=await fetcher(url);if(!r.ok)throw new Error(`content.fetch:${r.status}:${url}`);const raw=await r.text();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(v=>v.toString(16).padStart(2,'0')).join('');return {data:JSON.parse(raw),hash};};
 const base=new URL(projectUrl,globalThis.location?.href);
 const project=(await read(base)).data;
 const schemas=Object.fromEntries(await Promise.all(Object.entries(project.schemas??{}).map(async([key,path])=>[key,(await read(new URL(path,base))).data])));
 const packs=await Promise.all(project.packs.map(async path=>{
  const packUrl=new URL(path,base),pack=(await read(packUrl)).data;
  return Promise.all(pack.documents.filter(entry=>includeAuthoring||!entry.authoringOnly).map(async entry=>{const url=new URL(entry.path,packUrl),{data,hash}=await read(url);return {...entry,sourceId:url.pathname,sourceHash:hash,data};}));
 }));
 const documents=packs.flat();
 return {project,schemas,documents};
}
