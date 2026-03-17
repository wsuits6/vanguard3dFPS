import * as CANNON from 'cannon-es';
import * as THREE from 'three';

export class Physics {
  public world: CANNON.World;
  private lastTime: number = 0;

  constructor() {
    this.world = new CANNON.World();
    this.world.gravity.set(0, -9.82, 0);
    this.world.broadphase = new CANNON.NaiveBroadphase();
    (this.world.solver as CANNON.GSSolver).iterations = 10;
    
    // Default material
    const defaultMaterial = new CANNON.Material('default');
    const defaultContactMaterial = new CANNON.ContactMaterial(
      defaultMaterial,
      defaultMaterial,
      {
        friction: 0.1,
        restitution: 0.3,
      }
    );
    this.world.addContactMaterial(defaultContactMaterial);
  }

  update(deltaTime: number) {
    this.world.step(1 / 60, deltaTime, 3);
  }

  addBox(width: number, height: number, depth: number, position: THREE.Vector3, mass: number = 0): CANNON.Body {
    const shape = new CANNON.Box(new CANNON.Vec3(width / 2, height / 2, depth / 2));
    const body = new CANNON.Body({
      mass: mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: shape,
    });
    this.world.addBody(body);
    return body;
  }

  addSphere(radius: number, position: THREE.Vector3, mass: number = 0): CANNON.Body {
    const shape = new CANNON.Sphere(radius);
    const body = new CANNON.Body({
      mass: mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      shape: shape,
    });
    this.world.addBody(body);
    return body;
  }
}
