import { Model } from "../core/Model";
import { Node } from "../core/Node";
import { Transform } from "../core/Transform";
// make this a function
export class Circle {
    constructor(scene, location) {
        // find a circle in the scene
        const circleInstance = scene.find(node => node.name.includes("Circle"));
        // create a new circle
        let newInstance = new Node();
        // add Looks
        newInstance.addComponent(circleInstance.getComponentOfType(Model));
        newInstance.aabb = circleInstance.aabb;
        // add Location
        newInstance.addComponent(new Transform({
            translation: location,
        }));
        // add it to the scene
        newInstance.parent = scene;
        scene.addChild(newInstance);
        this.node = newInstance;
    }
}
//# sourceMappingURL=Circle.js.map