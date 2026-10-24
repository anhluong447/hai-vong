/** Scene lifetime owns request cancellation and all acquired leases. */
export class ResourceScope {
 constructor(service,revision){this.service=service;this.revision=revision;this.controller=new AbortController();this.leases=new Set();}
 async acquire(ids){const result=await this.service.acquire(ids,{revision:this.revision,signal:this.controller.signal});if(result.ok){if(this.controller.signal.aborted)result.value.release();else this.leases.add(result.value);}return result;}
 dispose(){this.controller.abort();for(const lease of this.leases)lease.release();this.leases.clear();}
}
