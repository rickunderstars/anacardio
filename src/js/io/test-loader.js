import { addMesh } from "@js/io/file-loader.js";

export const testMeshes = [
	{
		filename: "CARTO_EXAMPLE_MESH.mesh",
		load: () =>
			fetch(
				`${import.meta.env.BASE_URL}example-meshes/CARTO_EXAMPLE_MESH.mesh`,
			)
				.then((r) => r.text())
				.then((text) => ({ default: text })),
	},
];

export async function addTestMesh(dependencies, meshFilename) {
	const { shaders, sceneManager, state } = dependencies;

	const selectedMesh = testMeshes.find((m) => m.filename === meshFilename);

	if (!selectedMesh) {
		return;
	}

	const cpp = await HeartModule();
	const { filename, load } = selectedMesh;
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
}
