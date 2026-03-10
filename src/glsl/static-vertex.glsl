attribute float value;

uniform float uMin;
uniform float uMax;
uniform float uOnlyTwo;

varying float val;
varying vec3 vNormal;
varying vec3 vViewPosition;

float normalizeValue(float value, float minVal, float maxVal) {
	return (value - minVal) / (maxVal - minVal);
}

void main() {

	val = normalizeValue(value, uMin, uMax);

	vNormal = normalize(normalMatrix * normal);

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vViewPosition = -mvPosition.xyz;
	gl_Position = projectionMatrix * mvPosition;
}