import * as THREE from 'three';

export class Weapon {
  public mesh: THREE.Group;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  
  private isShooting = false;
  private lastShootTime = 0;
  private fireRate = 150; // ms
  private recoilAmount = 0.05;
  private currentRecoil = 0;

  constructor(scene: THREE.Scene, camera: THREE.Camera) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = new THREE.Group();
    this.createWeaponMesh();
    this.camera.add(this.mesh);
    
    // Position weapon in front of camera
    this.mesh.position.set(0.3, -0.3, -0.5);
    this.mesh.rotation.y = Math.PI;
  }

  private createWeaponMesh() {
    const bodyGeometry = new THREE.BoxGeometry(0.1, 0.15, 0.4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5, metalness: 0.8 });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    
    const barrelGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.3);
    const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.2, metalness: 1.0 });
    const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = 0.2;
    
    this.mesh.add(body);
    this.mesh.add(barrel);
  }

  update(deltaTime: number) {
    // Smooth recoil recovery
    this.currentRecoil = THREE.MathUtils.lerp(this.currentRecoil, 0, 0.1);
    this.mesh.position.z = -0.5 + this.currentRecoil;
    this.mesh.rotation.x = -this.currentRecoil * 2;
  }

  shoot(onHit: (point: THREE.Vector3, normal: THREE.Vector3) => void) {
    const now = Date.now();
    if (now - this.lastShootTime < this.fireRate) return false;
    
    this.lastShootTime = now;
    this.currentRecoil = this.recoilAmount;

    // Raycasting for hit detection
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      onHit(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0));
    }

    // Muzzle flash effect
    this.createMuzzleFlash();
    
    return true;
  }

  private createMuzzleFlash() {
    const flash = new THREE.PointLight(0xffaa00, 2, 2);
    flash.position.set(0.3, -0.2, -0.8);
    this.camera.add(flash);
    setTimeout(() => {
      this.camera.remove(flash);
    }, 50);
  }
}
