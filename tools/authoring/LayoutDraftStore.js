export class LayoutDraftStore{
 constructor(storage=localStorage,key='clb-bao-chi.authoring.menu.v1'){this.storage=storage;this.key=key;}
 save(draft){this.storage.setItem(this.key,JSON.stringify(draft));}
 load(){const text=this.storage.getItem(this.key);return text?JSON.parse(text):null;}
 clear(){this.storage.removeItem(this.key);}
}
