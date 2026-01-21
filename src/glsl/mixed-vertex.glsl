attribute float bipolar;
attribute float lat;

uniform float uBipAbsMin;
uniform float uBipMin;
uniform float uBipMax;
uniform float uLatAbsMin;
uniform float uLatMin;
uniform float uLatMax;

varying float lt;
varying float bip;
varying float vIsNull;
varying vec3 vNormal;

float normalizeValue(float value, float minVal, float maxVal) {
	return (value - minVal) / (maxVal - minVal);
}

void main() {

	lt = normalizeValue(lat, uLatMin, uLatMax);
	bip = normalizeValue(bipolar, uBipMin, uBipMax);

	float epsilon = 0.0001;
	vIsNull = step(lat, uLatMin + epsilon);

	vNormal = normalize(normalMatrix * normal);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
