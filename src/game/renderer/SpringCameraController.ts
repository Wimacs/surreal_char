import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class SpringCameraController {
  private controls: OrbitControls;
  private restPosition: THREE.Vector3;
  private restTarget: THREE.Vector3;

  constructor(
    camera: THREE.PerspectiveCamera,
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
  }

  setRestPose(position: THREE.Vector3, target: THREE.Vector3) {
    this.restPosition.copy(position);
    this.restTarget.copy(target);
    this.controls.target.copy(target);
  }

  setLocked(locked: boolean) {
    this.controls.enableRotate = !locked;
    this.controls.enableZoom = !locked;
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

