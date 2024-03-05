import { mat4 } from '../../../lib/gl-matrix-module.js';

export class Transform {

    public rotation: Array<number>; // vec4 kvatarnioni, enostavni za kombinirat (yaw pich roll so smeri rotacije)
    // probelm je ce stvari veckrat delas in zato mamo to. to je pa quat funkcija potem pa na njej delas xyz rotacije
        
    public translation: Array<number> ;  // vec3
    
    public scale: Array<number> ;  // vec 3 


    constructor({
        rotation = [0, 0, 0, 1],
        translation = [0, 0, 0],
        scale = [1, 1, 1],
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
        return mat4.fromRotationTranslationScale(mat4.create(),
            this.rotation, this.translation, this.scale);
    }

    set matrix(matrix) {
        mat4.getRotation(this.rotation, matrix);
        mat4.getTranslation(this.translation, matrix);
        mat4.getScale(this.scale, matrix);
    }

    public getTranslationX(): number {
        return this.translation[0];
    }

    public getTranslationY(): number {
        return this.translation[1];
    }

    public getTranslationZ(): number {
        return this.translation[2];
    }

    public setTranslationX(val: number): void {
        this.translation[0] = val;
    }

    public setTranslationY(val: number): void {
        this.translation[1] = val;
    }

    public setTranslationZ(val: number): void {
        this.translation[2] = val;
    }
}
