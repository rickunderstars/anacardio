import "@css/styles.css";

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { createScene } from "@js/visualization/scene.js";
import { createRenderer } from "@js/visualization/renderer.js";
import state from "@js/state/state.js";
import { setupFileHandlers } from "@js/interaction/file-handlers.js";
import { updateActiveMesh } from "@js/visualization/mesh-update.js";
import { loadShaders } from "@js/visualization/shader-update.js";
import { setupEventHandlers } from "@js/interaction/event-handlers.js";
import { colorizeGradient } from "@js/visualization/color-gauge.js";
import { visMode } from "@js/state/state.js";

const scene = createScene();
const viewport = document.getElementById("viewport");
const camera = new THREE.PerspectiveCamera(
	50,
	viewport.clientWidth / viewport.clientHeight,
);
camera.position.z = 5;

const renderer = createRenderer(viewport);
viewport.append(renderer.domElement);

const mouse = new THREE.Vector2();

export const controls = new OrbitControls(camera, renderer.domElement);
controls.addEventListener("change", () => {
	if (state.mode != visMode.ANIMATED) {
		renderer.render(scene, camera);
	}
});

if (state.mode != visMode.ANIMATED) {
	renderer.render(scene, camera);
} else {
	dynamicAnimate();
}

const clock = new THREE.Clock();

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
	scene,
	camera,
	controls,
	viewport,
	renderer,
});

setupEventHandlers({
	camera,
	controls,
	renderer,
	scene,
	mouse,

	shaders,
});

colorizeGradient();

let lastTime = 0;
const fps = 120;
const interval = 1000 / fps;

function dynamicAnimate(timeStamp) {
	if (state.mode != visMode.ANIMATED) {
		renderer.render(scene, camera);
		return;
	}

	requestAnimationFrame(dynamicAnimate);

	if (!lastTime) lastTime = timeStamp;

	const delta = timeStamp - lastTime;

	if (delta > interval) {
		lastTime = timeStamp - (delta % interval);

		if (state.activeMesh !== -1 && state.getActiveMesh()) {
			state.getActiveMesh().mesh.material.uniforms.uTime.value =
				clock.getElapsedTime();
		}

		renderer.render(scene, camera);
	}
}

document.getElementById("dynamic-animation").addEventListener("click", () => {
	if (state.activeMesh === -1 || !state.getActiveMesh()) return;
	if (state.mode != visMode.ANIMATED) {
		state.mode = visMode.ANIMATED;
		updateActiveMesh({ shaders });
		clock.start();
		lastTime = 0;
		dynamicAnimate();
	}
});

document.getElementById("color-ramp").addEventListener("click", () => {
	if (state.activeMesh === -1 || !state.getActiveMesh()) return;
	if (state.mode != visMode.COLOR_RAMP) {
		state.mode = visMode.COLOR_RAMP;
		updateActiveMesh({ shaders });
		renderer.render(scene, camera);
	}
});

document.getElementById("tangent-field").addEventListener("click", () => {
	if (state.activeMesh === -1 || !state.getActiveMesh()) return;
	if (state.mode != visMode.TANGENT_FIELD) {
		state.mode = visMode.TANGENT_FIELD;
		updateActiveMesh({ shaders });
		renderer.render(scene, camera);
	}
});
