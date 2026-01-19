import { updateActiveMesh } from "./mesh-update.js";

import staticVertexShader from "@glsl/static-vertex.glsl";
import staticFragmentShader from "@glsl/static-fragment.glsl";
import dynamicVertexShader from "@glsl/dynamic-vertex.glsl";
import dynamicFragmentShader from "@glsl/dynamic-fragment.glsl";

export async function loadShaders() {
	if (!import.meta.env.DEV) {
		return {
			vShader: staticVertexShader,
			fShader: staticFragmentShader,
			dynVShader: dynamicVertexShader,
			dynFShader: dynamicFragmentShader,
		};
	}

	const timestamp = Date.now();

	const loadShader = async (path) => {
		const response = await fetch(`${path}?t=${timestamp}`);
		return await response.text();
	};

	const [vShader, fShader, dynVShader, dynFShader] = await Promise.all([
		loadShader("glsl/static-vertex.glsl"),
		loadShader("glsl/static-fragment.glsl"),
		loadShader("glsl/dynamic-vertex.glsl"),
		loadShader("glsl/dynamic-fragment.glsl"),
	]);

	return { vShader, fShader, dynVShader, dynFShader };
}

export async function reloadShaderMaterial(dependencies) {
	const { state } = dependencies;
	const shaders = await loadShaders();

	updateActiveMesh({ shaders, state });
	return;
}
