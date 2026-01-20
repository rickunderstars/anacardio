import * as THREE from "three";
import { updateActiveMesh } from "@js/engine/mesh-renderer.js";
import { VisMode } from "@js/core/state-manager.js";
import { updateMeshesList, updateFilenameUI } from "@js/ui/ui-file-handlers.js";
import { updateMinMaxUI } from "@js/ui/ui-event-handlers.js";

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
				updateFilenameUI(file.name, true);
				return;
			}
			updateFilenameUI(file.name);

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

	const cpp = await HeartModule();
	const vertices = mesh.Float32ArrayOfVertices();
	const triangles = mesh.Uint32ArrayOfTriangles();

	const valueSets = {};
	FIELD_KEYS.forEach((key) => {
		valueSets[key] = mesh.Float32ArrayOfVerticesValues(key);
	});

	const tangentFieldMeshes = {};
	const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

	FIELD_KEYS.forEach((key) => {
		const fieldSegments = mesh.Float32ArrayOfTangentFieldSegments(key, 2.7);

		if (fieldSegments && fieldSegments.length > 0) {
			const geometry = new THREE.BufferGeometry();
			geometry.setAttribute(
				"position",
				new THREE.BufferAttribute(fieldSegments, 3),
			);
			tangentFieldMeshes[key] = new THREE.LineSegments(
				geometry,
				lineMaterial,
			);
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

	sceneManager.resetCamera(center, radius);

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
