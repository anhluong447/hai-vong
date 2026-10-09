import {t} from './text.js';

export function applyDocumentText(root = document) {
  for (const node of root.querySelectorAll('[data-text]')) node.textContent = t(node.dataset.text);
}
