import {applyDocumentText} from '../src/shared/documentText.js';
import {WorldEditor} from './authoring/WorldEditor.js';
applyDocumentText();
window.worldEditor=new WorldEditor(document);
window.addEventListener('pagehide',()=>window.worldEditor.dispose(),{once:true});
