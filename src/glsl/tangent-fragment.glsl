uniform float uAmbientLightIntensity;
uniform float uSpecularIntensity;
uniform vec3 uColor;

varying float val;
varying vec3 vNormal;
varying vec3 vViewPosition;

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

	vec3 viewDir = normalize(vViewPosition);
	float shininess = 256.0;
	vec3 h1 = normalize(light1Dir + viewDir);
	vec3 h2 = normalize(light2Dir + viewDir);
	vec3 h3 = normalize(light3Dir + viewDir);
	vec3 h4 = normalize(light4Dir + viewDir);
	float spec1 = pow(max(dot(vNormal, h1), 0.0), shininess);
	float spec2 = pow(max(dot(vNormal, h2), 0.0), shininess);
	float spec3 = pow(max(dot(vNormal, h3), 0.0), shininess);
	float spec4 = pow(max(dot(vNormal, h4), 0.0), shininess);
	float specular =
		(spec1 * 1.3 + spec2 * 1.3 + spec3 * 0.7 + spec4 * 0.7) / 6.0;

	vec3 color = uColor;

	vec3 ambient = color * uAmbientLightIntensity;
	vec3 diffuse = color * lambert * (1.0 - uAmbientLightIntensity);
	vec3 specColor = vec3(1.0) * specular * uSpecularIntensity;

	vec3 finalColor = ambient + diffuse + specColor;
	gl_FragColor = vec4(finalColor, 1.0);
}