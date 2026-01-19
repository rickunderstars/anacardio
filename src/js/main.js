import "@css/styles.css";

import * as THREE from "three";

import { SceneManager } from "@js/visualization/scene-manager.js";
import state from "@js/state/state.js";
import { setupFileHandlers } from "@js/interaction/file-handlers.js";
import { updateActiveMesh } from "@js/visualization/mesh-update.js";
import { loadShaders } from "@js/visualization/shader-update.js";
import { setupEventHandlers } from "@js/interaction/event-handlers.js";
import { colorizeGradient } from "@js/visualization/color-gauge.js";
import { visMode } from "@js/state/state.js";

const viewport = document.getElementById("viewport");
export const sceneManager = new SceneManager(viewport);

const mouse = new THREE.Vector2();

sceneManager.controls.addEventListener("change", () => {
	if (state.mode != visMode.ANIMATED) {
		sceneManager.render();
	}
});

if (state.mode != visMode.ANIMATED) {
	sceneManager.render();
} else {
	dynamicAnimate();
}

let shaders = await loadShaders();

state.meshes = [];

state.setActiveMesh(-1);

state.setActiveQuality(
	document.querySelector(
		'[data-js="qualities-list"] input[name="quality"]:checked',
	).value,
);

setupFileHandlers({
	shaders,
	scene: sceneManager.scene,
	camera: sceneManager.camera,
	controls: sceneManager.controls,
	viewport,
	renderer: sceneManager.renderer,
});

setupEventHandlers({
	sceneManager,
	camera: sceneManager.camera,
	controls: sceneManager.controls,
	renderer: sceneManager.renderer,
	scene: sceneManager.scene,
	mouse,

	shaders,
});

colorizeGradient();

let lastTime = 0;
const fps = 120;
const interval = 1000 / fps;

function dynamicAnimate(timeStamp) {
	if (state.mode != visMode.ANIMATED) {
		sceneManager.render();
		return;
	}

	requestAnimationFrame(dynamicAnimate);

	if (!lastTime) lastTime = timeStamp;

	const delta = timeStamp - lastTime;

	if (delta > interval) {
		lastTime = timeStamp - (delta % interval);

		if (state.activeMesh !== -1 && state.getActiveMesh()) {
			state.getActiveMesh().mesh.material.uniforms.uTime.value =
				sceneManager.getElapsedTime();
		}

		sceneManager.render();
	}
}

document.getElementById("dynamic-animation").addEventListener("click", () => {
	if (state.activeMesh === -1 || !state.getActiveMesh()) return;
	if (state.mode != visMode.ANIMATED) {
		state.mode = visMode.ANIMATED;
		updateActiveMesh({ shaders });
		sceneManager.startClock();
		lastTime = 0;
		dynamicAnimate();
	}
});

document.getElementById("color-ramp").addEventListener("click", () => {
	if (state.activeMesh === -1 || !state.getActiveMesh()) return;
	if (state.mode != visMode.COLOR_RAMP) {
		state.mode = visMode.COLOR_RAMP;
		updateActiveMesh({ shaders });
		sceneManager.render();
	}
});

document.getElementById("tangent-field").addEventListener("click", () => {
	if (state.activeMesh === -1 || !state.getActiveMesh()) return;
	if (state.mode != visMode.TANGENT_FIELD) {
		state.mode = visMode.TANGENT_FIELD;
		updateActiveMesh({ shaders });
		sceneManager.render();
	}
});
