uniform float uMin;
uniform float uMax;
uniform float uAmbientLightIntensity;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uExtemlColor;
uniform vec3 uNullColor;

varying float val;
varying float xtml;
varying float vGroupId;
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

	vec3 exteml = uExtemlColor;
	vec3 nullColor = uNullColor;

	vec3 ambient = color * uAmbientLightIntensity;
	vec3 diffuse = color * lambert * (1.0 - uAmbientLightIntensity);

	vec3 nullAmbient = nullColor * uAmbientLightIntensity;
	vec3 nullDiffuse = nullColor * lambert * (1.0 - uAmbientLightIntensity);
	vec3 extemlAmbient = exteml * uAmbientLightIntensity;
	vec3 extemlDiffuse = exteml * lambert * (1.0 - uAmbientLightIntensity);

	float binaryIsNull = step(0.1, abs(vGroupId));
	float binaryXtml = step(0.3, xtml);

	vec3 finalColor =
		mix(mix(ambient + diffuse, nullAmbient + nullDiffuse, binaryIsNull),
			extemlAmbient + extemlDiffuse, binaryXtml);

	gl_FragColor = vec4(finalColor, 1.0);
}
