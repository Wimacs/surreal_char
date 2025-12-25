import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { SpringCameraController } from './SpringCameraController';

type TickFn = (delta: number) => void;

export class RendererEngine {
  private scene: THREE.Scene;
  private camera: THREE.OrthographicCamera;
  private renderer: WebGPURenderer | THREE.WebGLRenderer;
  private cameraController!: SpringCameraController;
  private container!: HTMLElement;
  private clock: THREE.Clock;
  private tickFns = new Set<TickFn>();
  private textureLoader = new THREE.TextureLoader();
  private petMode = false;
  private currentBgUrl?: string;
  private readonly defaultBg = new THREE.Color(0x0e1117);
  private isMouseOverBase = false;
  private cameraSize = 1; // 正交相机的尺寸（控制视野大小）

  constructor() {
    this.scene = new THREE.Scene();
    // 正交相机：left, right, top, bottom, near, far
    // 初始值会在 init 中根据容器尺寸更新
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
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
    
    // 更新正交相机的投影矩阵（会在 onResize 中再次更新）
    this.updateOrthographicCamera();

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

    // Mouse position tracking for camera control
    this.setupMouseTracking();
    
    // Initialize camera control state (will be updated when mouse moves)
    // Use setTimeout to ensure WindowDragButton is created first
    setTimeout(() => {
      this.updateCameraControl();
    }, 0);

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

  setCameraSize(size: number) {
    this.cameraSize = size;
    this.updateOrthographicCamera();
  }

  getCameraSize(): number {
    return this.cameraSize;
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
    // petMode no longer locks camera - camera control is based on mouse position
    // if (this.cameraController) {
    //   this.cameraController.setLocked(enabled);
    // }
    if (enabled) {
      this.scene.background = null;
      this.renderer.domElement.style.backgroundColor = 'transparent';
    } else {
      this.setBackground(this.currentBgUrl);
    }
    this.updateClearColor();
    // Update camera control state after pet mode change
    this.updateCameraControl();
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
    this.renderer.setSize(width, height);
    this.updateOrthographicCamera();
  };

  private updateOrthographicCamera() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    const aspect = width / height;
    
    // 根据宽高比调整正交相机的左右和上下边界
    // cameraSize 控制视野大小，可以根据需要调整
    this.camera.left = -this.cameraSize * aspect;
    this.camera.right = this.cameraSize * aspect;
    this.camera.top = this.cameraSize;
    this.camera.bottom = -this.cameraSize;
    this.camera.updateProjectionMatrix();
  }

  private updateClearColor() {
    const alpha = this.petMode ? 0 : 1;
    if (typeof (this.renderer as any).setClearColor === 'function') {
      (this.renderer as any).setClearColor(this.defaultBg, alpha);
    }
  }

  private setupMouseTracking() {
    // Check if mouse is over the base (window drag area)
    const checkMousePosition = (event: MouseEvent) => {
      const baseElement = document.querySelector('.window-drag-base') as HTMLElement;
      if (!baseElement) {
        // If base doesn't exist, enable camera control
        this.isMouseOverBase = false;
        this.updateCameraControl();
        return;
      }

      const rect = baseElement.getBoundingClientRect();
      const isOverBase = 
        event.clientY >= rect.top && 
        event.clientY <= rect.bottom &&
        event.clientX >= rect.left && 
        event.clientX <= rect.right;

      if (this.isMouseOverBase !== isOverBase) {
        this.isMouseOverBase = isOverBase;
        this.updateCameraControl();
      }
    };

    // Track mouse movement
    document.addEventListener('mousemove', checkMousePosition);
    
    // Setup event listeners for base element (may be created later)
    const setupBaseListeners = () => {
      const baseElement = document.querySelector('.window-drag-base');
      if (baseElement) {
        baseElement.addEventListener('mouseenter', () => {
          this.isMouseOverBase = true;
          this.updateCameraControl();
        });
        baseElement.addEventListener('mouseleave', () => {
          this.isMouseOverBase = false;
          this.updateCameraControl();
        });
      } else {
        // Retry if base element doesn't exist yet
        setTimeout(setupBaseListeners, 100);
      }
    };
    
    setupBaseListeners();
  }

  private updateCameraControl() {
    if (!this.cameraController) return;
    
    // Enable camera control when mouse is NOT over the base (i.e., over the panel)
    // Disable when mouse is over the base
    // Note: petMode only affects background, not camera control when mouse is over panel
    const shouldEnable = !this.isMouseOverBase;
    this.cameraController.setEnabled(shouldEnable);
  }
}

