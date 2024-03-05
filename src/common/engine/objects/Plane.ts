import { Vehicle } from "../core/Interaction.js";
import { Node } from "../core/Node.js";
import { quat, vec3 } from '../../../lib/gl-matrix-module.js';
import { Transform } from "../core/Transform.js";
import { hideHTML, setExtremeValues, showHTML, stringify } from "../core/Utillity.js";
import { ParticleSystem } from "../animators/ParticleSystem.js";

export enum PlaneDTO {
    Plane = "Plane",
    Body = "Body",
    Propeler = "Propeler",
    LeftLeg = "Left Leg",
    LeftWing = "Left Wing",
    RightLeg = "Right Leg",
    RightWing = "Right Wing",
    StearingLeg = "Stearing Leg",
}

export class Plane {

    public node: Node; // body/plane
    public scene: Node;

    public body: VehiclePart;

    public propeler: VehiclePart;
    private propelerComponent: Propeler;

    public leftWing: VehiclePart;
    public rightWing: VehiclePart;

    public leftLeg: VehiclePart;
    public rightLeg: VehiclePart;
    public stearingLeg: VehiclePart;

    private vehicle: Vehicle;

    private HUB: HTMLElement;
    private interactContainer: HTMLElement;

    private slider_Ground_Left: HTMLInputElement;
    private slider_Ground_Right: HTMLInputElement;
    private slider_Ground_Power: HTMLInputElement;
   
    private slider_Air_Left: HTMLInputElement;
    private slider_Air_Up: HTMLInputElement;
    private slider_Air_Down: HTMLInputElement;
    private slider_Air_Right: HTMLInputElement;

    private DB_Velocity: HTMLElement;
    private DB_Acceleration: HTMLElement;
    private DB_Altitude: HTMLElement;

    // keyboard keys
    private keys = {};

    private enableFlightSteering = true;

    // ground controls
    private stearingValue = 0;
    private stearingMaxValue = 50; // for interface
    private stearingMaxRotation = 0.5; // for max de grees, is really small since this is per frame
    private stearingDecay = 1.3;

    private RPM = 0;
    private RPMMax = 3000;
    private RPMMultiplier = 10; // normalization value

    // air controls
    private wingsTiltValue = 0;
    private frontTiltValue = 0;

    private tiltDecay = 1.5
    private tiltMaxRotation = 0.5;
    private tiltMaxValue = 50; // for interface

    private translationYMin: number;

    //
    public inAir = false;

    private acceleration: number; // 0 -> 50
    private accelerationDecay = 1;

    public velocity = 0;
    public velocityMax = 80;

    private altitude = 0;

    private onCrashForwardDirection = vec3.create();

    // holds the value in which camera we are
    public inFirstPerson = true;

    private displayCrash = false;

    constructor(scene: Node, node: Node, document: Document) {

        this.scene = scene;
        this.node = node;
        
        // the parts cant move, but we still want to detect collision
        this.node.traverse(node => node.canMove = false);

        this.keydownHandler = this.keydownHandler.bind(this);
        this.keyupHandler = this.keyupHandler.bind(this);

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);

        this.HUB = document.getElementById("HUB") as HTMLElement;
        this.interactContainer = document.getElementById("interaction");

        this.slider_Ground_Power = document.getElementById("HUB_Power") as HTMLInputElement;
        this.slider_Ground_Right = document.getElementById("HUB_Right") as HTMLInputElement;
        this.slider_Ground_Left = document.getElementById("HUB_Left") as HTMLInputElement;

        this.slider_Air_Left = document.getElementById("HUB_Air_Left") as HTMLInputElement;
        this.slider_Air_Up = document.getElementById("HUB_Air_Up") as HTMLInputElement;
        this.slider_Air_Down = document.getElementById("HUB_Air_Down") as HTMLInputElement;
        this.slider_Air_Right = document.getElementById("HUB_Air_Right") as HTMLInputElement;

        this.DB_Velocity = document.getElementById("DB_Velocity");
        this.DB_Acceleration = document.getElementById("DB_Acceleration");
        this.DB_Altitude = document.getElementById("DB_Altitude");
       
        this.body = new VehiclePart(node.find(node => node.name == PlaneDTO.Body));
        
        // dodamo bodyu vehicle class
        this.vehicle = new Vehicle(this.node, this.body.node, scene, 
            () => {
                this.vehicle.checkCollision = false;
                this.resetVariables();
            },  
            () => {
                this.vehicle.checkCollision = true;
                this.hideHub();
                this.updateParticles(0);
            },
            );
        this.body.node.addComponent(this.vehicle);
        
        this.propeler = new VehiclePart(node.find(node => node.name == PlaneDTO.Propeler));
        this.propelerComponent = new Propeler(this.propeler);
        this.propeler.node.addComponent(this.propelerComponent);

        this.leftWing = new VehiclePart(node.find(node => node.name == PlaneDTO.LeftWing));
        this.rightWing = new VehiclePart(node.find(node => node.name == PlaneDTO.RightWing));

        this.leftLeg = new VehiclePart(node.find(node => node.name == PlaneDTO.LeftLeg));
        this.rightLeg = new VehiclePart(node.find(node => node.name == PlaneDTO.RightLeg));
        this.stearingLeg = new VehiclePart(node.find(node => node.name == PlaneDTO.StearingLeg));
        
        this.leftLeg.node.addComponent(new ParticleSystem(scene, this.leftLeg.node));
        this.rightLeg.node.addComponent(new ParticleSystem(scene, this.rightLeg.node));
        this.stearingLeg.node.addComponent(new ParticleSystem(scene, this.stearingLeg.node));

        // store some initial values
        this.translationYMin = (this.node.getComponentOfType(Transform) as Transform).getTranslationY();

        this.node.r = 3;
    }

    // torej vzanes foward in nad y na 0 ter nardis arcus tangens med njima da dobis kot (arctg(b/a)
    
    // uporabi arctg2 kot metodo (z / x)
    // upostevi predznake ker -- = + in jde

    // 3js

    // when we crash we give them the interacition to pick them up
    public crash(): void {

        this.node.crashed = true;

        this.interactContainer.innerHTML = "You crashed laddie!";

        const transform: Transform = this.node.getComponentOfType(Transform);

        // get last plane foward direction before crash
        vec3.transformQuat(this.onCrashForwardDirection, vec3.fromValues(1, 0, 0), transform.rotation);

        this.updateParticles(0);
        this.velocity = 0;

        this.displayCrash = true;

        // this.propeler.node.addComponent(new PortableObject(this.propeler.node, this.camera));

        // this.leftWing.node.addComponent(new PortableObject(this.leftWing.node, this.camera));
        // this.rightWing.node.addComponent(new PortableObject(this.rightWing.node, this.camera));

        // this.leftLeg.node.addComponent(new PortableObject(this.leftLeg.node, this.camera));
        // this.rightLeg.node.addComponent(new PortableObject(this.rightLeg.node, this.camera));
        // this.stearingLeg.node.addComponent(new PortableObject(this.stearingLeg.node, this.camera));
    }

    public update(time: number, dt: number): void {

        if (this.displayCrash) {
            showHTML(this.interactContainer);
            this.interactContainer.classList.remove("hidden");
        }

        // plane stays still when crashed (for a couple seconds) and not in air
        // if flying we can still turn and fall 
        if (this.node.crashed && !this.inAir) return;
        // if were not flying
        if (!this.vehicle.interacting) return;        

        showHTML(this.HUB);

        const transform: Transform = this.node.getComponentOfType(Transform);

        this.altitude = transform.getTranslationY() - this.translationYMin;
        this.DB_Altitude.innerHTML = stringify(this.altitude);

        // default plane location y = 2.37m which is grunded, anything above that is flying
        if (this.altitude > 0.1)
            this.inAir = true;
        // landing procedure 
        else if (this.inAir) {

            this.inAir = false;
            
            const XAngle = this.getAxiesEulerAngle(transform.rotation, [0, 1, 0]);
            
            // if the angle of plane to steep were crashing
            if (XAngle > 15) {
                 
                this.crash();

                setTimeout(_ => {
                    hideHTML(this.interactContainer);
                    // delete if you implement building the plane
                    location.reload()
                }, 5000);
            }

            // reset translationY
            transform.setTranslationY(this.translationYMin);

            this.wingsTiltValue = 0;
            this.frontTiltValue = 0;

            // reset rotation
            // only set the Y axies

            // get plane euler rotations
            const YAngleDegrees = this.getAxiesEulerAngle(transform.rotation, [1, 0, 0]);
            const YAngleRadians = this.degreesToRadians(YAngleDegrees);
            
            quat.rotateY(transform.rotation, quat.create(), YAngleRadians);            
        }
        // just driving arround
        // else {}

        ////////////////////////////////////////
        ////////////////////////////////////////
        // change values

        // ground

        // propeler / motor (*10 to sumulate real RPM)
        if (this.keys['KeyW']) 
            this.RPM += this.RPMMultiplier;
        else if (this.keys['KeyS']) 
            this.RPM -= this.RPMMultiplier;
            
        this.RPM = Math.max(this.RPM, 0);
        this.RPM = Math.min(this.RPM, this.RPMMax);

        // if crashed no engine rotation
        if (this.node.crashed)
            this.RPM = 0;

        this.slider_Ground_Power.value = String(this.RPM);

        // steering
        if (!this.inAir || this.enableFlightSteering) {
            
            if (this.keys['KeyD']) 
                this.stearingValue = this.addDeminishValue(this.stearingValue, 1);
            else if (this.keys['KeyA']) 
                this.stearingValue = this.addDeminishValue(this.stearingValue, -1);
            else if (
                !this.keys['KeyD'] && 
                !this.keys['KeyA']
            ) {
                this.stearingValue = this.addDropOff(this.stearingValue, this.stearingDecay);                
            }

            this.stearingValue = setExtremeValues(this.stearingValue, this.stearingMaxValue);
        }
        else {
            // if in air you cant steer
            this.stearingValue = 0;
        }
        
        this.updateHTML(this.stearingValue, this.slider_Ground_Left, this.slider_Ground_Right);

        // air
        const liftOffConditions = !this.inAir && this.velocity > this.velocityMax * 0.85;
        // special for lift off
        if (liftOffConditions) {
            if (this.keys['ArrowDown'])
                this.frontTiltValue = this.addDeminishValue(this.frontTiltValue, -1);
        }

        // in air
        if (this.inAir) {

            if (this.keys['ArrowDown'])
                this.frontTiltValue = this.addDeminishValue(this.frontTiltValue, -1);
            else if (this.keys['ArrowUp']) 
                this.frontTiltValue = this.addDeminishValue(this.frontTiltValue, 1);
            else if (
                    !this.keys['ArrowDown'] && 
                    !this.keys['ArrowUp']
            ) {
                this.frontTiltValue = this.addDropOff(this.frontTiltValue, this.tiltDecay);                
            }

            if (this.keys['ArrowRight']) 
                this.wingsTiltValue = this.addDeminishValue(this.wingsTiltValue, 1);
            else if (this.keys['ArrowLeft'])
                this.wingsTiltValue = this.addDeminishValue(this.wingsTiltValue, -1);
            else if (
                    !this.keys['ArrowRight'] && 
                    !this.keys['ArrowLeft']
            ) {
                this.wingsTiltValue = this.addDropOff(this.wingsTiltValue, this.tiltDecay);                
            }

            this.wingsTiltValue = setExtremeValues(this.wingsTiltValue, this.tiltMaxValue);
            this.frontTiltValue = setExtremeValues(this.frontTiltValue, this.tiltMaxValue);
        }

        this.updateHTML(this.frontTiltValue, this.slider_Air_Down, this.slider_Air_Up);
        this.updateHTML(this.wingsTiltValue, this.slider_Air_Left, this.slider_Air_Right);

        // change propeler transfom
        this.propelerComponent.acceleration = this.RPM / 20;

        // update particle number
        const particleCount = Math.min(5, Math.round(Math.sqrt(this.velocity)));
        this.updateParticles(this.inAir ? 0 : particleCount);

        /**
         * Tilt
         * 
         * so when in air we can tilt the plane to go in different directions and not just straight
         * 
         * by controls we just monitor that tilt
         */

        // Wings
        if (this.inAir) {

            // decision was made that for steering purpuses when tilting we'll also move y axies
            const wingsTiltRadianRotation = this.getRotationvalue(this.wingsTiltValue, this.tiltMaxValue, this.tiltMaxRotation);       

            // apply steering wheel rotation
            quat.rotateY(transform.rotation, transform.rotation,  wingsTiltRadianRotation / 4);            
            // apply wings tilt rotation
            quat.rotateX(transform.rotation, transform.rotation, -wingsTiltRadianRotation);
        }

        // Front
        if (this.inAir || liftOffConditions) {

            const frontTiltRadianRotation = this.getRotationvalue(this.frontTiltValue, this.tiltMaxValue, this.tiltMaxRotation);
            // apply front tilt rotation
            quat.rotateZ(transform.rotation, transform.rotation, frontTiltRadianRotation);
        }

        /**
         * Rotation
         * 
         * if we are actually moving, plane can rotate
         * we have tha value in HUB and need to normalize it to be in our max rotation value
         * then we just rotate our plane by thos degrees
         */

        // must be over 10km/h
        if (this.velocity > 10) {
            const stearingRadianRotation = this.getRotationvalue(this.stearingValue, this.stearingMaxValue, this.stearingMaxRotation);
            
            // apply steering wheel rotation
            quat.rotateY(transform.rotation, transform.rotation, stearingRadianRotation);
        }

        /**
         * Acceleration
         * 
         * counted based on RPM
         * minimum is -0.5 to slow down
         * until 800RPM acceleration is negative
         * 
         * TODO could be better but good for now
         */

        // calculate
        this.acceleration = (this.RPM / 500);
        // we subtract the drop off but want it more when low values and less on bigger values
        this.acceleration -= this.accelerationDecay * (1 - (this.RPM / this.RPMMax));
        // make it easier to slow down when belo 800
        if (this.RPM / this.RPMMax < 0.25)
            this.acceleration -= this.accelerationDecay;

        this.DB_Acceleration.innerHTML = stringify(this.acceleration);

        // by doing this we make it faster to speed up and faster to slow down

        /**
         * Velocity
         * 
         * i dont want endless acceleration so we will implement sor of automatic gearbox
         * it wont work like a real one but lets just say that you can't go faster if acceleration isn't high enough
         * so we will have 3 gears
         */
        
        this.velocity += dt * this.acceleration;

        this.velocity = Math.max(this.velocity, 0);
        this.velocity = Math.min(this.velocity, this.velocityMax);

        // gears
        if (this.RPM < this.RPMMax * 0.4)
            this.velocity = Math.min(this.velocity, this.velocityMax * 0.4);
        else if (this.RPM < this.RPMMax * 0.7)
            this.velocity = Math.min(this.velocity, this.velocityMax * 0.7);

        this.DB_Velocity.innerHTML = stringify(this.velocity);

        /**
         * Movement
         * 
         * we always move the plane foward
         * so we need the plane direction vector (quad matrix from rotation)
         * then multiply that vector by velocity
         * and add that vector to our model transformation
         * 
         * if we crahed the plane must cut RPM and reduce speed drasticly and cant change direction anymore
         */
        
        let forward;
        let gravityValue = 0.981;

        if (this.node.crashed && this.inAir) {
            forward = this.onCrashForwardDirection;
        }
        else {

            gravityValue *= dt;
            // plane goes foward
            forward = vec3.fromValues(1, 0, 0); // Assuming forward is along negative z-axis
                // get plane direction
            vec3.transformQuat(forward, forward, transform.rotation);
        }

        // multiply based on speed
        vec3.scale(forward, forward, dt * this.velocity); 

        // gravity
        const gravity = vec3.fromValues(0, this.inAir ? -1 : 0, 0);
        
            // normalize
        vec3.scale(gravity, gravity, gravityValue);

        // sum forces/vectors
        const forces = vec3.add(vec3.create(), forward, gravity);

        // apply to our plane model
        vec3.add(transform.translation, transform.translation, forces);
    }

    private updateParticles(particleNumber: number): void {
        (this.leftLeg.node.getComponentOfType(ParticleSystem) as ParticleSystem).newCount = particleNumber;
        (this.rightLeg.node.getComponentOfType(ParticleSystem) as ParticleSystem).newCount = particleNumber;
        // stearing has less
        (this.stearingLeg.node.getComponentOfType(ParticleSystem) as ParticleSystem).newCount = particleNumber / 2;
    }
    
    public resetVariables(): void {

        this.stearingValue = 0;
        this.altitude = 0;
        this.velocity = 0;
        this.acceleration = 0;
    }

    public hideHub(): void {
        this.slider_Ground_Power.value = String(0);
        this.slider_Ground_Right.value = String(0);
        this.slider_Ground_Left.value = String(0);

        hideHTML(this.HUB);
    }

    private getRotationvalue(value: number, maxValue: number, maxRotation: number): number {

        const normalizedValue = (value + maxValue) / (maxValue * 2);
        // convert normalized to rotation
        const degreesRotation = - (normalizedValue * (maxRotation * 2) - maxRotation);
        const radianRotation = degreesRotation * (Math.PI / 180);

        return radianRotation;
    }

    private updateHTML(value: number, input1: HTMLInputElement, input2: HTMLInputElement): void {
        
        if (value > 0) {
            input1.value = String(0);
            input2.value = String(value);
        } 
        else  {
            input1.value = String(Math.abs(value));
            input2.value = String(0);
        }
    }

    private addDeminishValue(variable: number, value: number, multiplier?: number): number {

        variable += value;

        // if we're going in different direction speed up the turn
        if ((value > 0 && variable < 0) ||
            (value < 0 && variable > 0)
        ) {
            variable += value * (multiplier ?? 2);
        }
        return variable;
    }

    private addDropOff(variable: number, decay: number): number {

        // if close to 0 make it otherwise it will keep adding and subtracting
        if (Math.abs(variable) < decay)
            variable = 0;
        else if (variable < 0) 
            variable += decay;
        else if (variable > 0) 
            variable -= decay;

        return variable;
    }

    // axies must be a normalized vector
    // za Y os lepo kaze ceprov so drugi indexi za axie k drugje ampak dobr
    // za ostala dva je pa drgac se mi zdi da mal mesano sploh za Z ampak zadovoljivo dobro da se lahko orientiram
    private getAxiesEulerAngle(rotation: Array<number>, axies: Array<number>): number {

        const angle = vec3.fromValues(axies[0], axies[1], axies[2]);
        vec3.transformQuat(angle, angle, rotation);

        const baseAngle = vec3.fromValues(axies[0], axies[1], axies[2]);

        // 1.
        // suppost to be better but harder to understand
        // const angleRadian = Math.atan2(vec3.length(vec3.cross(vec3.create(), angle, baseAngle)), vec3.dot(angle, baseAngle));

        // 2.
        // cos(angle) = (a * b) / (|a| * |b|)
        // first part is dot product, second is length multiplication, since normalized length = 1
        const dotProduct = vec3.dot(angle, baseAngle);        
        const angleRadian = Math.acos(dotProduct);
        
        // result is 0 (front) to PI (back)
        // that means I know where front and back is but not which way i got there
        // so I need to convert this to a 360 angle        

        // solution is calculating the normal
        // right is (+) and left is (-)
        const cross = vec3.cross(vec3.create(), angle, baseAngle);
        const dotCross = vec3.dot(cross, vec3.fromValues(0, 1, 0));

        let angleDegree = this.radiansToDegrees(angleRadian);

        if (dotCross > 0)
            angleDegree = 360 - angleDegree;        

        return angleDegree;
    }

    // convert to radians and normalize
    private radiansToDegrees(value: number): number {
        return value * (180 / Math.PI);
    }

    // convert to radians and normalize
    private degreesToRadians(value: number): number {
        return value  * (Math.PI / 180);
    }

    keydownHandler(e) {
        this.keys[e.code] = true;
    }

    keyupHandler(e) {
        this.keys[e.code] = false;
    }
}

// we need a rotating motor that rotates based on time and acceleration
class Propeler {

    private part: VehiclePart;

    public acceleration: number = 0;

    constructor(part: VehiclePart) {
        
        this.part = part;
    }

    public update(time: number, dt: number) {

        // console.log(this.part.modelMatrix.rotation)

        let modelMatrix: Transform = this.part.node.getComponentOfType(Transform);

        quat.rotateX(modelMatrix.rotation, this.part.modelMatrix.rotation, this.acceleration * time); // to slow it down devide acceleration
    }
}

// class that remembers the original position of the parts so we can put the plane back together
class VehiclePart {

    public modelMatrix: Transform;
    public node: Node;

    constructor(node: Node) {
        
        this.node = node;
        // here we clone the transform to save origin
        this.modelMatrix = structuredClone(node.getComponentOfType(Transform));
    }
}