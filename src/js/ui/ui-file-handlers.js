import { processFile } from "@js/io/file-loader.js";
import { testMeshes } from "@js/io/test-loader.js";

export function setupFileHandlers(dependencies) {
	const { shaders, sceneManager, state } = dependencies;
	const viewport = sceneManager.viewport;

	renderMeshDropdown(state);

	document
		.getElementById("raw-mesh")
		.addEventListener("change", function (e) {
			if (e.target.files.length > 0) {
				const file = e.target.files[0];
				processFile({
					file,
					shaders,
					sceneManager,
					state,
				});
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

	viewport.addEventListener("drop", (e) => {
		const files = e.dataTransfer.files;
		if (files.length > 0) {
			Array.from(files).forEach((file) => {
				processFile({
					file,
					shaders,
					sceneManager,
					state,
				});
			});
		}
	});
}

export function updateFilenameUI(filename, isError = false) {
	const fileElement = document.getElementById("filename");
	if (isError) {
		fileElement.innerHTML = "Could not load: " + filename;
	} else {
		fileElement.innerHTML = "Last upload: " + filename;
	}
}

export function renderMeshDropdown(state) {
	const dropdown = document.getElementById("add-mesh-dropdown");
	dropdown.innerHTML = "";

	const placeholder = document.createElement("option");
	placeholder.value = "";
	placeholder.text = "Select";
	placeholder.hidden = true;
	placeholder.selected = true;
	dropdown.appendChild(placeholder);

	const fileOption = document.createElement("option");
	fileOption.value = "file";
	fileOption.text = "Local file...";
	dropdown.appendChild(fileOption);

	testMeshes.forEach((tm) => {
		if (!state.meshes.some((m) => m.filename === tm.filename)) {
			const option = document.createElement("option");
			option.value = tm.filename;
			option.text = "Load '" + tm.filename + "'";
			dropdown.appendChild(option);
		}
	});
}

export function updateMeshesList(state) {
	renderMeshDropdown(state);
	const dropdown = document.getElementById("loaded-meshes-dropdown");
	dropdown.innerHTML = "";

	if (state.meshes.length === 0) {
		dropdown.classList.add("hidden");
		return;
	}

	dropdown.classList.remove("hidden");

	state.meshes.forEach((mesh, index) => {
		const option = document.createElement("option");
		option.value = index;
		option.text = mesh.filename;
		if (index === state.activeMeshIndex) {
			option.selected = true;
		}
		dropdown.appendChild(option);
	});
}
