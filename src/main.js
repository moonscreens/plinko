import TwitchChat from "twitch-chat-emotes-threejs";
import * as THREE from "three";
import Stats from "stats-js";
import "./main.css";

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

import * as Physics from "planck";

import { world } from "./physics";

/*
** connect to twitch chat
*/

// a default array of twitch channels to join
let channels = ['moonmoon'];

// the following few lines of code will allow you to add ?channels=channel1,channel2,channel3 to the URL in order to override the default array of channels
const query_vars = {};
const query_parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
	query_vars[key] = value;
});

if (query_vars.channels || query_vars.channel) {
	const temp = query_vars.channels || query_vars.channel;
	channels = temp.split(',');
}

let stats = false;
if (query_vars.stats) {
	stats = new Stats();
	stats.showPanel(1);
	document.body.appendChild(stats.dom);
}

if (query_vars.dev) {
	initDev();
}

const ChatInstance = new TwitchChat({
	// If using planes, consider using MeshBasicMaterial instead of SpriteMaterial
	materialType: THREE.MeshBasicMaterial,

	// Passed to material options
	materialOptions: {
		transparent: true,
	},

	channels,
	maximumEmoteLimit: 1,
})

/*
** Initiate ThreejS scene
*/

const camera = new THREE.PerspectiveCamera(
	70,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.z = 13;
camera.position.x = 0;


const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

scene.fog = new THREE.Fog(0x000000, camera.position.z, camera.position.z + 15);
scene.background = new THREE.Color(0x000000);

new RGBELoader().load('/fireplace_2k.hdr', function (texture) {
	texture.mapping = THREE.EquirectangularReflectionMapping;
	scene.environment = texture;
})

function resize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
}

window.addEventListener('DOMContentLoaded', () => {
	window.addEventListener('resize', resize);
	if (stats) document.body.appendChild(stats.dom);
	document.body.appendChild(renderer.domElement);
	draw();
})

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(1, 1, 0.5);
scene.add(sun);

scene.add(new THREE.AmbientLight(0x657576, 0.8));

import { board, pegShape } from './board.js';
scene.add(board);

/*
** Draw loop
*/
let lastFrame = performance.now();
let lastDelta = 0;
function draw() {
	if (stats) stats.begin();
	requestAnimationFrame(draw);
	const delta = Math.min(1, Math.max(0, (performance.now() - lastFrame) / 1000));
	lastFrame = performance.now();
	lastDelta = delta;

	world.step(delta, 8, 4);


	for (let index = sceneEmoteArray.length - 1; index >= 0; index--) {
		const element = sceneEmoteArray[index];
		if (element.destroy) {
			sceneEmoteArray.splice(index, 1);
			scene.remove(element);
		} else {
			element.update();
		}
	}

	instancedSphere.instanceMatrix.needsUpdate = true;

	dude.tick(delta);

	camera.position.x = dude.position.x * 0.25;
	camera.position.y = dude.position.y * 0.25;

	renderer.render(scene, camera);
	if (stats) stats.end();
};


/*
** Handle Twitch Chat Emotes
*/
const sceneEmoteArray = [];
const emoteGeometry = new THREE.PlaneBufferGeometry(0.5, 0.5, 1, 1);

const sphereGeometry = new THREE.CircleBufferGeometry(0.25, 1, -Math.PI / 8, Math.PI / 4);
sphereGeometry.translate(-0.5, 0, 0);
sphereGeometry.scale(1.25, 1.25, 1.25);
const sphereMaterial = new THREE.MeshBasicMaterial({
	color: 0x444444,
	opacity: 0.1,
});
const instancedSphere = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, 1024);
instancedSphere.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

scene.add(instancedSphere);
const dummy = new THREE.Object3D();

const activeBodies = [];
const inactiveBodies = [];
let currentID = 0;

function getBody() {
	const pos = Physics.Vec2((Math.random() - 0.5) * 3 - 15, 12);
	if (inactiveBodies.length === 0) {
		const collider = world.createDynamicBody({
			position: pos,
		});
		collider.objectType = 'emote';
		collider.createFixture(pegShape);
		collider.setMassData({
			mass: 0.5,
			center: Physics.Vec2(),
			I: 1,
		});
		collider.setAngularDamping(0);
		collider.myId = currentID++;
		return collider;
	} else {
		const collider = inactiveBodies.splice(0, 1)[0];
		collider.setLinearVelocity(Physics.Vec2(0, 0));
		collider.setAngularVelocity(0);
		collider.setPosition(pos);
		collider.setActive(true);
		collider.setAngle(0);
		return collider;
	}
}
function removeBody(id) {
	let body = null;
	for (let index = 0; index < activeBodies.length; index++) {
		if (activeBodies[index].myId === id) {
			body = activeBodies.splice(index, 1)[0];
			continue;
		}
	}
	if (body) {
		inactiveBodies.push(body);
	}
}

const dummyVector = new THREE.Vector2();
ChatInstance.listen((emotes) => {
	const emote = emotes[0];

	//prevent lag caused by emote buildup when you tab out from the page for a while
	if (performance.now() - lastFrame > 1000) return;

	const sprite = new THREE.Mesh(emoteGeometry, emote.material);

	const collider = getBody();
	collider.mesh = sprite;
	activeBodies.push(collider);

	sprite.update = () => {
		const { p, q } = collider.getTransform();
		sprite.position.set(p.x, p.y, 0);

		const velocity = collider.getLinearVelocity();
		dummyVector.set(velocity.x, velocity.y).normalize();
		//sprite.rotation.z = Math.atan2(dummyVector.x, dummyVector.y);

		dummy.position.copy(sprite.position);
		dummy.position.z = -0.01;
		dummy.rotation.z = -Math.atan2(dummyVector.x, dummyVector.y) - (Math.PI / 2);
		dummy.updateMatrixWorld();
		instancedSphere.setMatrixAt(collider.myId, dummy.matrixWorld);

		if (p.y < -15) {
			sprite.destroy = true;
			collider.setActive(false);
			removeBody(collider.myId);
		}
	}

	scene.add(sprite);
	sceneEmoteArray.push(sprite);
});

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



import dude from './dude.js';
scene.add(dude);

import { initDev } from "./dev";
