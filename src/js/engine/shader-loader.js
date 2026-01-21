import { updateActiveMesh } from "./mesh-renderer.js";

import staticVertexShader from "@glsl/static-vertex.glsl";
import staticFragmentShader from "@glsl/static-fragment.glsl";
import dynamicVertexShader from "@glsl/dynamic-vertex.glsl";
import dynamicFragmentShader from "@glsl/dynamic-fragment.glsl";
import mixedVertexShader from "@glsl/mixed-vertex.glsl";
import mixedFragmentShader from "@glsl/mixed-fragment.glsl";

export async function loadShaders() {
	if (!import.meta.env.DEV) {
		return {
			vShader: staticVertexShader,
			fShader: staticFragmentShader,
			dynVShader: dynamicVertexShader,
			dynFShader: dynamicFragmentShader,
			mixVShader: mixedVertexShader,
			mixFShader: mixedFragmentShader,
		};
	}

	const timestamp = Date.now();

	const loadShader = async (path) => {
		const response = await fetch(`${path}?t=${timestamp}`);
		return await response.text();
	};

	const [vShader, fShader, dynVShader, dynFShader, mixVShader, mixFShader] =
		await Promise.all([
			loadShader("glsl/static-vertex.glsl"),
			loadShader("glsl/static-fragment.glsl"),
			loadShader("glsl/dynamic-vertex.glsl"),
			loadShader("glsl/dynamic-fragment.glsl"),
			loadShader("glsl/mixed-vertex.glsl"),
			loadShader("glsl/mixed-fragment.glsl"),
		]);

	return { vShader, fShader, dynVShader, dynFShader, mixVShader, mixFShader };
}

export async function reloadShaderMaterial(dependencies) {
	const { state } = dependencies;
	const shaders = await loadShaders();
	return updateActiveMesh({ shaders, state });
}
