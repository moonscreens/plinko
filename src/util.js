import { CanvasTexture, CatmullRomCurve3, Mesh, MeshBasicMaterial, NearestFilter, PlaneGeometry, Vector2, Vector3 } from "three";
import { lerp } from "three/src/math/MathUtils";
import { world } from "./physWorld";
import RAPIER from "@dimforge/rapier2d";

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
				if (smooth) target.copy(curve.getPoint(easeInOutSine(p)));
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
	ctx.font = "400 " + Math.round(height * resolution) + "px 'Comfortaa', monospace";
	ctx.imageSmoothingEnabled = false;
	ctx.fillStyle = '#2288bb';

	const texture = new CanvasTexture(canvas);
	texture.magFilter = NearestFilter;
	const updateText = (text) => {
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.fillText(text, 0, canvas.height - 2);
		texture.needsUpdate = true;
	}
	updateText(text);
	window.addEventListener('load', () => {
		updateText(text);
	})
	return {
		mesh: new Mesh(
			new PlaneGeometry(width, height),
			new MeshBasicMaterial({
				map: texture,
				transparent: true,
			})
		),
		ctx,
		updateText,
	}
}


export const activeBoardEmotes = [];

export const pegShape = RAPIER.ColliderDesc.ball(0.25);
export const EmoteColliderDesc = new RAPIER.ColliderDesc(new RAPIER.Ball(0.35)).setDensity(0.5);

const enableEvents = (collider) => {
	collider.setActiveEvents(RAPIER.ActiveEvents.COLLISION_EVENTS);
	collider.setActiveCollisionTypes(RAPIER.ActiveCollisionTypes.ALL);
}
enableEvents(pegShape);
enableEvents(EmoteColliderDesc);

export const onDeath = (body) => {
	for (let index = 0; index < activeBoardEmotes.length; index++) {
		const element = activeBoardEmotes[index];
		if (body.userData.myId === element.userData.myId) {
			activeBoardEmotes.splice(index, 1);
			break;
		}
	}
}

export const emoteHit = (body, surface) => {
	body.userData.myScore += 1;
}

export const boardHasEmotes = () => {
	return activeBoardEmotes.length > 0;
}

export const addBoardEmotes = (list) => {
	if (list.length === undefined) {
		list.userData.onDeath = onDeath;
		activeBoardEmotes.push(list);
		return;
	}
	for (let index = 0; index < list.length; index++) {
		const element = list[index];
		element.userData.onDeath = onDeath;
		activeBoardEmotes.push(element);
	}
}

let currentID = 0;
export function getBody() {
	const pos = new RAPIER.Vector2((Math.random() - 0.5) * 3 - 15, 12);

	// Or create the collider and attach it to a rigid-body.
	let body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic());
	body.setTranslation(pos);

	body.userData = {
		myId: currentID++,
		type: 'emote',
	}

	let collider = world.createCollider(EmoteColliderDesc, body);


	return { body, collider };
}
