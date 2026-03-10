attribute float bipolar;
attribute float lat;
attribute float exteml;
attribute float groupid;

uniform float uBipAbsMin;
uniform float uBipMin;
uniform float uBipMax;
uniform float uLatAbsMin;
uniform float uLatMin;
uniform float uLatMax;

varying float lt;
varying float bip;
varying float xtml;
varying float vIsNull;
varying float vGroupId;
varying vec3 vNormal;
varying vec3 vViewPosition;

float normalizeValue(float value, float minVal, float maxVal) {
	return (value - minVal) / (maxVal - minVal);
}

void main() {

	lt = normalizeValue(lat, uLatMin, uLatMax);
	bip = normalizeValue(bipolar, uBipMin, uBipMax);
	xtml = step(0.5, exteml);
	vGroupId = groupid;

	float epsilon = 0.0001;
	vIsNull = 0.0;

	vNormal = normalize(normalMatrix * normal);

	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	vViewPosition = -mvPosition.xyz;
	gl_Position = projectionMatrix * mvPosition;
}
