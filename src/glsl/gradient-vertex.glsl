attribute float value;

uniform float uMin;
uniform float uMax;

varying float val;
varying vec3 vNormal;

void main() {
	val = value;
	vNormal = normalize(normalMatrix * normal);
	gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
