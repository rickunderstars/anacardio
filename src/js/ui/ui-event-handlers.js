import * as THREE from "three";

import { reloadShaderMaterial } from "@js/engine/shader-loader.js";
import { surfaceSampler } from "@js/engine/raycaster.js";
import { setGaugeLine } from "@js/ui/colors.js";
import { updateActiveMesh } from "@js/engine/mesh-renderer.js";
import { addTestMesh } from "@js/io/test-loader.js";
import { VisMode, AppEvents } from "@js/core/state-manager.js";
import { formatNumber, get2Min, getMax } from "@js/utils/math-utils.js";
import { processFile } from "@js/io/file-loader.js";
import { CameraVersors } from "@js/engine/scene-manager.js";
import { renderMeshDropdown } from "@js/ui/ui-file-handlers.js";

export function updateMinMaxUI(min, max, state) {
	document.getElementById("min-value").innerHTML = formatNumber(min);
	document.getElementById("max-value").innerHTML = formatNumber(max);

	let bMin = min;
	let bMax = max;

	if (state && state.activeQuality === "combined" && state.activeMesh) {
		const [, foundMin] = get2Min(state.activeMesh.valueSets["bipolar"]);
		bMin = foundMin;
		bMax = getMax(state.activeMesh.valueSets["bipolar"]);
	}

	document.querySelector("#bipolar-min span").innerHTML =
		formatNumber(bMin);
	document.querySelector("#bipolar-max span").innerHTML =
		formatNumber(bMax);
}

export function setupEventHandlers(dependencies) {
	const { sceneManager, mouse, shaders, state } = dependencies;

	const cameraViews = {
		"camera-front": CameraVersors.FRONT,
		"camera-back": CameraVersors.BACK,
		"camera-top": CameraVersors.TOP,
		"camera-bottom": CameraVersors.BOTTOM,
		"camera-left": CameraVersors.LEFT,
		"camera-right": CameraVersors.RIGHT,
	};

	Object.entries(cameraViews).forEach(([id, versor]) => {
		document.getElementById(id).addEventListener("click", () => {
			if (state.activeMesh) {
				const mesh = state.activeMesh;
				sceneManager.setCamera(mesh.center, mesh.radius, versor, 2.5);
			}
		});
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "r") {
			cameraReset(sceneManager, state);
		}
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "p" || k.key === " ") {
			sceneManager.togglePause();
		}
	});

	document.addEventListener("keydown", (k) => {
		if (k.key.toLowerCase() === "s") {
			console.log("loading shaders...");
			reloadShaderMaterial({ shaders, state }).then((res) => {
				if (res) updateMinMaxUI(res.min, res.max, state);
				sceneManager.render();
			});
			console.log("shaders loaded!!");
		}
	});

	document.addEventListener("keydown", (k) => {
		if (!state.activeMesh) return;
		const mesh = state.activeMesh;
		const key = k.key.toLowerCase();
		const shift = k.shiftKey;

		let versor = null;

		if (key === "x") {
			versor = shift ? CameraVersors.LEFT : CameraVersors.RIGHT;
		} else if (key === "y") {
			versor = shift ? CameraVersors.BOTTOM : CameraVersors.TOP;
		} else if (key === "z") {
			versor = shift ? CameraVersors.BACK : CameraVersors.FRONT;
		}

		if (versor) {
			sceneManager.setCamera(mesh.center, mesh.radius, versor, 2.5);
		}
	});

	document.getElementById("light-slider").oninput = function () {
		const intensity = (100 - this.value) / 100;
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

	document.getElementById("waves-number-slider").oninput = function () {
		const val = parseFloat(this.value);
		state.wavesNumber = val;
		if (
			state.activeMesh &&
			state.activeMesh.mesh &&
			state.activeMesh.mesh.material.uniforms &&
			state.activeMesh.mesh.material.uniforms.uNumWaves
		) {
			state.activeMesh.mesh.material.uniforms.uNumWaves.value = val;
		}
		sceneManager.render();
	};

	document.getElementById("waves-speed-slider").oninput = function () {
		const val = parseFloat(this.value) / 100;
		state.wavesSpeed = val;
		if (
			state.activeMesh &&
			state.activeMesh.mesh &&
			state.activeMesh.mesh.material.uniforms &&
			state.activeMesh.mesh.material.uniforms.uTimeSpeed
		) {
			state.activeMesh.mesh.material.uniforms.uTimeSpeed.value = val;
		}
		sceneManager.render();
	};

	window.addEventListener("resize", () => {
		sceneManager.onWindowResize();
	});

	window.addEventListener("mousemove", (e) => {
		onMouseMove(e, sceneManager, mouse, state);
	});

	updateUIForMode(state);
	updateControlsState(state);

	state.addEventListener(AppEvents.MESH_CHANGED, () => {
		updateControlsState(state);
	});

	state.addEventListener(AppEvents.MODE_CHANGED, () => {
		updateControlsState(state);
	});

	state.addEventListener(AppEvents.QUALITY_CHANGED, () => {
		updateControlsState(state);
	});

	document
		.querySelector('[data-js="qualities-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "quality") {
				const newQuality = e.target.value;
				const restrictedQualities = [
					"eml",
					"exteml",
					"scar",
					"groupid",
				];
				const combinedRestrictedModes = [
					VisMode.COLOR_RAMP,
					VisMode.TANGENT_FIELD,
				];

				if (
					restrictedQualities.includes(newQuality) &&
					(state.mode === VisMode.ANIMATED ||
						state.mode === VisMode.TANGENT_FIELD)
				) {
					state.mode = VisMode.COLOR_RAMP;
				} else if (
					newQuality === "combined" &&
					combinedRestrictedModes.includes(state.mode)
				) {
					state.mode = VisMode.ANIMATED;
				}

				state.activeQuality = newQuality;
				const selectedMode = document.querySelector(
					'[data-js="modes-list"] input[name="mode"]:checked',
				).value;

				if (state.mode !== selectedMode) {
					const modeInput = document.querySelector(
						`input[name="mode"][value="${state.mode}"]`,
					);
					if (modeInput) modeInput.checked = true;
				}

				updateUIForMode(state);
				const { min, max } = updateActiveMesh({ shaders, state });
				updateMinMaxUI(min, max, state);

				if (state.activeQuality === "combined") {
					sceneManager.startClock();
					sceneManager.resetAnimationState();
					sceneManager.runAnimationLoop(state);
				} else if (state.mode === VisMode.ANIMATED) {
					sceneManager.startClock();
					sceneManager.resetAnimationState();
					sceneManager.runAnimationLoop(state);
				} else {
					sceneManager.render();
				}
			}
		});

	const meshDropdown = document.getElementById("add-mesh-dropdown");
	meshDropdown.addEventListener("change", async (e) => {
		const value = e.target.value;

		if (value === "file") {
			document.getElementById("raw-mesh").click();
			renderMeshDropdown(state);
			return;
		}

		if (!isNaN(Number(value)) && value !== "") {
			if (state.activeMesh) {
				sceneManager.saveCameraVersor(state.activeMesh);
			}

			state.activeMeshIndex = parseInt(value);
			const { min, max } = updateActiveMesh({ shaders, state });
			updateMinMaxUI(min, max, state);


			for (let i = 0; i < state.meshes.length; i++) {
				if (i != state.activeMeshIndex) {
					state.meshes[i].mesh.visible = false;
				} else {
					state.meshes[i].mesh.visible = true;
				}
			}

			sceneManager.restoreCameraVersor(state.activeMesh);
			renderMeshDropdown(state);
			return;
		}

		document.body.style.cursor = "wait";
		meshDropdown.disabled = true;

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
			renderMeshDropdown(state);
		} finally {
			meshDropdown.disabled = false;
			document.body.style.cursor = "default";
		}
	});

	sceneManager.controls.addEventListener("change", () => {
		if (
			state.mode != VisMode.ANIMATED &&
			state.activeQuality != "combined"
		) {
			sceneManager.render();
		}
	});

	document
		.querySelector('[data-js="modes-list"]')
		.addEventListener("change", function (e) {
			if (e.target.name === "mode") {
				if (state.activeMeshIndex === -1 || !state.activeMesh) return;

				const newMode = e.target.value;
				const restrictedQualities = [
					"eml",
					"exteml",
					"scar",
					"groupid",
				];
				const combinedQuality = "combined";

				if (
					(newMode === VisMode.ANIMATED ||
						newMode === VisMode.TANGENT_FIELD) &&
					restrictedQualities.includes(state.activeQuality)
				) {
					state.activeQuality = "unipolar";
				} else if (
					(newMode === VisMode.COLOR_RAMP ||
						newMode === VisMode.TANGENT_FIELD) &&
					state.activeQuality === combinedQuality
				) {
					state.activeQuality = "unipolar";
				}

				state.mode = newMode;

				const selectedQuality = document.querySelector(
					'[data-js="qualities-list"] input[name="quality"]:checked',
				).value;
				if (state.activeQuality !== selectedQuality) {
					const qualityInput = document.querySelector(
						`input[name="quality"][value="${state.activeQuality}"]`,
					);
					if (qualityInput) qualityInput.checked = true;
				}

				if (state.mode != newMode) {
				}
				updateUIForMode(state);
				const { min, max } = updateActiveMesh({ shaders, state });
				updateMinMaxUI(min, max, state);

				if (newMode === VisMode.ANIMATED) {
					sceneManager.startClock();
					sceneManager.resetAnimationState();
					sceneManager.runAnimationLoop(state);
				} else {
					sceneManager.render();
				}
			}
		});
}

function cameraReset(sceneManager, state) {
	if (!state.activeMesh) return;
	const center = state.activeMesh.center;
	const radius = state.activeMesh.radius;
	sceneManager.setCamera(center, radius, new THREE.Vector3(0, 0, 1), 2.5);
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

		document.getElementById("sampler-value").innerHTML =
			formatNumber(activeValue);

		setGaugeLine(activeValue, state);
	} else {
		document.getElementById("sampler-value").innerHTML = "---";
	}
}

function updateUIForMode(state) {
	const wavesNumberContainer = document.getElementById(
		"waves-number-container",
	);
	const wavesSpeedContainer = document.getElementById(
		"waves-speed-container",
	);
	const verticalTitle = document.getElementById("vertical-gradient-title");

	const horizontalTitle = document.getElementById(
		"horizontal-gradient-title",
	);

	if (state.mode === VisMode.ANIMATED || state.activeQuality === "combined") {
		wavesNumberContainer.classList.remove("hidden");
		wavesSpeedContainer.classList.remove("hidden");
	} else {
		wavesNumberContainer.classList.add("hidden");
		wavesSpeedContainer.classList.add("hidden");
	}

	const colorGauge = document.getElementById("color-gauge");

	if (state.activeQuality === "combined") {
		horizontalTitle.classList.remove("hidden");
		verticalTitle.innerHTML = "&LongLeftArrow; LAT &LongRightArrow;";
		document.getElementById("bipolar-min").classList.remove("hidden");
		document.getElementById("bipolar-max").classList.remove("hidden");

		colorGauge.classList.remove("w-1/16");
		colorGauge.classList.add("w-1/12");
	} else {
		horizontalTitle.classList.add("hidden");
		verticalTitle.innerHTML =
			"&LongLeftArrow; " +
			state.activeQuality.toUpperCase() +
			" &LongRightArrow;";
		document.getElementById("bipolar-min").classList.add("hidden");
		document.getElementById("bipolar-max").classList.add("hidden");

		colorGauge.classList.remove("w-1/12");
		colorGauge.classList.add("w-1/16");
	}
}

function updateControlsState(state) {
	const isDisabled = state.activeMeshIndex === -1;
	const modeRadios = document.querySelectorAll('input[name="mode"]');
	const qualityRadios = document.querySelectorAll('input[name="quality"]');

	const restrictedQualities = ["eml", "exteml", "scar", "groupid"];
	const restrictedModes = [VisMode.ANIMATED, VisMode.TANGENT_FIELD];

	const combinedQuality = "combined";
	const combinedRestrictedModes = [VisMode.COLOR_RAMP, VisMode.TANGENT_FIELD];

	modeRadios.forEach((radio) => {
		radio.disabled = isDisabled;
		const label = radio.closest("label");
		if (!label) return;

		if (isDisabled) {
			return;
		}

		const isRestrictedByQualities =
			restrictedModes.includes(radio.value) &&
			restrictedQualities.includes(state.activeQuality);

		const isRestrictedByCombined =
			combinedRestrictedModes.includes(radio.value) &&
			state.activeQuality === combinedQuality;

		if (isRestrictedByQualities || isRestrictedByCombined) {
			label.classList.add("opacity-50");
		} else {
			label.classList.remove("opacity-50");
		}
	});

	qualityRadios.forEach((radio) => {
		radio.disabled = isDisabled;
		const label = radio.closest("label");
		if (!label) return;

		if (isDisabled) {
			return;
		}

		const isRestrictedByModes =
			restrictedQualities.includes(radio.value) &&
			restrictedModes.includes(state.mode);

		const isRestrictedByCombined =
			radio.value === combinedQuality &&
			combinedRestrictedModes.includes(state.mode);

		if (isRestrictedByModes || isRestrictedByCombined) {
			label.classList.add("opacity-50");
		} else {
			label.classList.remove("opacity-50");
		}
	});

	const ticks = document.querySelectorAll("span[data-tick]");
	ticks.forEach((tick) => {
		if (state.activeQuality === "combined") {
			tick.classList.remove("hidden");
		} else {
			tick.classList.add("hidden");
		}
	});
}
