import * as THREE from "three";

import { reloadShaderMaterial } from "@js/visualization/shader-update.js";
import { vertexPicker } from "@js/interaction/vertex-picker.js";
import { setGaugeLine } from "@js/visualization/color-gauge.js";
import { updateActiveMesh } from "@js/visualization/mesh-update.js";
import { addTestMesh } from "@js/test-meshes/load-test-meshes.js";
import { VisMode } from "@js/core/state-manager.js";

export function setupEventHandlers(dependencies) {
	const { sceneManager, mouse, shaders, state } = dependencies;

	document.getElementById("camera-reset").addEventListener("click", () => {
		cameraReset(sceneManager, state);
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "r") {
			cameraReset(sceneManager, state);
		}
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "s") {
			console.log("loading shaders...");
			reloadShaderMaterial({ shaders, state }).then(() => {
				sceneManager.render();
			});
			console.log("shaders loaded!!");
		}
	});

	document.getElementById("light-slider").oninput = function () {
		const intensity = this.value / 100;
		state.ambientLightIntensity = intensity;
		sceneManager.render();
	};

	window.addEventListener("resize", () => {
		sceneManager.onWindowResize();
	});

	window.addEventListener("mousemove", (e) => {
		onMouseMove(e, sceneManager, mouse, state);
	});

	document
		.querySelector('[data-js="qualities-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "quality") {
				state.activeQuality = e.target.value;
				updateActiveMesh({ shaders, state });
				sceneManager.render();
			}
		});

	document
		.querySelector('[data-js="meshes-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "loaded-mesh") {
				sceneManager.saveCameraVersor(state);

				state.activeMeshIndex = parseInt(e.target.value);
				updateActiveMesh({ shaders, state });

				let activeMesh = null;

				for (let i = 0; i < state.meshes.length; i++) {
					if (i != state.activeMeshIndex) {
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

				sceneManager.restoreCameraVersor(center, maxDim, state);
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
			sceneManager,
			state,
		});

		btnTestMesh.textContent = "Add Test Mesh";
		btnTestMesh.disabled = false;
		document.body.style.cursor = "default";
	});
}

function cameraReset(sceneManager, state) {
	if (!state.activeMesh) return;
	const center = state.activeMesh.center;
	const radius = state.activeMesh.radius;
	sceneManager.resetCamera(center, radius);
}

function onMouseMove(e, sceneManager, mouse, state) {
	const rect = sceneManager.renderer.domElement.getBoundingClientRect();
	mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
	const value = vertexPicker({ mouse, camera: sceneManager.camera, state });
	setGaugeLine(value, state);
}
