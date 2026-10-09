import {t} from '../../src/shared/text.js';
// Temporary balancing data, not character or story canon.
export const STAFF = [
  { id: 'khue', name: t("content.sandbox.fixtures.khue"), role: t("content.gameplay.definitions.phong_van"), joinWeek: 1, stats: { PV: 7, ANH: 4, TL: 5, GD: 6, HC: 5 } },
  { id: 'van', name: t("content.sandbox.fixtures.van"), role: t("content.sandbox.fixtures.toa_soan"), joinWeek: 1, stats: { PV: 4, ANH: 3, TL: 7, GD: 6, HC: 6 } },
  { id: 'long', name: 'Long', role: t("content.gameplay.definitions.hieu_chuyen"), joinWeek: 1, stats: { PV: 5, ANH: 5, TL: 3, GD: 4, HC: 7 } },
  { id: 'nhi', name: 'Nhi', role: t("content.gameplay.definitions.tai_lieu"), joinWeek: 3, stats: { PV: 3, ANH: 2, TL: 9, GD: 2, HC: 6 } },
  { id: 'nv5', name: t("content.sandbox.fixtures.cong_tac_vien_anh"), role: t("content.gameplay.definitions.anh"), joinWeek: 5, stats: { PV: 4, ANH: 9, TL: 3, GD: 5, HC: 4 } },
  { id: 'nv6', name: t("content.sandbox.fixtures.cong_tac_vien_hien_truong"), role: t("content.sandbox.fixtures.gan_da"), joinWeek: 7, stats: { PV: 8, ANH: 3, TL: 4, GD: 7, HC: 3 } },
];
export const NEED_NAMES = { ANH: t("content.gameplay.definitions.anh"), TL: t("content.gameplay.definitions.tai_lieu"), GD: t("content.sandbox.fixtures.gan_da"), HC: t("content.gameplay.definitions.hieu_chuyen") };
// [day, attraction, difficulty, energy, need, pressure, main]
const BASE = [
  [1,4,3,2,'HC',1,false], [1,6,4,3,'TL',6,false], [1,5,5,3,'ANH',5,false], [2,8,7,4,'TL',18,true],
  [2,5,4,2,'HC',1,false], [3,6,5,3,'ANH',4,false], [3,7,6,3,'GD',10,false], [4,9,8,4,'GD',26,true],
  [6,8,6,3,'HC',12,true], [6,4,3,2,'ANH',1,false], [6,7,6,3,'HC',10,false], [7,5,4,2,'TL',3,false],
  [7,3,2,2,'ANH',1,false], [8,8,7,4,'GD',22,true], [9,6,4,3,'TL',2,false], [9,6,5,3,'HC',6,false],
  [11,9,8,4,'TL',30,true], [11,6,5,3,'TL',6,false], [11,7,6,3,'GD',12,false], [12,8,7,4,'HC',16,true],
  [12,9,7,4,'HC',22,true], [13,5,3,2,'ANH',3,false], [13,6,4,2,'ANH',1,false], [14,8,8,4,'TL',28,true],
];

export function createSubjects() {
  const subjects = [];
  for (let week = 1; week <= 12; week++) {
    const group = (week - 1) % 3;
    BASE.slice(group * 8, group * 8 + 8).forEach(([day, attraction, difficulty, energy, need, pressure, main], index) => {
      const appears = day - group * 5 + (week - 1) * 5;
      // Fixed preview errors; no randomness or seed needed during play.
      const preview = Math.max(1, Math.min(10, attraction + [-1,0,1][(week + index) % 3]));
      const previewPressure = pressure * [0.8,1,1.2][index % 3];
      subjects.push({ id: `W${String(week).padStart(2,'0')}-S${String(group * 8 + index + 1).padStart(2,'0')}`,
        name: t("content.sandbox.fixtures.de_tai_thu_value0_tuan_value1", {value0: (group * 8 + index + 1), value1: (week)}), appears, expires: appears + 4,
        attraction, difficulty, energy, need, pressure, main, preview, previewPressure, scouted: false, done: false });
    });
  }
  return subjects;
}
