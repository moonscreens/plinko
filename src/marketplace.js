import * as THREE from 'three';
import colors from './colors';
import { boardWidth } from './config';
import { glassMaterial } from './materials';
import { scene } from './scene';
import { generateTextPlane, LAYERS, shiftGeometryLeft } from './util';


const chartResolution = 30;
const chartWidth = 8;
const chartHeight = chartWidth * 0.6;


const main = new THREE.Object3D();
main.position.x = boardWidth - chartWidth / 3;
scene.add(main);

const backplane = new THREE.Mesh(
	new THREE.PlaneGeometry(chartWidth, chartHeight, 1, 1),
	glassMaterial
);
backplane.position.z = -0.1;
main.add(backplane);

const grid = new THREE.Mesh(
	new THREE.PlaneGeometry(chartWidth * 0.9, chartHeight * 0.7, chartResolution, Math.round(chartHeight * 3)),
	new THREE.MeshBasicMaterial({
		color: colors.green.clone().multiplyScalar(0.3),
		wireframe: true,
	})
);
grid.position.z = -0.05;
main.add(grid);

const backplaneText = generateTextPlane(chartWidth, chartWidth * 0.08, 100, 'Rigged Gamba Market');
backplaneText.mesh.position.y = chartHeight / 2 + 0.6;
main.add(backplaneText.mesh);
backplaneText.mesh.layers.toggle(LAYERS.bloom);


const valueCountText = generateTextPlane(chartWidth, chartWidth * 0.05, 100, '0');
valueCountText.mesh.position.y = chartHeight / 2 - 0.3;
main.add(valueCountText.mesh);
valueCountText.mesh.layers.toggle(LAYERS.bloom);


const emoteCountText = generateTextPlane(chartWidth, chartWidth * 0.05, 100, '0 emotes');
emoteCountText.mesh.position.y = -chartHeight / 2 + 0.3;
main.add(emoteCountText.mesh);
emoteCountText.mesh.layers.toggle(LAYERS.bloom);



export const activeBoardEmotes = [];

export const onDeath = (body) => {
	for (let index = 0; index < activeBoardEmotes.length; index++) {
		const element = activeBoardEmotes[index];
		if (body.handle === element.handle) {
			activeBoardEmotes.splice(index, 1);
			break;
		}
	}

	calculateMarketImpact(body.userData.name, body.userData.myScore, body.translation().x > 0 ? true : false);
}

export const emoteHit = (emoteBody, pegBody) => {
	emoteBody.userData.myScore += 1;
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

const usersDB = {
	//username: { score: 0 }
};
const emoteDB = {

};

const calculateMarketImpact = (emote, score = 0, win = false) => {
	if (emoteDB.hasOwnProperty(emote)) {
		for (let index = 0; index < emoteDB[emote].length; index++) {
			const username = emoteDB[emote][index];
			if (usersDB.hasOwnProperty(username)) {
				usersDB[username].score += win ? score : -score;

				console.log(usersDB[username]);
			}
		}
	}
}

const buyEmote = (username, emote) => {
	if (!emoteDB.hasOwnProperty(emote)) {
		emoteDB[emote] = {
			owners: [],
		}
	}

	if (!emoteDB[emote].owners.includes(username)) {
		emoteDB[emote].owners.push(username);
	}
}

const sellEmote = (username, emote) => {
	if (!emoteDB.hasOwnProperty(emote)) return;

	if (emoteDB[emote].owners.includes(username)) {
		emoteDB[emote].owners.splice(emoteDB[emote].owners.indexOf(username), 1);
	}
}

export const activateMarketplace = (TMIClient) => {
	TMIClient.on('message', (channel, userstate, message, self) => {
		const username = userstate.username.toLowerCase();

		if (!usersDB.hasOwnProperty(username)) {
			usersDB[username] = {
				score: 0,
			}
		}

		const parts = message.toLowerCase().split(' ');

		switch (parts[0]) {
			case 'buy':
				if (parts.length > 1) {
					buyEmote(username, parts[1]);
				}
				console.log(username + ' bought ' + parts[1]);
				break;
			case 'sell':
				if (parts.length > 1) {
					sellEmote(username, parts[1]);
				}
				console.log(username + ' sold ' + parts[1]);
				break;
		}
	});
};


const totalValueArray = new Array(chartResolution).fill(0);
const totalValueGeometry = new THREE.BufferGeometry();
totalValueGeometry.setAttribute(
	'position',
	new THREE.BufferAttribute(
		new Float32Array(totalValueArray.length * 3),
		3
	),
);

const totalValueLine = new THREE.Line(
	totalValueGeometry,
	new THREE.MeshBasicMaterial({
		color: 0x2288ff
	})
);
main.add(totalValueLine);
totalValueLine.scale.set(chartWidth * 0.9, chartHeight * 0.7);
totalValueLine.position.x -= chartWidth / 2 - chartWidth * 0.05;

const totalValueLineMax = 250;

const recalcTotalValue = () => {
	let temp = 0;
	for (let index = 0; index < activeBoardEmotes.length; index++) {
		const element = activeBoardEmotes[index];
		temp += isNaN(element.userData.myScore) ? 0 : element.userData.myScore;
		if (isNaN(element.userData.myScore)) {
			element.userData.myScore = 0;
		}
	};
	totalValueArray.push(temp / totalValueLineMax);
	totalValueArray.splice(0, 1);

	valueCountText.updateText(temp.toLocaleString() + 'B Gamba Points');
	emoteCountText.updateText(activeBoardEmotes.length + ' emotes');

	shiftGeometryLeft(totalValueGeometry);

	const positions = totalValueGeometry.getAttribute('position');
	for (let index = 0; index < positions.count * positions.itemSize; index += positions.itemSize) {
		//console.log(index / 3, positions.array[index], positions.array[index + 1], positions.array[index + 2]);
		const valueIndex = index / 3;
		positions.array[index] = valueIndex / (totalValueArray.length - 1);
		positions.array[index + 1] = totalValueArray[valueIndex] - 0.5;
	}
	totalValueGeometry.setAttribute('position', positions);
	totalValueGeometry.attributes.position.needsUpdate = true;
}
recalcTotalValue();

setInterval(() => {
	recalcTotalValue();
}, 1000);