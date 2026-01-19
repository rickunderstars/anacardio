import * as THREE from "three";
import { formatNumber } from "../utils/math-utils";

export function vertexPicker(dependencies) {
	const { mouse, camera, state } = dependencies;

	if (state.activeMeshIndex === -1 || !state.activeMesh) {
		return;
	}
	const active = state.activeMesh.valueSets;
	const raycaster = new THREE.Raycaster();
	raycaster.setFromCamera(mouse, camera);
	const intersects = raycaster.intersectObject(state.activeMesh.mesh);

	if (intersects.length > 0) {
		const firstHit = intersects[0];
		const face = firstHit.face;
		const geometry = firstHit.object.geometry;
		const positions = geometry.attributes.position;
		const object = firstHit.object;

		const v0 = new THREE.Vector3().fromBufferAttribute(positions, face.a);
		const v1 = new THREE.Vector3().fromBufferAttribute(positions, face.b);
		const v2 = new THREE.Vector3().fromBufferAttribute(positions, face.c);

		v0.applyMatrix4(object.matrixWorld);
		v1.applyMatrix4(object.matrixWorld);
		v2.applyMatrix4(object.matrixWorld);

		const bary = new THREE.Vector3();
		THREE.Triangle.getBarycoord(firstHit.point, v0, v1, v2, bary);

		const unipolar =
			active.unipolar[face.a] * bary.x +
			active.unipolar[face.b] * bary.y +
			active.unipolar[face.c] * bary.z;

		const bipolar =
			active.bipolar[face.a] * bary.x +
			active.bipolar[face.b] * bary.y +
			active.bipolar[face.c] * bary.z;

		const lat =
			active.lat[face.a] * bary.x +
			active.lat[face.b] * bary.y +
			active.lat[face.c] * bary.z;

		let intValuesIndex = face.a;
		if (bary.y > bary.x && bary.y > bary.z) {
			intValuesIndex = face.b;
		} else if (bary.z > bary.x && bary.z > bary.y) {
			intValuesIndex = face.c;
		}

		const eml = active.eml[intValuesIndex];
		const exteml = active.exteml[intValuesIndex];
		const scar = active.scar[intValuesIndex];
		const groupid = active.groupid[intValuesIndex];

		document.getElementById("unipolar-value").innerHTML =
			formatNumber(unipolar);
		document.getElementById("bipolar-value").innerHTML =
			formatNumber(bipolar);
		document.getElementById("lat-value").innerHTML = formatNumber(lat);
		document.getElementById("eml-value").innerHTML = formatNumber(eml);
		document.getElementById("exteml-value").innerHTML =
			formatNumber(exteml);
		document.getElementById("scar-value").innerHTML = formatNumber(scar);
		document.getElementById("groupid-value").innerHTML =
			formatNumber(groupid);

		switch (state.activeQuality) {
			case "unipolar":
				return unipolar;
			case "bipolar":
				return bipolar;
			case "lat":
				return lat;
			case "eml":
				return eml;
			case "exteml":
				return exteml;
			case "scar":
				return scar;
			case "groupid":
				return groupid;
		}
	} else {
		document.getElementById("unipolar-value").innerHTML = "---";
		document.getElementById("bipolar-value").innerHTML = "---";
		document.getElementById("lat-value").innerHTML = "---";
		document.getElementById("eml-value").innerHTML = "---";
		document.getElementById("exteml-value").innerHTML = "---";
		document.getElementById("scar-value").innerHTML = "---";
		document.getElementById("groupid-value").innerHTML = "---";
	}
}
