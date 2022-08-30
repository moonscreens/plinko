import * as THREE from 'three';
import colors from './colors';

window.shaderPID = 10000;

function applyShader(material, options = {}) {
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
			varying vec2 vUv;
			void main()`
		);
		shader.vertexShader = shader.vertexShader.replace(
			"#include <begin_vertex>",
			`
			#include <begin_vertex>
			vUv = uv;
		`);

		shader.fragmentShader = shader.fragmentShader.replace(
			"void main()",
			`${options.tick ? "uniform float u_time;" : ""}
			varying vec2 vUv;
			void main()`
		);
		shader.fragmentShader = shader.fragmentShader.replace(
			options.fragmentInsert,
			options.fragmentInsert + '\n' + options.fragment
		);
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
	fragment: `
		diffuseColor.rgb *= sin(u_time * 0.01 + atan(vUv.x, vUv.y) * 4.0);
	`,
	fragmentInsert: '#include <color_fragment>'
})
