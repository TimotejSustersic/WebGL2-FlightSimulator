export class Application {
    constructor(canvas) {
        this.time = 0;
        this._update = this._update.bind(this);
        this.canvas = canvas;
        this._initGL();
        this.start(() => requestAnimationFrame(this._update));
    }
    _initGL() {
        this.gl = null;
        try {
            this.gl = this.canvas.getContext('webgl2');
        }
        catch (e) {
            console.log(e);
        }
        if (!this.gl)
            console.error(`Can't create WebGl 2.0 context`);
    }
    _update() {
        const time = performance.now() / 1000;
        const dt = time - this.time; // deltaTime
        this.time = time;
        this.resize();
        this.update(time, dt);
        this.render();
        requestAnimationFrame(this._update);
    }
    resize() {
        if (this.canvas.width !== this.canvas.clientWidth ||
            this.canvas.height !== this.canvas.clientHeight) {
            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;
            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        }
    }
}
//# sourceMappingURL=Aplication.js.map