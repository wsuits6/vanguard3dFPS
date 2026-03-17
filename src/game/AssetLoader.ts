import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';

export class AssetLoader {
  private gltfLoader: GLTFLoader;
  private rgbeLoader: RGBELoader;
  private textureLoader: THREE.TextureLoader;
  
  public assets: Map<string, any> = new Map();
  private loadingCount = 0;
  private totalToLoad = 0;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    this.rgbeLoader = new RGBELoader();
    this.textureLoader = new THREE.TextureLoader();
  }

  async loadAll(onProgress?: (progress: number) => void) {
    const assetsToLoad = [
      { id: 'weapon', type: 'gltf', url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb' },
      { id: 'enemy', type: 'gltf', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/models/gltf/RobotExpressive/RobotExpressive.glb' },
      { id: 'env_map', type: 'hdr', url: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/equirectangular/venice_sunset_1k.hdr' },
    ];

    this.totalToLoad = assetsToLoad.length;
    
    const promises = assetsToLoad.map(async (asset) => {
      try {
        let loadedAsset;
        if (asset.type === 'gltf') {
          loadedAsset = await this.gltfLoader.loadAsync(asset.url);
        } else if (asset.type === 'hdr') {
          loadedAsset = await this.rgbeLoader.loadAsync(asset.url);
        } else if (asset.type === 'texture') {
          loadedAsset = await this.textureLoader.loadAsync(asset.url);
        }
        
        this.assets.set(asset.id, loadedAsset);
      } catch (error) {
        console.error(`Failed to load asset ${asset.id}:`, error);
      } finally {
        this.loadingCount++;
        if (onProgress) onProgress(this.loadingCount / this.totalToLoad);
      }
    });

    await Promise.all(promises);
  }

  get(id: string) {
    return this.assets.get(id);
  }
}
