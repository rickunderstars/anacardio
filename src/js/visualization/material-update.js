import * as THREE from "three";
import { getMax, get2Min, formatNumber } from "../utils/math-utils.js";
import { visMode } from "../state/state.js";

export function updateActiveMaterial(dependencies) {
	const { state, shaders } = dependencies;

	const { vShader, fShader, dynVShader, dynFShader } = shaders;

	const activeMesh = state.getActiveMesh();
	const quality = state.activeQuality;
	const [absMin, min] = get2Min(activeMesh.valueSets[quality]);
	const max = getMax(activeMesh.valueSets[quality]);
	activeMesh.mesh.geometry.setAttribute(
		"value",
		new THREE.BufferAttribute(activeMesh.valueSets[quality], 1),
	);
	activeMesh.mesh.material.dispose();
	if (state.mode === visMode.COLOR_RAMP) {
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
		state.getActiveMesh().normalsMesh.visible = false;
	} else if (state.mode === visMode.ANIMATED) {
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
		state.getActiveMesh().normalsMesh.visible = false;
	} else if (state.mode == visMode.TANGENT_FIELD) {
		activeMesh.mesh.material = new THREE.ShaderMaterial({
			uniforms: {
				uOnlyTwo: { value: absMin - min == 0 ? 1.0 : 0.0 },
				uAbsMin: { value: absMin },
				uMin: { value: min },
				uMax: { value: max },
				uAmbientLightIntensity: {
					value: state.ambientLightIntensity,
				},
			},
			vertexShader: vShader,
			fragmentShader: fShader,
			side: THREE.DoubleSide,
		});
		state.getActiveMesh().normalsMesh.visible = true;
	}

	document.getElementById("min-value").innerHTML =
		"min<br/>" + formatNumber(min);
	document.getElementById("max-value").innerHTML =
		"max<br/>" + formatNumber(max);
}
