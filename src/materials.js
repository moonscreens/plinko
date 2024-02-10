import * as THREE from 'three';
import colors from './colors';

window.shaderPID = 10000;

export function applyShader(material, options = {}) {
	material.onBeforeCompile = function (shader) {
		shader.uniforms.u_time = { value: Math.random() * 1000 };
		const uniforms = shader.uniforms;
		if (options.tick) {
			const tickUniforms = () => {
				if (uniforms) {
					uniforms.u_time.value = performance.now();
				}
				window.requestAnimationFrame(tickUniforms);
			};
			tickUniforms();
		}

		material.userData.shader = shader;

		shader.vertexShader = shader.vertexShader.replace(
			"void main()",
			`
			${options.positionPass ? 'varying vec3 vPos;' : ''}
			${options.uvPass ? 'varying vec2 vUv;' : ''}
			${options.tick ? "uniform float u_time;" : ""}
			void main()`
		);
		shader.vertexShader = shader.vertexShader.replace(
			"#include <begin_vertex>",
			`
			#include <begin_vertex>
			${options.positionPass ? 'vPos = position;' : ''}
			${options.uvPass ? 'vUv = uv;' : ''}
		`);

		if (options.vertex && options.vertexInsert) {
			shader.vertexShader = shader.vertexShader.replace(
				options.vertexInsert,
				options.vertexInsert + '\n' + options.vertex
			);
		}

		shader.fragmentShader = shader.fragmentShader.replace(
			"void main()",
			`
			${options.tick ? "uniform float u_time;" : ""}
			${options.positionPass ? 'varying vec3 vPos;' : ''}
			${options.uvPass ? 'varying vec2 vUv;' : ''}
			void main()`
		);

		if (options.fragment && options.fragmentInsert) {
			shader.fragmentShader = shader.fragmentShader.replace(
				options.fragmentInsert,
				options.fragmentInsert + '\n' + options.fragment
			);
		}
	};

	// Make sure WebGLRenderer doesn't reuse a single program
	material.customProgramCacheKey = function () {
		return parseInt(window.shaderPID++); // some random ish number
	};
};

export const RedSpinningMat = new THREE.MeshPhongMaterial({
	color: colors.red,
	emissive: colors.red,
	shininess: 0,
});

applyShader(RedSpinningMat, {
	tick: true,
	uvPass: true,
	fragment: `
		float flip = sin(u_time * 0.01);
		float brightness = atan(vUv.x - 0.5, vUv.y - 0.5) * 3.0;
		brightness = pow(min(1.0, max(0.25, flip * sin(brightness) + 0.75)), 2.0);
		diffuseColor.rgb *= brightness;
		totalEmissiveRadiance.rgb *= brightness;
	`,
	fragmentInsert: '#include <emissivemap_fragment>'
})


export const GreenSpinningMat = new THREE.MeshPhongMaterial({
	color: colors.green,
	emissive: colors.green,
	shininess: 0,
});

applyShader(GreenSpinningMat, {
	tick: true,
	uvPass: true,
	fragment: `
		float brightness = 0.0;
		float angle = atan(vUv.x - 0.5, vUv.y - 0.5);
		brightness += angle * 2.0 + u_time * 0.005;
		brightness = sin(brightness) + 1.0;
		diffuseColor.rgb *= brightness;
		totalEmissiveRadiance.rgb *= brightness;
	`,
	fragmentInsert: '#include <emissivemap_fragment>'
})

export const glassMaterial = new THREE.MeshPhongMaterial({
	transparent: true,
	opacity: 0.8,
	color: 0xb0a29b,
	specular: 0xffffff,
})