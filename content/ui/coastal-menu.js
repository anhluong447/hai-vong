// Navigation routes and reusable art for the five-section editorial composition.
export const menuSections = [
  {id:'cases',textKey:'ui.replica.menu.nav_cases.1',icon:'cases',routes:['cases','quests','editor']},
  {id:'team',textKey:'ui.replica.menu.nav_team.1',icon:'team',routes:['team']},
  {id:'calendar',textKey:'ui.replica.menu.nav_calendar.1',icon:'calendar',routes:['calendar','activities']},
  {id:'journal',textKey:'ui.replica.menu.nav_journal.1',icon:'journal',routes:['reports']},
  {id:'settings',textKey:'ui.replica.menu.nav_settings.1',icon:'settings',routes:['settings']}
];
export const menuRouteLabels = {
  cases:'src.gameplay.main.ho_so',quests:'content.sandbox.fixtures.khue',editor:'src.gameplay.main.doi_soan',
  calendar:'ui.replica.menu.nav_calendar.1',activities:'src.gameplay.main.doi_song',team:'ui.replica.menu.nav_team.1',
  reports:'ui.replica.menu.nav_journal.1',settings:'ui.replica.menu.nav_settings.1',debug:'ui.replica.menu.nav_settings.1'
};
export const menuCaseArt = {documents:'card1-thumb.png',community:'card2-thumb-clean.png',photo:'menu-harbor-context.png'};
// CSS-backed materials must decode as well as DOM images before native capture.
export const menuMaterialFiles = ['menu-ink-wash.png','menu-case-paper.png','menu-thumb-edge-mask.png',
  'menu-nav-dry-brush.png','menu-tidal-wash.png','menu-hint-paper.png','menu-foreground-paper.svg'];
export const menuPreviewCases = [
  {id:'preview-documents',key:'documents',titleKey:'ui.replica.menu.case_one_title.1',teaserKey:'ui.replica.menu.case_one_teaser.1'},
  {id:'preview-community',key:'community',titleKey:'ui.replica.menu.case_two_title.1',teaserKey:'ui.replica.menu.case_two_teaser.1'}
];
