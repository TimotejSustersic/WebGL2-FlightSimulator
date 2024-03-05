import { Sampler } from "./Sampler.js";

export class Texture {

    image;
    sampler: Sampler; // parametri vzorčenja (neares neighbour, linearna interpolacija) za to mamo tudi class Sampler
    hasMipmaps;

    constructor({image,  sampler}) {
        this.image = image;
        this.sampler = sampler;
    }

    get width() {
        return this.image.width;
    }

    get height() {
        return this.image.height;
    }

}
