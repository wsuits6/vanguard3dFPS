import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { GammaCorrectionShader } from 'three/examples/jsm/shaders/GammaCorrectionShader.js';

import { Physics } from './Physics';
import { PlayerController } from './PlayerController';
import { WeaponSystem } from './WeaponSystem';
import { EnemyAI } from './EnemyAI';
import { SceneManager } from './SceneManager';
import { AssetLoader } from './AssetLoader';
import { SoundManager } from './SoundManager';

export class Game {
  private renderer: THREE.WebGLRenderer;
  private composer: EffectComposer;
  private scene: THREE.Scene;
  private physics: Physics;
  private player: PlayerController;
  private weapon: WeaponSystem | null = null;
  private enemies: EnemyAI[] = [];
  private assetLoader: AssetLoader;
  private soundManager: SoundManager;
  private sceneManager: SceneManager | null = null;
  
  private clock: THREE.Clock;
  public onUpdateHUD?: (health: number, ammo: number) => void;
  public onLoadingProgress?: (progress: number) => void;

  constructor(container: HTMLElement) {
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.physics = new Physics();
    this.assetLoader = new AssetLoader();
    this.soundManager = new SoundManager();
    this.player = new PlayerController(this.scene, this.renderer.domElement, this.physics.world);
    
    // Post-processing
    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.player.camera);
    this.composer.addPass(renderPass);
    
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.4, 0.85);
    this.composer.addPass(bloomPass);
    
    const gammaPass = new ShaderPass(GammaCorrectionShader);
    this.composer.addPass(gammaPass);

    this.clock = new THREE.Clock();
    this.init();
  }

  private async init() {
    await this.assetLoader.loadAll((p) => this.onLoadingProgress?.(p));
    
    this.sceneManager = new SceneManager(this.scene, this.physics.world, this.assetLoader.get('env_map'));
    this.weapon = new WeaponSystem(this.scene, this.player.camera, this.assetLoader.get('weapon'));
    
    this.spawnEnemies();
    this.initListeners();
    this.animate();
  }

  private spawnEnemies() {
    const model = this.assetLoader.get('enemy');
    const spawnPoints = [
      new THREE.Vector3(15, 1, 15),
      new THREE.Vector3(-15, 1, -15),
      new THREE.Vector3(25, 1, -5),
    ];
    
    spawnPoints.forEach(pos => {
      const enemy = new EnemyAI(this.scene, this.physics.world, model, pos);
      this.enemies.push(enemy);
    });
  }

  private initListeners() {
    window.addEventListener('resize', () => {
      this.player.camera.aspect = window.innerWidth / window.innerHeight;
      this.player.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.composer.setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener('mousedown', (e) => {
      if (this.player.controls.isLocked && e.button === 0) {
        this.shoot();
      }
    });
  }

  private shoot() {
    if (!this.weapon || this.player.ammo <= 0) return;
    
    const shot = this.weapon.shoot((point, normal) => {
      this.createHitEffect(point, normal);
      this.enemies.forEach(enemy => {
        if (enemy.mesh.position.distanceTo(point) < 1.5) {
          enemy.takeDamage(34);
          this.soundManager.playHit();
        }
      });
    });

    if (shot) {
      this.player.ammo--;
      this.soundManager.playGunshot();
      this.updateHUD();
    }
  }

  private createHitEffect(point: THREE.Vector3, normal: THREE.Vector3) {
    const spark = new THREE.Mesh(
      new THREE.SphereGeometry(0.04),
      new THREE.MeshBasicMaterial({ color: 0xffcc00 })
    );
    spark.position.copy(point);
    this.scene.add(spark);
    setTimeout(() => this.scene.remove(spark), 80);
  }

  private updateHUD() {
    this.onUpdateHUD?.(this.player.health, this.player.ammo);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const deltaTime = this.clock.getDelta();
    
    this.physics.update(deltaTime);
    this.player.update(deltaTime);
    this.weapon?.update(deltaTime);
    
    this.enemies.forEach(enemy => {
      enemy.update(deltaTime, this.player.camera.position);
      if (enemy.health > 0 && enemy.mesh.position.distanceTo(this.player.camera.position) < 2) {
        this.player.takeDamage(0.2);
        this.updateHUD();
      }
    });

    this.composer.render();
  }

  public start() {
    this.player.controls.lock();
  }
}
