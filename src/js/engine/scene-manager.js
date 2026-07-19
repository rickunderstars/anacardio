import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { OBJLoader } from "three/addons/loaders/OBJLoader.js";
import { VisMode } from "@js/core/state-manager.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";

export const STANDARD_CAMERA_DISTANCE = 2.1;

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

		this.gimbalScene = new THREE.Scene();

		const ambientLight = new THREE.AmbientLight(0xffffff, 1.7);
		this.gimbalScene.add(ambientLight);

		this.gimbalCamera = new THREE.OrthographicCamera(-2, 2, 2, -2, 0.1, 10);
		this.gimbalCamera.position.z = 5;

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
		directionalLight.position.set(1, 1, 1);
		this.gimbalCamera.add(directionalLight);
		this.gimbalCamera.add(directionalLight.target);
		directionalLight.target.position.set(0, 0, 0);
		this.gimbalScene.add(this.gimbalCamera);

		const textureLoader = new THREE.TextureLoader();
		const texture = textureLoader.load(
			`${import.meta.env.BASE_URL}faccino.png`,
		);

		const loader = new OBJLoader();
		loader.load(
			`${import.meta.env.BASE_URL}faccino.obj`,
			(obj) => {
				const box = new THREE.Box3().setFromObject(obj);
				const center = box.getCenter(new THREE.Vector3());
				const size = box.getSize(new THREE.Vector3());

				const maxDim = Math.max(size.x, size.y, size.z);
				const scale = 2.0 / maxDim;

				const wrapper = new THREE.Group();
				wrapper.add(obj);

				obj.position.sub(center);

				wrapper.scale.setScalar(scale);

				obj.traverse((child) => {
					if (child.isMesh) {
						if (child.geometry) {
							child.geometry.deleteAttribute("normal");
							const merged = BufferGeometryUtils.mergeVertices(
								child.geometry,
								1e-4,
							);
							merged.computeVertexNormals();
							child.geometry = merged;
						}
						child.material = new THREE.MeshPhongMaterial({
							map: texture,
							vertexColors: !!child.geometry.attributes.color,
							shininess: 50,
						});
					}
				});

				this.gimbalScene.add(wrapper);
			},
			undefined,
			(error) => {
				console.error("Gimbal load error:", error);
			},
		);

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

		this.isPaused = false;
		this.accumulatedTime = 0;
		this.isGimbalVisible = true;
		this.cameraTween = null;
		this.isAnimatingCamera = false;

		this.resizeObserver = new ResizeObserver(() => {
			this.onWindowResize();
		});
		this.resizeObserver.observe(this.viewport);
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

		this.renderer.setViewport(
			0,
			0,
			this.viewport.clientWidth,
			this.viewport.clientHeight,
		);
		this.renderer.setScissor(
			0,
			0,
			this.viewport.clientWidth,
			this.viewport.clientHeight,
		);
		this.renderer.setScissorTest(true);

		this.renderer.render(this.scene, this.camera);

		if (this.isGimbalVisible) {
			const minDim = Math.min(
				this.viewport.clientWidth,
				this.viewport.clientHeight,
			);
			const gimbalSize = minDim * 0.2;
			const padding = minDim * 0.02;
			const left = this.viewport.clientWidth - gimbalSize - padding;
			const bottom = this.viewport.clientHeight - gimbalSize - padding;

			this.gimbalCamera.position
				.copy(this.camera.position)
				.sub(this.controls.target)
				.normalize()
				.multiplyScalar(5);
			this.gimbalCamera.lookAt(0, 0, 0);
			this.gimbalCamera.updateMatrixWorld();

			this.renderer.setViewport(left, bottom, gimbalSize, gimbalSize);
			this.renderer.setScissor(left, bottom, gimbalSize, gimbalSize);
			this.renderer.setScissorTest(true);

			this.renderer.autoClear = false;
			this.renderer.clearDepth();
			this.renderer.render(this.gimbalScene, this.gimbalCamera);
			this.renderer.autoClear = true;
		}

		this.renderer.setScissorTest(false);
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
		return this.accumulatedTime;
	}

	togglePause() {
		this.isPaused = !this.isPaused;
		const el = document.getElementById("pause-indicator");
		if (this.isPaused) {
			el.classList.remove("hidden");
		} else {
			el.classList.add("hidden");
		}
	}

	toggleGimbal() {
		this.isGimbalVisible = !this.isGimbalVisible;
		this.render();
	}

	skipTime(amount) {
		this.accumulatedTime = Math.max(0, this.accumulatedTime + amount);
	}

	startClock() {
		this.clock.start();
		this.accumulatedTime = 10000.0;
	}

	resetAnimationState() {
		this.lastTime = 0;
	}

	runAnimationLoop(state, timeStamp = 0) {
		if (state.mode != VisMode.ANIMATED) {
			this.render();
			return;
		}

		requestAnimationFrame((t) => this.runAnimationLoop(state, t));

		const clockDelta = this.clock.getDelta();
		if (!this.isPaused) {
			this.accumulatedTime += clockDelta;
		}

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
						this.accumulatedTime;
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
		this.setCamera(
			meshData.center,
			meshData.radius,
			versor,
			STANDARD_CAMERA_DISTANCE,
		);
	}

	setCamera(
		center,
		radius,
		versor,
		distanceMultiplier = STANDARD_CAMERA_DISTANCE,
		animate = true,
	) {
		const targetTarget = center.clone();
		const distance = radius * distanceMultiplier;
		const targetPosition = center
			.clone()
			.add(versor.clone().normalize().multiplyScalar(distance));

		if (!animate) {
			this.controls.target.copy(targetTarget);
			this.camera.position.copy(targetPosition);
			this.controls.update();
			this.render();
			return;
		}

		if (this.cameraTween) cancelAnimationFrame(this.cameraTween);

		const startPosition = this.camera.position.clone();
		const startTarget = this.controls.target.clone();
		const duration = 250;
		const startTime = performance.now();

		const startOffset = new THREE.Vector3().subVectors(
			startPosition,
			startTarget,
		);
		const targetOffset = new THREE.Vector3().subVectors(
			targetPosition,
			targetTarget,
		);

		const startSpherical = new THREE.Spherical().setFromVector3(
			startOffset,
		);
		const targetSpherical = new THREE.Spherical().setFromVector3(
			targetOffset,
		);

		let startTheta = startSpherical.theta;
		let targetTheta = targetSpherical.theta;

		while (targetTheta - startTheta > Math.PI) targetTheta -= 2 * Math.PI;
		while (targetTheta - startTheta < -Math.PI) targetTheta += 2 * Math.PI;

		this.isAnimatingCamera = true;

		const animateStep = (now) => {
			const elapsed = now - startTime;
			const progress = Math.min(elapsed / duration, 1);
			const ease = 1 - Math.pow(1 - progress, 3);

			const currentTarget = new THREE.Vector3().lerpVectors(
				startTarget,
				targetTarget,
				ease,
			);

			const currentRadius =
				startSpherical.radius +
				(targetSpherical.radius - startSpherical.radius) * ease;
			const currentPhi =
				startSpherical.phi +
				(targetSpherical.phi - startSpherical.phi) * ease;
			const currentTheta = startTheta + (targetTheta - startTheta) * ease;

			const currentSpherical = new THREE.Spherical(
				currentRadius,
				currentPhi,
				currentTheta,
			);
			const currentOffset = new THREE.Vector3().setFromSpherical(
				currentSpherical,
			);

			this.camera.position.copy(currentTarget).add(currentOffset);
			this.controls.target.copy(currentTarget);

			this.controls.update();
			this.render();

			if (progress < 1) {
				this.cameraTween = requestAnimationFrame(animateStep);
			} else {
				this.cameraTween = null;
				this.isAnimatingCamera = false;
			}
		};

		this.cameraTween = requestAnimationFrame(animateStep);
	}

	takeScreenshot(targetWidth = 2000, state = null) {
		const aspect = this.viewport.clientWidth / this.viewport.clientHeight;
		const width = Math.floor(targetWidth);
		const height = Math.floor(width / aspect);

		this.renderer.setSize(width, height);
		this.camera.aspect = aspect;
		this.camera.updateProjectionMatrix();

		this.scene.traverse((object) => {
			if (
				object.isLineSegments2 &&
				object.material &&
				object.material.resolution
			) {
				object.material.resolution.set(width, height);
			}
		});

		this.renderer.setViewport(0, 0, width, height);
		this.renderer.setScissor(0, 0, width, height);
		this.renderer.setScissorTest(false);
		this.renderer.clear();
		this.renderer.render(this.scene, this.camera);

		if (this.isGimbalVisible) {
			const minDim = Math.min(width, height);
			const gimbalSize = minDim * 0.2;
			const padding = minDim * 0.02;
			const left = width - gimbalSize - padding;
			const bottom = height - gimbalSize - padding;

			this.gimbalCamera.position
				.copy(this.camera.position)
				.sub(this.controls.target)
				.normalize()
				.multiplyScalar(5);
			this.gimbalCamera.lookAt(0, 0, 0);
			this.gimbalCamera.updateMatrixWorld();

			this.renderer.setViewport(left, bottom, gimbalSize, gimbalSize);
			this.renderer.setScissor(left, bottom, gimbalSize, gimbalSize);
			this.renderer.setScissorTest(true);

			this.renderer.autoClear = false;
			this.renderer.clearDepth();
			this.renderer.render(this.gimbalScene, this.gimbalCamera);
			this.renderer.autoClear = true;
			this.renderer.setScissorTest(false);
		}

		try {
			const canvas2d = document.createElement("canvas");
			canvas2d.width = width;
			canvas2d.height = height;
			const ctx = canvas2d.getContext("2d");

			ctx.drawImage(this.renderer.domElement, 0, 0, width, height);

			const isLightMode = document.body.classList.contains("light-mode");
			const scale = width / this.viewport.clientWidth;

			const vertTitleEl = document.getElementById(
				"vertical-gradient-title",
			);
			const horizTitleEl = document.getElementById(
				"horizontal-gradient-title",
			);
			const maxEl = document.getElementById("max-value");
			const minEl = document.getElementById("min-value");
			const bipMaxEl = document.querySelector("#bipolar-max span");
			const bipMinEl = document.querySelector("#bipolar-min span");

			let legendItems = [];
			const cleanText = (str) => {
				if (!str) return "";
				return str.replace(/\n/g, " ").trim();
			};

			const fontFamily = window.getComputedStyle(
				document.body,
			).fontFamily;

			let vertNameStr = "";
			let horizNameStr = "";

			if (state) {
				if (state.activeQuality === "combined") {
					if (state.mode === VisMode.TANGENT_FIELD) {
						vertNameStr = "BIPOLAR";
					} else {
						vertNameStr = "LAT";
						horizNameStr = "BIPOLAR";
					}
				} else {
					vertNameStr = state.activeQuality.toUpperCase();
				}
			} else {
				if (vertTitleEl)
					vertNameStr = cleanText(vertTitleEl.innerText)
						.replace(/[^\w\s]/g, "")
						.trim();
				if (horizTitleEl)
					horizNameStr = cleanText(horizTitleEl.innerText)
						.replace(/[^\w\s]/g, "")
						.trim();
			}

			if (vertTitleEl && !vertTitleEl.classList.contains("hidden")) {
				if (vertNameStr) {
					legendItems.push({ text: `${vertNameStr} ():` });
					legendItems.push({
						text: `  max: ${cleanText(maxEl.innerText)}`,
					});
					legendItems.push({
						text: `  min: ${cleanText(minEl.innerText)}`,
					});
				}
			}

			if (horizTitleEl && !horizTitleEl.classList.contains("hidden")) {
				if (horizNameStr) {
					legendItems.push({ text: `${horizNameStr} ():` });
					legendItems.push({
						text: `  max: ${cleanText(bipMaxEl.innerText)}`,
					});
					legendItems.push({
						text: `  min: ${cleanText(bipMinEl.innerText)}`,
					});
				}
			}

			if (state && state.activeQuality === "combined") {
				legendItems.push({ text: "" });
				legendItems.push({
					text: "→ EXTEML = 1",
					color: "rgb(153, 76, 76)",
				});
				legendItems.push({
					text: "→ GroupID \u2260 0",
					color: "rgb(76, 76, 76)",
				});
			}

			if (legendItems.length > 0) {
				const legPad = 20 * scale;
				const legFontSize = 18 * scale;
				ctx.font = `bold ${legFontSize}px ${fontFamily}`;
				ctx.textBaseline = "top";

				let legMaxWidth = 0;
				for (const item of legendItems) {
					let w = ctx.measureText(item.text).width;
					if (item.color) {
						w += 16 * scale;
					}
					if (w > legMaxWidth) legMaxWidth = w;
				}

				const gradientBar = document.getElementById("gradient-bar");
				let barDrawWidth = 0;
				let barDrawHeight = 0;
				if (gradientBar && !gradientBar.classList.contains("hidden")) {
					barDrawWidth = 40 * scale;
					barDrawHeight = 250 * scale;
				}

				const legLineHeight = legFontSize * 1.5;
				const textHeight = legendItems.length * legLineHeight;

				const legBoxHeight =
					Math.max(textHeight, barDrawHeight) + legPad * 2;
				const barSpacing = barDrawWidth > 0 ? legPad : 0;
				const legBoxWidth =
					legMaxWidth + legPad * 2 + barDrawWidth + barSpacing;

				const legX = 20 * scale;
				const legY = height - legBoxHeight - 20 * scale;

				ctx.fillStyle = isLightMode
					? "rgba(255, 255, 255, 0.7)"
					: "rgba(0, 0, 0, 0.7)";
				ctx.strokeStyle = isLightMode ? "black" : "gray";
				ctx.lineWidth = 2 * (width / 1000);
				ctx.beginPath();
				if (ctx.roundRect) {
					ctx.roundRect(
						legX,
						legY,
						legBoxWidth,
						legBoxHeight,
						8 * scale,
					);
				} else {
					ctx.rect(legX, legY, legBoxWidth, legBoxHeight);
				}
				ctx.fill();
				ctx.stroke();

				ctx.shadowColor = "transparent";
				ctx.shadowBlur = 0;
				ctx.fillStyle = isLightMode ? "black" : "white";
				let currentY = legY + legPad;
				for (const item of legendItems) {
					if (item.text === "") {
					} else if (item.color) {
						const circleRadius = 5 * scale;
						const circleX = legX + legPad + circleRadius;
						const circleY = currentY + legFontSize / 2;

						ctx.beginPath();
						ctx.arc(circleX, circleY, circleRadius, 0, 2 * Math.PI);
						ctx.fillStyle = item.color;
						ctx.fill();
						ctx.strokeStyle = isLightMode ? "black" : "white";
						ctx.lineWidth = 1 * scale;
						ctx.stroke();

						ctx.fillStyle = isLightMode ? "black" : "white";
						ctx.fillText(
							item.text,
							circleX + circleRadius + 6 * scale,
							currentY,
						);
					} else {
						ctx.fillText(item.text, legX + legPad, currentY);
					}
					currentY += legLineHeight;
				}

				if (barDrawWidth > 0) {
					const barX = legX + legPad * 2 + legMaxWidth;
					const barY = legY + legPad;
					ctx.drawImage(
						gradientBar,
						barX,
						barY,
						barDrawWidth,
						barDrawHeight,
					);

					ctx.strokeStyle = isLightMode ? "black" : "white";
					ctx.lineWidth = 1 * (width / 1000);
					ctx.strokeRect(barX, barY, barDrawWidth, barDrawHeight);

					const gaugeLine = document.getElementById("gauge-line");
					if (gaugeLine && !gaugeLine.classList.contains("hidden")) {
						const bottomPctStr = gaugeLine.style.bottom;
						if (bottomPctStr && bottomPctStr.endsWith("%")) {
							const bottomPct = parseFloat(bottomPctStr) / 100;
							const lineY =
								barY +
								barDrawHeight -
								bottomPct * barDrawHeight;

							const overlap = 4 * scale;
							ctx.beginPath();
							ctx.moveTo(barX - overlap, lineY);
							ctx.lineTo(barX + barDrawWidth + overlap, lineY);
							ctx.strokeStyle = "white";
							ctx.lineWidth = 2 * scale;
							ctx.shadowColor = "rgba(0,0,0,0.5)";
							ctx.shadowBlur = 4 * scale;
							ctx.stroke();

							ctx.shadowBlur = 0;

							const gaugeDot =
								document.getElementById("gauge-dot");
							if (
								gaugeDot &&
								!gaugeDot.classList.contains("hidden")
							) {
								const leftPctStr = gaugeDot.style.left;
								if (leftPctStr && leftPctStr.endsWith("%")) {
									const leftPct =
										parseFloat(leftPctStr) / 100;
									const dotX = barX + leftPct * barDrawWidth;

									ctx.beginPath();
									ctx.arc(
										dotX,
										lineY,
										4 * scale,
										0,
										2 * Math.PI,
									);
									ctx.fillStyle = "white";
									ctx.fill();
									ctx.lineWidth = 1 * scale;
									ctx.strokeStyle = "black";
									ctx.stroke();
								}
							}
						}
					}
				}
			}

			// tooltip and crosshair
			const tooltip = document.getElementById("sampler-tooltip");
			if (tooltip && !tooltip.classList.contains("hidden")) {
				const rect = this.viewport.getBoundingClientRect();
				const tLeft = parseFloat(tooltip.style.left);
				const tTop = parseFloat(tooltip.style.top);

				const cursorClientX = tLeft - 15;
				const cursorClientY = tTop - 15;

				const cursorX = cursorClientX - rect.left;
				const cursorY = cursorClientY - rect.top;

				const cx = cursorX * scale;
				const cy = cursorY * scale;

				ctx.lineWidth = 3 * (width / 1000);
				ctx.strokeStyle = "white";
				ctx.shadowColor = "black";
				ctx.shadowBlur = 4 * (width / 1000);
				ctx.beginPath();
				const xSize = 8 * (width / 1000);
				ctx.moveTo(cx - xSize, cy - xSize);
				ctx.lineTo(cx + xSize, cy + xSize);
				ctx.moveTo(cx + xSize, cy - xSize);
				ctx.lineTo(cx - xSize, cy + xSize);
				ctx.stroke();

				ctx.shadowColor = "rgba(0,0,0,0.3)";
				ctx.shadowBlur = 10 * (width / 1000);

				const text = tooltip.innerText;
				const lines = text.split("\n");

				const fontSize = 14 * scale;
				ctx.font = `bold ${fontSize}px ${fontFamily}`;

				let maxWidth = 0;
				for (const line of lines) {
					const metrics = ctx.measureText(line);
					if (metrics.width > maxWidth) maxWidth = metrics.width;
				}

				const padding = 8 * scale;
				const lineHeight = fontSize * 1.4;
				const boxWidth = maxWidth + padding * 2;
				const boxHeight =
					lines.length * lineHeight +
					padding * 2 -
					(lineHeight - fontSize);

				const boxX = cx + 15 * scale;
				const boxY = cy + 15 * scale;

				if (isLightMode) {
					ctx.fillStyle = "white";
					ctx.strokeStyle = "black";
				} else {
					ctx.fillStyle = "black";
					ctx.strokeStyle = "gray";
				}
				ctx.lineWidth = 1 * (width / 1000);

				ctx.beginPath();
				if (ctx.roundRect) {
					ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 6 * scale);
				} else {
					ctx.rect(boxX, boxY, boxWidth, boxHeight);
				}
				ctx.fill();
				ctx.stroke();

				ctx.shadowColor = "transparent";
				ctx.shadowBlur = 0;
				if (isLightMode) {
					ctx.fillStyle = "black";
				} else {
					ctx.fillStyle = "white";
				}

				ctx.textBaseline = "top";
				let textY = boxY + padding;
				for (const line of lines) {
					ctx.fillText(line, boxX + padding, textY);
					textY += lineHeight;
				}
			}

			const dataURL = canvas2d.toDataURL("image/png");
			const link = document.createElement("a");
			link.download = `anacardio-capture-${Date.now()}.png`;
			link.href = dataURL;
			link.click();
		} catch (e) {
			console.error("Screenshot failed:", e);
		}

		this.onWindowResize();
	}
}
