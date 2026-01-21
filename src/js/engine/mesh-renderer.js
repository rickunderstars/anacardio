import * as THREE from "three";
import { getMax, get2Min } from "@js/utils/math-utils.js";
import { VisMode } from "@js/core/state-manager.js";

export function updateActiveMesh(dependencies) {
	const { shaders, state } = dependencies;
	const { vShader, fShader, dynVShader, dynFShader, mixVShader, mixFShader } =
		shaders;

	const activeMesh = state.activeMesh;
	const quality = state.activeQuality;
	const [absMin, min] = get2Min(activeMesh.valueSets[quality]);
	const max = getMax(activeMesh.valueSets[quality]);

	activeMesh.mesh.geometry.setAttribute(
		"value",
		new THREE.BufferAttribute(activeMesh.valueSets[quality], 1),
	);
	activeMesh.mesh.material.dispose();

	if (
		state.mode === VisMode.COLOR_RAMP ||
		state.mode === VisMode.TANGENT_FIELD
	) {
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uOnlyTwo: { value: absMin - min == 0 ? 1.0 : 0.0 },
				uAbsMin: { value: absMin },
				uMin: { value: min },
				uMax: { value: max },
				uAmbientLightIntensity: { value: state.ambientLightIntensity },
			},
			vertexShader: vShader,
			fragmentShader: fShader,
			side: THREE.DoubleSide,
		});
		hideAllTangentFields(state);
		if (state.mode === VisMode.TANGENT_FIELD) {
			state.activeMesh.tangentFieldMeshes[quality].visible = true;
		}
	} else if (state.mode === VisMode.ANIMATED) {
		hideAllTangentFields(state);
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uAbsMin: { value: absMin },
				uMin: { value: min },
				uMax: { value: max },
				uTime: { value: 0 },
				uAmbientLightIntensity: { value: state.ambientLightIntensity },
			},
			vertexShader: dynVShader,
			fragmentShader: dynFShader,
			side: THREE.DoubleSide,
		});
	} else if (state.mode === VisMode.MIXED_MODE) {
		hideAllTangentFields(state);
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uAbsMin: { value: absMin },
				uMin: { value: min },
				uMax: { value: max },
				uTime: { value: 0 },
				uAmbientLightIntensity: { value: state.ambientLightIntensity },
			},
			vertexShader: mixVShader,
			fragmentShader: mixFShader,
			side: THREE.DoubleSide,
		});
	}

	return { min, max };
}

export function hideAllTangentFields(state) {
	state.meshes.forEach((meshData) => {
		Object.values(meshData.tangentFieldMeshes).forEach((segMesh) => {
			segMesh.visible = false;
		});
	});
}
