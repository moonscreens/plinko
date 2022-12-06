import TwitchChat from "twitch-chat-emotes-threejs";
import * as THREE from "three";
import Stats from "stats-js";
import "./main.css";

import { initDev } from "./dev";
import { Vector2 } from "@dimforge/rapier2d";

import { collisionListener, eventQueue } from "./bounces";

import { getBody, LAYERS } from "./util";

import { world } from "./physWorld";

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
});

import { activateMarketplace } from "./marketplace";
activateMarketplace(ChatInstance.EmoteService.client);

/*
** Initiate ThreejS scene
*/
import { camera } from "./camera";
import { scene } from "./scene";
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(window.innerWidth, window.innerHeight);

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
const bloomSettings = {
	strength: 2,
	threshold: 0,
	radius: 0,
	scene: 'Scene with Glow'
};

const bloomLayer = new THREE.Layers();
bloomLayer.set(LAYERS.bloom);

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = bloomSettings.threshold;
bloomPass.strength = bloomSettings.strength;
bloomPass.radius = bloomSettings.radius;

const bloomComposer = new EffectComposer(renderer);
bloomComposer.renderToScreen = false;
bloomComposer.addPass(renderScene);
bloomComposer.addPass(bloomPass);

import bloomVert from './bloom.vert';
import bloomFrag from './bloom.frag';
const finalPass = new ShaderPass(
	new THREE.ShaderMaterial({
		uniforms: {
			baseTexture: { value: null },
			bloomTexture: { value: bloomComposer.renderTarget2.texture }
		},
		vertexShader: bloomVert,
		fragmentShader: bloomFrag,
		defines: {}
	}), 'baseTexture'
);
finalPass.needsSwap = true;

const finalComposer = new EffectComposer(renderer);
finalComposer.addPass(renderScene);
finalComposer.addPass(finalPass);

const darkMaterial = new THREE.MeshBasicMaterial({ color: 'black' });

const materials = {};
function darkenNonBloomed(obj) {
	if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
		materials[obj.uuid] = obj.material;
		obj.material = darkMaterial;
	}
}

function restoreMaterial(obj) {
	if (materials[obj.uuid]) {
		obj.material = materials[obj.uuid];
		delete materials[obj.uuid];
	}
}

scene.fog = new THREE.Fog(0x000000, camera.position.z, camera.position.z + 15);
scene.background = new THREE.Color(0x000000);

function resize() {
	const width = window.innerWidth;
	const height = window.innerHeight;
	camera.aspect = width / height;
	camera.updateProjectionMatrix();
	renderer.setSize(width, height);
	bloomComposer.setSize(width, height);
	finalComposer.setSize(width, height);
}

setTimeout(() => {
	window.addEventListener('resize', resize);
	if (stats) document.body.appendChild(stats.dom);
	document.body.appendChild(renderer.domElement);
	window.requestAnimationFrame(() => {
		resize();
		draw();
	})
}, 100);

const sun = new THREE.DirectionalLight(0xffffff, 1);
sun.position.set(1, 1, 0.5);
scene.add(sun);

scene.add(new THREE.AmbientLight(0xffffff, 0.3));

import { board } from './board.js';
scene.add(board);
import './bounces';

import dust from './dust.js';
scene.add(dust);

const physicsTickRate = Math.ceil(1000 / 120);
setInterval(()=>{
	world.step(eventQueue);
	eventQueue.drainContactForceEvents(collisionListener);
}, physicsTickRate);
world.timestep = physicsTickRate / 1000;

/*
** Draw loop
*/
let lastFrame = performance.now();

function draw() {
	if (stats) stats.begin();
	requestAnimationFrame(draw);
	const delta = Math.min(1, Math.max(0, (performance.now() - lastFrame) / 1000));
	lastFrame = performance.now();


	for (let index = sceneEmoteArray.length - 1; index >= 0; index--) {
		const element = sceneEmoteArray[index];
		if (element.destroy) {
			sceneEmoteArray.splice(index, 1);
			scene.remove(element);
		} else {
			element.update();
		}
	}

	//instancedSphere.instanceMatrix.needsUpdate = true;

	dude.tick(delta);

	//camera.position.x = dude.position.x * 0.25;
	//camera.position.y = dude.position.y * 0.25;

	// render scene with bloom
	scene.traverse(darkenNonBloomed);
	bloomComposer.render();
	scene.traverse(restoreMaterial);

	// render the entire scene, then render bloom scene on top
	finalComposer.render();

	if (stats) stats.end();
};


/*
** Handle Twitch Chat Emotes
*/
const sceneEmoteArray = [];
const emoteGeometry = new THREE.PlaneGeometry(0.75, 0.75, 1, 1);

const sphereGeometry = new THREE.CircleGeometry(0.25, 1, -Math.PI / 8, Math.PI / 4);
sphereGeometry.translate(-0.5, 0, 0);
sphereGeometry.scale(1.25, 1.25, 1.25);
const sphereMaterial = new THREE.MeshBasicMaterial({
	color: 0x444444,
	opacity: 0.1,
});
//const instancedSphere = new THREE.InstancedMesh(sphereGeometry, sphereMaterial, 1024);
//instancedSphere.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

//scene.add(instancedSphere);
const dummy = new THREE.Object3D();

const dummyVector = new THREE.Vector2();
ChatInstance.listen((emotes) => {
	const emote = emotes[0];

	//prevent lag caused by emote buildup when you tab out from the page for a while
	if (performance.now() - lastFrame > 1000) return;

	const sprite = new THREE.Mesh(emoteGeometry, emote.material);

	let body = getBody().body;

	const userData = {
		mesh: sprite,
	}


	const disablePhysics = () => {
		world.removeRigidBody(body);
		body = undefined;
		delete sprite.body;
	}
	const enablePhysics = (x, y) => {
		body = getBody().body;
		body.setTranslation(new Vector2(x, y));
		body.userData = { ...userData, ...body.userData };
		sprite.body = body;
	}

	userData.disablePhysics = disablePhysics;
	userData.enablePhysics = enablePhysics;
	sprite.disablePhysics = disablePhysics;
	sprite.enablePhysics = enablePhysics;
	sprite.body = body;

	body.userData = { ...userData, ...body.userData };

	sprite.update = () => {
		if (!body) return;
		const physicsPos = body.translation();

		if (!body.isGrasped) {
			sprite.position.set(physicsPos.x, physicsPos.y, 0);

			const velocity = body.linvel();
			dummyVector.set(velocity.x, velocity.y).normalize();
			//sprite.rotation.z = Math.atan2(dummyVector.x, dummyVector.y);

			dummy.position.copy(sprite.position);
			dummy.position.z = -0.01;
			dummy.rotation.z = -Math.atan2(dummyVector.x, dummyVector.y) - (Math.PI / 2);
			sprite.rotation.z = dummy.rotation.z;
			dummy.updateMatrixWorld();
		}

		if (physicsPos.y < -15) {
			sprite.destroy = true;
			if (body.userData.onDeath) {
				body.userData.onDeath(body);
			}
			world.removeRigidBody(body);
		}
	}

	scene.add(sprite);
	sceneEmoteArray.push(sprite);
});

import dude from './dude.js';
scene.add(dude);

