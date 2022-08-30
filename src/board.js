import * as THREE from "three";
import * as Physics from "planck";
import { world } from "./physWorld";
import { LAYERS } from "./util";
import colors from "./colors";
import { RedSpinningMat } from "./materials";

export const board = new THREE.Group();
export const boardDepth = 0.4;

export const pegShape = Physics.Circle(0.25);
const pegGeometry = new THREE.CylinderBufferGeometry(0.25, 0.25, boardDepth, 16);
pegGeometry.rotateX(Math.PI / 2);

const circleGeometry = new THREE.RingBufferGeometry(0.15, 0.25, 16, 1);
circleGeometry.translate(0, 0, boardDepth / 2 + 0.005);

const pegMaterial = new THREE.MeshPhongMaterial({
	color: '#aaaaaa',
	shininess: 100,
});

const superBouncePegMaterial = new THREE.MeshPhongMaterial({
	color: colors.red,
	emissive: colors.red,
	shininess: 0,
});
const noBouncePegMaterial = new THREE.MeshPhongMaterial({
	color: colors.blue,
	specular: 0xffffff,
	shininess: 100,
});

const wallMaterial = new THREE.MeshStandardMaterial({
	transparent: true,
	opacity: 0.7,
	reflectivity: 1,
	metalness: 0.9,
	roughness: 0.4,
})
const wallGeometry = new THREE.BoxBufferGeometry(1, 1, boardDepth);

export function createWall(x = 0, y = 0, width = 1, height = 1, rotation = 0, specialBounce = true) {
	const WallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
	WallMesh.scale.set(width, height, 1);
	WallMesh.position.set(x, y, 0);
	WallMesh.rotation.z = rotation;
	const collider = world.createBody({
		position: Physics.Vec2(x, y)
	});
	collider.createFixture(Physics.Box(width / 2, height / 2, Physics.Vec2(0, 0), rotation));

	WallMesh.physics = collider;
	collider.mesh = WallMesh;
	if (specialBounce) collider.objectType = 'wall';

	board.add(WallMesh);
}
createWall(-7, 0, 0.25, 17); //left wall
createWall(+7.5, 0, 0.25, 17); //right wall

const glass = new THREE.Mesh(
	new THREE.PlaneBufferGeometry(14.25, 17),
	new THREE.MeshStandardMaterial({
		transparent: true,
		opacity: 0.8,
		reflectivity: 1,
		metalness: 1,
		roughness: 0.4,
	})
);
glass.position.x += 0.25;
glass.position.z += boardDepth/2;
//board.add(glass);

const backGlass = glass.clone();
backGlass.position.z *= -1;
board.add(backGlass);


// idle walls outside board
createWall(-15 + 0.526, 0 + 4, 2, 0.5, -Math.PI / 4, false);
createWall(-15 - 0.526, 0 + 4, 2, 0.5, +Math.PI / 4, false);
createWall(-15 + 3.5, -5 + 4, 5, 0.5, +0.5, false);
createWall(-15 - 3.5, -5 + 4, 5, 0.5, -0.5, false);

const togglePegs = [];
let toggledNumber = 0;
export function createPeg(x, y, options = {}) {
	let mat = pegMaterial;

	//if (options.superbounce) mat = superBouncePegMaterial;
	if (options.nobounce) mat = noBouncePegMaterial;

	const PegMesh = new THREE.Mesh(pegGeometry, mat);
	PegMesh.position.set(x, y, 0);
	if (options.superbounce) {
		const CircleMesh = new THREE.Mesh(circleGeometry, RedSpinningMat);
		CircleMesh.layers.toggle(LAYERS.bloom);
		PegMesh.add(CircleMesh);
	}

	const collider = world.createBody({
		position: Physics.Vec2(x, y)
	});
	collider.createFixture(pegShape);

	PegMesh.physics = collider;
	collider.mesh = PegMesh;
	collider.objectType = 'peg';

	collider.customConfig = options;

	if (options.toggles) {
		togglePegs.push(collider);
	}
	board.add(PegMesh);
}
export function hitPeg(collider) {
	collider.setActive(false);
	collider.mesh.scale.setScalar(0.25);

	if (collider.customConfig.toggles) {
		toggledNumber++;
		return;
	}
	setTimeout(() => {
		collider.setActive(true);
		collider.mesh.scale.setScalar(1);
	}, 1500);
}

let lastToggle = performance.now();
setInterval(() => {
	if (lastToggle < performance.now() - 30000 || toggledNumber / togglePegs.length > 0.6) {
		lastToggle = performance.now();
		toggledNumber = 0;
		for (let index = 0; index < togglePegs.length; index++) {
			const element = togglePegs[index];
			element.setActive(true);
			element.mesh.scale.setScalar(1);
		}
	}
}, 1000);

const boardLength = 8;
for (let x = -boardLength / 2; x <= boardLength / 2; x++) {
	for (let y = -5; y <= 5; y++) {
		if (y > 1 || y < -1) createPeg((x + (y % 2 === 0 ? 0.5 : 0)) * 1.5, y * 1.5)
	}
}

for (let x = -Math.round(boardLength * 1.5); x < Math.round(boardLength * 1.5); x++) {
	createPeg(x * 0.5 + 0.5, Math.sin((x / boardLength) * Math.PI * 1.5), {
		toggles: true,
		superbounce: Math.abs(x) === 4 || Math.abs(x) === 12,
		nobounce: Math.abs(x) === 8 || Math.abs(x) === 16,
	})
}