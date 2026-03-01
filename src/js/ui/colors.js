import {
	turboColormap,
	get2Min,
	getMax,
	mixColors,
	gradientWave,
} from "@js/utils/math-utils.js";
import { VisMode } from "@js/core/state-manager.js";

function hsl(h, s, l) {
	const a = s * Math.min(l, 1 - l);
	const f = (n, k = (n + h / 30) % 12) =>
		l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
	return [f(0), f(8), f(4)];
}

export const SHADER_COLORS = {
	NULL: [0.3, 0.3, 0.3],
	WAVE_START: [0.2, 0.2, 0.2],
	WAVE_END: [0.3, 1.0, 1.0],
	WAVE_POLAR_START: [0.3, 0.3, 1.0],
	WAVE_POLAR_END: [0.0, 1.0, 0.0],
	EXTEML: [0.6, 0.3, 0.3],
	GRADIENT_BACKGROUND: [0.2, 0.1, 0.1],
	COMBINED_GRADIENT_START: [0.0, 0.74, 0.74],
	COMBINED_GRADIENT_END: [0.94, 0.0, 0.0],
	COMBINED_TL: [0.0, 0.74, 0.74],
	COMBINED_TR: [0.46, 0.94, 0.94],
	COMBINED_BL: [0.94, 0.0, 0.0],
	COMBINED_BR: [1.0, 0.54, 0.54],
	BIN_COLOR_1: [0.0, 0.74, 0.74],
	BIN_COLOR_2: [0.94, 0.0, 0.0],
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

export function colorizeGradientTurbo(ctx, width, height) {
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
	const imgData = ctx.createImageData(width, height);
	const data = imgData.data;

	const lerp = (start, end, t) => start + (end - start) * t;

	for (let y = 0; y < height; y++) {
		const val = 1 - y / height;
		const wave = (time * state.waveSpeed - val) * state.waveNumber;
		const phase = wave - Math.floor(wave);

		const tWave = Math.pow(1.0 - phase, power);

		for (let x = 0; x < width; x++) {
			const u = width > 1 ? x / (width - 1) : 0;
			const index = (y * width + x) * 4;

			const rPeak = lerp(colorLeft[0], colorRight[0], u);
			const gPeak = lerp(colorLeft[1], colorRight[1], u);
			const bPeak = lerp(colorLeft[2], colorRight[2], u);

			data[index] = lerp(colorBase[0], rPeak, tWave);
			data[index + 1] = lerp(colorBase[1], gPeak, tWave);
			data[index + 2] = lerp(colorBase[2], bPeak, tWave);
			data[index + 3] = 255;
		}
	}
	ctx.putImageData(imgData, 0, 0);
}

function colorizeGradient2D(ctx, width, height, cTL, cTR, cBL, cBR) {
	const imgData = ctx.createImageData(width, height);
	const data = imgData.data;

	const lerp = (start, end, t) => start + (end - start) * t;

	for (let y = 0; y < height; y++) {
		const v = height > 1 ? y / (height - 1) : 0;

		const rLeft = lerp(cTL[0], cBL[0], v);
		const gLeft = lerp(cTL[1], cBL[1], v);
		const bLeft = lerp(cTL[2], cBL[2], v);

		const rRight = lerp(cTR[0], cBR[0], v);
		const gRight = lerp(cTR[1], cBR[1], v);
		const bRight = lerp(cTR[2], cBR[2], v);

		for (let x = 0; x < width; x++) {
			const u = width > 1 ? x / (width - 1) : 0;

			const index = (y * width + x) * 4;

			data[index] = lerp(rLeft, rRight, u);
			data[index + 1] = lerp(gLeft, gRight, u);
			data[index + 2] = lerp(bLeft, bRight, u);
			data[index + 3] = 255;
		}
	}
	ctx.putImageData(imgData, 0, 0);
}

export function colorizeGradient(state, time = 0) {
	const gradient = document.getElementById("gradient-bar");
	if (!gradient) return;

	const ctx = gradient.getContext("2d");
	const rect = gradient.getBoundingClientRect();
	const dpr = window.devicePixelRatio || 1;
	const targetHeight = Math.floor(rect.height * dpr);
	const targetWidth = Math.floor(rect.width * dpr);

	if (gradient.style.position !== "absolute") {
		gradient.style.position = "absolute";
		gradient.style.left = "0";
		gradient.style.top = "0";
		gradient.style.width = "100%";
		gradient.style.height = "100%";
	}

	if (gradient.height !== targetHeight || gradient.width !== targetWidth) {
		gradient.width = targetWidth;
		gradient.height = targetHeight;
	}

	const height = gradient.height;
	const width = gradient.width;

	const mode = state ? state.mode : VisMode.COLOR_RAMP;

	if (mode === VisMode.TANGENT_FIELD) {
		if (state.activeQuality === "combined") {
			const start = SHADER_COLORS.COMBINED_GRADIENT_START.map(
				(c) => c * 255,
			);
			const end = SHADER_COLORS.COMBINED_GRADIENT_END.map((c) => c * 255);
			colorizeGradient2D(ctx, width, height, end, end, start, start);
		} else {
			const bgColor = SHADER_COLORS.GRADIENT_BACKGROUND.map(
				(c) => c * 255,
			);
			ctx.fillStyle = `rgb(${Math.round(bgColor[0])}, ${Math.round(bgColor[1])}, ${Math.round(bgColor[2])})`;
			ctx.fillRect(0, 0, width, height);
		}
		return;
	}

	if (state && state.isBinary) {
		colorizeBinaryGradient();
		return;
	}

	if (
		state &&
		state.activeQuality === "combined" &&
		mode === VisMode.ANIMATED
	) {
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
	} else if (mode === VisMode.COLOR_RAMP) {
		if (state.activeQuality === "combined") {
			const cTL = SHADER_COLORS.COMBINED_TL.map((c) => c * 255);
			const cTR = SHADER_COLORS.COMBINED_TR.map((c) => c * 255);
			const cBL = SHADER_COLORS.COMBINED_BL.map((c) => c * 255);
			const cBR = SHADER_COLORS.COMBINED_BR.map((c) => c * 255);
			colorizeGradient2D(ctx, width, height, cTL, cTR, cBL, cBR);
		} else {
			colorizeGradientTurbo(ctx, width, height);
		}
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

export function setGaugeLine(value, state, values = null) {
	if (!state.activeMesh) {
		return;
	}

	let quality = state.activeQuality;
	if (state.activeQuality === "combined") {
		quality = state.mode === VisMode.TANGENT_FIELD ? "bipolar" : "lat";
	}

	if (!state.activeMesh.valueSets[quality]) {
		return;
	}

	const line = document.getElementById("gauge-line");
	const dot = document.getElementById("gauge-dot");

	const [min] = get2Min(state.activeMesh.valueSets[quality]);
	const max = getMax(state.activeMesh.valueSets[quality]);

	if (value > max) {
		line.style.bottom = `100%`;
	} else if (value < min) {
		line.style.bottom = `0%`;
	} else {
		const position = (value - min) / (max - min);
		line.style.bottom = `${position * 100}%`;
	}

	if (
		dot &&
		state.activeQuality === "combined" &&
		(state.mode === VisMode.COLOR_RAMP || state.mode === VisMode.ANIMATED)
	) {
		dot.classList.remove("hidden");
		if (values && values.bipolar !== undefined) {
			const [bMin] = get2Min(state.activeMesh.valueSets["bipolar"]);
			const bMax = getMax(state.activeMesh.valueSets["bipolar"]);

			let bPos = (values.bipolar - bMin) / (bMax - bMin);
			bPos = Math.max(0, Math.min(1, bPos));
			dot.style.left = `${bPos * 100}%`;
		}
	} else if (dot) {
		dot.classList.add("hidden");
	}
}
