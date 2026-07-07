import * as THREE from 'three';

let scene, camera, renderer;
let avatarGroup;
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
    shoulderZ: -0.6,
    armX: -1.2,
    armY: -0.6,
    forearmX: 0.3
  },
  'exp-desktop-folder': { // Top-Right ("Experience's")
    shoulderZ: 0.6,
    armX: -1.2,
    armY: 0.6,
    forearmX: 0.3
  },
  'comp-desktop-folder': { // Bottom-Left ("Competencie's")
    shoulderZ: -0.4,
    armX: -0.8,
    armY: -0.5,
    forearmX: 0.25
  },
  'proj-desktop-folder': { // Bottom-Right ("Project's")
    shoulderZ: 0.4,
    armX: -0.8,
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

function buildProceduralAvatar() {
  avatarGroup = new THREE.Group();

  // Materials
  const chromeMaterial = new THREE.MeshStandardMaterial({
    color: 0x1c1e30,
    roughness: 0.15,
    metalness: 0.85
  });
  const neonPurpleMaterial = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
  const neonCyanMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffd6 });

  // 1. Spine / Torso
  const spineGeometry = new THREE.CylinderGeometry(0.12, 0.16, 0.7, 16);
  const spineMesh = new THREE.Mesh(spineGeometry, chromeMaterial);
  spineMesh.position.set(0, 0, 0);
  avatarGroup.add(spineMesh);
  spine = spineMesh;

  // Chest Plate / Shoulder Connector
  const chestGeometry = new THREE.BoxGeometry(0.48, 0.12, 0.16);
  const chestMesh = new THREE.Mesh(chestGeometry, chromeMaterial);
  chestMesh.position.set(0, 0.32, 0);
  avatarGroup.add(chestMesh);

  // 2. Right Arm Group (rotates from the right shoulder joint)
  const armPivot = new THREE.Group();
  armPivot.position.set(0.26, 0.32, 0);
  avatarGroup.add(armPivot);
  rightArm = armPivot; // Bind rightArm reference

  // Right Upper Arm Mesh
  const upperArmGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.38, 16);
  const upperArmMesh = new THREE.Mesh(upperArmGeometry, chromeMaterial);
  upperArmMesh.position.set(0, -0.19, 0);
  armPivot.add(upperArmMesh);

  // Right Elbow Joint
  const elbowGeometry = new THREE.SphereGeometry(0.05, 16, 16);
  const elbowMesh = new THREE.Mesh(elbowGeometry, neonPurpleMaterial);
  elbowMesh.position.set(0, -0.38, 0);
  armPivot.add(elbowMesh);

  // Right Forearm Group (rotates relative to upper arm)
  const forearmPivot = new THREE.Group();
  forearmPivot.position.set(0, -0.38, 0);
  armPivot.add(forearmPivot);
  rightForeArm = forearmPivot; // Bind rightForeArm reference

  // Right Forearm Mesh
  const forearmGeometry = new THREE.CylinderGeometry(0.038, 0.038, 0.34, 16);
  const forearmMesh = new THREE.Mesh(forearmGeometry, chromeMaterial);
  forearmMesh.position.set(0, -0.17, 0);
  forearmPivot.add(forearmMesh);

  // Hand Mesh
  const handGeometry = new THREE.SphereGeometry(0.04, 16, 16);
  const handMesh = new THREE.Mesh(handGeometry, chromeMaterial);
  handMesh.position.set(0, -0.34, 0);
  forearmPivot.add(handMesh);

  // Pointing Finger Cone (Glows neon cyan)
  const fingerGeometry = new THREE.ConeGeometry(0.015, 0.1, 16);
  const fingerMesh = new THREE.Mesh(fingerGeometry, neonCyanMaterial);
  fingerMesh.position.set(0, -0.4, 0.02);
  fingerMesh.rotation.x = -Math.PI / 4; // Point forward/downwards
  forearmPivot.add(fingerMesh);

  // 3. Neck
  const neckGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16);
  const neckMesh = new THREE.Mesh(neckGeometry, chromeMaterial);
  neckMesh.position.set(0, 0.44, 0);
  avatarGroup.add(neckMesh);
  neck = neckMesh;

  // 4. Head Group (rotates from neck top)
  const headPivot = new THREE.Group();
  headPivot.position.set(0, 0.52, 0);
  avatarGroup.add(headPivot);
  head = headPivot;

  // Head Sphere
  const headGeometry = new THREE.SphereGeometry(0.15, 32, 32);
  const headMesh = new THREE.Mesh(headGeometry, chromeMaterial);
  headPivot.add(headMesh);

  // Cyber Helmet Visor (Glows neon cyan)
  const visorGeometry = new THREE.SphereGeometry(0.152, 32, 16, 0, Math.PI * 2, Math.PI / 3, Math.PI / 3);
  const visorMesh = new THREE.Mesh(visorGeometry, neonCyanMaterial);
  visorMesh.position.set(0, 0, 0.01);
  headPivot.add(visorMesh);

  // Left & Right Eyes (Neon Purple)
  const eyeGeometry = new THREE.SphereGeometry(0.02, 16, 16);
  const leftEyeMesh = new THREE.Mesh(eyeGeometry, neonPurpleMaterial);
  leftEyeMesh.position.set(-0.05, 0.03, 0.13);
  headPivot.add(leftEyeMesh);
  leftEye = leftEyeMesh;

  const rightEyeMesh = new THREE.Mesh(eyeGeometry, neonPurpleMaterial);
  rightEyeMesh.position.set(0.05, 0.03, 0.13);
  headPivot.add(rightEyeMesh);
  rightEye = rightEyeMesh;

  // Lower model down slightly
  avatarGroup.position.set(0, -0.65, 0);
  scene.add(avatarGroup);
}

function initAvatar() {
  const canvas = document.getElementById('avatar-canvas');
  if (!canvas || isInitialized) return;

  // Scene setup
  scene = new THREE.Scene();

  // Camera setup
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 0.25, 2.3); // Focused on chest and head

  // Renderer setup
  renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    alpha: true,
    antialias: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  // Lights setup
  const ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
  scene.add(ambientLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
  dirLight.position.set(2, 4, 5);
  scene.add(dirLight);

  const rimLight = new THREE.DirectionalLight(0xa855f7, 2.0); // Neon purple back light
  rimLight.position.set(-2, 2, -3);
  scene.add(rimLight);

  const fillLight = new THREE.DirectionalLight(0x00ffd6, 1.5); // Neon cyan fill light
  fillLight.position.set(-3, 0, 3);
  scene.add(fillLight);

  // Build the procedural 3D cyber-avatar
  buildProceduralAvatar();

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
  if (rightArm && rightForeArm) {
    rightArm.rotation.z = THREE.MathUtils.lerp(rightArm.rotation.z, currentTargetPose.shoulderZ, 0.08);
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
  avatarGroup = null;
  isInitialized = false;
}

// Expose Avatar Module globally
window.AvatarModule = {
  init: initAvatar,
  destroy: destroyAvatar
};

export { initAvatar, destroyAvatar };
