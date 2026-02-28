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
	#wavesNumber = 1;
	#wavesSpeed = 0.05;
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

	get wavesNumber() {
		return this.#wavesNumber;
	}

	set wavesNumber(waves) {
		if (this.#wavesNumber == waves) return;
		this.#wavesNumber = waves;
		this.dispatchEvent(new CustomEvent(AppEvents.WAVES_NUMBER_CHANGED));
	}

	get wavesSpeed() {
		return this.#wavesSpeed;
	}

	set wavesSpeed(speed) {
		if (this.#wavesSpeed == speed) return;
		this.#wavesSpeed = speed;
		this.dispatchEvent(new CustomEvent(AppEvents.WAVES_SPEED_CHANGED));
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
