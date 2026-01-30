import * as THREE from "three";
import { getMax, get2Min, areValuesClose } from "@js/utils/math-utils.js";
import { VisMode } from "@js/core/state-manager.js";
import { SHADER_COLORS } from "@js/ui/colors.js";

export function updateActiveMesh(dependencies) {
	const { shaders, state } = dependencies;
	const {
		vShader,
		fShader,
		dynVShader,
		dynFShader,
		mixVShader,
		mixFShader,
		tanVShader,
		tanFShader,
		gradVShader,
		gradFShader,
		mixStaticVShader,
		mixStaticFShader,
	} = shaders;

	if (state.activeMeshIndex < 0) {
		return;
	}

	if (state.activeQuality === "combined") {
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
		activeMesh.mesh.geometry.setAttribute(
			"groupid",
			new THREE.BufferAttribute(activeMesh.valueSets["groupid"], 1),
		);

		state.isBinary = false;
		hideAllTangentFields(state);

		if (state.mode === VisMode.TANGENT_FIELD) {
			activeMesh.mesh.geometry.setAttribute(
				"value",
				new THREE.BufferAttribute(activeMesh.valueSets["bipolar"], 1),
			);
			activeMesh.mesh.material = new THREE.ShaderMaterial({
				uniforms: {
					uMin: { value: bipAbsMin },
					uMax: { value: bipMax },
					uAmbientLightIntensity: {
						value: state.ambientLightIntensity,
					},
					uColor1: {
						value: new THREE.Vector3(
							...SHADER_COLORS.COMBINED_GRADIENT_START,
						),
					},
					uColor2: {
						value: new THREE.Vector3(
							...SHADER_COLORS.COMBINED_GRADIENT_END,
						),
					},
					uExtemlColor: {
						value: new THREE.Vector3(...SHADER_COLORS.EXTEML),
					},
					uNullColor: {
						value: new THREE.Vector3(...SHADER_COLORS.NULL),
					},
				},
				vertexShader: gradVShader,
				fragmentShader: gradFShader,
				side: THREE.DoubleSide,
			});
			activeMesh.tangentFieldMeshes["combined"].visible = true;
			return { min: bipMin, max: bipMax };
		} else if (state.mode === VisMode.COLOR_RAMP) {
			activeMesh.mesh.material = new THREE.ShaderMaterial({
				uniforms: {
					uLatMin: { value: latMin },
					uLatMax: { value: latMax },
					uBipMin: { value: bipMin },
					uBipMax: { value: bipMax },
					uAmbientLightIntensity: {
						value: state.ambientLightIntensity,
					},
					uColorTL: {
						value: new THREE.Vector3(...SHADER_COLORS.COMBINED_TL),
					},
					uColorTR: {
						value: new THREE.Vector3(...SHADER_COLORS.COMBINED_TR),
					},
					uColorBL: {
						value: new THREE.Vector3(...SHADER_COLORS.COMBINED_BL),
					},
					uColorBR: {
						value: new THREE.Vector3(...SHADER_COLORS.COMBINED_BR),
					},
				},
				vertexShader: mixStaticVShader,
				fragmentShader: mixStaticFShader,
				side: THREE.DoubleSide,
			});
		} else {
			activeMesh.mesh.material = new THREE.ShaderMaterial({
				uniforms: {
					uBipAbsMin: { value: bipAbsMin },
					uBipMin: { value: bipMin },
					uBipMax: { value: bipMax },
					uLatAbsMin: { value: latAbsMin },
					uLatMin: { value: latAbsMin },
					uLatMax: { value: latMax },
					uTime: { value: 0 },
					uAmbientLightIntensity: {
						value: state.ambientLightIntensity,
					},
					uTimeSpeed: { value: state.wavesSpeed },
					uNumWaves: { value: state.wavesNumber },
					uNullColor: {
						value: new THREE.Vector3(...SHADER_COLORS.NULL),
					},
					uWaveStartColor: {
						value: new THREE.Vector3(...SHADER_COLORS.WAVE_START),
					},
					uWavePolarStart: {
						value: new THREE.Vector3(
							...SHADER_COLORS.WAVE_POLAR_START,
						),
					},
					uWavePolarEnd: {
						value: new THREE.Vector3(
							...SHADER_COLORS.WAVE_POLAR_END,
						),
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

		return { min: latMin, max: latMax };
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

	const isBinary = areValuesClose(absMin, min) || areValuesClose(min, max);
	state.isBinary = isBinary;
	const renderMin = isBinary ? absMin : min;
	const renderMax = isBinary && areValuesClose(absMin, max) ? max + 1.0 : max;

	if (state.mode === VisMode.COLOR_RAMP) {
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uOnlyTwo: { value: isBinary ? 1.0 : 0.0 },
				uMin: { value: renderMin },
				uMax: { value: renderMax },
				uAmbientLightIntensity: { value: state.ambientLightIntensity },
				uBinColor1: {
					value: new THREE.Vector3(...SHADER_COLORS.BIN_COLOR_1),
				},
				uBinColor2: {
					value: new THREE.Vector3(...SHADER_COLORS.BIN_COLOR_2),
				},
			},
			vertexShader: vShader,
			fragmentShader: fShader,
			side: THREE.DoubleSide,
		});
		hideAllTangentFields(state);
	} else if (state.mode === VisMode.TANGENT_FIELD) {
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uMin: { value: renderMin },
				uMax: { value: renderMax },
				uAmbientLightIntensity: { value: state.ambientLightIntensity },
				uColor: {
					value: new THREE.Vector3(
						...SHADER_COLORS.GRADIENT_BACKGROUND,
					),
				},
			},
			vertexShader: tanVShader,
			fragmentShader: tanFShader,
			side: THREE.DoubleSide,
		});
		hideAllTangentFields(state);
		state.activeMesh.tangentFieldMeshes[quality].visible = true;
	} else if (state.mode === VisMode.ANIMATED) {
		hideAllTangentFields(state);
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uMin: { value: min },
				uMax: { value: max },
				uTime: { value: 0 },
				uAmbientLightIntensity: { value: state.ambientLightIntensity },
				uTimeSpeed: { value: state.wavesSpeed },
				uNumWaves: { value: state.wavesNumber },
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
