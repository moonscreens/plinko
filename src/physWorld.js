export const RAPIER = await import("@dimforge/rapier2d-compat");

await RAPIER.init();

// function sleep(ms) {
//     return new Promise(resolve => setTimeout(resolve, ms));
// }
// await sleep(500);

RAPIER.init

export const world = new RAPIER.World(new RAPIER.Vector2(0, -15));
