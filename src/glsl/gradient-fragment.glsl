uniform float uMin;
uniform float uMax;
uniform float uAmbientLightIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;

varying float val;
varying vec3 vNormal;

float normalizeValue(float value, float minVal, float maxVal) {
	return (value - minVal) / (maxVal - minVal);
}

void main() {
	vec3 light1Dir = normalize(vec3(-1.0, 1.0, 1.0));
	vec3 light2Dir = normalize(vec3(1.0, 1.0, 1.0));
	vec3 light3Dir = normalize(vec3(1.0, -1.0, 1.0));
	vec3 light4Dir = normalize(vec3(-1.0, -1.0, 1.0));

	float light1Diffuse = max(dot(vNormal, light1Dir), 0.0);
	float light2Diffuse = max(dot(vNormal, light2Dir), 0.0);
	float light3Diffuse = max(dot(vNormal, light3Dir), 0.0);
	float light4Diffuse = max(dot(vNormal, light4Dir), 0.0);

	vec3 lambert = light1Diffuse * vec3(1.3) + light2Diffuse * vec3(1.3) +
				   light3Diffuse * vec3(0.7) + light4Diffuse * vec3(0.7);
	lambert = lambert / vec3(3.0);

	float t = normalizeValue(val, uMin, uMax);
	vec3 color = mix(uColor1, uColor2, clamp(t, 0.0, 1.0));

	vec3 ambient = color * uAmbientLightIntensity;
	vec3 diffuse = color * lambert * (1.0 - uAmbientLightIntensity);

	vec3 finalColor = ambient + diffuse;
	gl_FragColor = vec4(finalColor, 1.0);
}
