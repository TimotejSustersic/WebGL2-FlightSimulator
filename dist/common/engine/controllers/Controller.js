import { Plane } from "../objects/Plane.js";
import { Vehicle } from "../core/Interaction.js";
export class Controller {
    constructor() {
        this.keys = {};
    }
    exitInteraction(time) {
        // ce nekaj delamo in stisnemo E prekinemo interakcijo
        if (this.keys['KeyE'] && this.interactionNode != null) {
            let planeInstance = this.interactionNode.parent.getComponentOfType(Plane);
            // conditions for leaving the plane
            if (planeInstance?.inAir === false && planeInstance?.velocity < (planeInstance?.velocityMax * 0.1)) {
                if (this.interactionNode.getComponentOfType(Vehicle)?.stop(time))
                    this.interactionNode = null;
            }
        }
    }
}
//# sourceMappingURL=Controller.js.map