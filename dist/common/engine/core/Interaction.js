import { Transform } from "./Transform.js";
import { quat, vec3, mat4 } from '../../../lib/gl-matrix-module.js';
import { FirstPersonController } from "../controllers/FirstPersonController.js";
import { getGlobalModelMatrix } from "./SceneUtils.js";
// class for nodes which you can interact with
// they store the parent from which you took the node and append it to yourself
export class Interaction {
    constructor(startText, endText, scene, cbfStart, cbfStop) {
        this.interacting = false;
        this.checkCollision = true;
        // time between start and stop
        this.toggleTime = null;
        // time between action
        this.cancelationMargin = 1.5;
        this.HTMLText = startText;
        this.HTMLStartText = startText;
        this.HTMLEndText = endText;
        this.scene = scene;
        this.cbfStart = cbfStart;
        this.cbfStop = cbfStop;
    }
    // there needs to be at least 2 secconds of holding before you can drop the item
    start(time) {
        // if time bigger than cancelationMargin seconds you can stop
        if (time - this.toggleTime < this.cancelationMargin)
            return false;
        this.HTMLText = this.HTMLEndText;
        this.interacting = true;
        this.toggleTime = time;
        this.changeHierarchy();
        // console.log("pick up");
        if (this.cbfStart)
            this.cbfStart();
        return true;
    }
    // we return success factor
    stop(time) {
        // if time bigger than cancelationMargin seconds you can stop
        if (time - this.toggleTime < this.cancelationMargin)
            return false;
        this.HTMLText = this.HTMLStartText;
        this.interacting = false;
        this.toggleTime = time;
        this.reset();
        // console.log("put down");
        if (this.cbfStop)
            this.cbfStop();
        return true;
    }
    changeHierarchy() {
    }
    reset() {
    }
}
export class PortableObject extends Interaction {
    constructor(node, camera) {
        super("TODO", "TODO", camera);
        this.node = node;
        this.parent = node.parent;
    }
    changeHierarchy() {
    }
    reset() {
    }
}
export class Vehicle extends Interaction {
    // dej zbris kle te dodatne funcije pa prestav na gumb
    constructor(parent, node, scene, cbfStart, cbfStop) {
        super(`Enter the vehicle`, "Exit the vehicle", scene, cbfStart, cbfStop);
        this.parent = parent; // Plane
        this.node = node; // Body for collision
    }
    changeHierarchy() {
        let camera = this.scene.find(node => node.name == "Camera");
        // move the camera on top of the vehicle
        let cameraMatrix = camera.getComponentOfType(Transform);
        let fpc = camera.getComponentOfType(FirstPersonController);
        fpc.yaw = 4.6;
        fpc.pitch = 0;
        fpc.disableMovement = true;
        // proces of changing hierarchy
        // remove camera from parent
        camera.parent.removeChild(camera);
        // make camera the parent
        camera.parent = this.parent;
        // give to camera as child
        this.parent.addChild(camera);
        this.parent.traverse(node => node.isStatic = false);
        this.parent.traverse(node => node.isDynamic = false);
        this.parent.isDynamic = true;
        // reseta camera position (to be in center of vehicle), then move above
        vec3.add(cameraMatrix.translation, vec3.create(), vec3.fromValues(0, 3, 0));
        // reset camera rotation
        cameraMatrix.rotation = quat.create();
    }
    reset() {
        let camera = this.scene.find(node => node.name == "Camera");
        let fpc = camera.getComponentOfType(FirstPersonController);
        fpc.disableMovement = false;
        fpc.yaw = 0.164;
        fpc.pitch = 0.024;
        // we set the vehicle to its previous parent
        camera.parent = this.scene;
        // remove as child from camera
        this.parent.removeChild(camera);
        // add to parents children
        this.scene.addChild(camera);
        this.parent.traverse(node => node.isStatic = true);
        this.parent.traverse(node => node.isDynamic = false);
        camera.isDynamic = true;
        // now move the camera away from vehicle
        let cameraMatrix = camera.getComponentOfType(Transform);
        // get global matrix and set as cameras
        const vehicleMatrix = getGlobalModelMatrix(this.node);
        mat4.getTranslation(cameraMatrix.translation, vehicleMatrix);
        // move camera away from teh plane
        vec3.add(cameraMatrix.translation, cameraMatrix.translation, vec3.fromValues(0, 0, 10));
        cameraMatrix.translation[1] = 0.85; // camera starting height
    }
}
//# sourceMappingURL=Interaction.js.map