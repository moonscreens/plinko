import RAPIER from '@dimforge/rapier2d';
import { world } from './physWorld';
import { hitPeg } from "./board";

export const eventQueue = new RAPIER.EventQueue(true);

export const collisionListener = (handle1, handle2, started) => {
	if (!started) return;

	const bodyA = world.getRigidBody(handle1);
	const bodyB = world.getRigidBody(handle2);
	
	let peg = false;
	if (bodyA && bodyA.userData && bodyA.userData.type === 'peg') peg = bodyA;
	if (bodyB && bodyB.userData && bodyB.userData.type === 'peg') peg = bodyB;

	let emote = false;
	if (bodyA && bodyA.userData && bodyA.userData.type === 'emote') emote = bodyA;
	if (bodyB && bodyB.userData && bodyB.userData.type === 'emote') emote = bodyB;

	if (peg && emote) {
		console.log(peg, emote);
		emote.resetForces(true);
		emote.resetTorques(true);

		const direction = emote.userData.mesh.position.clone().subtract(peg.userData.mesh.position).normalize();

		emote.addForce(new RAPIER.Vector2(direction.x * 100, direction.y * 100));
	}

}

/*
world.on('begin-contact', function (contact) {
	const bodyA = contact.getFixtureA().getBody();
	const bodyB = contact.getFixtureB().getBody();

	let peg = null;
	if (bodyA.objectType === 'peg') peg = bodyA;
	if (bodyB.objectType === 'peg') peg = bodyB;

	let wall = null;
	if (bodyA.objectType === 'wall') wall = bodyA;
	if (bodyB.objectType === 'wall') wall = bodyB;

	let emote = null;
	if (bodyA.objectType === 'emote') emote = bodyA;
	if (bodyB.objectType === 'emote') emote = bodyB;

	if (emote && peg) {
		const emoteCenter = emote.getWorldCenter().clone();
		const pegCenter = peg.getWorldCenter().clone();
		const direction = emoteCenter.sub(pegCenter);
		//const emoteVelocity = emote.getLinearVelocity();
		//if (emoteVelocity.y < 0 && direction.y > 0) emote.setLinearVelocity(Physics.Vec2(emoteVelocity.x, emoteVelocity.y * 0.5));

		let multiplier = 8;
		if (peg.customConfig.superbounce) multiplier *= 5;


		if (!peg.customConfig.nobounce) {
			setTimeout(() => {
				emote.applyLinearImpulse(direction.mul(multiplier), emoteCenter);
			}, 0)
		}
		hitPeg(peg);

		if (emote.hasOwnProperty('onHit')) {
			emote.onHit(emote, peg);
		}
	}
	if (emote && wall) {
		const velocity = emote.getLinearVelocity();
		velocity.x *= -1;
		emote.setLinearVelocity(velocity);

		if (wall.hasOwnProperty('onHit')) {
			wall.onHit(emote, wall);
		}
	}
});
*/
