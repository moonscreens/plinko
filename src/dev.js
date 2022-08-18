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
	wrapper.appendChild(input);

	if (changeListener) {
		input.addEventListener('change', changeListener);
	}

	return wrapper;
}

const setupTextureInput = (name, material) => {
	const input = createInput(name, 'file', (e) => {
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
	devWrapper.appendChild(input);
}

export const initDev = () => {

	setupTextureInput("Head", head.material);
	setupTextureInput("Main Hand", mainHand.material);
	setupTextureInput("Off Hand", offHand.material);


	document.addEventListener('DOMContentLoaded', () => {
		document.body.appendChild(devWrapper);
	})
}