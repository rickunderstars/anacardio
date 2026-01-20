import { addMesh } from "@js/io/file-loader.js";
import { updateFilenameUI } from "@js/ui/ui-file-handlers.js";

const testMeshes = [
	{
		filename: "2-LA.mesh",
		load: () => import("@assets/test-meshes/2-LA.mesh?raw"),
	},
	{
		filename: "2-LA-FA.mesh",
		load: () => import("@assets/test-meshes/2-LA-FA.mesh?raw"),
	},
];

export async function addTestMesh(dependencies) {
	const { shaders, sceneManager, state } = dependencies;

	if (testMeshes.length === 0) {
		updateFilenameUI("No more test meshes available.", true);
		return;
	}

	const cpp = await HeartModule();
	const { filename, load } = testMeshes.pop();
	const meshModule = await load();
	const testMesh = meshModule.default;

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

	await addMesh({
		mesh,
		filename,
		shaders,
		sceneManager,
		state,
	});
	updateFilenameUI(filename);
}
