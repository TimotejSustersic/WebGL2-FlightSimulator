import { mat4, vec3, mat3 } from '../../../lib/gl-matrix-module.js';

import * as WebGL from '../WebGL.js';

import { BaseRenderer } from './BaseRenderer.js';

import {
    getLocalModelMatrix,
    getGlobalViewMatrix,
    getProjectionMatrix,
    getModels,
    getGlobalModelMatrix,
} from '../core/SceneUtils.js';

import { shaders } from '../shaders/shaders.js';
import { Light } from '../core/Light.js';
import { Node } from '../core/Node.js';
import { Primitive } from '../core/Primitive.js';

export class Renderer extends BaseRenderer {

    private programs: Object;

    constructor(gl: WebGL2RenderingContext) {
        super(gl);

        this.programs = WebGL.buildPrograms(gl, shaders);

        gl.clearColor(120/255, 187/255, 222/255, 1);
        // doda globino
        gl.enable(gl.DEPTH_TEST); 
        // to nam da normane oblike in ne samo pol noda, plus narise floor
        // gl.disable(gl.CULL_FACE);
        // zagotovi da zakrjemo cel kanvas
        gl.disable(gl.SCISSOR_TEST);
    }

    render(scene: Node, camera: Node, light: Node) {
        const gl = this.gl;

        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        const { program, uniforms } = this.programs["instanced"];
        gl.useProgram(program);

        // view matrix
        const viewMatrix = getGlobalViewMatrix(camera);
        gl.uniformMatrix4fv(uniforms.uViewMatrix, false, viewMatrix);
        
        // projection matrix
        const projectionMatrix = getProjectionMatrix(camera);
        gl.uniformMatrix4fv(uniforms.uProjectionMatrix, false, projectionMatrix);
        
        // kle posiljamo pozicijo kamere za Phongov model
        const cameraMatrix = getGlobalModelMatrix(camera);
        const cameraPosition = mat4.getTranslation(vec3.create(), cameraMatrix);
        gl.uniform3fv(uniforms.uCameraPosition, cameraPosition);

        // kle posljemo light v shader
        const lightMatrix = getGlobalModelMatrix(light);
        const lightPosition = mat4.getTranslation(vec3.create(), lightMatrix);
        gl.uniform3fv(uniforms.uLightPosition, lightPosition);

        const lightComponent: Light = light.getComponentOfType(Light);
        gl.uniform1f(uniforms.uLightAmbient, lightComponent.ambient);
        gl.uniform1f(uniforms.uLightShininess, lightComponent.shinines);
        gl.uniform3fv(uniforms.uLightColor, 
            vec3.scale(vec3.create(), lightComponent.color, lightComponent.intensity / 255));

        this.renderNode(scene);
    }

    renderNode(node: Node, modelMatrix = mat4.create()) {
        const gl = this.gl;

        const { program, uniforms } = this.programs["instanced"];

        const localMatrix = getLocalModelMatrix(node);
        // model matrix ki ga v shaderju spremenimo v model view projection matrix (mvpMatrix)
        modelMatrix = mat4.mul(mat4.create(), modelMatrix, localMatrix);
        gl.uniformMatrix4fv(uniforms.uModelMatrix, false, modelMatrix);
        
        // normale
        const normalMatrix = mat3.normalFromMat4(mat3.create(), modelMatrix);
        gl.uniformMatrix3fv(uniforms.uNormalMatrix, false, normalMatrix);


        const models = getModels(node);
        for (const model of models)
            for (const primitive of model.primitives)
                this.renderPrimitive(primitive);

        for (const child of node.children)
            this.renderNode(child, modelMatrix);
    }

    renderPrimitive(primitive: Primitive) {
        const gl = this.gl;

        const { program, uniforms } = this.programs["instanced"];

        const vao = this.prepareMesh(primitive.mesh);
        gl.bindVertexArray(vao);

        const material = primitive.material;
        gl.uniform4fv(uniforms.uBaseFactor, material.baseFactor);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(uniforms.uBaseTexture, 0);

        const glTexture = this.prepareImage(material.baseTexture.image);
        const glSampler = this.prepareSampler(material.baseTexture.sampler);

        gl.bindTexture(gl.TEXTURE_2D, glTexture);
        gl.bindSampler(0, glSampler);

        gl.drawElements(gl.TRIANGLES, primitive.mesh.indices.length, gl.UNSIGNED_INT, 0);

        gl.bindVertexArray(null);
    }
}
