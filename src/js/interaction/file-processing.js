import * as THREE from "three";
import { updateActiveMaterial } from "@js/visualization/material-update.js";
import { visMode } from "@js/state/state.js";

export function processFile(dependencies) {
	const { file, state, shaders, scene, camera, controls, renderer } =
		dependencies;

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
				state,
				mesh,
				filename,
				shaders,
				scene,
				camera,
				controls,
				renderer,
			});
		};
		reader.readAsText(file);
	});
}

export function addMesh(dependencies) {
	const {
		state,
		mesh,
		filename,
		shaders,
		scene,
		camera,
		controls,
		renderer,
	} = dependencies;

	HeartModule().then(() => {
		const vertices = mesh.Float32ArrayOfVertices();
		const triangles = mesh.Uint32ArrayOfTriangles();

		const valueSets = {
			unipolar: mesh.Float32ArrayOfVerticesValues("unipolar"),
			bipolar: mesh.Float32ArrayOfVerticesValues("bipolar"),
			lat: mesh.Float32ArrayOfVerticesValues("lat"),
			groupid: mesh.Float32ArrayOfVerticesValues("groupid"),
			eml: mesh.Float32ArrayOfVerticesValues("eml"),
			exteml: mesh.Float32ArrayOfVerticesValues("exteml"),
			scar: mesh.Float32ArrayOfVerticesValues("scar"),
			tangentField: mesh.Float32ArrayOfTangentFieldSegments(),
		};

		const geometry = new THREE.BufferGeometry();
		geometry.setAttribute(
			"position",
			new THREE.BufferAttribute(vertices, 3),
		);
		geometry.setIndex(new THREE.BufferAttribute(triangles, 1));
		geometry.computeVertexNormals();

		const material = new THREE.MeshBasicMaterial();

		const heart = new THREE.Mesh(geometry, material);

		const tangentFieldGeometry = new THREE.BufferGeometry();
		tangentFieldGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(valueSets.tangentField, 3),
		);
		const segmentMaterial = new THREE.LineBasicMaterial({
			color: 0x000000,
		});
		const tangentFieldMesh = new THREE.LineSegments(
			tangentFieldGeometry,
			segmentMaterial,
		);

		const box = new THREE.Box3().setFromObject(heart);
		const boundingSphere = new THREE.Sphere();
		box.getBoundingSphere(boundingSphere);
		const center = boundingSphere.center;
		const radius = boundingSphere.radius;

		camera.position.set(center.x, center.y, center.z + radius * 2.5);
		controls.target.set(center.x, center.y, center.z);
		controls.update();

		state.meshes.push({
			mesh: heart,
			tangentFieldMesh: tangentFieldMesh,
			filename: filename,
			valueSets: valueSets,
			center: center,
			radius: radius,
		});

		state.setActiveMesh(state.meshes.length - 1);

		updateActiveMaterial({ state, shaders });

		state.meshes.forEach((meshData) => {
			meshData.mesh.visible = false;
			meshData.tangentFieldMesh.visible = false;
		});
		scene.add(heart);
		scene.add(tangentFieldMesh);

		heart.visible = true;
		if (state.mode != visMode.TANGENT_FIELD) {
			tangentFieldMesh.visible = false;
		} else {
			tangentFieldMesh.visible = true;
		}

		renderer.render(scene, camera);

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
		if (state.activeMesh === 0 && state.meshes.length - 1 === 0) {
			corners = " class='mesh-top mesh-bottom' ";
			checked = "checked";
		} else if (meshValue === 0) {
			corners = " class='mesh-top' ";
		} else if (state.activeMesh === state.meshes.length - 1) {
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
