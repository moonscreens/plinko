import * as THREE from 'three';
import { applyShader } from './materials';

const scene = new THREE.Object3D();

const dustGeometry = new THREE.BufferGeometry();
const vertices = [];

for (let i = 0; i < 2000; i++) {
	const direction = Math.random() * Math.PI * 2;
	const distance = Math.random();
	const x = Math.sin(direction) * 30 * distance;
	const z = Math.cos(direction) * 30 * distance;
	const y = 50 * Math.random() - 25;
	vertices.push(x, y, z);
}
dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const dustMaterial = new THREE.PointsMaterial({
	size: 0.05,
	sizeAttenuation: true,
	transparent: true,
	opacity: 0.5,
});

applyShader(dustMaterial, {
	tick: true,
	vertexInsert: '#include <begin_vertex>',
	vertex: `
		transformed.x += sin(position.x * 10.0 + u_time * 0.00001) * 10.0;
		transformed.y += sin(position.z * 10.0 + u_time * 0.00001) * 10.0;
	`,
	/*fragmentInsert: '#include <color_fragment>',
	fragment: `
		diffuseColor.a *= sin(gl_fragCoord.x + gl_fragCoord.y + u_time * 0.01) * 0.5 + 0.5;
	`,*/
});

const dust = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dust);
const dust2 = new THREE.Points(dustGeometry, dustMaterial);
scene.add(dust2);

dust.position.x = -10;
dust2.position.x = 10;


const tick = () => {
	dust.rotation.y = performance.now() / 50000;
	dust.rotation.y = -performance.now() / 50000;
	window.requestAnimationFrame(tick);
}
tick();

export default scene;