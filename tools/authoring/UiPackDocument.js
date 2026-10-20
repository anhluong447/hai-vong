import {LayoutDocument} from './LayoutDocument.js';
import {validateScreenLayout} from '../../src/shared/validateScreenLayout.js';

/** HUD/dialogue editing shares the menu's transaction and canonical export contract. */
export class UiPackDocument extends LayoutDocument{
 constructor(source){super(source,{validate:validateScreenLayout});}
 get draft(){return this.value;}
}
