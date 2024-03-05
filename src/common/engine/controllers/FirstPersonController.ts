import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';

import { Transform } from '../core/Transform.js';

import { Node } from '../core/Node.js';
import { Vehicle } from '../core/Interaction.js';
import { Plane } from '../objects/Plane.js';
import { ThirdPersonController } from './ThirdPersonController.js';
import { getGlobalModelMatrix } from '../core/SceneUtils.js';
import { Controller } from './Controller.js';

export class FirstPersonController extends Controller {

    private velocity: Array<number>;
    private acceleration: number;
    private maxSpeed: number;
    private decay: number;
    private pointerSensitivity: number;

    // this will be some game properies
    public interactionNode: Node = null;

    public disableMovement = false;
    public disable = false;
    private toggleFlag = false;
    private TPC: ThirdPersonController;
 
    constructor(node: Node, canvasElement: HTMLCanvasElement, {
        pitch = 0,
        yaw = 0,
        velocity = [0, 0, 0],
        acceleration = 50,
        maxSpeed = 5,
        decay = 0.99999,
        pointerSensitivity = 0.002,
    } = {}) {
        super();

        this.node = node;
        this.canvasElement = canvasElement;

        this.pitch = pitch;
        this.yaw = yaw;

        this.velocity = velocity;
        this.acceleration = acceleration;
        this.maxSpeed = maxSpeed;
        this.decay = decay;
        this.pointerSensitivity = pointerSensitivity;

        this.initHandlers();
    }

    private initHandlers() {
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        const document = this.canvasElement.ownerDocument;

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);

        this.canvasElement.addEventListener('click', e => this.canvasElement.requestPointerLock());
        document.addEventListener('pointerlockchange', e => {

            if (document.pointerLockElement === this.canvasElement) 
                document.addEventListener('pointermove', this.pointermoveHandler);
            else 
                document.removeEventListener('pointermove', this.pointermoveHandler);
        });

        // timeout if TPC wasnt initialized yet
        setTimeout(_ => this.TPC = this.node.getComponentOfType(ThirdPersonController));
    }

    public update(time: number, dt: number) {
        if (this.disable) return;
        if (this.toggleView()) return; 

        const transform: Transform = this.node.getComponentOfType(Transform);
        if (!transform) return;
  
        this.exitInteraction(time);
        
        // Calculate forward and right vectors.
        const cos = Math.cos(this.yaw);
        const sin = Math.sin(this.yaw);
        const forward = [-sin, 0, -cos];
        const right = [cos, 0, -sin];

        // Map user input to the acceleration vector.
        const acc = vec3.create();
        if (!this.disableMovement) {
            if (this.keys['KeyW']) {
                vec3.add(acc, acc, forward);
            }
            if (this.keys['KeyS']) {
                vec3.sub(acc, acc, forward);
            }
            if (this.keys['KeyD']) {
                vec3.add(acc, acc, right);
            }
            if (this.keys['KeyA']) {
                vec3.sub(acc, acc, right);
            }
        }

        // Update velocity based on acceleration.
        vec3.scaleAndAdd(this.velocity, this.velocity, acc, dt * this.acceleration);

        // If there is no user input, apply decay.
        if ((!this.keys['KeyW'] &&
            !this.keys['KeyS'] &&
            !this.keys['KeyD'] &&
            !this.keys['KeyA']) || this.disableMovement)
        {
            const decay = Math.exp(dt * Math.log(1 - this.decay));
            vec3.scale(this.velocity, this.velocity, decay);
        }

        // Limit speed to prevent accelerating to infinity and beyond.
        const speed = vec3.length(this.velocity);
        if (speed > this.maxSpeed) {
            vec3.scale(this.velocity, this.velocity, this.maxSpeed / speed);
        }
        
        // Update translation based on velocity.
        vec3.scaleAndAdd(transform.translation,
            transform.translation, this.velocity, dt);

        // Update rotation based on the Euler angles.
        const rotation = quat.create();
        quat.rotateY(rotation, rotation, this.yaw);
        quat.rotateX(rotation, rotation, this.pitch);
        transform.rotation = rotation;
    }

    private toggleView(): boolean {

        // Toggle view
        if (this.keys['KeyR'] && this.disableMovement) 
            this.toggleFlag = true;        
        else if (!this.keys['KeyR'] && this.toggleFlag) {

            this.disable = true;
            this.TPC.disable = false;
            this.toggleFlag = false;
            return true;
        }

        return false;
    }

    private pointermoveHandler(e) {
        if (this.disable) return;

        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.pointerSensitivity;
        this.yaw   -= dx * this.pointerSensitivity;

        const twopi = Math.PI * 2;
        const halfpi = Math.PI / 2;

        this.pitch = Math.min(Math.max(this.pitch, -halfpi), halfpi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    private keydownHandler(e) {
        this.keys[e.code] = true;
    }

    private keyupHandler(e) {
        this.keys[e.code] = false;
    }
}

export function resetCameraPosition(node: Node, FPC: FirstPersonController, offset): void {
    
    // now move the camera away from vehicle
    FPC.yaw = 4.6;
    FPC.pitch = 0;
    
    let cameraMatrix: Transform = node.getComponentOfType(Transform);

    // get global matrix and set as cameras
    const vehicleMatrix = getGlobalModelMatrix(FPC.interactionNode);
    mat4.getTranslation(cameraMatrix.translation, vehicleMatrix);

    // move camera away from teh plane
    vec3.add(cameraMatrix.translation, vec3.create(), offset);
    cameraMatrix.rotation = quat.create();
}
