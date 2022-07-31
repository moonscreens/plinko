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
	THREE,

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
camera.position.z = 10;

const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

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

/*
** Physics
*/
const world = new Physics.World({
	gravity: Physics.Vec2(0, -5),
	blockSolve: true,
});

const circleShape = Physics.Circle(0.5);
const pegGeometry = new THREE.CylinderBufferGeometry(0.5, 0.5, 1, 16);
pegGeometry.rotateX(Math.PI / 2);
const pegMaterial = new THREE.MeshNormalMaterial();

function createPeg(x, y, size = 1) {
	const PegMesh = new THREE.Mesh(pegGeometry, pegMaterial);
	PegMesh.position.set(x, y, 0);
	const collider = world.createBody({
		position: Physics.Vec2(x, y)
	});
	collider.createFixture(circleShape);

	PegMesh.physics = collider;
	collider.mesh = PegMesh;

	scene.add(PegMesh);
}

for (let x = -5; x < 5; x++) {
	for (let y = -5; y < 5; y++) {
		createPeg((x + (y % 2 === 0 ? 0.5 : 0)) * 3, y * 3)
	}
}


/*
** Draw loop
*/
let lastFrame = performance.now();
function draw() {
	if (stats) stats.begin();
	requestAnimationFrame(draw);
	const delta = Math.min(1, Math.max(0, (performance.now() - lastFrame) / 1000));
	lastFrame = performance.now();

	world.step(delta, 10, 8);


	for (let index = sceneEmoteArray.length - 1; index >= 0; index--) {
		const element = sceneEmoteArray[index];
		if (element.destroy) {
			sceneEmoteArray.splice(index, 1);
			scene.remove(element);
		} else {
			element.update();
		}
	}

	renderer.render(scene, camera);
	if (stats) stats.end();
};


/*
** Handle Twitch Chat Emotes
*/
const sceneEmoteArray = [];
const emoteGeometry = new THREE.PlaneBufferGeometry(1, 1, 1, 1);
const squareShape = Physics.Box(0.45, 0.45);
ChatInstance.listen((emotes) => {
	const emote = emotes[0];

	//prevent lag caused by emote buildup when you tab out from the page for a while
	if (performance.now() - lastFrame > 1000) return;

	const sprite = new THREE.Mesh(emoteGeometry, emote.material);

	const collider = world.createDynamicBody({
		position: Physics.Vec2((Math.random() - 0.5) * 10, 12),
	});
	const fixture = collider.createFixture(circleShape);
	collider.setMassData({
		mass: 1,
		center: Physics.Vec2(),
		I: 1
	});

	sprite.update = () => {
		const { p, q } = collider.getTransform();
		sprite.position.set(p.x, p.y, 0);
		sprite.rotation.z = q.s;
		if (p.y < -10) {
			sprite.destroy = true;
			collider.destroyFixture(fixture);
			collider.setActive(false);
		}
	}

	scene.add(sprite);
	sceneEmoteArray.push(sprite);
});