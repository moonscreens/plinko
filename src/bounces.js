import RAPIER from '@dimforge/rapier2d';
import { world } from './physWorld';
import { hitPeg } from "./board";
import { emoteHit } from './marketplace';

export const eventQueue = new RAPIER.EventQueue(true);

export const collisionListener = (event) => {
	try {
		const bodyA = world.getCollider(event.collider1()).parent();
		const bodyB = world.getCollider(event.collider2()).parent();

		let peg = false;
		if (bodyA && bodyA.userData && bodyA.userData.type === 'peg') peg = bodyA;
		if (bodyB && bodyB.userData && bodyB.userData.type === 'peg') peg = bodyB;

		let emote = false;
		if (bodyA && bodyA.userData && bodyA.userData.type === 'emote') emote = bodyA;
		if (bodyB && bodyB.userData && bodyB.userData.type === 'emote') emote = bodyB;

		if (peg && emote && !peg.userData.options.nobounce) {
			//emote.resetForces();
			//emote.resetTorques();

			const direction = Math.atan2(
				peg.userData.mesh.position.x - emote.userData.mesh.position.x,
				peg.userData.mesh.position.y - emote.userData.mesh.position.y,
			);

			let multiplier = 2;
			if (peg.userData.options.superbounce) multiplier *= 5;
			emote.applyImpulse({ x: Math.sin(direction) * -multiplier, y: Math.cos(direction) * -multiplier }, true);
			hitPeg(peg);
			emoteHit(emote);
		}
	} catch (e) {
		console.error(e);
	}
}