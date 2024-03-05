import * as WebGL from '../WebGL.js';
import { Material } from '../core/Material.js';
import { Mesh } from '../core/Mesh.js';
import { Model } from '../core/Model.js';
import { Node } from '../core/Node.js';
import { Primitive } from '../core/Primitive.js';
import { Sampler } from '../core/Sampler.js';

import { getModels } from '../core/SceneUtils.js';
import { Texture } from '../core/Texture.js';
import { parseFormat, createVertexBuffer } from '../core/VertexUtils.js';

export class BaseRenderer {

    gl: WebGL2RenderingContext;
    glObjects: WeakMap<any, any>;

    constructor(gl: WebGL2RenderingContext) {
        this.gl = gl;
        this.glObjects = new WeakMap();
    }

    prepareNode(node: Node) {
        const models = getModels(node);
        for (const model of models) {
            this.prepareModel(model);
        }
        for (const child of node.children) {
            this.prepareNode(child);
        }
    }

    prepareModel(model: Model) {
        for (const primitive of model.primitives) {
            this.preparePrimitive(primitive);
        }
    }

    preparePrimitive(primitive: Primitive) {
        if (primitive.mesh) {
            this.prepareMesh(primitive.mesh);
        }
        if (primitive.material) {
            this.prepareMaterial(primitive.material);
        }
    }

    prepareMaterial(material: Material) {
        if (material.baseTexture) {
            this.prepareTexture(material.baseTexture);
        }
        if (material.emissionTexture) {
            this.prepareTexture(material.emissionTexture);
        }
        if (material.normalTexture) {
            this.prepareTexture(material.normalTexture);
        }
        if (material.occlusionTexture) {
            this.prepareTexture(material.occlusionTexture);
        }
        if (material.roughnessTexture) {
            this.prepareTexture(material.roughnessTexture);
        }
        if (material.metalnessTexture) {
            this.prepareTexture(material.metalnessTexture);
        }
    }

    prepareTexture(texture: Texture) {
        if (texture.image) {
            this.prepareImage(texture.image);
        }
        if (texture.sampler) {
            this.prepareSampler(texture.sampler);
        }
    }

    prepareImage(image) {
        if (this.glObjects.has(image)) {
            return this.glObjects.get(image);
        }

        const glTexture = WebGL.createTexture(this.gl, { image, mip: true } as any);

        this.glObjects.set(image, glTexture);
        return glTexture;
    }

    prepareSampler(sampler: Sampler) {
        if (this.glObjects.has(sampler)) {
            return this.glObjects.get(sampler);
        }

        const gl = this.gl;

        const minFilter = {
            'nearest': {
                'nearest': gl.NEAREST_MIPMAP_NEAREST,
                'linear': gl.NEAREST_MIPMAP_LINEAR,
            },
            'linear': {
                'nearest': gl.LINEAR_MIPMAP_NEAREST,
                'linear': gl.LINEAR_MIPMAP_LINEAR,
            },
        };

        const magFilter = {
            'nearest': gl.NEAREST,
            'linear': gl.LINEAR,
        };

        const wrap = {
            'repeat': gl.REPEAT,
            'mirror-repeat': gl.MIRRORED_REPEAT,
            'clamp-to-edge': gl.CLAMP_TO_EDGE,
        };

        const glSampler = WebGL.createSampler(this.gl, {
            min: minFilter[sampler.minFilter][sampler.mipmapFilter],
            mag: magFilter[sampler.magFilter],
            wrapS: wrap[sampler.addressModeU],
            wrapT: wrap[sampler.addressModeV],
        } as any);

        this.glObjects.set(sampler, glSampler);
        return glSampler;
    }

    prepareMesh(mesh: Mesh) {
        if (this.glObjects.has(mesh)) {
            return this.glObjects.get(mesh);
        }

        const gl = this.gl;

        const vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        const vertexBufferLayout = {
            arrayStride: 48,
            attributes: [
                {
                    name: 'position',
                    shaderLocation: 0,
                    offset: 0,
                    format: 'float32x3',
                },
                {
                    name: 'texcoords',
                    shaderLocation: 1,
                    offset: 12,
                    format: 'float32x2',
                },
                {
                    name: 'normal',
                    shaderLocation: 2,
                    offset: 20,
                    format: 'float32x3',
                },
                {
                    name: 'tangent',
                    shaderLocation: 3,
                    offset: 32,
                    format: 'float32x3',
                }, 
                // {
                //     name: 'bitangent',
                //     shaderLocation: 4,
                //     offset: 44,
                //     format: 'float32x3',
                // },
            ],
        };

        const vertexBufferArrayBuffer = createVertexBuffer(mesh.vertices, vertexBufferLayout);
        const vertexBuffer = WebGL.createBuffer(gl, {
            data: vertexBufferArrayBuffer,
            target: gl.ARRAY_BUFFER,
        });

        const indexBufferArrayBuffer = new Uint32Array(mesh.indices).buffer;
        const indexBuffer = WebGL.createBuffer(gl, {
            data: indexBufferArrayBuffer,
            target: gl.ELEMENT_ARRAY_BUFFER,
        });

        const componentTypeMap = {
            'float': {
                'true': {
                    4: gl.FLOAT,
                },
                'false': {
                    4: gl.FLOAT,
                },
            },
            'int': {
                'true': {
                    1: gl.BYTE,
                    2: gl.SHORT,
                    4: gl.INT,
                },
                'false': {
                    1: gl.UNSIGNED_BYTE,
                    2: gl.UNSIGNED_SHORT,
                    4: gl.UNSIGNED_INT,
                },
            },
        };

        for (const attribute of vertexBufferLayout.attributes) {
            const format = parseFormat(attribute.format);
            WebGL.configureAttribute(gl, {
                location: attribute.shaderLocation,
                count: format.componentCount,
                type: componentTypeMap[format.componentType][format.componentSigned][format.componentSize],
                normalize: format.componentNormalized,
                stride: vertexBufferLayout.arrayStride,
                offset: attribute.offset,
            });
        }

        this.glObjects.set(mesh, vao);
        return vao;
    }

}
