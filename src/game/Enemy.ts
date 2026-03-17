import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class Enemy {
  public mesh: THREE.Group;
  public body: CANNON.Body;
  public health = 50;
  private scene: THREE.Scene;
  private world: CANNON.World;
  
  private speed = 3;
  private state: 'patrol' | 'chase' | 'attack' = 'patrol';
  private patrolPoints: THREE.Vector3[] = [];
  private currentPatrolIndex = 0;
  
  constructor(scene: THREE.Scene, world: CANNON.World, position: THREE.Vector3) {
    this.scene = scene;
    this.world = world;
    
    this.mesh = new THREE.Group();
    this.createEnemyMesh();
    this.scene.add(this.mesh);
    
    // Physics body
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 1, 0.5));
    this.body = new CANNON.Body({
      mass: 1,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z),
      fixedRotation: true
    });
    this.world.addBody(this.body);
    
    // Patrol points
    this.patrolPoints = [
      position.clone(),
      position.clone().add(new THREE.Vector3(10, 0, 0)),
      position.clone().add(new THREE.Vector3(10, 0, 10)),
      position.clone().add(new THREE.Vector3(0, 0, 10)),
    ];
  }

  private createEnemyMesh() {
    const bodyGeo = new THREE.BoxGeometry(1, 2, 1);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xff3333 });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.castShadow = true;
    
    const eyeGeo = new THREE.BoxGeometry(0.8, 0.2, 0.2);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0.6, 0.5);
    
    this.mesh.add(body);
    this.mesh.add(eye);
  }

  update(deltaTime: number, playerPosition: THREE.Vector3) {
    if (this.health <= 0) return;

    const distanceToPlayer = this.body.position.distanceTo(new CANNON.Vec3(playerPosition.x, playerPosition.y, playerPosition.z));
    
    if (distanceToPlayer < 15) {
      this.state = 'chase';
    } else {
      this.state = 'patrol';
    }

    if (this.state === 'chase') {
      this.moveTowards(playerPosition, deltaTime);
    } else {
      const target = this.patrolPoints[this.currentPatrolIndex];
      if (this.body.position.distanceTo(new CANNON.Vec3(target.x, target.y, target.z)) < 1) {
        this.currentPatrolIndex = (this.currentPatrolIndex + 1) % this.patrolPoints.length;
      }
      this.moveTowards(target, deltaTime);
    }

    // Sync mesh with body
    this.mesh.position.set(this.body.position.x, this.body.position.y, this.body.position.z);
    this.mesh.quaternion.set(this.body.quaternion.x, this.body.quaternion.y, this.body.quaternion.z, this.body.quaternion.w);
  }

  private moveTowards(target: THREE.Vector3, deltaTime: number) {
    const direction = new THREE.Vector3().subVectors(target, new THREE.Vector3(this.body.position.x, this.body.position.y, this.body.position.z));
    direction.y = 0;
    direction.normalize();
    
    this.body.velocity.x = direction.x * this.speed;
    this.body.velocity.z = direction.z * this.speed;
    
    // Look at target
    if (direction.length() > 0.1) {
      const angle = Math.atan2(direction.x, direction.z);
      this.body.quaternion.setFromAxisAngle(new CANNON.Vec3(0, 1, 0), angle);
    }
  }

  takeDamage(amount: number) {
    this.health -= amount;
    if (this.health <= 0) {
      this.die();
    }
  }

  private die() {
    this.scene.remove(this.mesh);
    this.world.removeBody(this.body);
  }
}
