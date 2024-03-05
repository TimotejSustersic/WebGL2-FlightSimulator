import { getGlobalModelMatrix } from "../core/SceneUtils.js";
import { Transform } from "../core/Transform.js";
import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { FirstPersonController } from "./FirstPersonController.js";
import { Node } from "../core/Node.js";
import { Plane } from "../objects/Plane.js";
import { Vehicle } from "../core/Interaction.js";

export class Controller {

    protected node: Node;
    protected canvasElement: HTMLCanvasElement;

    public pitch: number;
    public yaw: number;

    public keys = {};
    public interactionNode: Node;


    public exitInteraction(time): void {

        // ce nekaj delamo in stisnemo E prekinemo interakcijo
        if (this.keys['KeyE'] && this.interactionNode != null) {

            let planeInstance: Plane = this.interactionNode.parent.getComponentOfType(Plane);

            // conditions for leaving the plane
            if (planeInstance?.inAir === false && planeInstance?.velocity < (planeInstance?.velocityMax * 0.1)) {            
                if (this.interactionNode.getComponentOfType(Vehicle)?.stop(time)) 
                    this.interactionNode = null;
            }
        }
    }    
}

