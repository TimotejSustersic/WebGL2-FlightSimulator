export class Material {

    // vse te stvari exporta gltf

    baseTexture; // edini ki ga bomo dejansko uporabljali in za nas bistven
    emissionTexture;
    normalTexture; // mogoce tud ta
    occlusionTexture;
    roughnessTexture;
    metalnessTexture;

    baseFactor
    emissionFactor
    normalFactor
    occlusionFactor
    roughnessFactor
    metalnessFactor


    constructor({
        baseTexture,
        emissionTexture,
        normalTexture,
        occlusionTexture,
        roughnessTexture,
        metalnessTexture,

        baseFactor = [1, 1, 1, 1],
        emissionFactor = [0, 0, 0],
        normalFactor = 1,
        occlusionFactor = 1,
        roughnessFactor = 1,
        metalnessFactor = 1,
    }) {
        this.baseTexture = baseTexture;
        this.emissionTexture = emissionTexture;
        this.normalTexture = normalTexture;
        this.occlusionTexture = occlusionTexture;
        this.roughnessTexture = roughnessTexture;
        this.metalnessTexture = metalnessTexture;

        this.baseFactor = baseFactor;
        this.emissionFactor = emissionFactor;
        this.normalFactor = normalFactor;
        this.occlusionFactor = occlusionFactor;
        this.roughnessFactor = roughnessFactor;
        this.metalnessFactor = metalnessFactor;
    }

}
