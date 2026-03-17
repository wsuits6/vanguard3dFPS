import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export class SceneManager {
  public scene: THREE.Scene;
  private world: CANNON.World;

  constructor(scene: THREE.Scene, world: CANNON.World, envMap?: THREE.Texture) {
    this.scene = scene;
    this.world = world;
    this.initScene(envMap);
  }

  private initScene(envMap?: THREE.Texture) {
    if (envMap) {
      envMap.mapping = THREE.EquirectangularReflectionMapping;
      this.scene.environment = envMap;
      this.scene.background = envMap;
    } else {
      this.scene.background = new THREE.Color(0x050505);
    }

    this.scene.fog = new THREE.Fog(0x050505, 0, 100);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
    sunLight.position.set(50, 100, 50);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.set(2048, 2048);
    sunLight.shadow.camera.left = -60;
    sunLight.shadow.camera.right = 60;
    sunLight.shadow.camera.top = 60;
    sunLight.shadow.camera.bottom = -60;
    sunLight.shadow.bias = -0.0001;
    this.scene.add(sunLight);

    // Realistic Ground with PBR
    const groundSize = 500;
    const groundGeo = new THREE.PlaneGeometry(groundSize, groundSize);
    const groundMat = new THREE.MeshStandardMaterial({ 
      color: 0x222222,
      roughness: 0.9,
      metalness: 0.1
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.scene.add(ground);

    const groundBody = new CANNON.Body({
      mass: 0,
      shape: new CANNON.Plane(),
    });
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    this.world.addBody(groundBody);

    // Add some realistic props (crates, walls)
    this.createWall(new THREE.Vector3(0, 2.5, -20), new THREE.Vector3(40, 5, 1));
    this.createWall(new THREE.Vector3(-20, 2.5, 0), new THREE.Vector3(1, 5, 40));
    this.createWall(new THREE.Vector3(20, 2.5, 0), new THREE.Vector3(1, 5, 40));
  }

  private createWall(position: THREE.Vector3, size: THREE.Vector3) {
    const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
    const mat = new THREE.MeshStandardMaterial({ color: 0x444444, roughness: 0.7 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    const shape = new CANNON.Box(new CANNON.Vec3(size.x / 2, size.y / 2, size.z / 2));
    const body = new CANNON.Body({
      mass: 0,
      shape: shape,
      position: new CANNON.Vec3(position.x, position.y, position.z)
    });
    this.world.addBody(body);
  }
}
