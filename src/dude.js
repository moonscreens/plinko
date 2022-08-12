import { CircleBufferGeometry, Group, Mesh, MeshBasicMaterial, MeshNormalMaterial, Vector3 } from "three";

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
		offHand: new Vector3(-3, -2,  -1.5),
	},
	dropping: {
		all: new Vector3(-3, 4, 0),
		head: new Vector3(0, 0, -1),
		mainHand: new Vector3(2, 1, 0),
		offHand: new Vector3(-3, -1, -1.2),
	}
}
let activeSpot = 'dropping';
const objKeys = Object.keys(spots);
setInterval(() => {
	activeSpot = objKeys[Math.floor(Math.random() * objKeys.length)];
}, 10000);

for (const key in spots) {
	if (Object.hasOwnProperty.call(spots, key)) {
		const spot = spots[key];
		for (const target in spot) {
			if (Object.hasOwnProperty.call(spot, target) && spot !== 'all') {
				const element = spot[target];
				element.add(spot.all);
			}
		}
	}
}

const scene = new Group();

export default scene;

const head = new Mesh(new CircleBufferGeometry(4, 32), new MeshBasicMaterial({ color: 0x555555 }));
scene.add(head);
const mainHand = new Mesh(new CircleBufferGeometry(1.5, 16), new MeshBasicMaterial({ color: 0xffeedd }));
scene.add(mainHand);
const offHand = new Mesh(new CircleBufferGeometry(1.5, 16), new MeshNormalMaterial());
scene.add(offHand);

head.targetPos = new Vector3(0, 100, 0);
mainHand.targetPos = new Vector3(0, 100, 0);
offHand.targetPos = new Vector3(0, 100, 0);


scene.tick = function tick(delta) {
	head.targetPos.lerp(spots[activeSpot].head, delta);
	head.position.set(
		head.targetPos.x,
		head.targetPos.y + Math.sin(performance.now() / 1500) * 0.4,
		head.targetPos.z
	);


	mainHand.targetPos.lerp(spots[activeSpot].mainHand, delta);
	mainHand.position.set(
		mainHand.targetPos.x,
		mainHand.targetPos.y + Math.sin(performance.now() / 1000 + 100) * 0.25,
		mainHand.targetPos.z
	);

	offHand.targetPos.lerp(spots[activeSpot].offHand, delta);
	offHand.position.set(
		offHand.targetPos.x,
		offHand.targetPos.y + Math.sin(performance.now() / 900 + 300) * 0.25,
		offHand.targetPos.z
	);
}