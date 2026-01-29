attribute float value;

uniform float uMin;
uniform float uMax;

varying float val;
varying vec3 vNormal;

float normalizeValue(float value, float minVal, float maxVal) {
	return (value - minVal) / (maxVal - minVal);
}

void main() {

	val = normalizeValue(value, uMin, uMax);

	vNormal = normalize(normalMatrix * normal);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}