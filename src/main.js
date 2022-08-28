import TwitchChat from "twitch-chat-emotes-threejs";
import * as THREE from "three";
import Stats from "stats-js";
import "./main.css";

import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';

import * as Physics from "planck";

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

import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
const params = {
	exposure: 1,
	bloomStrength: 5,
	bloomThreshold: 0,
	bloomRadius: 0,
	scene: 'Scene with Glow'
};

const bloomLayer = new THREE.Layers();
bloomLayer.set(LAYERS.bloom);

const renderScene = new RenderPass(scene, camera);

const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 1.5, 0.4, 0.85);
bloomPass.threshold = params.bloomThreshold;
bloomPass.strength = params.bloomStrength;
bloomPass.radius = params.bloomRadius;

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

const darkMaterial = new THREE.MeshBasicMaterial( { color: 'black' } );

const materials = {};
function darkenNonBloomed( obj ) {
	if ( obj.isMesh && bloomLayer.test( obj.layers ) === false ) {
		materials[ obj.uuid ] = obj.material;
		obj.material = darkMaterial;
	}
}

function restoreMaterial( obj ) {
	if ( materials[ obj.uuid ] ) {
		obj.material = materials[ obj.uuid ];
		delete materials[ obj.uuid ];
	}
}

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
	bloomComposer.setSize(window.innerWidth, window.innerHeight);
	finalComposer.setSize(window.innerWidth, window.innerHeight);
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
import './bounces';

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

	// render scene with bloom
	scene.traverse( darkenNonBloomed );
	bloomComposer.render();
	scene.traverse( restoreMaterial );

	// render the entire scene, then render bloom scene on top
	finalComposer.render();

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

import dude from './dude.js';
scene.add(dude);

import { initDev } from "./dev";
import { LAYERS } from "./util";
