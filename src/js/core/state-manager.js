export const VisMode = Object.freeze({
	COLOR_RAMP: "color-ramp",
	ANIMATED: "animated",
	TANGENT_FIELD: "tangent-field",
});

export const AppEvents = Object.freeze({
	MESH_CHANGED: "mesh-changed",
	QUALITY_CHANGED: "quality-changed",
	MODE_CHANGED: "mode-changed",
	LIGHT_INTENSITY_CHANGED: "light-intensity-changed",
	SPECULAR_INTENSITY_CHANGED: "specular-intensity-changed",
	WAVES_NUMBER_CHANGED: "waves-number-changed",
	WAVES_SPEED_CHANGED: "waves-speed-changed",
	IS_BINARY_CHANGED: "is-binary-changed",
});

export class StateManager extends EventTarget {
	meshes = [];

	#activeMeshIndex = -1;
	#activeQuality = "unipolar";
	#mode = VisMode.COLOR_RAMP;
	#ambientLightIntensity = 0.6;
	#specularIntensity = 0.0;
	#waveNumber = 1;
	#waveSpeedMultiplier = 0.05;
	#isBinary = false;

	get activeMesh() {
		return this.meshes[this.#activeMeshIndex] ?? null;
	}

	get activeMeshIndex() {
		return this.#activeMeshIndex;
	}

	set activeMeshIndex(index) {
		if (this.#activeMeshIndex === index) return;
		this.#activeMeshIndex = index;
		this.dispatchEvent(new CustomEvent(AppEvents.MESH_CHANGED));
	}

	get activeQuality() {
		return this.#activeQuality;
	}

	set activeQuality(quality) {
		if (this.#activeQuality === quality) return;
		this.#activeQuality = quality;
		this.dispatchEvent(new CustomEvent(AppEvents.QUALITY_CHANGED));
	}

	get mode() {
		return this.#mode;
	}

	set mode(mode) {
		if (this.#mode === mode) return;
		this.#mode = mode;
		this.dispatchEvent(new CustomEvent(AppEvents.MODE_CHANGED));
	}

	get ambientLightIntensity() {
		return this.#ambientLightIntensity;
	}

	set ambientLightIntensity(intensity) {
		const clamped = Math.max(0, Math.min(1, intensity));
		if (this.#ambientLightIntensity === clamped) return;
		this.#ambientLightIntensity = clamped;
		this.dispatchEvent(new CustomEvent(AppEvents.LIGHT_INTENSITY_CHANGED));
	}

	get specularIntensity() {
		return this.#specularIntensity;
	}

	set specularIntensity(intensity) {
		const clamped = Math.max(0, Math.min(1, intensity));
		if (this.#specularIntensity === clamped) return;
		this.#specularIntensity = clamped;
		this.dispatchEvent(new CustomEvent(AppEvents.SPECULAR_INTENSITY_CHANGED));
	}

	get waveNumber() {
		return this.#waveNumber;
	}

	set waveNumber(waves) {
		if (this.#waveNumber == waves) return;
		this.#waveNumber = waves;
		this.dispatchEvent(new CustomEvent(AppEvents.WAVES_NUMBER_CHANGED));
		this.dispatchEvent(new CustomEvent(AppEvents.WAVES_SPEED_CHANGED));
	}

	get waveSpeedMultiplier() {
		return this.#waveSpeedMultiplier;
	}

	set waveSpeedMultiplier(multiplier) {
		if (this.#waveSpeedMultiplier == multiplier) return;
		this.#waveSpeedMultiplier = multiplier;
		this.dispatchEvent(new CustomEvent(AppEvents.WAVES_SPEED_CHANGED));
	}

	get waveSpeed() {
		return this.#waveSpeedMultiplier / Math.sqrt(this.#waveNumber);
	}

	get isBinary() {
		return this.#isBinary;
	}

	set isBinary(value) {
		if (this.#isBinary === value) return;
		this.#isBinary = value;
		this.dispatchEvent(new CustomEvent(AppEvents.IS_BINARY_CHANGED));
	}

	addMesh(meshData) {
		this.meshes.push(meshData);
		this.activeMeshIndex = this.meshes.length - 1;
	}
}
