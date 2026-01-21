import * as THREE from "three";

import { reloadShaderMaterial } from "@js/engine/shader-loader.js";
import { surfaceSampler } from "@js/engine/raycaster.js";
import { setGaugeLine } from "@js/ui/color-gauge.js";
import { updateActiveMesh } from "@js/engine/mesh-renderer.js";
import { addTestMesh } from "@js/io/test-loader.js";
import { VisMode } from "@js/core/state-manager.js";
import { formatNumber } from "@js/utils/math-utils.js";
import { processFile } from "@js/io/file-loader.js";

export function updateMinMaxUI(min, max) {
	document.getElementById("min-value").innerHTML =
		"min<br/>" + formatNumber(min);
	document.getElementById("max-value").innerHTML =
		"max<br/>" + formatNumber(max);
}

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
			reloadShaderMaterial({ shaders, state }).then((res) => {
				if (res) updateMinMaxUI(res.min, res.max);
				sceneManager.render();
			});
			console.log("shaders loaded!!");
		}
	});

	document.getElementById("light-slider").oninput = function () {
		const intensity = this.value / 100;
		state.ambientLightIntensity = intensity;
		if (
			state.activeMesh &&
			state.activeMesh.mesh &&
			state.activeMesh.mesh.material.uniforms &&
			state.activeMesh.mesh.material.uniforms.uAmbientLightIntensity
		) {
			state.activeMesh.mesh.material.uniforms.uAmbientLightIntensity.value =
				intensity;
		}
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
					const { min, max } = updateActiveMesh({ shaders, state });
					updateMinMaxUI(min, max);
					sceneManager.render();
				}
			});

		document
			.getElementById("loaded-meshes-dropdown")
			.addEventListener("change", function (e) {
				sceneManager.saveCameraVersor(state);

				state.activeMeshIndex = parseInt(e.target.value);
				const { min, max } = updateActiveMesh({ shaders, state });
				updateMinMaxUI(min, max);

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
			});

		const meshDropdown = document.getElementById("add-mesh-dropdown");
	meshDropdown.addEventListener("change", async (e) => {
		const value = e.target.value;

		if (value === "file") {
			document.getElementById("raw-mesh").click();
			meshDropdown.value = "";
			return;
		}

		document.body.style.cursor = "wait";
		meshDropdown.disabled = true;

		const placeholder = meshDropdown.querySelector('option[value=""]');
		if (placeholder) placeholder.text = "Loading...";

		try {
			await addTestMesh(
				{
					shaders,
					sceneManager,
					state,
				},
				value,
			);
		} catch (error) {
			console.error("Failed to load test mesh: ", error);
		} finally {
			meshDropdown.disabled = false;
			meshDropdown.value = "";
			if (placeholder) placeholder.text = "Add Mesh";
			document.body.style.cursor = "default";
		}
	});
	document
		.getElementById("raw-mesh")
		.addEventListener("change", function (e) {
			if (e.target.files.length > 0) {
				const file = e.target.files[0];
				processFile({
					file,
					shaders,
					sceneManager,
					state,
				});
				e.target.value = "";
			}
		});

	sceneManager.controls.addEventListener("change", () => {
		if (state.mode != VisMode.ANIMATED) {
			sceneManager.render();
		}
	});

	document
		.getElementById("dynamic-animation")
		.addEventListener("click", () => {
			if (state.activeMeshIndex === -1 || !state.activeMesh) return;
			if (state.mode != VisMode.ANIMATED) {
				state.mode = VisMode.ANIMATED;
				const { min, max } = updateActiveMesh({ shaders, state });
				updateMinMaxUI(min, max);
				sceneManager.startClock();
				sceneManager.resetAnimationState();
				sceneManager.runAnimationLoop(state);
			}
		});

	document.getElementById("color-ramp").addEventListener("click", () => {
		if (state.activeMeshIndex === -1 || !state.activeMesh) return;
		if (state.mode != VisMode.COLOR_RAMP) {
			state.mode = VisMode.COLOR_RAMP;
			const { min, max } = updateActiveMesh({ shaders, state });
			updateMinMaxUI(min, max);
			sceneManager.render();
		}
	});

	document.getElementById("tangent-field").addEventListener("click", () => {
		if (state.activeMeshIndex === -1 || !state.activeMesh) return;
		if (state.mode != VisMode.TANGENT_FIELD) {
			state.mode = VisMode.TANGENT_FIELD;
			const { min, max } = updateActiveMesh({ shaders, state });
			updateMinMaxUI(min, max);
			sceneManager.render();
		}
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
	const result = surfaceSampler({
		mouse,
		camera: sceneManager.camera,
		state,
	});

	if (result && result.hovered) {
		const { values, activeValue } = result;

		document.getElementById("unipolar-value").innerHTML = formatNumber(
			values.unipolar,
		);
		document.getElementById("bipolar-value").innerHTML = formatNumber(
			values.bipolar,
		);
		document.getElementById("lat-value").innerHTML = formatNumber(
			values.lat,
		);
		document.getElementById("eml-value").innerHTML = formatNumber(
			values.eml,
		);
		document.getElementById("exteml-value").innerHTML = formatNumber(
			values.exteml,
		);
		document.getElementById("scar-value").innerHTML = formatNumber(
			values.scar,
		);
		document.getElementById("groupid-value").innerHTML = formatNumber(
			values.groupid,
		);

		setGaugeLine(activeValue, state);
	} else {
		document.getElementById("")
	}
}
