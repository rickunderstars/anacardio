import * as THREE from "three";
import { updateActiveMaterial } from "../visualization/material-update.js";

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
			unipolar: mesh.Float32ArrayOfUnipolar(),
			bipolar: mesh.Float32ArrayOfBipolar(),
			lat: mesh.Float32ArrayOfLAT(),
			groupid: mesh.Float32ArrayOfGroupID(),
			eml: mesh.Float32ArrayOfEML(),
			exteml: mesh.Float32ArrayOfExtEML(),
			scar: mesh.Float32ArrayOfSCAR(),
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

		const normalGeometry = new THREE.BufferGeometry();
		normalGeometry.setAttribute(
			"position",
			new THREE.BufferAttribute(valueSets.tangentField, 3),
		);
		const segmentMaterial = new THREE.LineBasicMaterial({
			color: 0x000000,
		});
		const normalsMesh = new THREE.LineSegments(
			normalGeometry,
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
			normalsMesh: normalsMesh,
			filename: filename,
			valueSets: valueSets,
			center: center,
			radius: radius,
		});

		state.setActiveMesh(state.meshes.length - 1);

		updateActiveMaterial({ state, shaders });

		state.meshes.forEach((meshData) => {
			meshData.mesh.visible = false;
			meshData.normalsMesh.visible = false;
		});
		scene.add(heart);
		scene.add(normalsMesh);

		heart.visible = true;
		normalsMesh.visible = false;

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
