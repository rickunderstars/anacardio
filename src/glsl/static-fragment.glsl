uniform float uAmbientLightIntensity;

varying float val;
varying float vIsNull;
varying vec3 vNormal;

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
	lambert = lambert / vec3(4.0);

	vec3 nullColor = vec3(0.5, 0.5, 0.5);
	vec3 color = TurboColormap(val);

	vec3 ambient = color * uAmbientLightIntensity;
	vec3 diffuse = color * lambert * (1.0 - uAmbientLightIntensity);
	vec3 nullAmbient = nullColor * uAmbientLightIntensity;
	vec3 nullDiffuse = nullColor * lambert * (1.0 - uAmbientLightIntensity);

	float binaryIsNull = step(0.1, vIsNull);
	vec3 finalColor =
		mix(ambient + diffuse, nullAmbient + nullDiffuse, binaryIsNull);
	gl_FragColor = vec4(finalColor, 1.0);
}