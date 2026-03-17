import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import * as CANNON from 'cannon-es';

export class Player {
  public camera: THREE.PerspectiveCamera;
  public controls: PointerLockControls;
  public body: CANNON.Body;
  
  private moveForward = false;
  private moveBackward = false;
  private moveLeft = false;
  private moveRight = false;
  private canJump = false;
  
  private velocity = new THREE.Vector3();
  private direction = new THREE.Vector3();
  
  public health = 100;
  public ammo = 30;
  public maxAmmo = 30;

  constructor(scene: THREE.Scene, domElement: HTMLElement, world: CANNON.World) {
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.controls = new PointerLockControls(this.camera, domElement);
    
    // Physics body
    const radius = 1.0;
    const shape = new CANNON.Sphere(radius);
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(0, 5, 0),
      fixedRotation: true,
      material: new CANNON.Material({ friction: 0.1 })
    });
    world.addBody(this.body);

    this.initListeners();
  }

  private initListeners() {
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = true;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = true;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = true;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = true;
          break;
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
        case 'ArrowUp':
        case 'KeyW':
          this.moveForward = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          this.moveLeft = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          this.moveBackward = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          this.moveRight = false;
          break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    
    this.body.addEventListener('collide', () => {
      this.canJump = true;
    });
  }

  update(deltaTime: number) {
    if (!this.controls.isLocked) return;

    const speed = 20.0;
    const inputDirection = new THREE.Vector3();
    
    if (this.moveForward) inputDirection.z -= 1;
    if (this.moveBackward) inputDirection.z += 1;
    if (this.moveLeft) inputDirection.x -= 1;
    if (this.moveRight) inputDirection.x += 1;
    
    inputDirection.normalize();

    // Get camera direction but ignore Y for movement
    const cameraRotation = new THREE.Euler().setFromQuaternion(this.camera.quaternion, 'YXZ');
    const moveVector = new THREE.Vector3(inputDirection.x, 0, inputDirection.z);
    moveVector.applyEuler(new THREE.Euler(0, cameraRotation.y, 0));

    this.body.velocity.x = moveVector.x * speed;
    this.body.velocity.z = moveVector.z * speed;

    // Sync camera with physics body
    this.camera.position.set(
      this.body.position.x,
      this.body.position.y + 0.8, // Eye level
      this.body.position.z
    );
  }

  takeDamage(amount: number) {
    this.health = Math.max(0, this.health - amount);
  }
}
