export class Attributes {
    POSITION: number;
    TEXCOORD_0: number;
    NORMAL: number;
}

export class Indices {
    bufferView: BufferView;
}

export class BufferView {
    buffer: any;
    byteOffset: any;
    byteLength: any;
    target: any;
}