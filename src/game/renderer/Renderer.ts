import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { SpringCameraController } from './SpringCameraController';

type TickFn = (delta: number) => void;

export class RendererEngine {
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: WebGPURenderer | THREE.WebGLRenderer;
  private cameraController!: SpringCameraController;
  private container!: HTMLElement;
  private clock: THREE.Clock;
  private tickFns = new Set<TickFn>();
  private textureLoader = new THREE.TextureLoader();
  private petMode = false;
  private currentBgUrl?: string;
  private readonly defaultBg = new THREE.Color(0x0e1117);

  constructor() {
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.clock = new THREE.Clock();
  }

  async init(containerId: string): Promise<void> {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container ${containerId} not found`);
    }
    this.container = container;

    // Try WebGPU, fallback to WebGL
    try {
      const webgpu = new WebGPURenderer({ antialias: true, alpha: true });
      await webgpu.init();
      this.renderer = webgpu;
      console.log('WebGPU renderer initialized');
    } catch (err) {
      console.warn('WebGPU unavailable, fallback to WebGL', err);
      this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    }

    // Scene and camera
    this.scene.background = this.defaultBg.clone();
    this.updateClearColor();
    const restPosition = new THREE.Vector3(0, 1.6, 5);
    const restTarget = new THREE.Vector3(0, 1.6, 0);
    this.camera.position.copy(restPosition);

    // Renderer dom
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(this.renderer.domElement);

    // Spring camera controller
    this.cameraController = new SpringCameraController(
      this.camera,
      this.renderer.domElement,
      restPosition,
      restTarget,
    );

    // Lights
    const ambient = new THREE.AmbientLight(0xffffff, 0.7);
    this.scene.add(ambient);
    const dir = new THREE.DirectionalLight(0xffffff, 1.0);
    dir.position.set(1, 1, 1);
    this.scene.add(dir);

    // Resize handling
    window.addEventListener('resize', this.onResize);
    this.onResize();

    this.animate();
  }

  getScene() {
    return this.scene;
  }

  getCamera() {
    return this.camera;
  }

  getRenderer() {
    return this.renderer;
  }

  getContainer() {
    return this.container;
  }

  addTick(fn: TickFn) {
    this.tickFns.add(fn);
    return () => this.tickFns.delete(fn);
  }

  addToScene(object: THREE.Object3D) {
    this.scene.add(object);
  }

  removeFromScene(object: THREE.Object3D) {
    this.scene.remove(object);
  }

  setCameraPose(position: THREE.Vector3, target: THREE.Vector3) {
    this.camera.position.copy(position);
    this.cameraController?.setRestPose(position, target);
  }

  setBackground(url?: string) {
    this.currentBgUrl = url;
    if (this.petMode) {
      this.scene.background = null;
      this.updateClearColor();
      return;
    }

    if (!url) {
      this.scene.background = this.defaultBg.clone();
      this.updateClearColor();
      return;
    }
    this.textureLoader.load(
      url,
      (texture) => {
        texture.colorSpace = THREE.SRGBColorSpace;
        this.scene.background = texture;
        this.updateClearColor();
      },
      undefined,
      (err) => console.warn('Failed to load background texture', err),
    );
  }

  setPetMode(enabled: boolean) {
    this.petMode = enabled;
    if (this.cameraController) {
      this.cameraController.setLocked(enabled);
    }
    if (enabled) {
      this.scene.background = null;
      this.renderer.domElement.style.backgroundColor = 'transparent';
    } else {
      this.setBackground(this.currentBgUrl);
    }
    this.updateClearColor();
  }

  enableDragAndDrop(onVRM: (url: string) => Promise<void>, onFBX: (url: string) => Promise<void>) {
    if (!this.container) return;
    const onDragOver = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.container.classList.add('dragover');
    };
    const onDragLeave = (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.container.classList.remove('dragover');
    };
    const onDrop = async (event: DragEvent) => {
      event.preventDefault();
      event.stopPropagation();
      this.container.classList.remove('dragover');

      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return;
      const file = files[0];
      const name = file.name.toLowerCase();
      const url = URL.createObjectURL(file);
      try {
        if (name.endsWith('.vrm')) {
          await onVRM(url);
        } else if (name.endsWith('.fbx')) {
          await onFBX(url);
        } else {
          console.warn('Please drop a VRM (.vrm) or Mixamo FBX (.fbx) file');
        }
      } finally {
        URL.revokeObjectURL(url);
      }
    };

    this.container.addEventListener('dragover', onDragOver);
    this.container.addEventListener('dragleave', onDragLeave);
    this.container.addEventListener('drop', onDrop);
  }

  private animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.cameraController?.update(delta);
    this.tickFns.forEach((fn) => fn(delta));
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private updateClearColor() {
    const alpha = this.petMode ? 0 : 1;
    if (typeof (this.renderer as any).setClearColor === 'function') {
      (this.renderer as any).setClearColor(this.defaultBg, alpha);
    }
  }
}

