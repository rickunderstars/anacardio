attribute float lat;
attribute float bipolar;
attribute float exteml;
attribute float groupid;

uniform float uLatMin;
uniform float uLatMax;
uniform float uBipMin;
uniform float uBipMax;

varying float vLat;
varying float vBip;
varying float vXtml;
varying float vGroupId;
varying vec3 vNormal;

float normalizeValue(float value, float minVal, float maxVal) {
	return (value - minVal) / (maxVal - minVal);
}

void main() {
	vLat = normalizeValue(lat, uLatMin, uLatMax);
	vBip = normalizeValue(bipolar, uBipMin, uBipMax);
	vXtml = step(0.5, exteml);
	vGroupId = groupid;
	
	vNormal = normalize(normalMatrix * normal);

	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
