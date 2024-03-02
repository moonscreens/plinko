import * as THREE from "three";
import { world, RAPIER } from "./physWorld";
import { LAYERS, pegShape } from "./util";
import colors from "./colors";
import { glassMaterial, GreenSpinningMat, RedSpinningMat } from "./materials";
import { boardHeight, boardWidth } from "./config";

export const board = new THREE.Group();
export const boardDepth = 0.4;

const pegGeometry = new THREE.CylinderGeometry(0.25, 0.25, boardDepth, 16);
pegGeometry.rotateX(Math.PI / 2);

const circleGeometry = new THREE.RingGeometry(0.15, 0.25, 16, 1);
circleGeometry.translate(0, 0, boardDepth / 2 + 0.08);

const pegMaterial = new THREE.MeshPhongMaterial({
	color: '#bfeaf2',
	shininess: 100,
	specular: 0xffffff,
});

const noBouncePegMaterial = new THREE.MeshPhongMaterial({
	color: colors.blue,
	specular: 0xffffff,
	shininess: 100,
});

const wallGeometry = new THREE.BoxGeometry(1, 1, boardDepth);

export function createWall(x = 0, y = 0, width = 1, height = 1, rotation = 0) {
	const WallMesh = new THREE.Mesh(wallGeometry, glassMaterial);
	WallMesh.scale.set(width, height, 1);
	WallMesh.position.set(x, y, 0);
	WallMesh.rotation.z = rotation;

	const collider = RAPIER.ColliderDesc.cuboid(width / 2, height / 2);
	collider.setTranslation(x, y);
	collider.setRotation(rotation);
	if (rotation === 0) {
		collider.setRestitution(1);
		collider.setFriction(0);
	}
	world.createCollider(collider);


	WallMesh.physics = collider;
	collider.mesh = WallMesh;

	board.add(WallMesh);
}

const wallWidth = 0.25;
createWall(0, boardHeight / 2 - wallWidth / 2, boardWidth - wallWidth, wallWidth, 0); //top wall
createWall(-boardWidth / 2, 0, wallWidth, boardHeight); //left wall
createWall(boardWidth / 2, 0, wallWidth, boardHeight); //right wall

const glass = new THREE.Mesh(
	new THREE.PlaneGeometry(boardWidth - wallWidth, 21),
	glassMaterial,
);
glass.position.z += boardDepth / 2;

const backGlass = glass.clone();
backGlass.position.z *= -1;
board.add(backGlass);


// idle walls outside board
createWall(-15 + 0.526, 0 + 4, 2, 0.5, -Math.PI / 4);
createWall(-15 - 0.526, 0 + 4, 2, 0.5, +Math.PI / 4);
createWall(-15 + 3.5, -5 + 4, 5, 0.5, +0.5);
createWall(-15 - 3.5, -5 + 4, 5, 0.5, -0.5);

const pegBodies = [];
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
	if (options.resetPegs) {
		const CircleMesh = new THREE.Mesh(circleGeometry, GreenSpinningMat);
		CircleMesh.layers.toggle(LAYERS.bloom);
		PegMesh.add(CircleMesh);
	}

	const body = world.createRigidBody(RAPIER.RigidBodyDesc.fixed());
	body.userData = { type: 'peg', mesh: PegMesh, options };
	body.setTranslation({ x, y });
	world.createCollider(pegShape, body);

	PegMesh.physics = body;

	board.add(PegMesh);
	pegBodies.push(body);
}
export function hitPeg(body) {
	if (body.userData.type !== 'peg') {
		console.warn('hitPeg called on non-peg body', body);
		return;
	}
	if (body.userData.options?.resetPegs) {
		resetPegs();
	}
	if (!body.userData.options || !body.userData.options.nobounce) {
		body.userData.mesh.scale.setScalar(0.25);
		body.setTranslation({ x: 999, y: 999 });
	}
}

export function resetPegs() {
	for (let index = 0; index < pegBodies.length; index++) {
		const body = pegBodies[index];
		body.userData.mesh.scale.setScalar(1);
		body.setTranslation({ x: body.userData.mesh.position.x, y: body.userData.mesh.position.y });
	}
}

const boardLength = 8;
for (let x = -boardLength / 2; x <= boardLength / 2; x++) {
	for (let y = -6; y <= 6; y++) {
		if ((y > 1 || y < -1) && (y !== 6 || x !== boardLength / 2)) createPeg(
			(x - 0.25 + (y % 2 === 0 ? 0.5 : 0)) * 1.5,
			y * 1.5,
			{
				nobounce: y === 6 && x % 2 === 0,
				superbounce: y === -6,
			}
		);
	}
}

for (let x = -Math.round(boardLength * 1.5); x < Math.round(boardLength * 1.5); x++) {
	createPeg(x * 0.5 + 0.5, Math.sin((x / boardLength) * Math.PI * 1.5), {
		superbounce: Math.abs(x) === 4 || Math.abs(x) === 12,
		//nobounce: Math.abs(x) === 8 || Math.abs(x) === 16 || x === 0,
		resetPegs: Math.abs(x) === 8 || Math.abs(x) === 16 || x === 0,
	})
}