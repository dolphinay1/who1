import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let scene, camera, renderer, model;
let neck, head, spine, leftEye, rightEye;
let rightShoulder, rightArm, rightForeArm, rightHand;
let animationFrameId = null;
let isInitialized = false;

// Target and active poses for interpolation
const idlePose = {
  shoulderZ: 0.1,
  armX: 0.3,
  armY: 0.1,
  forearmX: 0.4
};

const pointingPoses = {
  'desktop-folder': { // Top-Left ("Who is Yunus?")
    shoulderZ: -0.5,
    armX: -1.3,
    armY: -0.6,
    forearmX: 0.3
  },
  'exp-desktop-folder': { // Top-Right ("Experience's")
    shoulderZ: 0.5,
    armX: -1.3,
    armY: 0.6,
    forearmX: 0.3
  },
  'comp-desktop-folder': { // Bottom-Left ("Competencie's")
    shoulderZ: -0.35,
    armX: -0.9,
    armY: -0.5,
    forearmX: 0.25
  },
  'proj-desktop-folder': { // Bottom-Right ("Project's")
    shoulderZ: 0.35,
    armX: -0.9,
    armY: 0.5,
    forearmX: 0.25
  }
};

let currentTargetPose = { ...idlePose };
const mouse = { x: 0, y: 0 };

function onMouseMove(event) {
  // Normalize cursor position from -1 to 1
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

function initAvatar() {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas || isInitialized) return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.25, 2.5); // Focused on chest and head

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;

  // Lights setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
  dirLight.position.set(2, 4, 5);
  dirLight.castShadow = true;
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xa855f7, 1.5); // Neon purple back light
  rimLight.position.set(-2, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x00ffd6, 1.0); // Neon cyan fill light
  fillLight.position.set(-3, 0, 3);
  scene.add(fillLight);

  // Load avatar GLB
  const loader = new GLTFLoader();
  const avatarUrl = 'https://models.readyplayer.me/63ac7498c199859f143715c0.glb'; // Default public RPM avatar

  loader.load(
    avatarUrl,
    (gltf) => {
      model = gltf.scene;
      
      // Position model centered and slightly lowered
      model.position.set(0, -1.58, 0);
      model.scale.set(1.08, 1.08, 1.08);
      scene.add(model);

      // Locate skeletal bones
      model.traverse((child) => {
        if (child.isBone) {
          if (child.name.includes('Neck')) neck = child;
          if (child.name.includes('Head')) head = child;
          if (child.name.includes('Spine')) spine = child;
          if (child.name.includes('LeftEye')) leftEye = child;
          if (child.name.includes('RightEye')) rightEye = child;
          if (child.name.includes('RightShoulder')) rightShoulder = child;
          if (child.name.includes('RightArm')) rightArm = child;
          if (child.name.includes('RightForeArm')) rightForeArm = child;
          if (child.name.includes('RightHand')) rightHand = child;
        }
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });

      // Bind folder hover listeners
      const folders = document.querySelectorAll('.desktop-folder-item');
      folders.forEach(folder => {
        folder.addEventListener('mouseenter', onFolderHover);
        folder.addEventListener('mouseleave', onFolderLeave);
      });

      isInitialized = true;
      animate();
    },
    undefined,
    (error) => {
      console.error('An error happened loading 3D avatar GLB:', error);
    }
  );

  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('resize', onWindowResize);
}

function animate() {
  animationFrameId = requestAnimationFrame(animate);

  const time = Date.now() * 0.0015;

  // 1. Idle Breathing Animation (Subtle rotation adjustments on spine/shoulder)
  if (spine) {
    spine.rotation.z = Math.sin(time) * 0.015;
    spine.rotation.y = Math.cos(time * 0.5) * 0.01;
  }

  // 2. Mouse Tracking (Neck, Head, and Eyes follow cursor)
  if (neck) {
    const targetNeckY = mouse.x * 0.42; // Up to ~24 degrees left/right
    const targetNeckX = -mouse.y * 0.32; // Up to ~18 degrees up/down
    neck.rotation.y = THREE.MathUtils.lerp(neck.rotation.y, targetNeckY, 0.08);
    neck.rotation.x = THREE.MathUtils.lerp(neck.rotation.x, targetNeckX, 0.08);
  }
  if (leftEye && rightEye) {
    const targetEyeY = mouse.x * 0.22;
    const targetEyeX = -mouse.y * 0.18;
    leftEye.rotation.y = THREE.MathUtils.lerp(leftEye.rotation.y, targetEyeY, 0.12);
    leftEye.rotation.x = THREE.MathUtils.lerp(leftEye.rotation.x, targetEyeX, 0.12);
    rightEye.rotation.y = THREE.MathUtils.lerp(rightEye.rotation.y, targetEyeY, 0.12);
    rightEye.rotation.x = THREE.MathUtils.lerp(rightEye.rotation.x, targetEyeX, 0.12);
  }

  // 3. Folder Pointing arm interpolation
  if (rightShoulder && rightArm && rightForeArm) {
    rightShoulder.rotation.z = THREE.MathUtils.lerp(rightShoulder.rotation.z, currentTargetPose.shoulderZ, 0.08);
    rightArm.rotation.x = THREE.MathUtils.lerp(rightArm.rotation.x, currentTargetPose.armX, 0.08);
    rightArm.rotation.y = THREE.MathUtils.lerp(rightArm.rotation.y, currentTargetPose.armY, 0.08);
    rightForeArm.rotation.x = THREE.MathUtils.lerp(rightForeArm.rotation.x, currentTargetPose.forearmX, 0.08);
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
