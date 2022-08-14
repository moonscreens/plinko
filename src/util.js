import { CatmullRomCurve3, Vector3 } from "three";

const easeInOutSine = (x) => {
	return -(Math.cos(Math.PI * x) - 1) / 2;
}

const dummyVec = new Vector3();
const lerpVectorArray = (vectors = [], progress) => {
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
	console.log(progress);
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
				target.copy(curve.getPoint(p));
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