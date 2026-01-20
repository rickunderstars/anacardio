import * as THREE from "three";
import { updateActiveMesh } from "@js/engine/mesh-renderer.js";
import { VisMode } from "@js/core/state-manager.js";

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

	const fileElement = document.getElementById("filename");
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
				fileElement.innerHTML = "Could not load: " + file.name;
				return;
			}
			fileElement.innerHTML = "Last upload: " + file.name;

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

export function addMesh(dependencies) {
	const { mesh, filename, shaders, sceneManager, state } = dependencies;

	HeartModule().then(() => {
		const vertices = mesh.Float32ArrayOfVertices();
		const triangles = mesh.Uint32ArrayOfTriangles();

		const valueSets = {};
		FIELD_KEYS.forEach((key) => {
			valueSets[key] = mesh.Float32ArrayOfVerticesValues(key);
		});

		const tangentFieldMeshes = {};
		const lineMaterial = new THREE.LineBasicMaterial({ color: 0x000000 });

		FIELD_KEYS.forEach((key) => {
			const fieldSegments = mesh.Float32ArrayOfTangentFieldSegments(key);

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
		geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(vertices, 3),
		);
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

		updateActiveMesh({ shaders, state });

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
	});
}

function updateMeshesList(state) {
	let meshValue = 0;
	document.getElementById("loaded-meshes").innerHTML = "";
	for (const m of state.meshes) {
		let corners = "";
		let checked = "";
		if (state.activeMeshIndex === 0 && state.meshes.length - 1 === 0) {
			corners = " class='mesh-top mesh-bottom' ";
			checked = "checked";
		} else if (meshValue === 0) {
			corners = " class='mesh-top' ";
		} else if (state.activeMeshIndex === state.meshes.length - 1) {
			corners = " class='mesh-bottom' ";
			checked = "checked";
		}
		document.getElementById("loaded-meshes").innerHTML +=
			"<label" +
			corners +
			">" +
			"<input type='radio' name='loaded-mesh' value='" +
			meshValue +
			"' " +
			checked +
			"/>" +
			"<span>" +
			m.filename +
			"</span>" +
			"</label¨>";
		meshValue++;
	}
}
