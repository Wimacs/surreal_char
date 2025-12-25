import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SpringCameraController {
  private controls: OrbitControls;
  private restPosition: THREE.Vector3;
  private restTarget: THREE.Vector3;
  private isLocked = false;
  private isEnabled = true;

  constructor(
    camera: THREE.OrthographicCamera | THREE.PerspectiveCamera,
    domElement: HTMLElement,
    restPosition: THREE.Vector3,
    restTarget: THREE.Vector3,
  ) {
    this.restPosition = restPosition.clone();
    this.restTarget = restTarget.clone();

    this.controls = new OrbitControls(camera, domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.target.copy(restTarget);
    this.controls.update();

    // 禁用平移（pan）
    this.controls.enablePan = false;
    // 允许缩放
    this.controls.enableZoom = true;
    // 允许旋转
    this.controls.enableRotate = true;

    // 使用右键旋转（禁用左键和中键）
    this.controls.mouseButtons = {
      LEFT: null,
      MIDDLE: null,
      RIGHT: THREE.MOUSE.ROTATE,
    };

    // 限制旋转角度
    // polarAngle 控制上下角度（0 = 向上，Math.PI = 向下）
    // 限制在水平方向上下各10度（总共20度范围）
    const horizontalAngle = Math.PI / 2; // 水平方向（90度）
    const maxDeviation = (20 * Math.PI) / 180; // 20度转换为弧度
    this.controls.minPolarAngle = horizontalAngle - maxDeviation / 2; // 水平向上10度
    this.controls.maxPolarAngle = horizontalAngle + maxDeviation / 2; // 水平向下10度

    // 允许水平旋转360度（不限制 azimuth angle）
    // 默认情况下 azimuth angle 没有限制，所以不需要设置
  }

  setRestPose(position: THREE.Vector3, target: THREE.Vector3) {
    this.restPosition.copy(position);
    this.restTarget.copy(target);
    this.controls.target.copy(target);
  }

  setLocked(locked: boolean) {
    this.isLocked = locked;
    this.updateControlsState();
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    this.updateControlsState();
  }

  private updateControlsState() {
    // Enable controls only if not locked AND enabled
    const shouldEnable = !this.isLocked && this.isEnabled;
    this.controls.enableRotate = shouldEnable;
    this.controls.enableZoom = shouldEnable;
    this.controls.update();
  }

  update(_delta: number) {
    // 更新 OrbitControls（处理旋转）
    this.controls.update();

    // 确保 target 始终以角色为中心（不移动）
    this.controls.target.copy(this.restTarget);
  }

  dispose() {
    this.controls.dispose();
  }

  getControls() {
    return this.controls;
  }
}

