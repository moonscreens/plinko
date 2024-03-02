import { CanvasTexture } from "three";
import { head, mainHand, mainHandForeground, offHand, offHandForeground } from "./dude";

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

	return { wrapper, input };
}

const containers = {};
const getContainer = (name) => {
	if (!containers[name] || true) {
		containers[name] = document.createElement('div');

		// const title = document.createElement('p');
		// title.textContent = name;
		// containers[name].appendChild(title);

		devWrapper.appendChild(containers[name]);
	}
	return containers[name];
}

const setupTextureInput = (name, material) => {
	const { wrapper, input } = createInput(name + ':', 'file', (e) => {
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
	const { wrapper, input } = createInput(name+':', 'range', (e) => {
		const scale = (e.target.value / 300) * defaultValue * 2;
		vector.setScalar(scale);
	});
	input.min = 0;
	input.max = 300;
	input.value = (vector.x / Number(input.max)) * defaultValue * 2;
	getContainer(name).appendChild(wrapper);
}

const setupSliderInput = (name, min, max, callback) => {
	const { wrapper, input } = createInput(name, 'range', (e) => {
		callback(e.target.value);
	});
	input.min = min;
	input.max = max;
	input.value = (max - min) / 2;
	input.step = 0.001;
	getContainer(name).appendChild(wrapper);
}

const insertSeparator = () => {
	const separator = document.createElement('hr');
	devWrapper.appendChild(separator);
}
const insertTitle = (title) => {
	const titleElement = document.createElement('h3');
	titleElement.textContent = title;
	devWrapper.appendChild(titleElement);
}

export const initDev = () => {
	console.log('initDev');
	insertTitle('Head');
	setupTextureInput("Head", head.material);
	setupScaleInput("Head", head.scale, 2);
	insertSeparator();


	insertTitle('Main Hand');
	setupTextureInput("back texture", mainHand.material);
	setupTextureInput("foreground texture", mainHandForeground.material);
	setupSliderInput("foreground depth", 0, 2, (value) => {
		mainHandForeground.position.set(0, 0, value);
	});
	setupScaleInput("scale", mainHand.scale, 2);
	insertSeparator();


	insertTitle('Off Hand');
	setupTextureInput("back texture", offHand.material);
	setupTextureInput("foreground texture", offHandForeground.material);
	setupScaleInput("scale", offHand.scale, 2);
	setupSliderInput("foreground depth", 0, 2, (value) => {
		offHandForeground.position.set(0, 0, value);
	});


	document.body.appendChild(devWrapper);
}