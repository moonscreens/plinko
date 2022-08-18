import { CircleBufferGeometry, Group, Mesh, MeshBasicMaterial, MeshNormalMaterial, PlaneBufferGeometry, RepeatWrapping, TextureLoader, Vector3 } from "three";
import { addTwistBetweenVectors, animateVector, nearestNeighborify } from "./util";
import { world } from "./physics";
import * as Physics from "planck";

const dipVector = new Vector3(0, 0, -3) //dips hands into the background while moving
const animateWithDip = (target, destination, duration = 3000) => {
	const dip = new Vector3().lerpVectors(target, destination, 0.5).add(dipVector);
	animateVector(
		target,
		[
			target,
			dip,
			dip,
			destination,
		],
		duration
	);
}

const spots = {
	idle: {
		all: new Vector3(-13, -4, 0),
		head: new Vector3(0, 0, -4),
		mainHand: new Vector3(3, -2, 0),
		offHand: new Vector3(-3, -2, 0),
		run: (spot) => {
			animateVector(group.position, addTwistBetweenVectors(group.position, spot.all), 3000);
			animateWithDip(offHand.targetPos, spot.offHand);
			animateWithDip(mainHand.targetPos, spot.mainHand);
		},
	},
	catching: {
		all: new Vector3(-13, -3, 0),
		head: new Vector3(0, 0, -4),
		mainHand: new Vector3(4, -2, 0),
		offHand: new Vector3(-3, -2, -1.5),
		run: (spot) => {
			handBody.setActive(true);
			animateVector(group.position, addTwistBetweenVectors(group.position, spot.all), 3000);
			animateVector(mainHand.targetRot, [mainHand.targetRot, new Vector3(0, 0, -Math.PI)], 1000);
			animateVector(offHand.targetPos, [offHand.targetPos, spot.offHand], 3000);
			animateVector(mainHand.targetPos, [mainHand.targetPos, spot.mainHand], 3000);
		},
	},
	dropping: {
		all: new Vector3(-2, 12, 0),
		head: new Vector3(0, 0, -4),
		mainHand: new Vector3(2, -1, 0),
		offHand: new Vector3(-5, -3, -1.5),
		run: (spot) => {
			animateVector(
				group.position,
				[
					group.position,
					group.position.clone().add(new Vector3(-5, 1, 0)),
					group.position.clone().add(new Vector3(-10, 3, 0)),
					group.position.clone().add(new Vector3(-9, 15, 0)),
					spot.all
				], 5000).then(() => {
					animateWithDip(offHand.targetPos, spot.offHand);
					animateWithDip(mainHand.targetPos, spot.mainHand);
					setTimeout(() => {
						animateVector(mainHand.targetRot, [mainHand.targetRot, new Vector3(0, 0, 0)], 1000);
						handBody.setActive(false);
					}, 4000)
				})
		},
	},
};
let activeSpot = "dropping";
const objKeys = Object.keys(spots);
let objKeyIndex = objKeys.length;
setInterval(() => {
	objKeyIndex++;
	if (objKeyIndex >= objKeys.length) objKeyIndex = 0;
	activeSpot = objKeys[objKeyIndex];

	spots[activeSpot].run(spots[activeSpot]);
}, 10000);

const group = new Group();

export default group;

const loader = new TextureLoader();

export const head = new Mesh(
	new PlaneBufferGeometry(7, 7),
	new MeshBasicMaterial({
		map: loader.load("/face.png"),
		transparent: true,
	})
);
group.add(head);

const handGeometry = new PlaneBufferGeometry(4, 4);
export const mainHand = new Mesh(
	handGeometry,
	new MeshBasicMaterial({
		map: loader.load("/hand.png"),
		transparent: true,
	})
);
group.add(mainHand);
mainHand.material.map.wrapS = RepeatWrapping;
mainHand.material.map.repeat.x = -1;

const handBody = world.createBody({
	position: Physics.Vec2(0, 0),
	type: 'kinematic',
});
handBody.createFixture(Physics.Box(1.5, 0.5, Physics.Vec2(0, 0), 0));
handBody.createFixture(Physics.Box(0.25, 1, Physics.Vec2(-1.75, 0.5), 0));
handBody.createFixture(Physics.Box(0.25, 1, Physics.Vec2(1.75, 0.5), 0));
handBody.setActive(false);

export const offHand = new Mesh(
	handGeometry,
	new MeshBasicMaterial({
		map: loader.load("/hand.png"),
		transparent: true,
	})
);
group.add(offHand);

nearestNeighborify(head.material.map);
nearestNeighborify(mainHand.material.map);
nearestNeighborify(offHand.material.map);

head.targetPos = new Vector3(0, 0, -10);
mainHand.targetPos = new Vector3(0, 0, -10);
mainHand.targetRot = new Vector3(0, 0, 0);
offHand.targetPos = new Vector3(0, 0, -10);
offHand.targetRot = new Vector3(0, 0, 0);

animateVector(group.position, [new Vector3(0, 0, -3), new Vector3(0, -1, -3), new Vector3(-3, 0, -3), new Vector3(0, 1, -2), new Vector3(3, 0, -2)], 3000);

animateVector(head.targetPos, [head.targetPos.clone(), spots.idle.head], 1000);
animateVector(mainHand.targetPos, [mainHand.targetPos.clone(), spots.idle.mainHand], 1000);
animateVector(offHand.targetPos, [offHand.targetPos.clone(), spots.idle.offHand], 1000);

group.tick = function tick(delta) {
	head.position.set(head.targetPos.x,
		head.targetPos.y + Math.sin(performance.now() / 1500) * 0.4,
		head.targetPos.z
	);

	mainHand.position.set(mainHand.targetPos.x,
		mainHand.targetPos.y + Math.sin(performance.now() / 1000 + 100) * 0.25,
		mainHand.targetPos.z
	);
	mainHand.rotation.set(
		mainHand.targetRot.x,
		mainHand.targetRot.y,
		mainHand.targetRot.z + Math.sin(performance.now() / 1200) * 0.2
	);

	const pos = handBody.getPosition();
	const worldPos = new Vector3();
	mainHand.getWorldPosition(worldPos);
	pos.x = worldPos.x;
	pos.y = worldPos.y;
	handBody.setPosition(pos);

	offHand.position.set(offHand.targetPos.x,
		offHand.targetPos.y + Math.sin(performance.now() / 900 + 300) * 0.25,
		offHand.targetPos.z
	);
	offHand.rotation.set(
		offHand.targetRot.x,
		offHand.targetRot.y,
		offHand.targetRot.z + Math.cos(performance.now() / 1000 + 100) * 0.2
	);
};
