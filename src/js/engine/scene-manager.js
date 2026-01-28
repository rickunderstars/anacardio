import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { VisMode } from "@js/core/state-manager.js";

export const CameraVersors = Object.freeze({
	FRONT: new THREE.Vector3(0, 0, 1),
	BACK: new THREE.Vector3(0, 0, -1),
	TOP: new THREE.Vector3(0, 1, 0),
	BOTTOM: new THREE.Vector3(0, -1, 0),
	LEFT: new THREE.Vector3(-1, 0, 0),
	RIGHT: new THREE.Vector3(1, 0, 0),
});

export class SceneManager {
	constructor(viewport) {
		this.viewport = viewport;

		this.scene = new THREE.Scene();
		this.renderer = this.#createRenderer();
		this.camera = this.#createCamera();

		this.controls = new OrbitControls(
			this.camera,
			this.renderer.domElement,
		);
		this.clock = new THREE.Clock();

		this.viewport.append(this.renderer.domElement);

		this.fps = 120;
		this.interval = 1000 / this.fps;
		this.lastTime = 0;
		this.onRender = null;
	}

	#createRenderer() {
		const renderer = new THREE.WebGLRenderer({ alpha: true });
		renderer.setSize(this.viewport.clientWidth, this.viewport.clientHeight);
		return renderer;
	}

	#createCamera() {
		const camera = new THREE.PerspectiveCamera(
			50,
			this.viewport.clientWidth / this.viewport.clientHeight,
		);
		camera.position.z = 5;
		return camera;
	}

	render() {
		if (this.onRender) {
			this.onRender();
		}
		this.renderer.render(this.scene, this.camera);
	}

	onWindowResize() {
		this.camera.aspect =
			this.viewport.clientWidth / this.viewport.clientHeight;
		this.camera.updateProjectionMatrix();
		this.renderer.setSize(
			this.viewport.clientWidth,
			this.viewport.clientHeight,
		);

		const width = this.viewport.clientWidth;
		const height = this.viewport.clientHeight;

		this.scene.traverse((object) => {
			if (
				object.isLineSegments2 &&
				object.material &&
				object.material.resolution
			) {
				object.material.resolution.set(width, height);
			}
		});

		this.render();
	}

	getElapsedTime() {
		return this.clock.getElapsedTime();
	}

	startClock() {
		this.clock.start();
	}

	resetAnimationState() {
		this.lastTime = 0;
	}

	runAnimationLoop(state, timeStamp = 0) {
		if (
			state.mode != VisMode.ANIMATED &&
			state.activeQuality != "combined"
		) {
			this.render();
			return;
		}

		requestAnimationFrame((t) => this.runAnimationLoop(state, t));

		if (!this.lastTime) this.lastTime = timeStamp;

		const delta = timeStamp - this.lastTime;

		if (delta > this.interval) {
			this.lastTime = timeStamp - (delta % this.interval);

			if (state.activeMeshIndex !== -1 && state.activeMesh) {
				if (
					state.activeMesh.mesh.material.uniforms &&
					state.activeMesh.mesh.material.uniforms.uTime
				) {
					state.activeMesh.mesh.material.uniforms.uTime.value =
						this.getElapsedTime();
				}
			}

			this.render();
		}
	}

	saveCameraVersor(meshData) {
		if (!meshData) return;
		const versor = new THREE.Vector3();
		versor
			.subVectors(this.camera.position, this.controls.target)
			.normalize();
		meshData.cameraVersor = versor;
	}

	restoreCameraVersor(meshData) {
		const versor = meshData.cameraVersor ?? CameraVersors.FRONT;
		this.setCamera(meshData.center, meshData.radius, versor, 2.5);
	}

	setCamera(center, radius, versor, distanceMultiplier = 2.5) {
		this.controls.target.copy(center);
		const distance = radius * distanceMultiplier;
		const offset = versor.clone().normalize().multiplyScalar(distance);
		this.camera.position.copy(center).add(offset);
		this.controls.update();
	}
}
