import { world } from './physWorld';
import { hitPeg } from "./board";

world.on('begin-contact', function (contact) {
	/* handle begin event */
	const bodyA = contact.getFixtureA().getBody();
	const bodyB = contact.getFixtureB().getBody();

	let peg = null;
	if (bodyA.objectType === 'peg') peg = bodyA;
	if (bodyB.objectType === 'peg') peg = bodyB;
	if (peg && peg.customConfig && peg.customConfig.nobounce) return;

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

		let multiplier = 7;
		if (peg.customConfig.superbounce) multiplier *= 4;

		multiplier += Math.random() * 5;

		setTimeout(() => {
			emote.applyLinearImpulse(direction.mul(multiplier), emoteCenter);
		}, 0)
		hitPeg(peg);
	}
	if (emote && wall) {
		const velocity = emote.getLinearVelocity();
		velocity.x *= -1;
		emote.setLinearVelocity(velocity);
	}
});

