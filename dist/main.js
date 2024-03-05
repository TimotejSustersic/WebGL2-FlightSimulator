import { Application } from "./common/engine/Aplication.js";
import { GLTFLoader } from './common/engine/loaders/GLTFLoader.js';
import { Camera } from "./common/engine/core/Camera.js";
import { Node } from "./common/engine/core/Node.js";
import { Renderer } from "./common/engine/renderers/Renderer.js";
import { Physics } from "./common/engine/Physics/Physics.js";
import { FirstPersonController } from "./common/engine/controllers/FirstPersonController.js";
import { Model } from "./common/engine/core/Model.js";
import { calculateAxisAlignedBoundingBox, mergeAxisAlignedBoundingBoxes, } from './common/engine/core/MeshUtils.js';
import { Transform } from "./common/engine/core/Transform.js";
import { Light } from "./common/engine/core/Light.js";
import { Vehicle } from "./common/engine/core/Interaction.js";
import { Plane, PlaneDTO } from "./common/engine/objects/Plane.js";
import { Game } from "./common/engine/Game.js";
import { hideHTML } from "./common/engine/core/Utillity.js";
import { ThirdPersonController } from "./common/engine/controllers/ThirdPersonController.js";
class Main extends Application {
    constructor(canvas) {
        super(canvas);
    }
    async start(resolve) {
        this.loader = new GLTFLoader();
        // scene source
        await this.loader.load('../blender/vol11/blender_plane_ver1.gltf'); // faza8_plane_presentable_test.gltf
        // await this.loader.load('../blender/bufferExample/sceneBufferExample.gltf'); 
        this.scene = await this.loader.loadScene(this.loader.defaultScene);
        if (!this.scene)
            throw new Error('Scene did not load.');
        this.camera = this.scene.find(node => node.getComponentOfType(Camera));
        if (!this.camera)
            throw new Error('There is no camera in the scene.');
        this.renderer = new Renderer(this.gl);
        // Game logic //
        // gre cez vse node in vsakemu doloci aabb torej njegov prostor v sceni
        this.scene.traverse(node => {
            const model = node.getComponentOfType(Model);
            if (!model)
                return;
            const boxes = model.primitives.map(primitive => calculateAxisAlignedBoundingBox(primitive.mesh));
            node.aabb = mergeAxisAlignedBoundingBoxes(boxes);
            // no collision on landscapes and treeLeaves
            if (!node.name.includes("Landscape") && !node.name.includes("TreeLeaves") && !node.name.includes("Particle"))
                node.isStatic = true;
        });
        // we add first person camera
        this.camera.addComponent(new FirstPersonController(this.camera, this.canvas));
        // we add third person camera
        this.camera.addComponent(new ThirdPersonController(this.camera, this.canvas));
        // collision in interaction z modeli
        this.physics = new Physics(this.scene, this.canvas);
        // create game instace
        this.game = new Game(this.scene, document, "GameButton");
        // dodamo Light
        this.light = new Node();
        this.light.name = "Light";
        this.light.addComponent(new Light({
            ambient: 0.01,
        }));
        this.light.addComponent(new Transform({
            translation: [30, 30, 30],
        }));
        this.scene.addChild(this.light);
        console.log(this.scene);
        // nase letalo
        this.plane = this.scene.find(node => node.name == PlaneDTO.Plane);
        this.plane.addComponent(new Plane(this.scene, this.plane, document));
        resolve();
    }
    update(time, dt) {
        // we remove it every frame
        let interactContainer = document.getElementById("interaction");
        hideHTML(interactContainer);
        // we update all the components of all nodes
        this.scene.traverse(node => {
            for (const component of node.components) {
                // if we find a node that is interacting we tell it to the controler
                if (node !== this.camera && node.getComponentOfType(Vehicle)?.interacting) {
                    this.camera.getComponentOfType(FirstPersonController).interactionNode = node;
                    this.camera.getComponentOfType(ThirdPersonController).interactionNode = node;
                }
                component.update?.(time, dt);
            }
        });
        this.physics.update(time, dt);
        this.game.update(time, dt);
    }
    render() {
        this.renderer.render(this.scene, this.camera, this.light);
    }
}
const startButton = document.getElementById("startButton");
// init
startButton.addEventListener('click', () => {
    startButton.style.display = 'none';
    const canvas = document?.querySelector('canvas');
    new Main(canvas);
});
//# sourceMappingURL=main.js.map