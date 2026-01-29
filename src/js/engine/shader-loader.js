import { updateActiveMesh } from "./mesh-renderer.js";

import staticVertexShader from "@glsl/static-vertex.glsl";
import staticFragmentShader from "@glsl/static-fragment.glsl";
import dynamicVertexShader from "@glsl/dynamic-vertex.glsl";
import dynamicFragmentShader from "@glsl/dynamic-fragment.glsl";
import combinedVertexShader from "@glsl/combined-dynamic-vertex.glsl";
import combinedFragmentShader from "@glsl/combined-dynamic-fragment.glsl";
import tangentVertexShader from "@glsl/tangent-vertex.glsl";
import tangentFragmentShader from "@glsl/tangent-fragment.glsl";

export async function loadShaders() {
	if (!import.meta.env.DEV) {
		return {
			vShader: staticVertexShader,
			fShader: staticFragmentShader,
			dynVShader: dynamicVertexShader,
			dynFShader: dynamicFragmentShader,
			mixVShader: combinedVertexShader,
			mixFShader: combinedFragmentShader,
			tanVShader: tangentVertexShader,
			tanFShader: tangentFragmentShader,
		};
	}

	const timestamp = Date.now();

	const loadShader = async (path) => {
		const response = await fetch(`${path}?t=${timestamp}`);
		return await response.text();
	};

	const [
		vShader,
		fShader,
		dynVShader,
		dynFShader,
		mixVShader,
		mixFShader,
		tanVShader,
		tanFShader,
	] = await Promise.all([
		loadShader("glsl/static-vertex.glsl"),
		loadShader("glsl/static-fragment.glsl"),
		loadShader("glsl/dynamic-vertex.glsl"),
		loadShader("glsl/dynamic-fragment.glsl"),
		loadShader("glsl/combined-dynamic-vertex.glsl"),
		loadShader("glsl/combined-dynamic-fragment.glsl"),
		loadShader("glsl/tangent-vertex.glsl"),
		loadShader("glsl/tangent-fragment.glsl"),
	]);

	return {
		vShader,
		fShader,
		dynVShader,
		dynFShader,
		mixVShader,
		mixFShader,
		tanVShader,
		tanFShader,
	};
}

export async function reloadShaderMaterial(dependencies) {
	const { state } = dependencies;
	const shaders = await loadShaders();
	return updateActiveMesh({ shaders, state });
}
