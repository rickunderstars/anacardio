export function getMax(array) {
	let max = -Infinity;

	for (let i = 0; i < array.length; i++) {
		if (array[i] > max) {
			max = array[i];
		}
	}
	return max;
}

export function get2Min(array) {
	let absMin = Infinity;
	let min = Infinity;

	const valSet = new Set(array);
	const moreThan2 = valSet.size > 2;

	for (let i = 0; i < array.length; i++) {
		if (array[i] < absMin) {
			min = absMin;
			absMin = array[i];
		} else if (array[i] < min && array[i] > absMin) {
			min = array[i];
		}
	}

	if (!moreThan2) {
		min = absMin;
	}

	return [absMin, min];
}

export function turboColormap(x) {
	const kRedVec4 = [0.13572138, 4.6153926, -42.66032258, 132.13108234];
	const kGreenVec4 = [0.09140261, 2.19418839, 4.84296658, -14.18503333];
	const kBlueVec4 = [0.1066733, 12.64194608, -60.58204836, 110.36276771];
	const kRedVec2 = [-152.94239396, 59.28637943];
	const kGreenVec2 = [4.27729857, 2.82956604];
	const kBlueVec2 = [-89.90310912, 27.34824973];

	x = Math.max(0, Math.min(1, x));
	const v4 = [1, x, x * x, x * x * x];
	const v2 = [v4[2] * v4[2], v4[3] * v4[2]];

	const r =
		v4.reduce((s, v, i) => s + v * kRedVec4[i], 0) +
		v2.reduce((s, v, i) => s + v * kRedVec2[i], 0);
	const g =
		v4.reduce((s, v, i) => s + v * kGreenVec4[i], 0) +
		v2.reduce((s, v, i) => s + v * kGreenVec2[i], 0);
	const b =
		v4.reduce((s, v, i) => s + v * kBlueVec4[i], 0) +
		v2.reduce((s, v, i) => s + v * kBlueVec2[i], 0);

	return [
		Math.round(Math.max(0, Math.min(1, r)) * 255),
		Math.round(Math.max(0, Math.min(1, g)) * 255),
		Math.round(Math.max(0, Math.min(1, b)) * 255),
	];
}

export function areValuesClose(v1, v2) {
	return Math.abs(v1 - v2) < 0.00001;
}

export function formatNumber(num, significantDigits = 5) {
	if (num === undefined || num === null) {
		return "---";
	}
	if (Number.isInteger(num)) {
		return num.toString();
	}
	return parseFloat(num.toPrecision(significantDigits));
}

export function mixColors(c1, c2, t) {
	return [
		c1[0] * (1 - t) + c2[0] * t,
		c1[1] * (1 - t) + c2[1] * t,
		c1[2] * (1 - t) + c2[2] * t,
	];
}

export function gradientWave(t, colorStart, colorEnd, power) {
	t = 1.0 - t;
	t = Math.pow(t, power);
	return mixColors(colorStart, colorEnd, t);
}
