import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { MToonMaterialLoaderPlugin } from '@pixiv/three-vrm';
import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';
import { RendererEngine } from '../renderer/Renderer';
import { GameStore } from '../state/store';

const animationVRMRigMap: { [key: string]: string } = {
  mixamorigHips: 'hips',
  mixamorigSpine: 'spine',
  mixamorigSpine1: 'chest',
  mixamorigSpine2: 'upperChest',
  mixamorigNeck: 'neck',
  mixamorigHead: 'head',
  mixamorigLeftShoulder: 'leftShoulder',
  mixamorigLeftArm: 'leftUpperArm',
  mixamorigLeftForeArm: 'leftLowerArm',
  mixamorigLeftHand: 'leftHand',
  mixamorigLeftHandThumb1: 'leftThumbMetacarpal',
  mixamorigLeftHandThumb2: 'leftThumbProximal',
  mixamorigLeftHandThumb3: 'leftThumbDistal',
  mixamorigLeftHandIndex1: 'leftIndexProximal',
  mixamorigLeftHandIndex2: 'leftIndexIntermediate',
  mixamorigLeftHandIndex3: 'leftIndexDistal',
  mixamorigLeftHandMiddle1: 'leftMiddleProximal',
  mixamorigLeftHandMiddle2: 'leftMiddleIntermediate',
  mixamorigLeftHandMiddle3: 'leftMiddleDistal',
  mixamorigLeftHandRing1: 'leftRingProximal',
  mixamorigLeftHandRing2: 'leftRingIntermediate',
  mixamorigLeftHandRing3: 'leftRingDistal',
  mixamorigLeftHandPinky1: 'leftLittleProximal',
  mixamorigLeftHandPinky2: 'leftLittleIntermediate',
  mixamorigLeftHandPinky3: 'leftLittleDistal',
  mixamorigRightShoulder: 'rightShoulder',
  mixamorigRightArm: 'rightUpperArm',
  mixamorigRightForeArm: 'rightLowerArm',
  mixamorigRightHand: 'rightHand',
  mixamorigRightHandPinky1: 'rightLittleProximal',
  mixamorigRightHandPinky2: 'rightLittleIntermediate',
  mixamorigRightHandPinky3: 'rightLittleDistal',
  mixamorigRightHandRing1: 'rightRingProximal',
  mixamorigRightHandRing2: 'rightRingIntermediate',
  mixamorigRightHandRing3: 'rightRingDistal',
  mixamorigRightHandMiddle1: 'rightMiddleProximal',
  mixamorigRightHandMiddle2: 'rightMiddleIntermediate',
  mixamorigRightHandMiddle3: 'rightMiddleDistal',
  mixamorigRightHandIndex1: 'rightIndexProximal',
  mixamorigRightHandIndex2: 'rightIndexIntermediate',
  mixamorigRightHandIndex3: 'rightIndexDistal',
  mixamorigRightHandThumb1: 'rightThumbMetacarpal',
  mixamorigRightHandThumb2: 'rightThumbProximal',
  mixamorigRightHandThumb3: 'rightThumbDistal',
  mixamorigLeftUpLeg: 'leftUpperLeg',
  mixamorigLeftLeg: 'leftLowerLeg',
  mixamorigLeftFoot: 'leftFoot',
  mixamorigLeftToeBase: 'leftToes',
  mixamorigRightUpLeg: 'rightUpperLeg',
  mixamorigRightLeg: 'rightLowerLeg',
  mixamorigRightFoot: 'rightFoot',
  mixamorigRightToeBase: 'rightToes',
  Hips: 'hips',
  Spine: 'spine',
  Spine1: 'chest',
  Spine2: 'upperChest',
  Neck: 'neck',
  Neck1: 'neck',
  Head: 'head',
  LeftShoulder: 'leftShoulder',
  LeftArm: 'leftUpperArm',
  LeftForeArm: 'leftLowerArm',
  LeftHand: 'leftHand',
  LeftHandThumb1: 'leftThumbMetacarpal',
  LeftHandThumb2: 'leftThumbProximal',
  LeftHandThumb3: 'leftThumbDistal',
  LeftHandIndex1: 'leftIndexProximal',
  LeftHandIndex2: 'leftIndexIntermediate',
  LeftHandIndex3: 'leftIndexDistal',
  LeftHandMiddle1: 'leftMiddleProximal',
  LeftHandMiddle2: 'leftMiddleIntermediate',
  LeftHandMiddle3: 'leftMiddleDistal',
  LeftHandRing1: 'leftRingProximal',
  LeftHandRing2: 'leftRingIntermediate',
  LeftHandRing3: 'leftRingDistal',
  LeftHandPinky1: 'leftLittleProximal',
  LeftHandPinky2: 'leftLittleIntermediate',
  LeftHandPinky3: 'leftLittleDistal',
  RightShoulder: 'rightShoulder',
  RightArm: 'rightUpperArm',
  RightForeArm: 'rightLowerArm',
  RightHand: 'rightHand',
  RightHandThumb1: 'rightThumbMetacarpal',
  RightHandThumb2: 'rightThumbProximal',
  RightHandThumb3: 'rightThumbDistal',
  RightHandIndex1: 'rightIndexProximal',
  RightHandIndex2: 'rightIndexIntermediate',
  RightHandIndex3: 'rightIndexDistal',
  RightHandMiddle1: 'rightMiddleProximal',
  RightHandMiddle2: 'rightMiddleIntermediate',
  RightHandMiddle3: 'rightMiddleDistal',
  RightHandRing1: 'rightRingProximal',
  RightHandRing2: 'rightRingIntermediate',
  RightHandRing3: 'rightRingDistal',
  RightHandPinky1: 'rightLittleProximal',
  RightHandPinky2: 'rightLittleIntermediate',
  RightHandPinky3: 'rightLittleDistal',
  LeftUpLeg: 'leftUpperLeg',
  LeftLeg: 'leftLowerLeg',
  LeftFoot: 'leftFoot',
  LeftToeBase: 'leftToes',
  RightUpLeg: 'rightUpperLeg',
  RightLeg: 'rightLowerLeg',
  RightFoot: 'rightFoot',
  RightToeBase: 'rightToes',
};

const cycleExpressions: Array<{ name: string; value: number }> = [
  { name: 'happy', value: 1.0 },
  { name: 'relaxed', value: 1.0 },
  { name: 'fun', value: 1.0 },
  { name: 'blink', value: 1.0 },
];

export class CharacterController {
  private loader: GLTFLoader;
  private fbxLoader: FBXLoader;
  private currentVRM: any = null;
  private animationMixer: THREE.AnimationMixer | null = null;
  private currentAction: THREE.AnimationAction | null = null;
  private expressionIndex = 0;
  private expressionChangeTime = 0;
  private readonly EXPRESSION_INTERVAL = 3;

  constructor(private renderer: RendererEngine, private store: GameStore) {
    this.loader = new GLTFLoader();
    this.loader.register((parser) => {
      const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser, {
        materialType: MToonNodeMaterial,
      });
      return new VRMLoaderPlugin(parser, {
        mtoonMaterialPlugin,
      });
    });
    this.fbxLoader = new FBXLoader();

    // Tick
    this.renderer.addTick(this.update);
  }

  getVRM() {
    return this.currentVRM;
  }

  async loadVRM(url: string): Promise<void> {
    const scene = this.renderer.getScene();
    let oldVRM: any = null;

    if (!scene) throw new Error('Renderer not ready');

    try {
      if (this.currentVRM) {
        oldVRM = this.currentVRM;
        this.currentVRM = null;
      }

      const gltf = await this.loader.loadAsync(url);
      const vrm = gltf.userData.vrm;
      if (!vrm) throw new Error('VRM payload missing in file');

      if (oldVRM) {
        try {
          scene.remove(oldVRM.scene);
          oldVRM.dispose?.();
        } catch (err) {
          console.warn('Failed to dispose previous VRM', err);
        }
        oldVRM = null;
      }

      VRMUtils.removeUnnecessaryVertices(gltf.scene);
      VRMUtils.combineSkeletons(gltf.scene);
      VRMUtils.combineMorphs(vrm);
      VRMUtils.rotateVRM0(vrm);

      vrm.scene.traverse((obj: THREE.Object3D) => {
        obj.frustumCulled = false;
      });

      scene.add(vrm.scene);

      this.animationMixer = new THREE.AnimationMixer(vrm.scene);
      this.currentAction = null;
      this.expressionIndex = 0;
      this.expressionChangeTime = 0;
      this.currentVRM = vrm;

      // Fit camera
      this.fitCameraToModel(vrm.scene);

      // UI hint
      this.renderer.getContainer()?.classList.add('has-model');

      this.store.setState({ character: { vrmUrl: url } });
      console.log('VRM model loaded', vrm);
    } catch (error) {
      console.error('Error loading VRM model:', error);
      if (oldVRM && !this.currentVRM) {
        try {
          scene.add(oldVRM.scene);
          this.currentVRM = oldVRM;
        } catch (restoreError) {
          console.error('Error restoring old VRM:', restoreError);
        }
      }
      throw error;
    }
  }

  async loadMixamoAnimation(url: string, motionName?: string): Promise<void> {
    if (!this.currentVRM || !this.animationMixer) {
      console.error('VRM not loaded or mixer missing');
      return;
    }

    const asset = await this.fbxLoader.loadAsync(url);
    let clip = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com');
    if (!clip && asset.animations.length > 0) {
      clip = asset.animations[0];
    }
    if (!clip) {
      throw new Error('No animation clip found in FBX');
    }

    const tracks: THREE.KeyframeTrack[] = [];
    const restRotationInverse = new THREE.Quaternion();
    const parentRestWorldRotation = new THREE.Quaternion();
    const quat = new THREE.Quaternion();

    const hipsBone = asset.getObjectByName('mixamorigHips') || asset.getObjectByName('Hips');
    if (!hipsBone) throw new Error('Hips bone not found in FBX');

    const motionHipsHeight = hipsBone.position.y;
    const vrmHipsHeight = this.currentVRM.humanoid.normalizedRestPose.hips.position[1];
    const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

    clip.tracks.forEach((track) => {
      const [rigName, propertyName] = track.name.split('.');
      const vrmBoneName = animationVRMRigMap[rigName];
      if (!vrmBoneName) return;

      const vrmNodeName = this.currentVRM.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
      const rigNode = asset.getObjectByName(rigName);
      if (!vrmNodeName || !rigNode) return;

      rigNode.getWorldQuaternion(restRotationInverse).invert();
      if (rigNode.parent) {
        rigNode.parent.getWorldQuaternion(parentRestWorldRotation);
      } else {
        parentRestWorldRotation.identity();
      }

      if (track instanceof THREE.QuaternionKeyframeTrack) {
        const values = [...track.values];
        for (let i = 0; i < values.length; i += 4) {
          const flatQuaternion = values.slice(i, i + 4);
          quat.fromArray(flatQuaternion);
          quat.premultiply(parentRestWorldRotation).multiply(restRotationInverse);
          quat.toArray(flatQuaternion);
          for (let j = 0; j < 4; j++) values[i + j] = flatQuaternion[j];
        }
        const adjusted = values.map((v, i) =>
          this.currentVRM.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v,
        );
        tracks.push(
          new THREE.QuaternionKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, adjusted),
        );
      } else if (track instanceof THREE.VectorKeyframeTrack) {
        const adjusted = track.values.map((v, i) =>
          (this.currentVRM.meta?.metaVersion === '0' && i % 3 !== 1 ? -v : v) * hipsPositionScale,
        );
        tracks.push(
          new THREE.VectorKeyframeTrack(`${vrmNodeName}.${propertyName}`, track.times, adjusted),
        );
      }
    });

    const vrmClip = new THREE.AnimationClip(motionName ?? 'vrmAnimation', clip.duration, tracks);
    const newAction = this.animationMixer.clipAction(vrmClip);
    newAction.reset().play();
    if (this.currentAction && this.currentAction !== newAction) {
      this.currentAction.crossFadeTo(newAction, 0.4, false);
    }
    this.currentAction = newAction;
    this.store.setState({ character: { motionName: motionName ?? clip.name } });
  }

  setExpression(name: string, value = 1.0) {
    if (!this.currentVRM?.expressionManager) return;
    const manager = this.currentVRM.expressionManager;
    const presetNames = manager.presetExpressionMap ? Object.keys(manager.presetExpressionMap) : [];
    const customNames = manager.customExpressionMap ? Object.keys(manager.customExpressionMap) : [];
    const allNames = [...presetNames, ...customNames];
    if (!allNames.includes(name)) return;
    allNames.forEach((n) => manager.setValue(n, 0));
    manager.setValue(name, value);
    this.store.setState({ character: { expression: { name, value } } });
  }

  private fitCameraToModel(model: THREE.Object3D) {
    const box = new THREE.Box3().setFromObject(model);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const distance = maxDim * 2;
    const position = new THREE.Vector3(center.x, center.y + size.y * 0.3, center.z + distance);
    this.renderer.setCameraPose(position, center);
  }

  private updateExpressions(delta: number) {
    if (!this.currentVRM?.expressionManager) return;
    this.expressionChangeTime += delta;
    if (this.expressionChangeTime < this.EXPRESSION_INTERVAL) return;
    this.expressionChangeTime = 0;
    const current = cycleExpressions[this.expressionIndex];
    this.setExpression(current.name, current.value);
    this.expressionIndex = (this.expressionIndex + 1) % cycleExpressions.length;
  }

  private update = (delta: number) => {
    if (this.animationMixer) this.animationMixer.update(delta);
    this.updateExpressions(delta);
    if (this.currentVRM) this.currentVRM.update(delta);
  };
}

