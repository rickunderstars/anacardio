import { processFile } from "@js/io/file-loader.js";
import { testMeshes } from "@js/io/test-loader.js";

export function toggleLoading(show) {
	const el = document.getElementById("loading-indicator");
	if (show) {
		el.classList.remove("hidden");
	} else {
		el.classList.add("hidden");
	}
}

export function setupFileHandlers(dependencies) {
	const { shaders, sceneManager, state } = dependencies;
	const viewport = sceneManager.viewport;

	renderMeshDropdown(state);

	document
		.getElementById("raw-mesh")
		.addEventListener("change", async function (e) {
			if (e.target.files.length > 0) {
				toggleLoading(true);
				const file = e.target.files[0];
				try {
					await processFile({
						file,
						shaders,
						sceneManager,
						state,
					});
				} finally {
					toggleLoading(false);
					e.target.value = "";
				}
			}
		});

	["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
		viewport.addEventListener(eventName, (e) => {
			e.preventDefault();
			e.stopPropagation();
		});
	});

	["dragenter", "dragover"].forEach((eventName) => {
		viewport.addEventListener(eventName, () => {
			viewport.style.opacity = "0.7";
		});
	});

	["dragleave", "drop"].forEach((eventName) => {
		viewport.addEventListener(eventName, () => {
			viewport.style.opacity = "1";
		});
	});

	viewport.addEventListener("drop", async (e) => {
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			toggleLoading(true);
			try {
				const promises = Array.from(files).map((file) =>
					processFile({
						file,
						shaders,
						sceneManager,
						state,
					}),
				);
				await Promise.all(promises);
			} finally {
				toggleLoading(false);
			}
		}
	});
}

export function renderMeshDropdown(state) {
	const dropdown = document.getElementById("add-mesh-dropdown");
	dropdown.innerHTML = "";

	const placeholder = document.createElement("option");
	placeholder.value = "";
	placeholder.text = state.activeMesh ? state.activeMesh.filename : "Select";
	placeholder.hidden = true;
	placeholder.selected = true;
	dropdown.appendChild(placeholder);

	const fileOption = document.createElement("option");
	fileOption.value = "file";
	fileOption.text = "Load from file...";
	dropdown.appendChild(fileOption);

	testMeshes.forEach((tm) => {
		const loadedIndex = state.meshes.findIndex(
			(m) => m.filename === tm.filename,
		);
		const option = document.createElement("option");
		option.text = tm.filename;

		if (loadedIndex !== -1) {
			option.value = loadedIndex;
		} else {
			option.value = tm.filename;
		}
		dropdown.appendChild(option);
	});

	state.meshes.forEach((m, index) => {
		const isTestMesh = testMeshes.some((tm) => tm.filename === m.filename);
		if (!isTestMesh) {
			const option = document.createElement("option");
			option.value = index;
			option.text = m.filename;
			dropdown.appendChild(option);
		}
	});
}
