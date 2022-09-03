import { CanvasTexture } from "three";
import { head, mainHand, offHand } from "./dude";

let currentId = 0;
const devWrapper = document.createElement('div');
devWrapper.className = 'devWrapper';

const createInput = (name, type, changeListener) => {
	const wrapper = document.createElement('div');
	wrapper.className = 'inputWrap';

	const id = 'id' + (currentId++);
	const label = document.createElement('label');
	label.textContent = name;
	label.setAttribute('for', id);
	wrapper.appendChild(label);

	const input = document.createElement('input');
	input.type = type;
	input.id = id;
	if (type === 'file') {
		input.accept = 'image/png, image/jpeg, image/apng, image/avif, image/gif, image/svg+xml, image/webp'
	}
	wrapper.appendChild(input);

	if (changeListener) {
		input.addEventListener('change', changeListener);
	}

	return {wrapper, input};
}

const containers = {};
const getContainer = (name) => {
	if (!containers[name]) {
		containers[name] = document.createElement('div');

		const title = document.createElement('h3');
		title.textContent = name;
		containers[name].appendChild(title);

		devWrapper.appendChild(containers[name]);
	}
	return containers[name];
}

const setupTextureInput = (name, material) => {
	const {wrapper, input} = createInput('texture:', 'file', (e) => {
		const image = new Image();
		image.onload = () => {
			const canvas = document.createElement('canvas');
			canvas.width = image.width;
			canvas.height = image.height;
			const ctx = canvas.getContext('2d');
			document.body.appendChild(canvas);
			ctx.drawImage(image, 0, 0);
			material.map = new CanvasTexture(canvas);
			material.needsUpdate = true;
		};
		image.src = URL.createObjectURL(e.target.files[0]);
		console.log(image.src);
	});
	getContainer(name).appendChild(wrapper);
}


const setupScaleInput = (name, vector, defaultValue = 1) => {
	const {wrapper, input} = createInput('scale:', 'range', (e) => {
		const scale = (e.target.value / 300) * defaultValue * 2;
		vector.setScalar(scale);
	});
	input.min = 0;
	input.max = 300;
	input.value = (vector.x / Number(input.max)) * defaultValue * 2;
	getContainer(name).appendChild(wrapper);
}

export const initDev = () => {

	setupTextureInput("Head", head.material);
	setupScaleInput("Head", head.scale, 2);
	setupTextureInput("Main Hand", mainHand.material);
	setupScaleInput("Main Hand", mainHand.scale, 2);
	setupTextureInput("Off Hand", offHand.material);
	setupScaleInput("Off Hand", offHand.scale, 2);


	document.addEventListener('DOMContentLoaded', () => {
		document.body.appendChild(devWrapper);
	})
}