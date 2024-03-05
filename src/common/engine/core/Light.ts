export class Light {

    public ambient: number; // da ni vse kamor ne sveti svetloba crno to nekak poveca minimum
    public shinines: number; // kolk se sveti vir svetlobe (Phong)
    public intensity: number; // kolk je barva mocna
    public color: Array<number>; // batva
    
    constructor({
        ambient = 0,
        shinines = 200,
        color = [255, 255, 255], // white
        intensity = 1,
    } = {}) {
        this.ambient = ambient;
        this.shinines = shinines;
        this.color = color;
        this.intensity = intensity;
    }
}
