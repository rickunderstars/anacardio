import { processFile } from "./file-processing.js";
import state from "@js/state/state";

export function setupFileHandlers(dependencies) {
	const { shaders, scene, camera, controls, viewport, renderer } =
		dependencies;

	document
		.getElementById("raw-mesh")
		.addEventListener("change", function (e) {
			if (e.target.files.length > 0) {
				const file = e.target.files[0];
				processFile({
					file,
					shaders,
					scene,
					camera,
					controls,
					renderer,
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
					scene,
					camera,
					controls,
					renderer,
				});
			});
		}
	});
}
