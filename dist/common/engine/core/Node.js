export class Node {
    constructor(name) {
        this.canMove = true;
        this.isCircular = false;
        // for circle
        this.crashed = false;
        this.colided = false;
        this.name = name;
        this.parent = null;
        this.components = [];
        this.children = [];
    }
    addChild(node) {
        node.parent?.removeChild(node); // ce node ze ma otroka mu ga odtranimo
        this.children.push(node);
        node.parent = this; // dodamo novga fotra
    }
    removeChild(node) {
        const index = this.children.indexOf(node);
        if (index >= 0) {
            this.children.splice(index, 1);
            node.parent = null;
        }
    }
    // to je sprehod po hierarhiji vseh otrok in parametra so funkcije ki se zgodijo before in after 
    traverse(before, after) {
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
    filter(predicate) {
        return this.linearize().filter(predicate);
    }
    find(predicate) {
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
//# sourceMappingURL=Node.js.map