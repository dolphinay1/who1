import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let neck, head, spine, leftEye, rightEye;
let rightShoulder, rightArm, rightForeArm, rightHand;
let animationFrameId = null;
let isInitialized = false;
let isPlaceholder = false;

// Pose presets tailored for standard Ready Player Me (RPM) skeletal structure
const idlePose = {
  shoulderZ: 0,
  armX: 0.1,
  armY: 0.1,
  armZ: -1.3, // Arm pointing down at side
  forearmY: 0.15
};

const pointingPoses = {
  'desktop-folder': { // Top-Left ("Who is Yunus?")
    shoulderZ: 0.1,
    armX: 0.3,
    armY: -0.8, // Brought forward
    armZ: -0.3, // Raised up
    forearmY: -0.2
  },
  'exp-desktop-folder': { // Top-Right ("Experience's")
    shoulderZ: 0.1,
    armX: -0.3,
    armY: -0.8, // Brought forward
    armZ: -0.3, // Raised up
    forearmY: -0.2
  },
  'comp-desktop-folder': { // Bottom-Left ("Competencie's")
    shoulderZ: 0.05,
    armX: 0.2,
    armY: -0.6,
    armZ: -0.6,
    forearmY: -0.15
  },
  'proj-desktop-folder': { // Bottom-Right ("Project's")
    shoulderZ: 0.05,
    armX: -0.2,
    armY: -0.6,
    armZ: -0.6,
    forearmY: -0.15
  }
};

let currentTargetPose = { ...idlePose };
const mouse = { x: 0, y: 0 };

function onMouseMove(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function onFolderHover(event) {
  const folderId = event.currentTarget.id;
  if (pointingPoses[folderId]) {
    currentTargetPose = pointingPoses[folderId];
  }
}

function onFolderLeave() {
  currentTargetPose = idlePose;
}

function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function createPlaceholderAvatar() {
  isPlaceholder = true;
  model = new THREE.Group();

  // Futuristic wireframe holographic materials
  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x00ffd6,
    wireframe: true,
    transparent: true,
    opacity: 0.4
  });
  const jointMaterial = new THREE.MeshBasicMaterial({
    color: 0xa855f7,
    wireframe: true,
    transparent: true,
    opacity: 0.6
  });

  // Torso / Spine
  const spineGeo = new THREE.CylinderGeometry(0.15, 0.2, 0.7, 8);
  const spineMesh = new THREE.Mesh(spineGeo, wireframeMaterial);
  model.add(spineMesh);
  spine = spineMesh;

  // Neck
  const neckGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.15, 8);
  const neckMesh = new THREE.Mesh(neckGeo, wireframeMaterial);
  neckMesh.position.set(0, 0.42, 0);
  model.add(neckMesh);
  neck = neckMesh;

  // Head
  const headGeo = new THREE.SphereGeometry(0.16, 12, 12);
  const headMesh = new THREE.Mesh(headGeo, wireframeMaterial);
  headMesh.position.set(0, 0.56, 0);
  model.add(headMesh);
  head = headMesh;

  // Eyes (Holographic glowing spheres)
  const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8);
  const leftEyeMesh = new THREE.Mesh(eyeGeo, jointMaterial);
  leftEyeMesh.position.set(-0.06, 0.58, 0.12);
  model.add(leftEyeMesh);
  leftEye = leftEyeMesh;

  const rightEyeMesh = new THREE.Mesh(eyeGeo, jointMaterial);
  rightEyeMesh.position.set(0.06, 0.58, 0.12);
  model.add(rightEyeMesh);
  rightEye = rightEyeMesh;

  // Right Arm Pivot
  const armPivot = new THREE.Group();
  armPivot.position.set(0.25, 0.3, 0);
  model.add(armPivot);
  rightArm = armPivot;

  const upperArmGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.35, 8);
  const upperArmMesh = new THREE.Mesh(upperArmGeo, wireframeMaterial);
  upperArmMesh.position.set(0, -0.17, 0);
  armPivot.add(upperArmMesh);

  // Forearm Pivot
  const forearmPivot = new THREE.Group();
  forearmPivot.position.set(0, -0.35, 0);
  armPivot.add(forearmPivot);
  rightForeArm = forearmPivot;

  const forearmGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.32, 8);
  const forearmMesh = new THREE.Mesh(forearmGeo, wireframeMaterial);
  forearmMesh.position.set(0, -0.16, 0);
  forearmPivot.add(forearmMesh);

  const handGeo = new THREE.SphereGeometry(0.035, 8, 8);
  const handMesh = new THREE.Mesh(handGeo, jointMaterial);
  handMesh.position.set(0, -0.32, 0);
  forearmPivot.add(handMesh);

  // Lower model down
  model.position.set(0, -0.65, 0);
  scene.add(model);
}

function initAvatar() {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas || isInitialized) return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.25, 2.3);

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(2, 4, 5);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xa855f7, 2.0); // purple rim
  rimLight.position.set(-2, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x00ffd6, 1.5); // cyan fill
  fillLight.position.set(-3, 0, 3);
  scene.add(fillLight);

  // Try loading local avatar.glb
  const loader = new GLTFLoader();
  loader.load(
    './space/avatar.glb',
    (gltf) => {
      isPlaceholder = false;
      model = gltf.scene;
      model.position.set(0, -1.6, 0);
      model.scale.set(1.05, 1.05, 1.05);
      scene.add(model);

      // Locate RPM bones
      model.traverse((child) => {
        if (child.isBone) {
          const name = child.name.toLowerCase();
          if (name.includes('neck')) neck = child;
          if (name.includes('head') && !name.includes('forehead')) head = child;
          if (name.includes('spine')) spine = child;
          if (name.includes('lefteye')) leftEye = child;
          if (name.includes('righteye')) rightEye = child;
          if (name.includes('rightshoulder')) rightShoulder = child;
          if (name.includes('rightarm')) rightArm = child;
          if (name.includes('rightforearm')) rightForeArm = child;
          if (name.includes('righthand')) rightHand = child;
        }
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
    },
    undefined,
    (error) => {
      console.warn('avatar.glb not found at src/space/avatar.glb. Loading holographic 3D wireframe placeholder...', error);
      createPlaceholderAvatar();
    }
  );

  // Bind folder hover listeners
  const folders = document.querySelectorAll('.desktop-folder-item');
  folders.forEach(folder => {
    folder.addEventListener('mouseenter', onFolderHover);
    folder.addEventListener('mouseleave', onFolderLeave);
  });

  isInitialized = true;
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onWindowResize);

  animate();
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const time = Date.now() * 0.0015;

  // 1. Breathing animation
  if (spine) {
    spine.rotation.z = Math.sin(time) * 0.012;
    spine.rotation.y = Math.cos(time * 0.5) * 0.008;
  }

  // 2. Mouse gaze tracking (Neck & Head and Eyes look at cursor)
  if (neck) {
    const targetNeckY = mouse.x * (isPlaceholder ? 0.42 : 0.55); // Rotates neck
    const targetNeckX = -mouse.y * (isPlaceholder ? 0.32 : 0.4);
    neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetNeckY, 0.08);
    neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, targetNeckX, 0.08);
  }
  if (leftEye && rightEye) {
    const targetEyeY = mouse.x * 0.28;
    const targetEyeX = -mouse.y * 0.22;
    leftEye.rotation.y = THREE.MathUtils.lerp(leftEye.rotation.y, targetEyeY, 0.12);
    leftEye.rotation.x = THREE.MathUtils.lerp(leftEye.rotation.x, targetEyeX, 0.12);
    rightEye.rotation.y = THREE.MathUtils.lerp(rightEye.rotation.y, targetEyeY, 0.12);
    rightEye.rotation.x = THREE.MathUtils.lerp(rightEye.rotation.x, targetEyeX, 0.12);
  }

  // 3. Right arm point rotation interpolation
  if (rightArm && rightForeArm) {
    if (isPlaceholder) {
      // Placeholder specific bone rotation mappings
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, currentTargetPose.shoulderZ, 0.08);
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, currentTargetPose.armX, 0.08);
      rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, currentTargetPose.armY, 0.08);
      rightForeArm.rotation.x = THREE.MathUtils.lerp(rightForeArm.rotation.x, currentTargetPose.forearmX, 0.08);
    } else {
      // RPM anatomical skeleton bone rotation mappings
      rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, currentTargetPose.armX, 0.08);
      rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, currentTargetPose.armY, 0.08);
      rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, currentTargetPose.armZ, 0.08);
      rightForeArm.rotation.y = THREE.MathUtils.lerp(rightForeArm.rotation.y, currentTargetPose.forearmY, 0.08);
    }
  }

  renderer.render(scene, camera);
}

function destroyAvatar() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('resize', onWindowResize);

  const folders = document.querySelectorAll('.desktop-folder-item');
  folders.forEach(folder => {
    folder.removeEventListener('mouseenter', onFolderHover);
    folder.removeEventListener('mouseleave', onFolderLeave);
  });

  if (renderer) {
    renderer.dispose();
    renderer = null;
  }

  scene = null;
  camera = null;
  model = null;
  isInitialized = false;
}

// Expose Avatar Module globally
window.AvatarModule = {
  init: initAvatar,
  destroy: destroyAvatar
};

export { initAvatar, destroyAvatar };
