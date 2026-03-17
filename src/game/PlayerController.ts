import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'cannon-es';

export class PlayerController {
  public camera: THREE.PerspectiveCamera;
  public controls: PointerLockControls;
  public body: CANNON.Body;
  
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private isSprinting = false;
  private isCrouching = false;
  private canJump = false;
  
  private walkSpeed = 5.0;
  private sprintSpeed = 8.5;
  private crouchSpeed = 2.5;
  
  private headBobTimer = 0;
  private headBobFrequency = 10;
  private headBobAmplitude = 0.05;
  
  public health = 100;
  public ammo = 30;

  constructor(scene: THREE.Scene, domElement: HTMLElement, world: CANNON.World) {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    
    // Physics body
    const radius = 0.6;
    const height = 1.8;
    const shape = new CANNON.Cylinder(radius, radius, height, 16);
    this.body = new CANNON.Body({
      mass: 70,
      shape: shape,
      position: new CANNON.Vec3(0, 5, 0),
      fixedRotation: true,
      material: new CANNON.Material({ friction: 0.1 })
    });
    world.addBody(this.body);

    this.controls = new PointerLockControls(this.camera, domElement);
    this.initListeners();
  }

  private initListeners() {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': this.moveForward = true; break;
        case 'KeyA': this.moveLeft = true; break;
        case 'KeyS': this.moveBackward = true; break;
        case 'KeyD': this.moveRight = true; break;
        case 'ShiftLeft': this.isSprinting = true; break;
        case 'KeyC': this.toggleCrouch(); break;
        case 'Space':
          if (this.canJump) {
            this.body.velocity.y = 5;
            this.canJump = false;
          }
          break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'KeyW': this.moveForward = false; break;
        case 'KeyA': this.moveLeft = false; break;
        case 'KeyS': this.moveBackward = false; break;
        case 'KeyD': this.moveRight = false; break;
        case 'ShiftLeft': this.isSprinting = false; break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    this.body.addEventListener('collide', (e: any) => {
      // Simple ground check
      if (e.contact.ni.y > 0.5) this.canJump = true;
    });
  }

  private toggleCrouch() {
    this.isCrouching = !this.isCrouching;
    // In a real implementation, we'd change the physics body height here
  }

  update(deltaTime: number) {
    if (!this.controls.isLocked) return;

    let speed = this.walkSpeed;
    if (this.isSprinting) speed = this.sprintSpeed;
    if (this.isCrouching) speed = this.crouchSpeed;

    const inputDirection = new THREE.Vector3();
    if (this.moveForward) inputDirection.z -= 1;
    if (this.moveBackward) inputDirection.z += 1;
    if (this.moveLeft) inputDirection.x -= 1;
    if (this.moveRight) inputDirection.x += 1;
    inputDirection.normalize();

    const cameraRotation = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    const moveVector = new THREE.Vector3(inputDirection.x, 0, inputDirection.z);
    moveVector.applyEuler(new THREE.Euler(0, cameraRotation.y, 0));

    this.body.velocity.x = moveVector.x * speed;
    this.body.velocity.z = moveVector.z * speed;

    // Head Bobbing
    const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
    let bobY = 0;
    if (isMoving && this.canJump) {
      this.headBobTimer += deltaTime * (this.isSprinting ? 15 : 10);
      bobY = Math.sin(this.headBobTimer) * this.headBobAmplitude;
    } else {
      this.headBobTimer = 0;
    }

    const eyeHeight = this.isCrouching ? 0.4 : 0.8;
    this.camera.position.set(
      this.body.position.x,
      this.body.position.y + eyeHeight + bobY,
      this.body.position.z
    );
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
  }
}
