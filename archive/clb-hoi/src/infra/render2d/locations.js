/**
 * 2D Top-Down Location Definitions for "Câu Lạc Bộ Hỏi".
 * Defines spawn points, boundaries, colliders, hotspots, and cinematic marks.
 * Coordinates: x (meters, left-right), z (meters, depth where z > 0 is forward/North).
 */

export const LOCATIONS_2D = {
  gate: {
    name: 'Cổng trường Tĩnh Tâm',
    indoor: false,
    spawn: { x: 0, z: -14, yaw: 0 },
    bounds: { minX: -3.2, maxX: 3.2, minZ: -21.5, maxZ: 17.5 },
    colliders: [
      // Left and right stone gate pillars
      { minX: -3.8, maxX: -2.6, minZ: 14.2, maxZ: 15.6 },
      { minX: 2.6, maxX: 3.8, minZ: 14.2, maxZ: 15.6 },
      // Iron gate leaf obstacle (right half closed)
      { minX: 0.6, maxX: 2.6, minZ: 14.6, maxZ: 15.4 },
    ],
    hotspots: {
      plaque: { x: -1.6, z: 13.0, radius: 1.8, label: 'XEM TẤM BIỂN ĐỒNG' },
      gate_entrance: { x: 1.2, z: 16.4, radius: 1.8, label: 'BƯỚC VÀO SÂN TRƯỜNG' },
    },
    marks: {
      behind: { x: -1.3, z: -15.2, yaw: 0 },
      gate_side: { x: 2.3, z: 12.6, yaw: Math.PI },
      center: { x: 0, z: -11, yaw: 0 },
      left: { x: -1.5, z: -11, yaw: 0 },
      right: { x: 1.5, z: -11, yaw: 0 },
    },
  },

  hallway: {
    name: 'Hành lang dãy A',
    indoor: true,
    spawn: { x: 0, z: -11, yaw: 0 },
    bounds: { minX: -2.9, maxX: 2.9, minZ: -14.5, maxZ: 11.5 },
    colliders: [
      // Lockers along left wall
      { minX: -2.9, maxX: -2.3, minZ: -5.0, maxZ: -2.5 },
    ],
    hotspots: {
      board: { x: 1.9, z: 0, radius: 2.0, label: 'ĐỌC BẢNG TIN DÃY A' },
      attic_stairs: { x: -1.6, z: 11.0, radius: 2.0, label: 'LÊN CẦU THANG GÁC XÉP' },
    },
    marks: {
      board_side: { x: 1.4, z: -1.6, yaw: 0 },
      far: { x: 0.5, z: 12.5, yaw: Math.PI },
      near: { x: 0.9, z: 1.2, yaw: Math.PI },
      exit_back: { x: 0.9, z: -16, yaw: Math.PI },
      center: { x: 0, z: -8, yaw: 0 },
      left: { x: -1.2, z: -8, yaw: 0 },
      right: { x: 1.2, z: -8, yaw: 0 },
    },
  },

  room0: {
    name: 'Phòng Số 0',
    indoor: true,
    spawn: { x: 0, z: -3.6, yaw: 0 },
    bounds: { minX: -4.3, maxX: 4.3, minZ: -4.7, maxZ: 4.7 },
    colliders: [
      // Central meeting table
      { minX: -1.3, maxX: 1.3, minZ: -1.3, maxZ: 1.3 },
      // Globe stand
      { minX: -4.2, maxX: -3.2, minZ: -2.8, maxZ: -1.6 },
    ],
    hotspots: {
      chalkboard: { x: -1.8, z: 4.4, radius: 1.8, label: 'XEM CÂU HỎI TRÊN BẢNG' },
      chair: { x: 0, z: 2.8, radius: 1.5, label: 'NGỒI XUỐNG BÀN TRÒN' },
      teapot: { x: 1.6, z: 0.4, radius: 1.6, label: 'RÓT TÁCH TRÀ HOA CÚC' },
      door: { x: 0, z: -4.6, radius: 1.6, label: 'RỜI KHỎI PHÒNG SỐ 0' },
    },
    marks: {
      // Feet stay below the board; the taller anime silhouette remains inside the room.
      board: { x: 1.6, z: 2.3, yaw: 0 },
      window: { x: -3.2, z: 1.5, yaw: -Math.PI / 2 },
      center: { x: 0, z: -3, yaw: 0 },
      left: { x: -1.5, z: -3, yaw: 0 },
      right: { x: 1.5, z: -3, yaw: 0 },
    },
  },
};

export const DEFAULT_LOCATION = {
  name: 'Khu vực chưa xác định',
  indoor: true,
  spawn: { x: 0, z: 0, yaw: 0 },
  bounds: { minX: -5, maxX: 5, minZ: -5, maxZ: 5 },
  colliders: [],
  hotspots: {},
  marks: {},
};
