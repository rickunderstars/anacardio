import { turboColormap, get2Min, getMax } from "@js/utils/math-utils.js";

export function colorizeGradient() {
	const gradient = document.getElementById("gradient-bar");
	const ctx = gradient.getContext("2d");
	const height = gradient.height;

	for (let y = 0; y < height; y++) {
		const t = 1 - y / height;
		const [r, g, b] = turboColormap(t);
		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		ctx.fillRect(0, y, gradient.width, 1);
	}
}

export function setGaugeLine(value, state) {
	if (!state.getActiveMesh()) {
		return;
	}
	const line = document.getElementById("gauge-line");

	const [, min] = get2Min(
		state.getActiveMesh().valueSets[state.activeQuality],
	);
	const max = getMax(state.getActiveMesh().valueSets[state.activeQuality]);

	if (value > max) {
		line.style.bottom = `100%`;
		return;
	} else if (value < min) {
		line.style.bottom = `0%`;
		return;
	}

	const position = (value - min) / (max - min) - 0.15 / 42; // - gauge-line heght / gradient height

	line.style.bottom = `${position * 100}%`;
}
