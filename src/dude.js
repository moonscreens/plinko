import { CircleBufferGeometry, Group, Mesh, MeshBasicMaterial, MeshNormalMaterial, Vector3 } from "three";
import { addTwistBetweenVectors, animateVector } from "./util";
import { world } from "./physics";

const spots = {
	idle: {
		all: new Vector3(-8, -2, 0),
		head: new Vector3(0, 0, -1),
		mainHand: new Vector3(3, -2, 0),
		offHand: new Vector3(-3, -2, 0),
	},
	catching: {
		all: new Vector3(-8, -2, 0),
		head: new Vector3(0, 0, -1),
		mainHand: new Vector3(3, -2, 0),
		offHand: new Vector3(-3, -2, -1.5),
	},
	dropping: {
		all: new Vector3(-2, 5, 0),
		head: new Vector3(0, 0, -1),
		mainHand: new Vector3(2, 1, 0),
		offHand: new Vector3(-3, -1, -1.2),
	}
}
let activeSpot = 'dropping';
const objKeys = Object.keys(spots);
setInterval(() => {
	activeSpot = objKeys[Math.floor(Math.random() * objKeys.length)];

	animateVector(
		group.position,
		addTwistBetweenVectors(group.position, spots[activeSpot].all),
		1000,
	);
}, 10000);

const group = new Group();

export default group;

const head = new Mesh(new CircleBufferGeometry(4, 32), new MeshBasicMaterial({ color: 0x555555 }));
group.add(head);
const mainHand = new Mesh(new CircleBufferGeometry(1.5, 16), new MeshBasicMaterial({ color: 0xffeedd }));
group.add(mainHand);
const offHand = new Mesh(new CircleBufferGeometry(1.5, 16), new MeshNormalMaterial());
group.add(offHand);

head.targetPos = new Vector3(0, 0, 0);
mainHand.targetPos = new Vector3(0, 0, 0);
offHand.targetPos = new Vector3(0, 0, 0);

animateVector(
	group.position,
	[
		head.targetPos.clone(),
		new Vector3(0, -1, 0),
		new Vector3(-3, 0, 0),
		new Vector3(0, 1, 0),
		new Vector3(3, 0, 0)
	],
	10000,
);

animateVector(head.targetPos, [head.targetPos.clone(), spots.idle.head], 1000);
animateVector(mainHand.targetPos, [mainHand.targetPos.clone(), spots.idle.mainHand], 1000);
animateVector(offHand.targetPos, [offHand.targetPos.clone(), spots.idle.offHand], 1000);

group.tick = function tick(delta) {
	head.position.set(
		head.targetPos.x,
		head.targetPos.y + Math.sin(performance.now() / 1500) * 0.4,
		head.targetPos.z
	);

	mainHand.position.set(
		mainHand.targetPos.x,
		mainHand.targetPos.y + Math.sin(performance.now() / 1000 + 100) * 0.25,
		mainHand.targetPos.z
	);

	offHand.position.set(
		offHand.targetPos.x,
		offHand.targetPos.y + Math.sin(performance.now() / 900 + 300) * 0.25,
		offHand.targetPos.z
	);
}