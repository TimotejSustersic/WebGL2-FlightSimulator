export class Mesh {

    // letalo je najprej mesh

    //model.addComoponet(new Mesh(vertices, indices )) // glej nas kvadrat

    public vertices: Array<number>;
    public indices: Array<number>;
    
    constructor({
        vertices = [],
        indices = [],
    } = {}) {
        this.vertices = vertices;
        this.indices = indices;
    }
}
