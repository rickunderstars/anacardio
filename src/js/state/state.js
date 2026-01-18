class State {
	meshes = [];
	activeMesh = -1;
	activeQuality = "unipolar";
	mode = visMode.COLOR_RAMP;
	ambientLightIntensity = 0.6;
	lastCameraVersor = null;

	getActiveMesh() {
		return this.meshes[this.activeMesh] ?? null;
	}

	setActiveMesh(index) {
		this.activeMesh = index;
	}

	setActiveQuality(quality) {
		this.activeQuality = quality;
	}

	setMode(mode) {
		this.mode = mode;
	}

	setAmbientLightIntensity(intensity) {
		if (intensity > 1) {
			intensity = 1;
		} else if (intensity < 0) {
			intensity = 0;
		}
		this.ambientLightIntensity = intensity;
		this.getActiveMesh().mesh.material.uniforms.uAmbientLightIntensity.value =
			intensity;
	}
}

export const visMode = Object.freeze({
	COLOR_RAMP: "color-ramp",
	ANIMATED: "animated",
	TANGENT_FIELD: "tangent-field",
});

const state = new State();

export default state;
