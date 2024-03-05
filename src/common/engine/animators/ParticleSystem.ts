import { GameDTO } from "../Game.js";
import { Model } from "../core/Model.js";
import { Node } from "../core/Node.js";
import { getGlobalModelMatrix } from "../core/SceneUtils.js";
import { Transform } from "../core/Transform.js";

import { mat4, vec3, quat } from '../../../lib/gl-matrix-module.js';
import { setExtremeValues } from "../core/Utillity.js";

export class ParticleSystem {

    private scene: Node;
    private node: Node;

    // always the same
    private particleNode: Node;

    private particles: Array<Particle> = [];

    public newCount = 0;
    public sumCount = 0;

    constructor(scene: Node, node: Node) {

        this.scene = scene;
        this.node = node;

        this.particleNode = this.scene.find(node => node.name.includes(GameDTO.Particle));
        if (!this.particleNode)
            console.error("no particle node found");
    }

    public update(time: number, dt: number) {

        // update existing
        for (let i = 0; i < this.particles.length; i++) {

            const particle = this.particles[i];
            particle.age += dt;

            // delete old
            if (particle.age >= particle.lifespan) {               
                this.particles.splice(i, 1);
                particle.discard();
            }
            else {
                // update location of old
                particle.updateLocation();
            }
        }            
        
        // add new
        for (let i = 0; i < this.newCount; i++) {

            const randNum = Math.random() * 3;
            if (randNum > 2) {

                const newInstance = new Particle(this.scene, this.node, this.particleNode, this.sumCount);
                this.sumCount++;
                this.particles.push(newInstance);
            }
        }
    }
}

class Particle {

    public node: Node;
    public scene: Node;

    // time to dissappear
    public lifespan = 0.1;
    public age = 0;
        
    private initTranslation: Array<number>;

    private interpolationSpeed = 4;

    // scene, targetNode, particle origin instance
    constructor(scene: Node, node: Node, origin: Node, index: number) {

        this.scene = scene;
        this.node = new Node(`Particle#${index}`);

        // add Looks
        this.node.addComponent(origin.getComponentOfType(Model));

        this.node.canMove = false;
        this.node.isDynamic = false;
        this.node.isStatic = false;

        // parent global loction
        const parentLocation = getGlobalModelMatrix(node);
        if (!parentLocation) return;

        this.initTranslation = Object.assign([], mat4.getTranslation(vec3.create(), parentLocation));
        // we need to move particle from the centre of the wheel to the ground (hardcoded)
        vec3.add(this.initTranslation, this.initTranslation, vec3.fromValues(0, -0.3, 0));

        // some randomization to spawn somewhere arround the wheel
        const locationX = -0.3 + Math.random() * 0.6; // -0.3 -> 0.3
        const locationY = -0.05 + Math.random() * 0.1; // -0.05 -> 0.05
        const locationZ = -0.2 + Math.random() * 0.4; // -0.2 -> 0.2
        const location = vec3.fromValues(locationX, locationY, locationZ);
        vec3.add(this.initTranslation, this.initTranslation, location);
        
        this.node.addComponent(new Transform({
            translation: this.initTranslation,
            // rotation: mat4.getRotation(quat.create(), parentLocation),
            scale: mat4.getScaling(vec3.create(), parentLocation),
        }));

        this.node.parent = this.scene;
        scene.addChild(this.node);
    }

    public updateLocation(): void {

        const transform: Transform = this.node.getComponentOfType(Transform);

        // we need a jump and then tatic 0 as the first sector of sinus (0 -> 2)
        const agePercentage = this.age / this.lifespan;
        const normalizedAgeValue = agePercentage * 2 * Math.PI;
        const sinusFunValue = Math.sin(normalizedAgeValue);
        const curveValue = Math.max(0, sinusFunValue);
        const shortenedCurveValue = curveValue * 0.1;
        
        const x = 0;
        // moves as positive sinus values
        const y = shortenedCurveValue;
        // in random direction based on start (not reallly necesery since we move so fast you cant see it)
        const z = 0;// quat.scale(this.direction, this.direction, this.age)

        const newTranslation = vec3.fromValues(x, y, z);

        // // Interpolation
        // // Smoothly interpolate towards the target values
        // const interpolationFactor = setExtremeValues(dt * this.interpolationSpeed, 1, 0);
        // const interpolatedTranslation = vec3.create();
        // vec3.lerp(interpolatedTranslation, this.initTranslation, newTranslation, interpolationFactor);
        // transform.translation = interpolatedTranslation;

        vec3.add(transform.translation, this.initTranslation, newTranslation);
    }

    public discard(): void {
        this.scene.removeChild(this.node); 
    }
}
