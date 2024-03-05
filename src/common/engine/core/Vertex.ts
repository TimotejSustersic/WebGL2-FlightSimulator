export class Vertex {

    public position: Array<number>;
    public texcoords: Array<number>;
    public normal: Array<number>;
    public tangent: Array<number>;

    constructor({
        position = [0, 0, 0],
        texcoords = [0, 0],
        normal = [0, 0, 0],
        tangent = [0, 0, 0],
    } = {}) {
        this.position = position;
        this.texcoords = texcoords;
        this.normal = normal;
        this.tangent = tangent;
    }

}
