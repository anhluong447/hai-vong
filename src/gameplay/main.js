import {applyDocumentText} from '../shared/documentText.js';
applyDocumentText();
import {mountGameplay} from '../presentation/gameplay-controller.js';
import {validateContent} from '../shared/validateContent.js';
import {GAME_CONTENT} from '../../content/manifest.js';

validateContent(GAME_CONTENT);
await mountGameplay({pixelMode:location.pathname.endsWith('/pixel.html')});
