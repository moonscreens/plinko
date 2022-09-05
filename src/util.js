import { CanvasTexture, CatmullRomCurve3, Mesh, MeshBasicMaterial, NearestFilter, PlaneGeometry, Vector2, Vector3 } from "three";
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


export const animateVector = (target, input_keyframes = [], duration = 1000, smooth = true) => {
	let keyframes = Array.isArray(input_keyframes) ? input_keyframes : [target.clone(), input_keyframes];

	const curve = new CatmullRomCurve3(keyframes);
	//const points = curve.getPoints(50);

	const promise = new Promise((resolve, reject) => {
		animationArray.push({
			tick: (p) => {
				if (smooth)target.copy(curve.getPoint(easeInOutSine(p)));
				else target.copy(lerpVectorArray(keyframes, easeInOutSine(p)));
				//target.copy(curve.getPoint(easeInOutSine(p)));
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

export const LAYERS = {
	default: 0,
	bloom: 1,
}

export const checkOverlap = (target, a, b) => {
	const min_x = Math.min(a.x, b.x);
	const min_y = Math.min(a.y, b.y);
	const max_x = Math.max(a.x, b.x);
	const max_y = Math.max(a.y, b.y);
	return (target.x > min_x && target.x < max_x && target.y > min_y && target.y < max_y);
}

export const shiftGeometryLeft = (geometry) => {
    const positions = geometry.getAttribute('position');
    for (let index = positions.itemSize; index < positions.count * positions.itemSize; index++) {
        positions.array[index - positions.itemSize] = positions.array[index];
    }
	geometry.setAttribute('position', positions);
}

export const generateTextPlane = (width, height, resolution, text) => {
	const canvas = document.createElement('canvas');
	canvas.width = Math.round(width * resolution);
	canvas.height = Math.round(height * resolution);
	const ctx = canvas.getContext('2d');
	ctx.font = Math.round(height * resolution)+'px monospace';
	ctx.fillStyle = '#2288ff';
	ctx.fillText(text, 0, canvas.height);

	const texture = new CanvasTexture(canvas);
	texture.magFilter = NearestFilter;
	return new Mesh(
		new PlaneGeometry(width, height),
		new MeshBasicMaterial({
			map: texture,
			transparent: true,
		})
	);
}