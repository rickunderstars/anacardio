import { addMesh } from "../interaction/file-processing";

import testMesh1 from "@assets/test-meshes/2-LA.mesh?raw";
import testMesh2 from "@assets/test-meshes/2-LA-FA.mesh?raw";

const testMeshes = [
	[testMesh1, "2-LA.mesh"],
	[testMesh2, "2-LA-FA.mesh"],
];

export function addTestMesh(dependencies) {
	const { state, shaders, scene, camera, controls, renderer } = dependencies;

	const fileElement = document.getElementById("filename");
	if (testMeshes.length === 0) {
		fileElement.innerHTML = "No more test meshes available.";
		return;
	}

	HeartModule().then((cpp) => {
		const [testMesh, filename] = testMeshes.pop();
		const mesh = cpp.importMesh(testMesh);

		if (filename === "2-LA.mesh") {
			mesh.triangleFix(8703, 4559, 4538);
			mesh.fixNMEdges();
		} else if (filename === "2-LA-FA.mesh") {
			mesh.triangleFix(25180, 12810, 12813);
			mesh.triangleFix(29108, 9930, 14703);
			mesh.triangleFix(21420, 10857, 10941);
			mesh.triangleFix(56, 38, 29);
			mesh.triangleFix(30812, 15492, 15447);
			mesh.triangleFix(30578, 14384, 14398);
			let fixTri = new cpp.Triangle(15417, 14398, 14381);
			mesh.triangles.push_back(fixTri);
			mesh.fixNMEdges();
		}

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
		fileElement.innerHTML = "Last upload: " + filename;
	});
}
