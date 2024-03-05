import { Material } from "./Material.js";
import { Mesh } from "./Mesh.js";

export class Primitive {

    mesh: Mesh;
    material: Material;

    constructor({
        mesh,
        material,
    }) {
        this.mesh = mesh;
        this.material = material;
    }

}
