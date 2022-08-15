import { CircleBufferGeometry, Group, Mesh, MeshBasicMaterial, MeshNormalMaterial, PlaneBufferGeometry, RepeatWrapping, TextureLoader, Vector3 } from "three";
import { addTwistBetweenVectors, animateVector, nearestNeighborify } from "./util";
import { world } from "./physics";

const spots = {
	idle: {
		all: new Vector3(-12, -2, 0),
		head: new Vector3(0, 0, -4),
		mainHand: new Vector3(3, -2, 0),
		offHand: new Vector3(-3, -2, 0),
	},
	catching: {
		all: new Vector3(-12, -2, 0),
		head: new Vector3(0, 0, -4),
		mainHand: new Vector3(3, -2, 0),
		offHand: new Vector3(-3, -2, -1.5),
	},
	dropping: {
		all: new Vector3(-2, 12, 0),
		head: new Vector3(0, 0, -4),
		mainHand: new Vector3(2, 1, 0),
		offHand: new Vector3(-3, -1, -1.2),
	},
};
let activeSpot = "dropping";
const objKeys = Object.keys(spots);
let objKeyIndex = objKeys.length;
const backgroundDip = new Vector3(0, 0, -3);
setInterval(() => {
	objKeyIndex++;
	if (objKeyIndex >= objKeys.length) objKeyIndex = 0;
	activeSpot = objKeys[objKeyIndex];

	animateVector(group.position, addTwistBetweenVectors(group.position, spots[activeSpot].all), 3000);

	if (activeSpot === 'dropping' || activeSpot === 'idle') {
		animateVector(
			offHand.targetPos,
			[
				offHand.targetPos.clone(),
				offHand.targetPos.clone().add(backgroundDip),
				offHand.targetPos.clone().add(backgroundDip),
				offHand.targetPos.clone()
			],
			3000
		);
		animateVector(
			mainHand.targetPos,
			[
				mainHand.targetPos.clone(),
				mainHand.targetPos.clone().add(backgroundDip),
				mainHand.targetPos.clone().add(backgroundDip),
				mainHand.targetPos.clone()
			],
			3000
		);
	}
}, 3000);

const group = new Group();

export default group;

const loader = new TextureLoader();

const head = new Mesh(
	new PlaneBufferGeometry(7, 7),
	new MeshBasicMaterial({
		map: loader.load("/face.png"),
		transparent: true,
	})
);
group.add(head);

const handGeometry = new PlaneBufferGeometry(4, 4);
const mainHand = new Mesh(
	handGeometry,
	new MeshBasicMaterial({
		map: loader.load("/hand.png"),
		transparent: true,
	})
);
group.add(mainHand);
mainHand.material.map.wrapS = RepeatWrapping;
mainHand.material.map.repeat.x = -1;

const offHand = new Mesh(
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

head.targetPos = new Vector3(0, 0, 0);
mainHand.targetPos = new Vector3(0, 0, 0);
offHand.targetPos = new Vector3(0, 0, 0);

animateVector(group.position, [head.targetPos.clone(), new Vector3(0, -1, 0), new Vector3(-3, 0, 0), new Vector3(0, 1, 0), new Vector3(3, 0, 0)], 3000);

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
	mainHand.rotation.z = Math.sin(performance.now() / 1200) * 0.2;

	offHand.position.set(offHand.targetPos.x,
		offHand.targetPos.y + Math.sin(performance.now() / 900 + 300) * 0.25,
		offHand.targetPos.z
	);
	offHand.rotation.z = Math.cos(performance.now() / 1000 + 100) * 0.2;
};
