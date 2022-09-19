import * as THREE from 'three';
import { applyShader } from './materials';

const scene = new THREE.Object3D();

const dustGeometry = new THREE.BufferGeometry();
const vertices = [];

for (let i = 0; i < 3000; i++) {
	const direction = Math.random() * Math.PI * 2;
	const distance = Math.random();
	const x = Math.sin(direction) * 30 * distance;
	const z = Math.cos(direction) * 30 * distance;
	const y = 50 * Math.random() - 25;
	vertices.push(x, y, z);
}
dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const dustMaterial = new THREE.PointsMaterial({
	size: 0.1,
	sizeAttenuation: true,
	transparent: true,
	blending: THREE.AdditiveBlending,
	opacity: 0.15,
	map: new THREE.TextureLoader().load('/particle.png'),
});

applyShader(dustMaterial, {
	tick: true,
	positionPass: true,
	vertexInsert: '#include <begin_vertex>',
	vertex: `
		transformed.x += sin(position.x * 10.0 + u_time * 0.00001) * 10.0;
		transformed.y += sin(position.z * 10.0 + u_time * 0.00001) * 10.0;
	`,
	fragmentInsert: '#include <color_fragment>',
	fragment: `
		diffuseColor.a *= sin(u_time * 0.001 + vPos.x + vPos.z) * 0.5 + 0.5;
		diffuseColor.a *= sin(u_time * 0.0001 + vPos.y + vPos.z) * 0.5 + 0.5;
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

dust.renderOrder = 1;
dust2.renderOrder = 1;

dust.position.x = -10;
dust2.position.x = 10;


const tick = () => {
	dust.rotation.y = performance.now() / 50000;
	dust.rotation.y = -performance.now() / 50000;
	window.requestAnimationFrame(tick);
}
tick();

export default scene;