uniform float uAmbientLightIntensity;
uniform float uSpecularIntensity;
uniform float uOnlyTwo;
uniform vec3 uBinColor1;
uniform vec3 uBinColor2;

varying float val;
varying vec3 vNormal;
varying vec3 vViewPosition;

vec3 TurboColormap(in float x) {
	const vec4 kRedVec4 =
		vec4(0.13572138, 4.61539260, -42.66032258, 132.13108234);
	const vec4 kGreenVec4 =
		vec4(0.09140261, 2.19418839, 4.84296658, -14.18503333);
	const vec4 kBlueVec4 =
		vec4(0.10667330, 12.64194608, -60.58204836, 110.36276771);
	const vec2 kRedVec2 = vec2(-152.94239396, 59.28637943);
	const vec2 kGreenVec2 = vec2(4.27729857, 2.82956604);
	const vec2 kBlueVec2 = vec2(-89.90310912, 27.34824973);

	x = clamp(x, 0.0, 1.0);
	vec4 v4 = vec4(1.0, x, x * x, x * x * x);
	vec2 v2 = v4.zw * v4.z;
	return vec3(dot(v4, kRedVec4) + dot(v2, kRedVec2),
				dot(v4, kGreenVec4) + dot(v2, kGreenVec2),
				dot(v4, kBlueVec4) + dot(v2, kBlueVec2));
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

	vec3 color;
	if (uOnlyTwo > 0.5) {
		float snappedVal = step(0.5, val);
		color = mix(uBinColor1, uBinColor2, snappedVal);
	} else {
		color = TurboColormap(val);
	}

	vec3 ambient = color * uAmbientLightIntensity;
	vec3 diffuse = color * lambert * (1.0 - uAmbientLightIntensity);
	vec3 specColor = vec3(1.0) * specular * uSpecularIntensity;

	vec3 finalColor = ambient + diffuse + specColor;
	gl_FragColor = vec4(finalColor, 1.0);
}