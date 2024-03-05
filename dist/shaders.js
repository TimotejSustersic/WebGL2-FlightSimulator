const vertex = `#version 300 es

layout (location = 0) in vec3 aPosition;
layout (location = 1) in vec2 aTexCoord;
layout (location = 2) in vec3 aNormal; // dobimo se normalo

uniform mat4 uModelMatrix; // mvpMatrix (model matrix)

uniform mat4 uViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat3 uNormalMatrix;

uniform vec3 uCameraPosition; // input za poticijo nase kamere

// Za shaderje
out vec2 vTexCoord;
out vec3 vModelSurface; // povrsina modela
out vec3 vCameraPosition; // rabimo vec nase camere
out vec3 vNormal;

void main() {

    // tuki nardimo model view projection matrix in zracunamo pozicijo v dejanski sceni
    gl_Position = uProjectionMatrix * uViewMatrix * uModelMatrix * vec4(aPosition, 1);
    
    vCameraPosition = uCameraPosition;

    vModelSurface = (uModelMatrix * vec4(aPosition, 1)).xyz;
    vTexCoord = aTexCoord;
    vNormal = uNormalMatrix * aNormal;
}`;
const fragment = `#version 300 es
precision mediump float;
precision mediump sampler2D;

uniform sampler2D uBaseTexture;
uniform vec4 uBaseFactor;

uniform vec3 uLightPosition;
uniform float uLightAmbient; 
uniform float uLightShininess; 
uniform vec3 uLightColor; 

in vec3 vModelSurface; // to je pozicija povrsine
in vec2 vTexCoord;
in vec3 vCameraPosition; // to je pozicija kamere
in vec3 vNormal;

out vec4 oColor;

void main() {

    // Lambert
    vec3 N = normalize(vNormal); // vektor smeri normale
    vec3 L = normalize(uLightPosition - vModelSurface); // vektor smeri luci
    float lambert = max(dot(L, N), 0.0);

    vec3 diffuseLight = (lambert + uLightAmbient) * uLightColor;
    
    // Phong
    vec3 V = normalize(vCameraPosition - vModelSurface); // vector nase kamere ki gleda proti povrsini
    // reflect(vector, normal); 
    // reflect deluje tko da osteje dve projekciji zato je treba L negirat
    vec3 R = normalize(reflect(-L, N)); // oboj svetlobe od povrsine
    float phong = pow(max(dot(R, V), 0.0), uLightShininess);

    vec3 specularLight = phong * uLightColor;
    
    // koncna barva
    vec4 baseColor = texture(uBaseTexture, vTexCoord);
    
    // we dont see colors linearly so we fix this with some gamma  (to gain a curve)
    const float gamma = 2.2;
    vec3 gammaCorrection = pow(baseColor.rgb, vec3(gamma));
       
    // we only want to change the color and not alfa
    vec3 finalColor = gammaCorrection * diffuseLight + specularLight;
    
    oColor = uBaseFactor * pow(vec4(finalColor, baseColor.a), vec4(1.0 / gamma));
}`;
export const shaders = {
    instanced: { vertex, fragment }
};
//# sourceMappingURL=shaders.js.map