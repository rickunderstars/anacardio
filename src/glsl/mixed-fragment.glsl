
uniform float uTime;
uniform float uAmbientLightIntensity;

const float TimeSpeed = 0.05;
const int NumWaves = 10;

varying float val;
varying float vIsNull;
varying vec3 vNormal;

vec3 gradientWave(float t, vec3 colorStart, vec3 colorEnd) {
	t = 1.0 - t;
	t = t * t * t;
	return mix(colorStart, colorEnd, t);
}

void main() {

	float wave = (uTime * TimeSpeed - val) * float(NumWaves);
	float phase = fract(wave);

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

	vec3 nullColor = vec3(0.45, 0.45, 0.45); // grey
	vec3 color = gradientWave(phase, vec3(0.2, 0.2, 0.2), vec3(0.3, 1.0, 1.0));

	vec3 ambient = color * uAmbientLightIntensity;
	vec3 diffuse = color * lambert * (1.0 - uAmbientLightIntensity);
	vec3 nullAmbient = nullColor * uAmbientLightIntensity;
	vec3 nullDiffuse = nullColor * lambert * (1.0 - uAmbientLightIntensity);

	vec3 finalColor =
		mix(ambient + diffuse, nullAmbient + nullDiffuse, vIsNull);
	gl_FragColor = vec4(finalColor, 1.0);

	/*
	if (dFdx(wave) * dFdx(wave) + dFdy(wave) * dFdy(wave) > 0.006) {
		gl_FragColor.rgb = vec3(1.0, 0.0, 1.0);
	}
	*/
}
