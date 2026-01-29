import {
	turboColormap,
	get2Min,
	getMax,
	mixColors,
	gradientWave,
} from "@js/utils/math-utils.js";
import { VisMode } from "@js/core/state-manager.js";

export const SHADER_COLORS = {
	NULL: [0.45, 0.45, 0.45],
	WAVE_START: [0.2, 0.2, 0.2],
	WAVE_END: [0.3, 1.0, 1.0],
	WAVE_POLAR_START: [0.3, 0.3, 1.0],
	WAVE_POLAR_END: [0.0, 1.0, 0.0],
	EXTEML: [0.55, 0.41, 0.41],
	GRADIENT_BACKGROUND: [0.2, 0.1, 0.1],
	BIN_COLOR_1: [0.0, 0.0, 1.0],
	BIN_COLOR_2: [0.0, 1.0, 0.0],
};

export const SEGMENT_COLORS = {
	START: [1.0, 1.0, 1.0],
	END: [0.0, 0.0, 0.0],
};

export function colorizeBinaryGradient() {
	const gradient = document.getElementById("gradient-bar");
	if (!gradient) return;

	const ctx = gradient.getContext("2d");

	const width = gradient.width;
	const height = gradient.height;

	const binColor1 = SHADER_COLORS.BIN_COLOR_1.map((c) => Math.round(c * 255));
	const binColor2 = SHADER_COLORS.BIN_COLOR_2.map((c) => Math.round(c * 255));

	ctx.fillStyle = `rgb(${binColor1[0]}, ${binColor1[1]}, ${binColor1[2]})`;
	ctx.fillRect(0, height / 2, width, height / 2);

	ctx.fillStyle = `rgb(${binColor2[0]}, ${binColor2[1]}, ${binColor2[2]})`;
	ctx.fillRect(0, 0, width, height / 2);
}

export function colorizeGradientWithTurbo(ctx, width, height) {
	for (let y = 0; y < height; y++) {
		const t = 1 - y / height;
		const [r, g, b] = turboColormap(t);
		ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
		ctx.fillRect(0, y, width, 1);
	}
}

export function colorizeGradientDynamic(
	ctx,
	width,
	height,
	state,
	time,
	colorLeft,
	colorRight,
	colorBase,
	power = 3,
) {
	for (let y = 0; y < height; y++) {
		const val = 1 - y / height;
		const wave = (time * state.wavesSpeed - val) * state.wavesNumber;
		const phase = wave - Math.floor(wave);

		for (let x = 0; x < width; x++) {
			const tHorizontal = width > 1 ? x / (width - 1) : 0;
			const peakColor = mixColors(colorLeft, colorRight, tHorizontal);
			const [r, g, b] = gradientWave(phase, colorBase, peakColor, power);
			ctx.fillStyle = `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
			ctx.fillRect(x, y, 1, 1);
		}
	}
}

export function colorizeGradient(state, time = 0) {
	const gradient = document.getElementById("gradient-bar");
	if (!gradient) return;

	const ctx = gradient.getContext("2d");
	const rect = gradient.getBoundingClientRect();
	const dpr = window.devicePixelRatio || 1;
	const targetHeight = Math.floor(rect.height * dpr);

	if (gradient.style.position !== "absolute") {
		gradient.style.position = "absolute";
		gradient.style.left = "0";
		gradient.style.top = "0";
		gradient.style.width = "100%";
		gradient.style.height = "100%";
	}

	if (gradient.height !== targetHeight || gradient.width !== 2) {
		gradient.width = 2;
		gradient.height = targetHeight;
	}

	const height = gradient.height;
	const width = gradient.width;

	const mode = state ? state.mode : VisMode.COLOR_RAMP;

	if (state.isBinary) {
		colorizeBinaryGradient();
		return;
	}

	if (state.activeQuality === "combined" && mode === VisMode.ANIMATED) {
		const startColor = SHADER_COLORS.WAVE_START.map((c) => c * 255);
		const blue = SHADER_COLORS.WAVE_POLAR_START.map((c) => c * 255);
		const green = SHADER_COLORS.WAVE_POLAR_END.map((c) => c * 255);

		colorizeGradientDynamic(
			ctx,
			width,
			height,
			state,
			time,
			blue,
			green,
			startColor,
			2,
		);
	} else if (mode === VisMode.COLOR_RAMP || mode === VisMode.TANGENT_FIELD) {
		colorizeGradientWithTurbo(ctx, width, height);
	} else if (mode === VisMode.ANIMATED) {
		const startColor = SHADER_COLORS.WAVE_START.map((c) => c * 255);
		const endColor = SHADER_COLORS.WAVE_END.map((c) => c * 255);

		colorizeGradientDynamic(
			ctx,
			width,
			height,
			state,
			time,
			endColor,
			endColor,
			startColor,
			3,
		);
	}
}

export function setGaugeLine(value, state) {
	if (!state.activeMesh) {
		return;
	}

	const quality =
		state.activeQuality === "combined" ? "lat" : state.activeQuality;

	if (!state.activeMesh.valueSets[quality]) {
		return;
	}

	const line = document.getElementById("gauge-line");

	const [, min] = get2Min(state.activeMesh.valueSets[quality]);
	const max = getMax(state.activeMesh.valueSets[quality]);

	if (value > max) {
		line.style.bottom = `100%`;
		return;
	} else if (value < min) {
		line.style.bottom = `0%`;
		return;
	}

	const position = (value - min) / (max - min);

	line.style.bottom = `${position * 100}%`;
}
