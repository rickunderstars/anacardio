import { processFile } from "@js/io/file-loader.js";

export function setupFileHandlers(dependencies) {
	const { shaders, sceneManager, state } = dependencies;
	const viewport = sceneManager.viewport;

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

	document.addEventListener("keydown", (e) => {
		if (e.key.toLowerCase() === "u") {
			e.preventDefault();
			const upload = document.getElementById("raw-mesh");
			upload.click();
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

export function updateMeshesList(state) {
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
