import { mat4 } from '../../../lib/gl-matrix-module.js';

import { Camera } from './Camera.js';
import { Model } from './Model.js';
import { Transform } from './Transform.js';
import { Node } from '../core/Node.js';

// lokalno matriko od noda To mas zato da tud ce node nima transformacije gor se vedno dobis lokalno matriko noda
export function getLocalModelMatrix(node: Node) {
    const matrix = mat4.create();
    for (const transform of node.getComponentsOfType(Transform)) {
        mat4.mul(matrix, matrix, transform.matrix);
    }
    return matrix;
}

// gre po hierarhiji gor dol in pomnozi vse lokalne matrike on noda in starsa da dobis tapravo pozicijo od noda
export function getGlobalModelMatrix(node: Node) {
    if (node.parent) {
        const parentMatrix = getGlobalModelMatrix(node.parent);
        const modelMatrix = getLocalModelMatrix(node);
        return mat4.multiply(parentMatrix, parentMatrix, modelMatrix);
    } else {
        return getLocalModelMatrix(node);
    }
}

// samo helper file da nardi inverz namesto tebe
export function getLocalViewMatrix(node: Node) {
    const matrix = getLocalModelMatrix(node);
    return mat4.invert(matrix, matrix);
}

export function getGlobalViewMatrix(node: Node) {
    const matrix = getGlobalModelMatrix(node);
    return mat4.invert(matrix, matrix);
}

// dobis od kamere lokacijo ce nimas nic dobis entiteo
export function getProjectionMatrix(node: Node) {
    const camera = node.getComponentOfType(Camera);
    return camera ? camera.projectionMatrix : mat4.create();
}

export function getModels(node: Node) {
    return node.getComponentsOfType(Model);
}
