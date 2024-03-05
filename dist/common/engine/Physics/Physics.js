import { vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { getGlobalModelMatrix } from '../core/SceneUtils.js';
import { Transform } from '../core/Transform.js';
import { FirstPersonController } from '../controllers/FirstPersonController.js';
import { Interaction } from '../core/Interaction.js';
import { showHTML } from '../core/Utillity.js';
import { Plane } from '../objects/Plane.js';
export class Physics {
    constructor(scene, canvas) {
        this.scene = scene;
        this.document = canvas.ownerDocument;
        this.interactContainer = this.document.getElementById("interaction");
    }
    update(time, dt) {
        this.scene.traverse(node => {
            if (node.isDynamic && node.aabb) {
                this.scene.traverse(other => {
                    if (node !== other && other.isStatic && other.aabb)
                        this.resolveAABBCollision(node, other, time);
                });
            }
            else if (node.isDynamic && node.r) {
                this.scene.traverse(other => {
                    if (node !== other && other.isCircular)
                        this.resolveCircularCollision(node, other, time);
                });
            }
        });
    }
    intervalIntersection(min1, max1, min2, max2) {
        return !(min1 > max2 || min2 > max1);
    }
    aabbIntersection(aabb1, aabb2) {
        return this.intervalIntersection(aabb1.min[0], aabb1.max[0], aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1], aabb1.max[1], aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2], aabb1.max[2], aabb2.min[2], aabb2.max[2]);
    }
    aabbAdjacent(aabb1, aabb2, margin) {
        return this.intervalIntersection(aabb1.min[0] - margin, aabb1.max[0] + margin, aabb2.min[0], aabb2.max[0])
            && this.intervalIntersection(aabb1.min[1] - margin, aabb1.max[1] + margin, aabb2.min[1], aabb2.max[1])
            && this.intervalIntersection(aabb1.min[2] - margin, aabb1.max[2] + margin, aabb2.min[2], aabb2.max[2]);
    }
    getTransformedAABB(node) {
        // Transform all vertices of the AABB from local to global space.
        const matrix = getGlobalModelMatrix(node);
        const { min, max } = node.aabb;
        const vertices = [
            [min[0], min[1], min[2]],
            [min[0], min[1], max[2]],
            [min[0], max[1], min[2]],
            [min[0], max[1], max[2]],
            [max[0], min[1], min[2]],
            [max[0], min[1], max[2]],
            [max[0], max[1], min[2]],
            [max[0], max[1], max[2]],
        ].map(v => vec3.transformMat4(v, v, matrix));
        // Find new min and max by component.
        const xs = vertices.map(v => v[0]);
        const ys = vertices.map(v => v[1]);
        const zs = vertices.map(v => v[2]);
        const newmin = [Math.min(...xs), Math.min(...ys), Math.min(...zs)];
        const newmax = [Math.max(...xs), Math.max(...ys), Math.max(...zs)];
        return { min: newmin, max: newmax };
    }
    resolveAABBCollision(a, b, time) {
        // Get global space AABBs.
        const aBox = this.getTransformedAABB(a);
        const bBox = this.getTransformedAABB(b);
        let interaction = b.getComponentOfType(Interaction);
        // if interaction compoennt 
        if (interaction != undefined) {
            if (interaction.checkCollision) {
                // Check if close enough for interaction
                const isClose = this.aabbAdjacent(aBox, bBox, 2);
                if (isClose) {
                    // console.log("close");
                    const aFirstPersonController = a.getComponentOfType(FirstPersonController);
                    if (aFirstPersonController != undefined) {
                        const keys = aFirstPersonController.keys;
                        // if E is pressed while close
                        if (keys["KeyE"]) {
                            if (interaction.interacting)
                                interaction.stop(time);
                            else
                                interaction.start(time);
                        }
                        showHTML(this.interactContainer);
                        this.interactContainer.innerHTML = interaction.HTMLText;
                    }
                }
            }
            // if we are interacting we dont need colision
            else
                return;
        }
        // Check if there is collision.
        const isColliding = this.aabbIntersection(aBox, bBox);
        if (!isColliding)
            return;
        if (!a.canMove)
            return;
        // Ce pride do trka dynamic blok premaknemo
        // Move node A minimally to avoid collision.
        const diffa = vec3.sub(vec3.create(), bBox.max, aBox.min);
        const diffb = vec3.sub(vec3.create(), aBox.max, bBox.min);
        let minDiff = Infinity;
        let minDirection = [0, 0, 0];
        if (diffa[0] >= 0 && diffa[0] < minDiff) {
            minDiff = diffa[0];
            minDirection = [minDiff, 0, 0];
        }
        if (diffa[1] >= 0 && diffa[1] < minDiff) {
            minDiff = diffa[1];
            minDirection = [0, minDiff, 0];
        }
        if (diffa[2] >= 0 && diffa[2] < minDiff) {
            minDiff = diffa[2];
            minDirection = [0, 0, minDiff];
        }
        if (diffb[0] >= 0 && diffb[0] < minDiff) {
            minDiff = diffb[0];
            minDirection = [-minDiff, 0, 0];
        }
        if (diffb[1] >= 0 && diffb[1] < minDiff) {
            minDiff = diffb[1];
            minDirection = [0, -minDiff, 0];
        }
        if (diffb[2] >= 0 && diffb[2] < minDiff) {
            minDiff = diffb[2];
            minDirection = [0, 0, -minDiff];
        }
        const transform = a.getComponentOfType(Transform);
        if (!transform)
            return;
        vec3.add(transform.translation, transform.translation, minDirection);
    }
    resolveCircularCollision(a, b, time) {
        // 0..x, 1...y, 2...z
        const aTranslation = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(a));
        const bTranslation = mat4.getTranslation(vec3.create(), getGlobalModelMatrix(b));
        // distance = √ [(x2 – x1)2 + (y2 – y1)2 + (z2 – z1)2]
        const d3D = Math.sqrt(((bTranslation[0] - aTranslation[0]) ** 2) +
            ((bTranslation[1] - aTranslation[1]) ** 2) +
            ((bTranslation[2] - aTranslation[2]) ** 2));
        // first we need 3D distance to see how far object is (basic collision of spheres)
        if (d3D <= a.r + b.r) {
            // now this isn't done properly (should be somhere else) but is quite efficient and simple
            // if you enter its space you passed the circle (even if you crashed)
            b.colided = true;
            // now we only get YZ collision since plane is a sphere and circle is in "2D"
            const d2D = Math.sqrt(((bTranslation[1] - aTranslation[1]) ** 2) +
                ((bTranslation[2] - aTranslation[2]) ** 2));
            // basic collision of 2D circles
            if (d2D + a.r > b.r) {
                a.crashed = true;
                b.crashed = true;
                showHTML(this.interactContainer);
                this.interactContainer.classList.remove("hidden");
                this.interactContainer.innerHTML = `Crahed into ${b.name}`;
                let planeInstance = a.getComponentOfType(Plane);
                if (planeInstance != null)
                    planeInstance.crash();
                setTimeout(_ => location.reload(), 5000);
            }
        }
    }
}
//# sourceMappingURL=Physics.js.map