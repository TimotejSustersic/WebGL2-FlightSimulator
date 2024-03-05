export class Node {

    public name: string;
    public children: Array<Node>;
    public parent: Node;
    public components: Array<any>;

    public isDynamic: boolean;
    public isStatic: boolean;
    public canMove = true;
    public aabb;
    public isCircular = false;
    public r: number;

    // for circle
    public crashed = false;
    public colided = false;

    constructor(name?: string) {

        this.name = name;

        this.parent = null;
        this.components = [];
        this.children = [];
    }

    addChild(node: Node) {
        node.parent?.removeChild(node); // ce node ze ma otroka mu ga odtranimo
        this.children.push(node);
        node.parent = this; // dodamo novga fotra
    }

    removeChild(node: Node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
            node.parent = null;
        }
    }

    // to je sprehod po hierarhiji vseh otrok in parametra so funkcije ki se zgodijo before in after 
    traverse(before: (node: Node) => void, after?: (node: Node) => void) {
        before?.(this);
        for (const child of this.children) {
            child.traverse(before, after);
        }
        after?.(this);
    }

    linearize() {
        const array = [];
        this.traverse(node => array.push(node));
        return array;
    }

    filter(predicate: (node: Node) => void): Array<Node> {
        return this.linearize().filter(predicate);
    }

    find(predicate: (node: Node) => void): Node {
        return this.linearize().find(predicate);
    }

    map(transform) {
        return this.linearize().map(transform);
    }

    addComponent(component) {
        this.components.push(component);
    }

    removeComponent(component) {
        this.components = this.components.filter(c => c !== component);
    }

    removeComponentsOfType(type) {
        this.components = this.components.filter(component => !(component instanceof type));
    }

    getComponentOfType(type) {
        return this.components.find(component => component instanceof type);
    }

    getComponentsOfType(type) {
        return this.components.filter(component => component instanceof type);
    }
}