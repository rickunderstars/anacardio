import "@css/styles.css";

import * as THREE from "three";

import { SceneManager } from "@js/engine/scene-manager.js";
import { StateManager, VisMode } from "@js/core/state-manager.js";
import { setupFileHandlers } from "@js/ui/ui-file-handlers.js";
import { loadShaders } from "@js/engine/shader-loader.js";
import { setupEventHandlers } from "@js/ui/ui-event-handlers.js";
import { colorizeGradient } from "@js/ui/color-gauge.js";

const viewport = document.getElementById("viewport");
export const sceneManager = new SceneManager(viewport);
export const state = new StateManager();

const mouse = new THREE.Vector2();

if (state.mode != VisMode.ANIMATED) {
	sceneManager.render();
} else {
	sceneManager.runAnimationLoop(state);
}

let shaders = await loadShaders();

state.activeMeshIndex = -1;

state.activeQuality = document.querySelector(
	'[data-js="qualities-list"] input[name="quality"]:checked',
).value;

setupFileHandlers({
	shaders,
	sceneManager,
	state,
	viewport,
});

setupEventHandlers({
	sceneManager,
	mouse,
	shaders,
	state,
});

colorizeGradient();
