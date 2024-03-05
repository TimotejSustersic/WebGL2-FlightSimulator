import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { Node } from '../core/Node.js';

import { Transform } from '../core/Transform.js';
import { setExtremeValues } from '../core/Utillity.js';
import { Controller } from './Controller.js';
import { FirstPersonController, resetCameraPosition } from './FirstPersonController.js';

export class ThirdPersonController extends Controller {

    private distance: number;
    private distanceMax = 50;
    private distanceMin = 10;

    private moveSensitivity: number;
    private zoomSensitivity: number;

    public disable = true;
    private toggleFlag = false;
    private FPC: FirstPersonController;
    
    private interpolationSpeed = 4.5; 

    constructor(node: Node, canvasElement: HTMLCanvasElement, {
        pitch = 1.4,
        yaw = Math.PI,
        distance = 25,
        moveSensitivity = 0.002,
        zoomSensitivity = 0.001,
    } = {}) {
        super();

        this.node = node;
        this.canvasElement = canvasElement;

        this.pitch = pitch;
        this.yaw = yaw;
        this.distance = distance;

        this.moveSensitivity = moveSensitivity;
        this.zoomSensitivity = zoomSensitivity;

        this.initHandlers();
    }

    private initHandlers() {
        this.pointermoveHandler = this.pointermoveHandler.bind(this);
        
        this.wheelHandler = this.wheelHandler.bind(this);

        this.canvasElement.addEventListener('wheel', this.wheelHandler);

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

        this.FPC = this.node.getComponentOfType(FirstPersonController);
    }

    private pointermoveHandler(e) {
        if (this.disable) return;

        const dx = e.movementX;
        const dy = e.movementY;

        this.pitch -= dy * this.moveSensitivity;
        this.yaw   -= dx * this.moveSensitivity;

        const twopi = Math.PI * 2;

        this.pitch = Math.min(Math.max(this.pitch, -twopi), twopi);
        this.yaw = ((this.yaw % twopi) + twopi) % twopi;
    }

    private wheelHandler(e) {
        if (this.disable) return;

        this.distance *= Math.exp(this.zoomSensitivity * e.deltaY);

        this.distance = setExtremeValues(this.distance, this.distanceMax, this.distanceMin);
    }

    public update(time: number, dt: number) {
        if (this.disable) return;
        if (this.toggleView(time)) return;     
        
        const transform: Transform = this.node.getComponentOfType(Transform);
        if (!transform) return;
        const targetTransform: Transform = this.interactionNode.getComponentOfType(Transform);
        if (!targetTransform) return;

        // camera new position based on pitch, yaw, and distance
        const x = this.distance * Math.sin(this.pitch) * Math.cos(this.yaw);
        const y = this.distance * Math.cos(this.pitch);
        const z = this.distance * Math.sin(this.pitch) * Math.sin(this.yaw);

        const newTranslation = vec3.fromValues(x, y, z);

        // Interpolation
        // Smoothly interpolate towards the target values
        const interpolationFactor = setExtremeValues(dt * this.interpolationSpeed, 1, 0);

        const interpolatedTranslation = vec3.create();
        vec3.lerp(interpolatedTranslation, transform.translation, newTranslation, interpolationFactor);
        
        transform.translation = interpolatedTranslation;
        // transform.translation = newTranslation;

        // rotation must always face the object
        // const direction = vec3.create();
        // vec3.subtract(direction, targetTransform.translation, transform.translation);
        // vec3.normalize(direction, direction);     
    
        // const pitch = Math.asin(-direction[1]);
        // const yaw = Math.atan2(direction[0], -direction[2]);

        // // quats for each rotation
        // const pitchQuat = quat.create();
        // quat.setAxisAngle(pitchQuat, [1, 0, 0], -pitch);

        // const yawQuat = quat.create();
        // quat.setAxisAngle(yawQuat, [0, 1, 0], -yaw);

        // // combine the rotations
        const newRotation = quat.create();
        // quat.multiply(newRotation, newRotation, yawQuat);
        // quat.multiply(newRotation, newRotation, pitchQuat);
        
        const toRotation = mat4.create();
        mat4.targetTo(toRotation, transform.translation, targetTransform.translation, [0, 1, 0])

        mat4.getRotation(newRotation, toRotation);

        // apply new rotation
        transform.rotation = newRotation;
    }

    private toggleView(time): boolean {

        if (this.keys['KeyR'] || this.keys['KeyE'] || !this.FPC.disableMovement) 
            this.toggleFlag = true;        
        else if (!this.keys['KeyR'] && this.toggleFlag) {

            resetCameraPosition(this.node, this.FPC, vec3.fromValues(0, 3, 0));

            this.disable = true;
            this.FPC.disable = false;
            this.toggleFlag = false;

            // TODO make this work
            this.exitInteraction(time);
            return true;  
        }

        return false;
    }

    private keydownHandler(e) {
        this.keys[e.code] = true;
    }

    private keyupHandler(e) {
        this.keys[e.code] = false;
    }
}
