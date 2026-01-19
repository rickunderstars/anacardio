import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

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
		this.render();
	}

		getElapsedTime() {

			return this.clock.getElapsedTime();

		}

	    

	    startClock() {

	        this.clock.start();

	    }

	

		saveCameraVersor(state) {

			const versor = new THREE.Vector3();

			versor.subVectors(this.camera.position, this.controls.target).normalize();

			state.lastCameraVersor = versor;

		}

	

		restoreCameraVersor(center, objectSize, state) {

			this.controls.target.copy(center);

	

			const distance = objectSize * 1.8;

	

			const offset = state.lastCameraVersor.clone().multiplyScalar(distance);

			this.camera.position.copy(center).add(offset);

	

			this.controls.update();

		}

	

		resetCamera(center, radius) {

			this.camera.position.set(center.x, center.y, center.z + radius * 2.5);

			this.controls.target.set(center.x, center.y, center.z);

			this.controls.update();

		}

	}

	
