import RAPIER from "@dimforge/rapier2d";

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

await sleep(500);

export const world = new RAPIER.World({x: 0, y: -15});