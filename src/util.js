import { CatmullRomCurve3, NearestFilter, Vector2, Vector3 } from "three";
import { lerp } from "three/src/math/MathUtils";

const easeInOutSine = (x) => {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}

const dummyVec = new Vector3();
export const lerpVectorArray = (vectors = [], progress) => {
	const stepSize = 1 / vectors.length;

	for (let index = 1; index < vectors.length; index++) {
		if (stepSize * (index + 1) >= progress) {
			return dummyVec.lerpVectors(
				vectors[index - 1],
				vectors[index],
				(progress - stepSize * index) * vectors.length
			);
		}
	}
}

const animationArray = [];

const animateTick = () => {
	for (let index = animationArray.length - 1; index >= 0; index--) {
		const element = animationArray[index];
		const p = Math.min(1, (Date.now() - element.start) / element.duration);
		element.tick(p);
		if (p >= 1) {
			animationArray.splice(index, 1);
		}
	}
	window.requestAnimationFrame(animateTick);
}
window.requestAnimationFrame(animateTick);


export const animateVector = (target, input_keyframes = [], duration = 1000) => {
	let keyframes = Array.isArray(input_keyframes) ? input_keyframes : [input_keyframes];

	//keyframes = [target.clone(), ...keyframes];
	const curve = new CatmullRomCurve3(keyframes);

	const promise = new Promise((resolve, reject) => {
		animationArray.push({
			tick: (p) => {
				//target.copy(lerpVectorArray(keyframes, easeInOutSine(p)));
				target.copy(curve.getPoint(easeInOutSine(p)));
				if (p >= 1) resolve();
			},
			keyframes,
			curve,
			start: Date.now(),
			end: Date.now() + duration,
			duration,
		})
	});

	return promise;
}


const a2 = new Vector2();
const b2 = new Vector2();
export const addTwistBetweenVectors = (a, b) => {
	a2.x = a.x;
	a2.y = a.y;

	b2.x = b.x;
	b2.y = b.y;
	const distance = a2.distanceTo(b2);

	const angleHelper = a2.clone().sub(b2);
	const angle = angleHelper.angle();

	const vec2Array = [
		a2,

		new Vector2().lerpVectors(a2, b2, 0.3).add(new Vector2(
			Math.sin(angle + Math.PI / 2) * (distance * 0.1),
			Math.cos(angle + Math.PI / 2) * (distance * 0.1)
		)),

		new Vector2().lerpVectors(a2, b2, 0.7).add(new Vector2(
			Math.sin(angle - Math.PI / 2) * (distance * 0.1),
			Math.cos(angle - Math.PI / 2) * (distance * 0.1)
		)),

		b2,
	]

	for (let index = 0; index < vec2Array.length; index++) {
		const element = vec2Array[index];
		vec2Array[index] = new Vector3(element.x, element.y, lerp(a.z, b.z, index / (vec2Array.length - 1)))
	}

	return vec2Array;
}


export const nearestNeighborify = (texture) => {
	texture.minFilter = NearestFilter;
	texture.magFilter = NearestFilter;
}