import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';

export class EnemyAI {
  public mesh: THREE.Group;
  public body: CANNON.Body;
  public health = 100;
  private scene: THREE.Scene;
  private world: CANNON.World;
  
  private mixer: THREE.AnimationMixer | null = null;
  private animations: Map<string, THREE.AnimationAction> = new Map();
  private currentState: 'idle' | 'patrol' | 'chase' | 'attack' = 'idle';

  constructor(scene: THREE.Scene, world: CANNON.World, model: any, position: THREE.Vector3) {
    this.scene = scene;
    this.world = world;
    
    if (model && model.scene) {
      this.mesh = SkeletonUtils.clone(model.scene) as THREE.Group;
    } else {
      // Procedural fallback
      this.mesh = new THREE.Group();
      const bodyGeo = new THREE.BoxGeometry(1, 2, 1);
      const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
      this.mesh.add(new THREE.Mesh(bodyGeo, bodyMat));
    }
    this.scene.add(this.mesh);
    
    // Animations
    if (model && model.animations && model.animations.length > 0) {
      this.mixer = new THREE.AnimationMixer(this.mesh);
      model.animations.forEach((clip: THREE.AnimationClip) => {
        const action = this.mixer!.clipAction(clip);
        this.animations.set(clip.name.toLowerCase(), action);
      });
      this.playAnimation('idle');
    }

    // Physics
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      fixedRotation: true
    });
    this.world.addBody(this.body);
  }

  private playAnimation(name: string) {
    const action = this.animations.get(name);
    if (action) {
      this.animations.forEach(a => a.fadeOut(0.2));
      action.reset().fadeIn(0.2).play();
    }
  }

  update(deltaTime: number, playerPosition: THREE.Vector3) {
    if (this.health <= 0) return;
    if (this.mixer) this.mixer.update(deltaTime);

    const dist = this.body.position.distanceTo(new CANNON.Vec3(playerPosition.x, playerPosition.y, playerPosition.z));
    
    if (dist < 20) {
      this.chase(playerPosition, deltaTime);
    } else {
      this.idle();
    }

    this.mesh.position.set(this.body.position.x, this.body.position.y - 1, this.body.position.z);
    this.mesh.quaternion.set(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w);
  }

  private chase(target: THREE.Vector3, deltaTime: number) {
    if (this.currentState !== 'chase') {
      this.currentState = 'chase';
      this.playAnimation('walk'); // Or 'run' if available
    }
    
    const dir = new THREE.Vector3().subVectors(target, new THREE.Vector3(this.body.position.x, this.body.position.y, this.body.position.z));
    dir.y = 0;
    dir.normalize();
    
    this.body.velocity.x = dir.x * 3.5;
    this.body.velocity.z = dir.z * 3.5;
    
    const angle = Math.atan2(dir.x, dir.z);
    this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
  }

  private idle() {
    if (this.currentState !== 'idle') {
      this.currentState = 'idle';
      this.playAnimation('idle');
      this.body.velocity.set(0, 0, 0);
    }
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  private die() {
    this.playAnimation('death');
    setTimeout(() => {
      this.scene.remove(this.mesh);
      this.world.removeBody(this.body);
    }, 2000);
  }
}
