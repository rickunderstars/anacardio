attribute float value;
attribute float exteml;
attribute float groupid;

uniform float uMin;
uniform float uMax;

varying float val;
varying float xtml;
varying float vGroupId;
varying vec3 vNormal;

void main() {
	val = value;
	xtml = step(0.5, exteml);
	vGroupId = groupid;
	vNormal = normalize(normalMatrix * normal);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
