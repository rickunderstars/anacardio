import * as THREE from "three";
import { getMax, get2Min } from "@js/utils/math-utils.js";
import { VisMode } from "@js/core/state-manager.js";
import { SHADER_COLORS } from "@js/ui/color-gauge.js";

export function updateActiveMesh(dependencies) {
	const { shaders, state } = dependencies;
	const { vShader, fShader, dynVShader, dynFShader, mixVShader, mixFShader } =
		shaders;

	if (state.activeMeshIndex < 0) {
		return;
	}

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
				uNullColor: {
					value: new THREE.Vector3(...SHADER_COLORS.NULL_STATIC),
				},
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
				uTimeSpeed: { value: state.wavesSpeed },
				uNumWaves: { value: state.wavesNumber },
				uNullColor: {
					value: new THREE.Vector3(...SHADER_COLORS.NULL),
				},
				uWaveStartColor: {
					value: new THREE.Vector3(...SHADER_COLORS.WAVE_START),
				},
				uWaveEndColor: {
					value: new THREE.Vector3(...SHADER_COLORS.WAVE_END),
				},
			},
			vertexShader: dynVShader,
			fragmentShader: dynFShader,
			side: THREE.DoubleSide,
		});
	} else if (state.mode === VisMode.MIXED_MODE) {
		const activeMesh = state.activeMesh;
		const [bipAbsMin, bipMin] = get2Min(activeMesh.valueSets["bipolar"]);
		const bipMax = getMax(activeMesh.valueSets["bipolar"]);
		const [latAbsMin, latMin] = get2Min(activeMesh.valueSets["lat"]);
		const latMax = getMax(activeMesh.valueSets["lat"]);

		activeMesh.mesh.geometry.setAttribute(
			"bipolar",
			new THREE.BufferAttribute(activeMesh.valueSets["bipolar"], 1),
		);
		activeMesh.mesh.geometry.setAttribute(
			"lat",
			new THREE.BufferAttribute(activeMesh.valueSets["lat"], 1),
		);
		activeMesh.mesh.geometry.setAttribute(
			"exteml",
			new THREE.BufferAttribute(activeMesh.valueSets["exteml"], 1),
		);

		hideAllTangentFields(state);
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uBipAbsMin: { value: bipAbsMin },
				uBipMin: { value: bipMin },
				uBipMax: { value: bipMax },
				uLatAbsMin: { value: latAbsMin },
				uLatMin: { value: latMin },
				uLatMax: { value: latMax },
				uTime: { value: 0 },
				uAmbientLightIntensity: { value: state.ambientLightIntensity },
				uTimeSpeed: { value: state.wavesSpeed },
				uNumWaves: { value: state.wavesNumber },
				uNullColor: {
					value: new THREE.Vector3(...SHADER_COLORS.NULL),
				},
				uWaveStartColor: {
					value: new THREE.Vector3(...SHADER_COLORS.WAVE_START),
				},
				uWavePolarStart: {
					value: new THREE.Vector3(...SHADER_COLORS.WAVE_POLAR_START),
				},
				uWavePolarEnd: {
					value: new THREE.Vector3(...SHADER_COLORS.WAVE_POLAR_END),
				},
				uExtemlColor: {
					value: new THREE.Vector3(...SHADER_COLORS.EXTEML),
				},
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
