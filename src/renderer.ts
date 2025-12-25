import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { MToonMaterialLoaderPlugin, VRMLoaderPlugin, VRMUtils } from '@pixiv/three-vrm';
import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';

let scene: THREE.Scene;
let camera: THREE.PerspectiveCamera;
let renderer: WebGPURenderer | THREE.WebGLRenderer;
let controls: OrbitControls;
let container: HTMLElement;
let currentVRM: any = null; // VRM instance
let loader: GLTFLoader;
let fbxLoader: FBXLoader;
let animationMixer: THREE.AnimationMixer | null = null;
let currentAction: THREE.AnimationAction | null = null;
let clock: THREE.Clock;

// Expression animation
let expressionIndex = 0;
let expressionChangeTime = 0;
const EXPRESSION_CHANGE_INTERVAL = 3.0; // Change expression every 3 seconds
const expressions: Array<{ name: string; value: number; duration?: number }> = [
  { name: 'happy', value: 1.0 },
  { name: 'sad', value: 1.0 },
  { name: 'angry', value: 1.0 },
  { name: 'surprised', value: 1.0 },
  { name: 'aa', value: 1.0 }, // Open mouth
  { name: 'ih', value: 1.0 }, // Smile
  { name: 'ou', value: 1.0 }, // Pout
  { name: 'fun', value: 1.0 },
  { name: 'relaxed', value: 1.0 },
  { name: 'blink', value: 1.0 },
  { name: 'blinkLeft', value: 1.0 },
  { name: 'blinkRight', value: 1.0 },
  { name: 'lookUp', value: 1.0 },
  { name: 'lookDown', value: 1.0 },
  { name: 'lookLeft', value: 1.0 },
  { name: 'lookRight', value: 1.0 },
  { name: 'neutral', value: 0.0 }, // Reset to neutral
];

/**
 * A map from animation rig name to VRM Humanoid bone name
 * Supports both Mixamo (mixamorig*) and Mixion (no prefix) naming conventions
 */
const animationVRMRigMap: { [key: string]: string } = {
  // Mixamo format (with mixamorig prefix)
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
  
  // Mixion format (no prefix, based on provided skeleton structure)
  Hips: 'hips',
  Spine: 'spine',
  Spine1: 'chest',
  Spine2: 'upperChest',
  Neck: 'neck',
  Neck1: 'neck', // Map Neck1 to neck as well
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

export async function initRenderer(): Promise<void> {
  // Get the container element
  container = document.getElementById('canvas-container')!;
  if (!container) {
    console.error('Canvas container not found');
    return;
  }

  // Create scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x87ceeb); // Sky blue background

  // Create camera
  const aspect = container.clientWidth / container.clientHeight;
  camera = new THREE.PerspectiveCamera(50, aspect, 0.1, 1000);
  camera.position.set(0, 1.6, 5);

  // Try to create WebGPU renderer, fallback to WebGL if not supported
  try {
    const webgpuRenderer = new WebGPURenderer({ antialias: true });
    await webgpuRenderer.init();
    renderer = webgpuRenderer;
    console.log('WebGPU renderer initialized');
  } catch (error) {
    console.warn('WebGPU not supported, falling back to WebGL:', error);
    renderer = new THREE.WebGLRenderer({ antialias: true });
  }
  
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  container.appendChild(renderer.domElement);

  // Add orbit controls for camera manipulation
  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.target.set(0, 1.6, 0);
  controls.update();

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
  directionalLight.position.set(1, 1, 1);
  scene.add(directionalLight);

  // Create GLTF loader with VRM plugin
  // Configure for WebGPU compatibility using MToonNodeMaterial
  loader = new GLTFLoader();
  loader.register((parser) => {
    // Use MToonNodeMaterial for WebGPU compatibility
    const mtoonMaterialPlugin = new MToonMaterialLoaderPlugin(parser, {
      materialType: MToonNodeMaterial,
    });
    return new VRMLoaderPlugin(parser, {
      mtoonMaterialPlugin,
    });
  });

  // Create FBX loader for Mixamo animations
  fbxLoader = new FBXLoader();

  // Initialize clock for animation timing
  clock = new THREE.Clock();

  // Setup drag and drop
  setupDragAndDrop();

  // Handle window resize
  window.addEventListener('resize', onWindowResize);

  // Start animation loop
  animate();
}

function onWindowResize(): void {
  if (!container || !camera || !renderer) return;

  const width = container.clientWidth;
  const height = container.clientHeight;

  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);
}

/**
 * Setup drag and drop functionality for VRM files
 */
function setupDragAndDrop(): void {
  if (!container) return;

  // Prevent default drag behaviors
  container.addEventListener('dragover', (event) => {
    event.preventDefault();
    event.stopPropagation();
    container.classList.add('dragover');
  });

  container.addEventListener('dragleave', (event) => {
    event.preventDefault();
    event.stopPropagation();
    container.classList.remove('dragover');
  });

  container.addEventListener('drop', async (event) => {
    event.preventDefault();
    event.stopPropagation();
    container.classList.remove('dragover');

    const files = event.dataTransfer?.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    const fileName = file.name.toLowerCase();
    
    // Create object URL
    const url = URL.createObjectURL(file);
    
    try {
      if (fileName.endsWith('.vrm')) {
        // Load VRM model
        await loadVRM(url);
      } else if (fileName.endsWith('.fbx')) {
        // Load Mixamo animation
        await loadMixamoAnimation(url);
      } else {
        console.warn('Please drop a VRM file (.vrm) or FBX animation file (.fbx)');
        URL.revokeObjectURL(url);
        return;
      }
      // Clean up the object URL after loading
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to load file:', error);
      URL.revokeObjectURL(url);
    }
  });
}

/**
 * Update expressions on the VRM model
 * Cycles through different expressions periodically
 */
/**
 * Update expressions on the VRM model
 * Cycles through different expressions periodically
 * Based on three-vrm-core example: expressions.html
 */
function updateExpressions(delta: number): void {

  if (!currentVRM || !currentVRM.expressionManager) {
    return;
  }

  // Debug: Log expression manager structure on first call
  if (expressionChangeTime === 0 && expressionIndex === 0) {
    console.log('=== Expression Manager Debug ===');
    console.log('Expression Manager:', currentVRM.expressionManager);
    console.log('Expressions:', currentVRM.expressionManager.expressions);
    console.log('Preset expressions:', currentVRM.expressionManager.presetExpressionMap);
    console.log('Custom expressions:', currentVRM.expressionManager.customExpressionMap);
    
    // Try to get expression names using different methods
    const presetNames = currentVRM.expressionManager.presetExpressionMap 
      ? Object.keys(currentVRM.expressionManager.presetExpressionMap) 
      : [];
    const customNames = currentVRM.expressionManager.customExpressionMap 
      ? Object.keys(currentVRM.expressionManager.customExpressionMap) 
      : [];
    const allNames = [...presetNames, ...customNames];
    console.log('All expression names:', allNames);
  }

  expressionChangeTime += delta;

  // Change expression every EXPRESSION_CHANGE_INTERVAL seconds
  if (expressionChangeTime >= EXPRESSION_CHANGE_INTERVAL) {
    expressionChangeTime = 0;

    // Get available expressions from the model
    // According to VRMExpressionManager docs, expressions are stored in:
    // - presetExpressionMap: preset expressions (happy, sad, etc.)
    // - customExpressionMap: custom expressions defined in the model
    const presetExpressions = currentVRM.expressionManager.presetExpressionMap || {};
    const customExpressions = currentVRM.expressionManager.customExpressionMap || {};
    
    // Get all available expression names
    const presetNames = Object.keys(presetExpressions);
    const customNames = Object.keys(customExpressions);
    const allExpressionNames = [...presetNames, ...customNames];
    
    if (allExpressionNames.length === 0) {
      console.warn('⚠️ No expressions available in this VRM model');
      return;
    }

    // Reset all expressions first
    allExpressionNames.forEach((name) => {
      currentVRM.expressionManager.setValue(name, 0);
    });

    // Find the next available expression from our list
    let found = false;
    let attempts = 0;
    while (!found && attempts < expressions.length) {
      const currentExpression = expressions[expressionIndex];
      
      // Check if this expression is available in the model
      if (allExpressionNames.includes(currentExpression.name)) {
        currentVRM.expressionManager.setValue(currentExpression.name, currentExpression.value);
        console.log(`✓ Playing expression: ${currentExpression.name} (value: ${currentExpression.value})`);
        found = true;
      }
      
      // Move to next expression
      expressionIndex = (expressionIndex + 1) % expressions.length;
      attempts++;
    }

    // If no expression from our list is available, try a random one from the model
    if (!found && allExpressionNames.length > 0) {
      const randomExpression = allExpressionNames[Math.floor(Math.random() * allExpressionNames.length)];
      currentVRM.expressionManager.setValue(randomExpression, 1.0);
      console.log(`✓ Playing random expression: ${randomExpression}`);
    }
  }

  // NOTE: According to the official three-vrm example (expressions.html),
  // we should NOT call expressionManager.update() separately.
  // The vrm.update(delta) call in animate() handles all updates including expressions.
  // This is different from three-vrm-core which requires explicit update() call.
}

function animate(): void {
  requestAnimationFrame(animate);
  
  const delta = clock.getDelta();
  
  // Update controls
  if (controls) {
    controls.update();
  }
  
  // Update animation mixer if active
  if (animationMixer) {
    animationMixer.update(delta);
  }
  
  // Update expressions
  updateExpressions(delta);
  
  // Update VRM animation if loaded
  if (currentVRM) {
    currentVRM.update(delta);
  }
  
  renderer.render(scene, camera);
}

/**
 * Load a VRM model from a URL
 * @param url - URL or path to the VRM file
 * @returns Promise that resolves when the VRM is loaded
 */
export async function loadVRM(url: string): Promise<void> {
  if (!scene || !renderer || !loader) {
    console.error('Renderer not initialized. Call initRenderer() first.');
    return;
  }

  let oldVRM: any = null;

  try {
    // Store reference to old VRM before removing
    if (currentVRM) {
      oldVRM = currentVRM;
      currentVRM = null;
    }

    // Load the VRM file
    const gltf = await loader.loadAsync(url);
    
    // Get the VRM instance
    const vrm = gltf.userData.vrm;
    
    if (!vrm) {
      throw new Error('VRM data not found in loaded file');
    }

    // Remove old VRM only after new one is successfully loaded
    if (oldVRM) {
      try {
        scene.remove(oldVRM.scene);
        oldVRM.dispose();
      } catch (disposeError) {
        console.warn('Error disposing old VRM:', disposeError);
      }
      oldVRM = null;
    }

    // Optimize VRM model for better performance
    VRMUtils.removeUnnecessaryVertices(gltf.scene);
    VRMUtils.combineSkeletons(gltf.scene);
    VRMUtils.combineMorphs(vrm);

    // Disable frustum culling for better rendering
    vrm.scene.traverse((obj: THREE.Object3D) => {
      obj.frustumCulled = false;
    });

    // Rotate if the VRM is VRM0.0
    VRMUtils.rotateVRM0(vrm);

    // Add VRM to scene
    scene.add(vrm.scene);

    // Create AnimationMixer for VRM
    animationMixer = new THREE.AnimationMixer(vrm.scene);
    currentAction = null;

    // Reset expression animation
    expressionIndex = 0;
    expressionChangeTime = 0;
    
    // Log available expressions
    if (vrm.expressionManager && vrm.expressionManager.expressions) {
      const availableExpressions = Object.keys(vrm.expressionManager.expressions);
      console.log('Available expressions:', availableExpressions);
    }

    // Adjust camera to fit the model
    const box = new THREE.Box3().setFromObject(vrm.scene);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());
    
    // Check if model has valid size
    if (size.x === 0 && size.y === 0 && size.z === 0) {
      console.warn('Model has zero size, using default camera position');
      camera.position.set(0, 1.6, 5);
      controls.target.set(0, 1.6, 0);
    } else {
      // Position camera to view the model from the front
      // VRM models typically face the negative Z direction
      const maxDim = Math.max(size.x, size.y, size.z);
      const distance = maxDim * 2;
      // Place camera in front of the model (negative Z direction)
      camera.position.set(center.x, center.y + size.y * 0.3, center.z + distance);
      controls.target.copy(center);
    }
    controls.update();

    // Store reference to current VRM
    currentVRM = vrm;

    // Hide drop hint when model is loaded
    if (container) {
      container.classList.add('has-model');
    }

    console.log('VRM model loaded successfully:', vrm);
  } catch (error) {
    console.error('Error loading VRM model:', error);
    
    // Restore old VRM if loading failed
    if (oldVRM && !currentVRM) {
      try {
        scene.add(oldVRM.scene);
        currentVRM = oldVRM;
        console.log('Restored previous VRM model after load failure');
      } catch (restoreError) {
        console.error('Error restoring old VRM:', restoreError);
      }
    }
    
    throw error;
  }
}

/**
 * Load Mixamo animation from FBX file and convert for VRM use
 * Based on official three-vrm example: loadMixamoAnimation.js
 * @param url - URL or path to the FBX animation file
 * @returns Promise that resolves when the animation is loaded and applied
 */
export async function loadMixamoAnimation(url: string): Promise<void> {
  if (!currentVRM || !fbxLoader || !animationMixer) {
    console.error('VRM model not loaded, FBX loader not initialized, or animation mixer not created');
    return;
  }

  try {
    // Load FBX animation
    const asset = await fbxLoader.loadAsync(url);
    
    // Extract the AnimationClip
    // Try to find animation clip (Mixamo uses 'mixamo.com', others might use different names)
    let clip = THREE.AnimationClip.findByName(asset.animations, 'mixamo.com');
    
    // If not found, try to get the first animation clip
    if (!clip && asset.animations && asset.animations.length > 0) {
      clip = asset.animations[0];
      console.log('Using first animation clip:', clip.name);
    }
    
    if (!clip) {
      throw new Error('No animation clip found in FBX file');
    }

    // Convert animation tracks for VRM use
    const tracks: THREE.KeyframeTrack[] = [];
    
    const restRotationInverse = new THREE.Quaternion();
    const parentRestWorldRotation = new THREE.Quaternion();
    const _quatA = new THREE.Quaternion();

    // Adjust with reference to hips height
    // Try to find hips bone (support both Mixamo and Mixion formats)
    const hipsBone = asset.getObjectByName('mixamorigHips') || asset.getObjectByName('Hips');
    if (!hipsBone) {
      throw new Error('Hips bone not found in FBX file (tried mixamorigHips and Hips)');
    }
    
    const motionHipsHeight = hipsBone.position.y;
    const vrmHipsHeight = currentVRM.humanoid.normalizedRestPose.hips.position[1];
    const hipsPositionScale = vrmHipsHeight / motionHipsHeight;

    // Process each track
    clip.tracks.forEach((track) => {
      // Split track name: "mixamorigHips.quaternion" or "Hips.quaternion" -> ["mixamorigHips"/"Hips", "quaternion"]
      const trackSplitted = track.name.split('.');
      const rigName = trackSplitted[0];
      const vrmBoneName = animationVRMRigMap[rigName];
      
      if (!vrmBoneName) {
        return; // Skip unmapped bones
      }

      // Get VRM normalized bone node
      const vrmNodeName = currentVRM.humanoid?.getNormalizedBoneNode(vrmBoneName)?.name;
      const rigNode = asset.getObjectByName(rigName);

      if (vrmNodeName != null && rigNode != null) {
        const propertyName = trackSplitted[1];

        // Store rotations of rest-pose
        rigNode.getWorldQuaternion(restRotationInverse).invert();
        if (rigNode.parent) {
          rigNode.parent.getWorldQuaternion(parentRestWorldRotation);
        } else {
          parentRestWorldRotation.identity();
        }

        if (track instanceof THREE.QuaternionKeyframeTrack) {
          // Retarget rotation of mixamoRig to NormalizedBone
          const values = [...track.values]; // Copy values array
          
          for (let i = 0; i < values.length; i += 4) {
            const flatQuaternion = values.slice(i, i + 4);
            _quatA.fromArray(flatQuaternion);

            // Apply rest pose transformation:
            // parent rest world rotation * track rotation * rest world rotation inverse
            _quatA
              .premultiply(parentRestWorldRotation)
              .multiply(restRotationInverse);

            _quatA.toArray(flatQuaternion);
            
            // Copy back to values array
            for (let j = 0; j < 4; j++) {
              values[i + j] = flatQuaternion[j];
            }
          }

          // Handle VRM 0.0 coordinate system (invert Y and Z for quaternion)
          const adjustedValues = values.map((v, i) => 
            currentVRM.meta?.metaVersion === '0' && i % 2 === 0 ? -v : v
          );

          tracks.push(
            new THREE.QuaternionKeyframeTrack(
              `${vrmNodeName}.${propertyName}`,
              track.times,
              adjustedValues,
            ),
          );

        } else if (track instanceof THREE.VectorKeyframeTrack) {
          // Retarget position (usually for hips)
          const adjustedValues = track.values.map((v, i) => 
            (currentVRM.meta?.metaVersion === '0' && i % 3 !== 1 ? -v : v) * hipsPositionScale
          );
          
          tracks.push(
            new THREE.VectorKeyframeTrack(
              `${vrmNodeName}.${propertyName}`,
              track.times,
              adjustedValues,
            ),
          );
        }
      }
    });

    // Create new animation clip for VRM
    const vrmClip = new THREE.AnimationClip('vrmAnimation', clip.duration, tracks);

    // Apply animation
    const newAction = animationMixer.clipAction(vrmClip);
    newAction.reset().play();

    // Cross-fade from previous animation if exists
    if (currentAction && currentAction !== newAction) {
      currentAction.crossFadeTo(newAction, 0.5, false);
    }

    currentAction = newAction;

    console.log('Mixamo animation loaded and applied successfully:', tracks.length, 'tracks');
  } catch (error) {
    console.error('Error loading Mixamo animation:', error);
    throw error;
  }
}

/**
 * Get the current VRM instance
 * @returns Current VRM instance or null
 */
export function getCurrentVRM(): any {
  return currentVRM;
}

