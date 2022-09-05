import * as THREE from 'three';
import { boardWidth } from './config';
import { glassMaterial } from './materials';
import { scene } from './scene';
import { activeBoardEmotes, generateTextPlane, LAYERS, shiftGeometryLeft } from './util';


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

const backplaneText = generateTextPlane(chartWidth, chartWidth * 0.08, 30, 'Total Value On Board');
backplaneText.mesh.position.y = chartHeight / 2 + 0.6;
main.add(backplaneText.mesh);
backplaneText.mesh.layers.toggle(LAYERS.bloom);


const valueCountText = generateTextPlane(chartWidth, chartWidth * 0.05, 30, '0');
valueCountText.mesh.position.y = chartHeight / 2 -0.3;
main.add(valueCountText.mesh);
valueCountText.mesh.layers.toggle(LAYERS.bloom);


const emoteCountText = generateTextPlane(chartWidth, chartWidth * 0.05, 30, '0 emotes');
emoteCountText.mesh.position.y = -chartHeight / 2 + 0.3;
main.add(emoteCountText.mesh);
emoteCountText.mesh.layers.toggle(LAYERS.bloom);




export const activateMarketplace = (TMIClient) => {
    TMIClient.on('message', (channel, userstate, message, self) => {
        /*console.log(
            channel,
            userstate.username,
            message
        );*/
    });
};


const totalValueArray = new Array(30).fill(0);
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
totalValueLine.position.x -= chartWidth / 2;

const totalValueLineMax = 250;

const recalcTotalValue = () => {
    let temp = 0;
    for (let index = 0; index < activeBoardEmotes.length; index++) {
        const element = activeBoardEmotes[index];
        temp += isNaN(element.myScore) ? 0 : element.myScore;
        if (isNaN(element.myScore)) {
            console.log(element.onHit);
            element.myScore = 0;
        }
    };
    totalValueArray.push(temp / totalValueLineMax);
    totalValueArray.splice(0, 1);

    valueCountText.updateText(temp.toLocaleString() + ' points');
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