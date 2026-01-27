import * as THREE from "three";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import { updateActiveMesh } from "@js/engine/mesh-renderer.js";
import { VisMode } from "@js/core/state-manager.js";
import { updateMeshesList } from "@js/ui/ui-file-handlers.js";
import { updateMinMaxUI } from "@js/ui/ui-event-handlers.js";
import { SEGMENT_COLORS } from "@js/ui/colors.js";

export const FIELD_KEYS = [
	"unipolar",
	"bipolar",
	"lat",
	"eml",
	"exteml",
	"scar",
	"groupid",
];

export function processFile(dependencies) {
	const { file, shaders, sceneManager, state } = dependencies;

	if (state.meshes.some((item) => item.filename === file.name)) {
		console.log("Mesh already uploaded");
		return;
	}

	HeartModule().then((cpp) => {
		const reader = new FileReader();

		reader.onload = function (e) {
			const fileContent = e.target.result;
			let mesh;
			try {
				mesh = cpp.importMesh(fileContent);
			} catch (e) {
				console.error("Error: ", e.message);
				return;
			}

			const filename = file.name;
			addMesh({
				mesh,
				filename,
				shaders,
				sceneManager,
				state,
			});
		};
		reader.readAsText(file);
	});
}

export async function addMesh(dependencies) {
	const { mesh, filename, shaders, sceneManager, state } = dependencies;

	const vertices = mesh.Float32ArrayOfVertices();
	const triangles = mesh.Uint32ArrayOfTriangles();

	const valueSets = {};
	FIELD_KEYS.forEach((key) => {
		valueSets[key] = mesh.Float32ArrayOfVerticesValues(key);
	});

	const tangentFieldMeshes = {};
	const resolution = new THREE.Vector2(
		sceneManager.viewport.clientWidth,
		sceneManager.viewport.clientHeight,
	);
	const lineMaterial = new LineMaterial({
		color: 0xffffff,
		linewidth: 1.5,
		resolution: resolution,
		vertexColors: true,
	});

	FIELD_KEYS.forEach((key) => {
		const fieldSegments = mesh.Float32ArrayOfTangentFieldSegments(key, 2.8);

		if (fieldSegments && fieldSegments.length > 0) {
			const geometry = new LineSegmentsGeometry();
			geometry.setPositions(fieldSegments);

			const colors = new Float32Array(fieldSegments.length);
			for (let i = 0; i < fieldSegments.length; i += 6) {
				colors[i] = SEGMENT_COLORS.START[0];
				colors[i + 1] = SEGMENT_COLORS.START[1];
				colors[i + 2] = SEGMENT_COLORS.START[2];
				colors[i + 3] = SEGMENT_COLORS.END[0];
				colors[i + 4] = SEGMENT_COLORS.END[1];
				colors[i + 5] = SEGMENT_COLORS.END[2];
			}
			geometry.setColors(colors);

			tangentFieldMeshes[key] = new LineSegments2(geometry, lineMaterial);
		}
	});

	const geometry = new THREE.BufferGeometry();
	geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
	geometry.setIndex(new THREE.BufferAttribute(triangles, 1));
	geometry.computeVertexNormals();

	const material = new THREE.MeshBasicMaterial();
	const heart = new THREE.Mesh(geometry, material);

	const box = new THREE.Box3().setFromObject(heart);
	const boundingSphere = new THREE.Sphere();
	box.getBoundingSphere(boundingSphere);
	const center = boundingSphere.center;
	const radius = boundingSphere.radius;

	if (state.activeMesh) {
		sceneManager.saveCameraVersor(state.activeMesh);
	}

	sceneManager.setCamera(center, radius, new THREE.Vector3(0, 0, 1), 2.5);

	const meshData = {
		mesh: heart,
		filename: filename,
		valueSets: valueSets,
		tangentFieldMeshes: tangentFieldMeshes,
		center: center,
		radius: radius,
	};

	state.addMesh(meshData);

	const { min, max } = updateActiveMesh({ shaders, state });
	updateMinMaxUI(min, max);

	state.meshes.forEach((m) => {
		m.mesh.visible = false;
		Object.values(m.tangentFieldMeshes).forEach((segMesh) => {
			sceneManager.scene.add(segMesh);
			segMesh.visible = false;
		});
	});

	sceneManager.scene.add(heart);
	heart.visible = true;

	if (state.mode === VisMode.TANGENT_FIELD) {
		tangentFieldMeshes[state.activeQuality].visible = true;
	}

	sceneManager.render();
	updateMeshesList(state);

	console.log(
		"Mesh loaded successfully. Meshes loaded:",
		state.meshes.length,
	);
}
