import {applyDocumentText} from '../src/shared/documentText.js';
import {t} from '../src/shared/text.js';
import {CoastalHud} from '../src/ui/coastal/CoastalHud.js';

applyDocumentText();

const DAYS = [
  'THỨ NĂM',
  'THỨ SÁU',
  'THỨ BẢY',
  'CHỦ NHẬT',
  'THỨ HAI',
  'THỨ BA',
  'THỨ TƯ'
];

const PHASES = [
  'Chiều · Phòng CLB',
  'Tối · Ký túc xá',
  'Sáng · Sân trường'
];

const TARGETS = [
  {id:'van',textKey:'ui.coastal.hud.preview.prompt_van',x:936,y:415},
  {id:'khue',textKey:'ui.coastal.hud.preview.prompt_khue',x:835,y:430},
  {id:'desk',textKey:'ui.coastal.hud.preview.prompt_desk',x:520,y:590}
];

const stage = document.getElementById('stage-host');
const refImage = document.getElementById('ref-image');
const bgFill = document.getElementById('bg-fill');

const hud = new CoastalHud({
  onMap: () => {
    console.log('Map action triggered (M)');
  },
  onMenu: () => {
    console.log('Menu action triggered (Esc)');
  },
  onInteract: () => {
    console.log('Interact action triggered (E)');
  }
});

stage.append(hud.node);

let currentDayIndex = 0;
let currentPhaseIndex = 0;
let currentEnergy = 3;
let currentMoney = 450;
let promptVisible = true;

const statusDay = document.getElementById('status-day');
const statusPhase = document.getElementById('status-phase');
const statusEnergy = document.getElementById('status-energy');
const statusMoney = document.getElementById('status-money');
const statusLocation = document.getElementById('status-location');

function syncStatus() {
  statusDay.textContent = DAYS[currentDayIndex];
  statusPhase.textContent = PHASES[currentPhaseIndex];
  statusEnergy.textContent = `${currentEnergy} / 4`;
  statusMoney.textContent = `${currentMoney}đ`;
  statusLocation.textContent = t('ui.replica.hud.location.1');
}

// Initial setup
hud.update({
  weekday: DAYS[currentDayIndex],
  phase: PHASES[currentPhaseIndex],
  energy: currentEnergy,
  maxEnergy: 4,
  money: currentMoney,
  objective: t('ui.replica.hud.objective.2'),
  location: t('ui.replica.hud.location.1'),
  prompt: t('ui.replica.hud.interaction.1'),
  promptVisible: true,
  targetPosition: {x: TARGETS[0].x, y: TARGETS[0].y}
});
syncStatus();

// Dropdown targets
const targetSelect = document.getElementById('prompt-target');
targetSelect.replaceChildren(...TARGETS.map(item => new Option(t(item.textKey), item.id)));
targetSelect.addEventListener('change', () => {
  const chosen = TARGETS.find(item => item.id === targetSelect.value);
  if (chosen) {
    hud.setPromptAnchor(chosen.x, chosen.y);
  }
});

// Background switcher
const bgMode = document.getElementById('bg-mode');
bgMode.addEventListener('change', () => {
  const mode = bgMode.value;
  if (mode === 'reference') {
    refImage.hidden = false;
    bgFill.hidden = true;
  } else if (mode === 'dark') {
    refImage.hidden = true;
    bgFill.hidden = false;
    bgFill.className = 'hud-preview-bg dark';
  } else if (mode === 'light') {
    refImage.hidden = true;
    bgFill.hidden = false;
    bgFill.className = 'hud-preview-bg light';
  }
});

// Energy slider
const energyRange = document.getElementById('energy-range');
energyRange.addEventListener('input', () => {
  currentEnergy = Number(energyRange.value);
  hud.setResources({energy: currentEnergy, maxEnergy: 4, money: currentMoney});
  syncStatus();
});

// Money input
const moneyInput = document.getElementById('money-input');
moneyInput.addEventListener('input', () => {
  currentMoney = Number(moneyInput.value) || 0;
  hud.setResources({energy: currentEnergy, maxEnergy: 4, money: currentMoney});
  syncStatus();
});

// Next day button (stamp impact animation)
const btnNextDay = document.getElementById('btn-next-day');
btnNextDay.addEventListener('click', () => {
  currentDayIndex = (currentDayIndex + 1) % DAYS.length;
  hud.setDate({weekday: DAYS[currentDayIndex], phase: PHASES[currentPhaseIndex], animate: true});
  syncStatus();
});

// Next phase button
const btnNextPhase = document.getElementById('btn-next-phase');
btnNextPhase.addEventListener('click', () => {
  currentPhaseIndex = (currentPhaseIndex + 1) % PHASES.length;
  hud.setDate({weekday: DAYS[currentDayIndex], phase: PHASES[currentPhaseIndex], animate: false});
  syncStatus();
});

// Toggle prompt button
const btnTogglePrompt = document.getElementById('btn-toggle-prompt');
btnTogglePrompt.addEventListener('click', () => {
  promptVisible = !promptVisible;
  hud.setPrompt({visible: promptVisible});
});

// Reduced motion toggle
const chkReducedMotion = document.getElementById('chk-reduced-motion');
chkReducedMotion.addEventListener('change', () => {
  hud.setReducedMotion(chkReducedMotion.checked);
});

// Stage click to move prompt dynamically
stage.addEventListener('click', event => {
  // Ignore clicks on HUD controls or date paper
  if (event.target.closest('.coastal-date-paper') ||
      event.target.closest('.coastal-hud-resource-ribbon') ||
      event.target.closest('.coastal-hud-objective') ||
      event.target.closest('.coastal-hud-bottom') ||
      event.target.closest('.coastal-interaction-bubble')) {
    return;
  }
  const rect = stage.getBoundingClientRect();
  // Map stage client position into reference 1672x941 coordinates
  const scaleX = 1672 / rect.width;
  const scaleY = 941 / rect.height;
  const stageX = Math.round((event.clientX - rect.left) * scaleX);
  const stageY = Math.round((event.clientY - rect.top) * scaleY);
  hud.setPromptAnchor(stageX, stageY);
  hud.setPrompt({visible: true});
  promptVisible = true;
});

window.coastalHudPreview = {
  hud,
  DAYS,
  PHASES,
  TARGETS,
  setDay: index => {
    currentDayIndex = index % DAYS.length;
    hud.setDate({weekday: DAYS[currentDayIndex], phase: PHASES[currentPhaseIndex], animate: true});
    syncStatus();
  },
  setEnergy: value => {
    currentEnergy = value;
    energyRange.value = value;
    hud.setResources({energy: value, maxEnergy: 4, money: currentMoney});
    syncStatus();
  },
  setMoney: value => {
    currentMoney = value;
    moneyInput.value = value;
    hud.setResources({energy: currentEnergy, maxEnergy: 4, money: value});
    syncStatus();
  }
};
