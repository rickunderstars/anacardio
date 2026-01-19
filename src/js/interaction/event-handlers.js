import * as THREE from "three";

import { reloadShaderMaterial } from "@js/visualization/shader-update.js";
import { vertexPicker } from "@js/interaction/vertex-picker.js";
import { setGaugeLine } from "@js/visualization/color-gauge.js";
import { updateActiveMesh } from "@js/visualization/mesh-update.js";
import { addTestMesh } from "@js/test-meshes/load-test-meshes.js";
import { visMode } from "@js/state/state.js";
import state from "@js/state/state";
import {
	saveCameraVersor,
	setCameraLastVersor,
} from "@js/visualization/camera.js";

export function setupEventHandlers(dependencies) {
	const { camera, controls, renderer, scene, mouse, shaders, sceneManager } = dependencies;

	document.getElementById("camera-reset").addEventListener("click", () => {
		cameraReset(camera, controls);
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "r") {
			cameraReset(camera, controls);
		}
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "s") {
			console.log("loading shaders...");
			reloadShaderMaterial(state).then(() => {
				renderer.render(scene, camera);
			});
			console.log("shaders loaded!!");
		}
	});

	document.getElementById("light-slider").oninput = function () {
		const intensity = this.value / 100;
		state.setAmbientLightIntensity(intensity);
		renderer.render(scene, camera);
	};

	window.addEventListener("resize", () => {
		sceneManager.onWindowResize();
	});

	window.addEventListener("mousemove", (e) => {
		onMouseMove(e, camera, renderer, mouse, state);
	});

	document
		.querySelector('[data-js="qualities-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "quality") {
				state.setActiveQuality(e.target.value);
				updateActiveMesh({ shaders });
				renderer.render(scene, camera);
			}
		});

	document
		.querySelector('[data-js="meshes-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "loaded-mesh") {
				saveCameraVersor(camera, controls);

				state.setActiveMesh(e.target.value);
				updateActiveMesh({ shaders });

				let activeMesh = null;

				for (let i = 0; i < state.meshes.length; i++) {
					if (i != state.activeMesh) {
						state.meshes[i].mesh.visible = false;
					} else {
						state.meshes[i].mesh.visible = true;
						activeMesh = state.meshes[i].mesh;
					}
				}

				const box = new THREE.Box3().setFromObject(activeMesh);
				const center = new THREE.Vector3();
				box.getCenter(center);

				const size = new THREE.Vector3();
				box.getSize(size);
				const maxDim = Math.max(size.x, size.y, size.z);

				setCameraLastVersor(camera, controls, center, maxDim);
			}
		});

	const btnTestMesh = document.getElementById("add-test-meshes");

	btnTestMesh.addEventListener("click", async () => {
		btnTestMesh.textContent = "Loading...";
		btnTestMesh.disabled = true;
		document.body.style.cursor = "wait";
		await new Promise((r) => setTimeout(r, 50));

		await addTestMesh({
			shaders,
			scene,
			camera,
			controls,
			renderer,
		});

		btnTestMesh.textContent = "Add Test Mesh";
		btnTestMesh.disabled = false;
		document.body.style.cursor = "default";
	});
}

function cameraReset(camera, controls) {
	const center = state.getActiveMesh().center;
	const radius = state.getActiveMesh().radius;
	camera.position.set(center.x, center.y, center.z + radius * 2.5);
	controls.target.set(center.x, center.y, center.z);
	controls.update();
}

function onMouseMove(e, camera, renderer, mouse, state) {
	const rect = renderer.domElement.getBoundingClientRect();
	mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
	const value = vertexPicker({ mouse, camera });
	setGaugeLine(value, state);
}
