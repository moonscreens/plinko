import * as THREE from 'three';
import { applyShader } from './materials';

const dustGeometry = new THREE.BufferGeometry();
const vertices = [];

for (let i = 0; i < 2000; i++) {
	const x = 60 * Math.random() - 30;
	const y = 50 * Math.random() - 25;
	const z = 10 * Math.random() - 5;
	vertices.push(x, y, z);
}
dustGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
const dustMaterial = new THREE.PointsMaterial({
	size: 0.07,
	sizeAttenuation: true,
	transparent: true,
	opacity: 0.15,
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
})

const dust = new THREE.Points(dustGeometry, dustMaterial);

export default dust;