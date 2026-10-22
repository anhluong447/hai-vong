/** I/O only: caller owns shared domain validation. Paths come from project/pack manifests. */
export async function loadProject(projectUrl,fetcher=fetch) {
 const hashes=new Map();
 const read=async url=>{const r=await fetcher(url);if(!r.ok)throw new Error(`content.fetch:${r.status}:${url}`);const raw=await r.text();const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(raw)))).map(v=>v.toString(16).padStart(2,'0')).join('');hashes.set(url.href,hash);return JSON.parse(raw);};
 const base=new URL(projectUrl,globalThis.location?.href);
 const project=await read(base);
 const schemas=Object.fromEntries(await Promise.all(Object.entries(project.schemas??{}).map(async([key,path])=>[key,await read(new URL(path,base))])));
 const documents=[];
 for(const path of project.packs) {
  const packUrl=new URL(path,base),pack=await read(packUrl);
  for(const entry of pack.documents) {const url=new URL(entry.path,packUrl),data=await read(url);documents.push({...entry,sourceId:url.pathname,sourceHash:hashes.get(url.href),data});}
 }
 return {project,schemas,documents};
}
