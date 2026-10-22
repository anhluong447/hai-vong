/** I/O only: caller owns shared domain validation. Paths come from project/pack manifests. */
export async function loadProject(projectUrl,fetcher=fetch) {
 const read=async url=>{const r=await fetcher(url);if(!r.ok)throw new Error(`content.fetch:${r.status}:${url}`);return r.json();};
 const base=new URL(projectUrl,globalThis.location?.href);
 const project=await read(base);
 const schemas=Object.fromEntries(await Promise.all(Object.entries(project.schemas??{}).map(async([key,path])=>[key,await read(new URL(path,base))])));
 const documents=[];
 for(const path of project.packs) {
  const packUrl=new URL(path,base),pack=await read(packUrl);
  for(const entry of pack.documents) documents.push({...entry,sourceId:new URL(entry.path,packUrl).pathname,data:await read(new URL(entry.path,packUrl))});
 }
 return {project,schemas,documents};
}
