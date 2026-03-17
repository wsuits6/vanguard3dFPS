import * as THREE from 'three';

export class WeaponSystem {
  public mesh: THREE.Group;
  private scene: THREE.Scene;
  private camera: THREE.Camera;
  
  private lastShootTime = 0;
  private fireRate = 100; // ms
  private recoilAmount = 0.08;
  private currentRecoil = 0;
  
  private muzzleFlash: THREE.PointLight;
  private model: THREE.Group | null = null;

  constructor(scene: THREE.Scene, camera: THREE.Camera, weaponModel: any) {
    this.scene = scene;
    this.camera = camera;
    this.mesh = new THREE.Group();
    
    if (weaponModel && weaponModel.scene) {
      this.model = weaponModel.scene;
      this.mesh.add(this.model);
      // Scale and rotate model to fit FPS view
      this.model.scale.set(0.1, 0.1, 0.1);
      this.model.rotation.y = Math.PI;
      this.model.position.set(0.2, -0.2, -0.4);
    } else {
      // Procedural fallback
      const bodyGeometry = new THREE.BoxGeometry(0.1, 0.1, 0.4);
      const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.set(0.2, -0.2, -0.4);
      this.mesh.add(body);
    }

    this.muzzleFlash = new THREE.PointLight(0xffaa00, 0, 2);
    this.mesh.add(this.muzzleFlash);
    this.muzzleFlash.position.set(0.2, -0.1, -0.8);

    this.camera.add(this.mesh);
  }

  update(deltaTime: number) {
    // Recoil recovery
    this.currentRecoil = THREE.MathUtils.lerp(this.currentRecoil, 0, 0.15);
    this.mesh.position.z = this.currentRecoil;
    this.mesh.rotation.x = -this.currentRecoil * 1.5;
    
    // Smooth weapon sway could be added here
  }

  shoot(onHit: (point: THREE.Vector3, normal: THREE.Vector3) => void) {
    const now = Date.now();
    if (now - this.lastShootTime < this.fireRate) return false;
    
    this.lastShootTime = now;
    this.currentRecoil = this.recoilAmount;

    // Raycast
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera);
    const intersects = raycaster.intersectObjects(this.scene.children, true);
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      onHit(hit.point, hit.face?.normal || new THREE.Vector3(0, 1, 0));
    }

    this.triggerMuzzleFlash();
    this.triggerShellEjection();
    return true;
  }

  private triggerMuzzleFlash() {
    this.muzzleFlash.intensity = 5;
    setTimeout(() => {
      this.muzzleFlash.intensity = 0;
    }, 40);
  }

  private triggerShellEjection() {
    const shellGeo = new THREE.CylinderGeometry(0.005, 0.005, 0.02);
    const shellMat = new THREE.MeshStandardMaterial({ color: 0xdaa520, metalness: 1, roughness: 0.2 });
    const shell = new THREE.Mesh(shellGeo, shellMat);
    
    // Position at ejection port
    const worldPos = new THREE.Vector3();
    this.mesh.getWorldPosition(worldPos);
    shell.position.copy(worldPos).add(new THREE.Vector3(0.1, 0, 0).applyQuaternion(this.mesh.quaternion));
    
    this.scene.add(shell);
    
    const force = new THREE.Vector3(0.1, 0.1, 0).applyQuaternion(this.mesh.quaternion);
    let velocity = force.clone();
    let gravity = -0.01;
    
    const animateShell = () => {
      if (shell.position.y < 0) {
        this.scene.remove(shell);
        return;
      }
      velocity.y += gravity;
      shell.position.add(velocity);
      shell.rotation.x += 0.2;
      shell.rotation.z += 0.2;
      requestAnimationFrame(animateShell);
    };
    animateShell();
  }
}
