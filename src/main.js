import TwitchChat from "twitch-chat-emotes-threejs";
import * as THREE from "three";
import Stats from "stats-js";
import "./main.css";


import * as Physics from "planck";

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
	40,
	window.innerWidth / window.innerHeight,
	0.1,
	1000
);
camera.position.z = 30;
camera.position.x = -10;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

scene.background = new THREE.Color(0x222222);

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

import dude from './dude.js';
scene.add(dude);

/*
** Physics
*/
const world = new Physics.World({
	gravity: Physics.Vec2(0, -7.5),
});

const circleShape = Physics.Circle(0.25);
const pegGeometry = new THREE.CylinderBufferGeometry(0.25, 0.4, 1, 16);
pegGeometry.rotateX(Math.PI / 2);
const pegMaterial = new THREE.MeshPhongMaterial({
	shininess: 0,
});
const superBouncePegMaterial = new THREE.MeshPhongMaterial({
	color: 0xff4422,
	specular: 0xff0000,
	shininess: 100,
});
const noBouncePegMaterial = new THREE.MeshPhongMaterial({
	color: 0x2277ff,
	specular: 0x0000ff,
	shininess: 100,
});

const togglePegs = [];
let toggledNumber = 0;
function createPeg(x, y, options = {}) {
	let mat = pegMaterial;

	if (options.superbounce) mat = superBouncePegMaterial;
	if (options.nobounce) mat = noBouncePegMaterial;

	const PegMesh = new THREE.Mesh(pegGeometry, mat);
	PegMesh.position.set(x, y, 0);
	const collider = world.createBody({
		position: Physics.Vec2(x, y)
	});
	collider.createFixture(circleShape);

	PegMesh.physics = collider;
	collider.mesh = PegMesh;
	collider.objectType = 'peg';

	collider.customConfig = options;

	if (options.toggles) {
		togglePegs.push(collider);
	}
	scene.add(PegMesh);
}
function hitPeg(collider) {
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
for (let x = -boardLength / 3; x <= boardLength / 3; x++) {
	for (let y = -5; y <= 5; y++) {
		if (y > 1 || y < -1) createPeg((x + (y % 2 === 0 ? 0.5 : 0)) * 2, y * 1.5)
	}
}

for (let x = -Math.round(boardLength * 0.75); x < Math.round(boardLength * 0.75); x++) {
	createPeg(x * 1, Math.sin((x / boardLength) * Math.PI * 1.5) * 1.5, {
		toggles: true,
		superbounce: Math.abs(x) === 4 || Math.abs(x) === 12,
		nobounce: Math.abs(x) === 8 || Math.abs(x) === 16,
	})
}


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

	world.step(delta, 4, 2);


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

	renderer.render(scene, camera);
	if (stats) stats.end();
};


/*
** Handle Twitch Chat Emotes
*/
const sceneEmoteArray = [];
const emoteGeometry = new THREE.PlaneBufferGeometry(0.25, 0.25, 1, 1);

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
	const pos = Physics.Vec2((Math.random() - 0.5) * 30, 12);
	if (inactiveBodies.length === 0) {
		const collider = world.createDynamicBody({
			position: pos,
		});
		collider.objectType = 'emote';
		collider.createFixture(circleShape);
		collider.setMassData({
			mass: 1,
			center: Physics.Vec2(),
			I: 1,
		});
		collider.setAngularDamping(100);
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
});