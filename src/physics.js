import * as Physics from "planck";

export const world = new Physics.World({
	gravity: Physics.Vec2(0, -7.5),
	allowSleep: false,
});