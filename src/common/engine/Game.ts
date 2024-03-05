import { Interaction } from "./core/Interaction.js";
import { Model } from "./core/Model.js";
import { Node } from "./core/Node.js";
import { Transform } from "./core/Transform.js";
import { hideHTML, showHTML, stringify } from "./core/Utillity.js";

export enum GameDTO {
    Particle = "Particle",
    Circle = "Circle",
}

export class Game {

    private scene: Node;
    private node: Node;

    private time: number;
    private timeHTML: HTMLElement;
    private gameTime: number;

    private score: number;
    private scoreHTML: HTMLElement;

    private started = false;

    private circles: Array<Node> = [];
    private difficulty = 4;

    constructor(scene: Node, document: Document, interactionNodeName: string) {

        this.scene = scene;

        this.node = this.scene.find(node => node.name == interactionNodeName);
        this.node?.addComponent(new Interaction("Start game", "Finnish game", scene, 
        () => {
            this.start();
        }, 
        () => {
            this.end();
            this.difficulty++;
        }
        ));

        this.timeHTML = document.getElementById("HUB_Time");
        this.scoreHTML = document.getElementById("HUB_Score");
    }

    public start() {
        this.started = true;
        
        for (let i = 0; i < this.difficulty; i++)  {
            const difficultyAddition = 200 / this.difficulty; // TODO
            this.circles.push(this.createCircle(`Circle${i}`, (300 + difficultyAddition) * (i + 1)));
        }

        showHTML(this.timeHTML);
        showHTML(this.scoreHTML);
    }

    public end() {
        this.started = false;

        for (let circle of this.circles)
            this.scene.removeChild(circle);

        this.circles = [];      

        hideHTML(this.scoreHTML);

        this.gameTime += (this.difficulty - this.score) * 15;
        this.timeHTML.innerHTML = this.numberToTimeString(this.gameTime);

        setTimeout(_ => {
            hideHTML(this.timeHTML);
            this.time = null;
        }, 1500);
    }

    public update(time: number, dt: number): void {

        if (this.started) {

            if (this.time == null) 
                this.time = time;

            this.gameTime = time - this.time;
            this.timeHTML.innerHTML = this.numberToTimeString(this.gameTime);
        }

        this.score = 0;
        for (let circle of this.circles)
            if (circle.colided === true)
                this.score++;

        this.scoreHTML.innerHTML = `${this.score} / ${this.difficulty}`;
    }

    private createCircle(name: string, nodeDistance: number): Node {

        // find a circle in the scene
        const circleInstance = this.scene.find(node => node.name.includes(GameDTO.Circle));

        if (!circleInstance) {
            console.error("no circle node found");
            return;
        }

        // create a new circle
        let newInstance = new Node(name);
        // add Looks
        newInstance.addComponent(circleInstance.getComponentOfType(Model));
        newInstance.aabb = circleInstance.aabb;

        newInstance.canMove = false;
        newInstance.isDynamic = false;
        newInstance.isStatic = false;

        newInstance.isCircular = true;
        newInstance.r = Math.max(Math.abs(newInstance.aabb.min[0]), Math.abs(newInstance.aabb.max[0]));

        // add Location
        const circleTransform: Transform = circleInstance.getComponentOfType(Transform);

        // initial X location which is more or less fixed
        const locationX = 1000 + Math.random() * 50;
        const locationY = 50 + Math.random() * 200;
        const locationZ = Math.random() * 100;
        const location = [locationX + nodeDistance, locationY, locationZ];

        newInstance.addComponent(new Transform({
            translation: location,
            rotation: circleTransform.rotation,
            scale: circleTransform.scale,
        }));

        newInstance.parent = this.scene;
        this.scene.addChild(newInstance);
    
        return newInstance;
    }

    private numberToTimeString(num: number): string { 

        const minutes = Math.floor(num / 60);
        const seconds = Math.floor(num % 60);

        return `${minutes} : ${seconds}`;         
   }
}