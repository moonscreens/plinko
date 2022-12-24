import { Group, Mesh, MeshBasicMaterial, PlaneGeometry, RepeatWrapping, TextureLoader, Vector3 } from "three";
import { addTwistBetweenVectors, animateVector, nearestNeighborify } from "./util";
import { world } from "./physWorld";
import { camera } from "./camera";
import { scene } from "./scene";
import { resetPegs } from "./board";
import RAPIER from "@dimforge/rapier2d";
import { addBoardEmotes, boardHasEmotes } from "./marketplace";


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
	idle: () => {
		const spot = {
			all: new Vector3(20, -8, -10),
			head: new Vector3(0, 0, -5),
			mainHand: new Vector3(5, -6, -2),
			offHand: new Vector3(-5, -6, -2),
		}
		animateVector(group.position, addTwistBetweenVectors(group.position, spot.all), 5000);
		animateWithDip(offHand.targetPos, spot.offHand);
		animateWithDip(mainHand.targetPos, spot.mainHand);

		animateVector(camera.position, [
			camera.position.clone(),
			new Vector3(0, 0, 15)
		], 5000).then(() => {
			const interval = setInterval(() => {
				if (!boardHasEmotes()) {
					clearInterval(interval);
					setTimeout(spots.catching, 0);
				}
			}, 1000);
		});
	},
	catching: () => {
		const spot = {
			all: new Vector3(-19, -3, 0),
			head: new Vector3(0, 0, -4),
			mainHand: new Vector3(4, -2, 0),
			offHand: new Vector3(-5, -4, -3),
		}
		enableHand();
		if (!boardHasEmotes()) {
			animateVector(camera.position, [
				camera.position.clone(),
				new Vector3(-12, 0, 13)
			], 4000);
		}
		animateVector(group.position, addTwistBetweenVectors(group.position, spot.all), 3000);
		animateVector(mainHand.targetRot, [mainHand.targetRot, new Vector3(0, 0, -Math.PI)], 1000);
		animateVector(offHand.targetPos, [offHand.targetPos, spot.offHand], 3000);
		animateVector(mainHand.targetPos, [mainHand.targetPos, spot.mainHand], 3000);

		setTimeout(() => {
			const interval = setInterval(() => {
				if (checkHand().length > 3) {
					clearInterval(interval);
					setTimeout(spots.dropping, 0);
				}
			}, 1000);
		}, 5000);
	},
	dropping: () => {
		const spot = {
			all: new Vector3(-2, 12, 0),
			head: new Vector3(0, 0, -4),
			mainHand: new Vector3(2, -1, 0),
			offHand: new Vector3(-5, -3, -1.5),
		}
		handGrasp();
		disableHand();
		animateVector(camera.position, [
			camera.position.clone(),
			new Vector3(0, 3, 17)
		], 4000);
		animateWithDip(offHand.targetPos, spot.offHand, 5000);
		animateWithDip(mainHand.targetPos, spot.mainHand, 5000);
		animateVector(
			group.position,
			[
				group.position.clone(),
				group.position.clone().add(new Vector3(-10, 15, 0)),
				spot.all
			], 5000).then(() => {
				setTimeout(() => {
					animateVector(mainHand.targetRot, [mainHand.targetRot, new Vector3(0, 0, 0)], 1000)
						.then(() => {
							handRelease();
							resetPegs();

							setTimeout(() => {
								setTimeout(spots.idle, 0);
							}, 3100);
						})
				}, 4000)
			})
	},
};
setTimeout(() => {
	spots.catching();
}, 3100);

const group = new Group();

export default group;

const loader = new TextureLoader();

export const head = new Mesh(
	new PlaneGeometry(13, 13),
	new MeshBasicMaterial({
		map: loader.load("/face.png"),
		transparent: true,
	})
);
group.add(head);

const handGeometry = new PlaneGeometry(5, 5);
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

const setFriction = (collider) => {
	collider.setFriction(1);
	collider.setRestitution(0);
	return collider;
}
const handBody = world.createRigidBody(
	RAPIER.RigidBodyDesc.kinematicPositionBased()
);
const colliders = [
	world.createCollider(setFriction(RAPIER.ColliderDesc.cuboid(1.5, 0.5)), handBody),
	world.createCollider(setFriction(RAPIER.ColliderDesc.cuboid(0.25, 1).setTranslation(-1.75, 0.5)), handBody),
	world.createCollider(setFriction(RAPIER.ColliderDesc.cuboid(0.25, 1).setTranslation(1.75, 0.5)), handBody),
];

const disableHand = () => {
	for (let index = 0; index < colliders.length; index++) {
		const element = colliders[index];
		element.setCollisionGroups(0);
	}
};
const enableHand = () => {
	for (let index = 0; index < colliders.length; index++) {
		const element = colliders[index];
		element.setCollisionGroups(0xffffff);
	}
};

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

const graspedEmotes = [];

function checkHand() {
	const handPos = new Vector3();
	mainHand.getWorldPosition(handPos);

	const array = [];

	world.intersectionsWithShape(
		new RAPIER.Vector2(handPos.x, handPos.y + 1),
		0,
		new RAPIER.Cuboid(4, 2),
		(handle) => {
			const parent = handle.parent();
			if (parent && parent.userData) {
				array.push(parent);
			}
			return true; // `false` stops the query
		}
	);
	return array;
}

function handGrasp() {
	const emotes = checkHand();
	for (let index = 0; index < emotes.length; index++) {
		const body = emotes[index];
		mainHand.attach(body.userData.mesh);
		graspedEmotes.push(body.userData.mesh);
		body.userData.disablePhysics();
	}
	console.log(graspedEmotes.length, 'grasped');
}

function handRelease() {
	const worldPos = new Vector3();
	for (let i = graspedEmotes.length - 1; i >= 0; i--) {
		const sprite = graspedEmotes[i];

		sprite.getWorldPosition(worldPos);
		scene.add(sprite);
		sprite.position.copy(worldPos);
		sprite.enablePhysics(worldPos.x, worldPos.y);
		addBoardEmotes(sprite.body);
		graspedEmotes.splice(i, 1);
	};
}

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
	mainHand.rotation.set(
		mainHand.targetRot.x,
		mainHand.targetRot.y,
		mainHand.targetRot.z + Math.sin(performance.now() / 1200) * 0.2
	);

	const pos = handBody.translation();
	const worldPos = new Vector3();
	mainHand.getWorldPosition(worldPos);
	pos.x = worldPos.x;
	pos.y = worldPos.y;
	handBody.setTranslation(pos);
	handBody.setRotation(mainHand.rotation.z + Math.PI);

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
