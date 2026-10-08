/**
 * Contract every location module must follow. One module per place in the
 * story bible (Phòng Số 0, Thư viện cũ, Sân thượng dãy B, ...). Register it in
 * ./index.js. Locations without a module use ./placeholder.js automatically,
 * so writers can script scenes before the 3D set exists.
 *
 * @typedef {{ x: number, z: number, yaw?: number }} Mark
 *   A named spot. yaw 0 faces +Z.
 *
 * @typedef {{ x: number, z: number, radius?: number, prompt?: string, y?: number }} Hotspot
 *   Something the player can interact with during @explore. Its id is what
 *   scripts reference: `on plaque -> label`. Characters on stage are hotspots
 *   automatically, using their character id.
 *
 * @typedef {object} BuiltLocation
 * @property {import('three').Group} group            Everything to add to the scene
 * @property {Mark} spawn                             Player start
 * @property {{ minX: number, maxX: number, minZ: number, maxZ: number }} bounds  Walkable area
 * @property {Array<{ minX: number, maxX: number, minZ: number, maxZ: number }>} [colliders]
 * @property {Record<string, Hotspot>} hotspots
 * @property {Record<string, Mark>} marks             Staging spots used by `@show id at=mark`
 * @property {{ distance?: number, pitch?: number, radius?: number, maxY?: number,
 *   bounds?: { minX: number, maxX: number, minZ: number, maxZ: number, maxY?: number } }} [camera]
 *   radius/bounds keep the camera inside rooms
 * @property {(x: number, z: number) => number} [groundY]
 * @property {(dt: number, t: number) => void} [update] Per-frame animation (water, leaves...)
 *
 * @typedef {object} LocationModule
 * @property {(kit: ReturnType<typeof import('../LocationKit.js').createKit>, ctx: {
 *   spec: { location: string, time: string, weather: string, season: string },
 *   meta: { name: string, indoor: boolean },
 *   palette: { foliage: string, leaf: string, grass: string, soil: string },
 * }) => BuiltLocation} build
 */
export {};
