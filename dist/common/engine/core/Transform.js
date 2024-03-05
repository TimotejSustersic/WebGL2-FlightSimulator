import { mat4 } from '../../../lib/gl-matrix-module.js';
export class Transform {
    constructor({ rotation = [0, 0, 0, 1], translation = [0, 0, 0], scale = [1, 1, 1],
    //matrix,
     } = {}) {
        this.rotation = rotation;
        this.translation = translation;
        this.scale = scale;
        //if (matrix) {
        //    this.matrix = matrix;
        // }
    }
    // mi mormo te stvari na konc skupi dat in zato mamo to funkcijo
    get matrix() {
        return mat4.fromRotationTranslationScale(mat4.create(), this.rotation, this.translation, this.scale);
    }
    set matrix(matrix) {
        mat4.getRotation(this.rotation, matrix);
        mat4.getTranslation(this.translation, matrix);
        mat4.getScale(this.scale, matrix);
    }
    getTranslationX() {
        return this.translation[0];
    }
    getTranslationY() {
        return this.translation[1];
    }
    getTranslationZ() {
        return this.translation[2];
    }
    setTranslationX(val) {
        this.translation[0] = val;
    }
    setTranslationY(val) {
        this.translation[1] = val;
    }
    setTranslationZ(val) {
        this.translation[2] = val;
    }
}
//# sourceMappingURL=Transform.js.map