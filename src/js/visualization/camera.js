import * as THREE from "three";
import state from "@js/state/state.js";

export function saveCameraVersor(camera, controls) {
	const versor = new THREE.Vector3();
	versor.subVectors(camera.position, controls.target).normalize();
	state.lastCameraVersor = versor;
}

export function setCameraLastVersor(camera, controls, newCenter, objectSize) {
	controls.target.copy(newCenter);

	const distance = objectSize * 1.8;

	const offset = state.lastCameraVersor.clone().multiplyScalar(distance);
	camera.position.copy(newCenter).add(offset);

	controls.update();
}
