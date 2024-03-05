import { Primitive } from "./Primitive.js";

export class Model {

    public primitives: Array<Primitive>;

    constructor({
        primitives = [],
    } ) {
        this.primitives = primitives;
    }

}
