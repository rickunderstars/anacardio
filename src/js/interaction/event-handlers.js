import { reloadShaderMaterial } from "@js/visualization/shader-update";
import { vertexPicker } from "@js/interaction/vertex-picker.js";
import { setGaugeLine } from "@js/visualization/color-gauge";
import { updateActiveMaterial } from "@js/visualization/material-update";
import { addTestMesh } from "@js/test-meshes/load-test-meshes";

export function setupEventHandlers(dependencies) {
	const { camera, controls, renderer, scene, mouse, state, shaders } =
		dependencies;

	document.getElementById("camera-reset").addEventListener("click", () => {
		cameraReset(state, camera, controls);
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "r") {
			cameraReset(state, camera, controls);
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
		onViewportResize(camera, renderer, state);
	});

	window.addEventListener("mousemove", (e) => {
		onMouseMove(e, camera, renderer, mouse, state);
	});

	document
		.querySelector('[data-js="qualities-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "quality") {
				state.setActiveQuality(e.target.value);
				updateActiveMaterial({ state, shaders });
				renderer.render(scene, camera);
			}
		});

	document
		.querySelector('[data-js="meshes-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "loaded-mesh") {
				state.setActiveMesh(e.target.value);
				updateActiveMaterial({ state, shaders });

				for (let i = 0; i < state.meshes.length; i++) {
					if (i != state.activeMesh) {
						state.meshes[i].mesh.visible = false;
					} else {
						state.meshes[i].mesh.visible = true;
					}
				}
				const activeMesh = state.getActiveMesh();

				camera.position.set(
					activeMesh.center.x,
					activeMesh.center.y,
					activeMesh.center.z + activeMesh.radius * 2.5,
				);
				controls.target.set(
					activeMesh.center.x,
					activeMesh.center.y,
					activeMesh.center.z,
				);
				controls.update();
			}
		});

	document.getElementById("add-test-meshes").addEventListener("click", () => {
		addTestMesh({ state, shaders, scene, camera, controls, renderer });
	});
}

function cameraReset(state, camera, controls) {
	const center = state.getActiveMesh().center;
	const radius = state.getActiveMesh().radius;
	camera.position.set(center.x, center.y, center.z + radius * 2.5);
	controls.target.set(center.x, center.y, center.z);
	controls.update();
}

function onViewportResize(camera, renderer, state) {
	camera.aspect = viewport.clientWidth / viewport.clientHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(viewport.clientWidth, viewport.clientHeight);
	if (!state.timeMode) {
		renderer.render(scene, camera);
	}
}

function onMouseMove(e, camera, renderer, mouse, state) {
	const rect = renderer.domElement.getBoundingClientRect();
	mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
	mouse.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
	const value = vertexPicker({ state, mouse, camera });
	setGaugeLine(value, state);
}
