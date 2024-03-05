export abstract class Application {

    public canvas: HTMLCanvasElement;
    public gl: WebGL2RenderingContext;

    private time = 0;

    constructor(canvas: HTMLCanvasElement) {
        this._update = this._update.bind(this);

        this.canvas = canvas;
        this._initGL();
        this.start(() => requestAnimationFrame(this._update));
    }

    private _initGL(): void {

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

    _update(): void {
        const time = performance.now() / 1000;
        const dt = time - this.time; // deltaTime
        this.time = time;

        this.resize();
        this.update(time, dt)
        this.render();
        requestAnimationFrame(this._update);
    }

    resize(): void {

        if (this.canvas.width !== this.canvas.clientWidth ||
            this.canvas.height !== this.canvas.clientHeight
            ) {

            this.canvas.width = this.canvas.clientWidth;
            this.canvas.height = this.canvas.clientHeight;

            this.gl.viewport(0, 0, this.gl.drawingBufferWidth, this.gl.drawingBufferHeight);
        }
    }

    abstract start(resolve: Function): Promise<void>;
    abstract update(time: number, dt: number): void;
    abstract render(): void;
}
