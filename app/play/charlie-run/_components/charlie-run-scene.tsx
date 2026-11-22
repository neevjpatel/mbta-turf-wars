"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { createCharlieRunTrain, type CharlieRunLine } from "./charlie-run-train-models";

export default function CharlieRunScene() {
  const mountRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const skyColor = new THREE.Color("#8faab3");
    scene.background = skyColor;
    scene.fog = new THREE.Fog(skyColor, 55, 155);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 220);
    camera.position.set(0, 7, 13);
    camera.lookAt(0, 0, -15);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight("#dce7e4", "#302e2b", 2.1));
    const sunlight = new THREE.DirectionalLight("#fff0d2", 2.4);
    sunlight.position.set(-12, 24, 18);
    scene.add(sunlight);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: "#3c4140", roughness: 1 });
    const bedMaterial = new THREE.MeshStandardMaterial({ color: "#62594e", roughness: 1 });
    const sleeperMaterial = new THREE.MeshStandardMaterial({ color: "#463b32", roughness: 1 });
    const railMaterial = new THREE.MeshStandardMaterial({ color: "#b8c2c2", metalness: 0.78, roughness: 0.26 });
    const hoodieMaterial = new THREE.MeshStandardMaterial({ color: "#df4938", roughness: 0.84 });
    const pantsMaterial = new THREE.MeshStandardMaterial({ color: "#26364a", roughness: 0.92 });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: "#bd805f", roughness: 0.9 });
    const hairMaterial = new THREE.MeshStandardMaterial({ color: "#30241e", roughness: 1 });
    const packMaterial = new THREE.MeshStandardMaterial({ color: "#e19b33", roughness: 0.9 });
    const packTrimMaterial = new THREE.MeshStandardMaterial({ color: "#814626", roughness: 0.95 });
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: "#e7e1d5", roughness: 0.8 });
    const shadowMaterial = new THREE.MeshBasicMaterial({ color: "#161616", transparent: true, opacity: 0.34, depthWrite: false });
    const trainScale = 1.25;
    const trackRunLength = 170 * trainScale;
    const trackCenterZ = 17 - trackRunLength / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(240 * trainScale, 220 * trainScale), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.2, -80);
    scene.add(floor);

    const trackSpacing = 4.2 * trainScale;
    const trackCenters = [-trackSpacing, 0, trackSpacing];
    let currentLane = 1;
    let targetLaneX = trackCenters[currentLane];
    const bedGeometry = new THREE.BoxGeometry(3.5 * trainScale, 0.22 * trainScale, trackRunLength);
    const sleeperGeometry = new THREE.BoxGeometry(3.12 * trainScale, 0.15 * trainScale, 0.48 * trainScale);
    const railGeometry = new THREE.BoxGeometry(0.13 * trainScale, 0.2 * trainScale, trackRunLength);
    const geometries: THREE.BufferGeometry[] = [floor.geometry, bedGeometry, sleeperGeometry, railGeometry];
    const materials: THREE.Material[] = [floorMaterial, bedMaterial, sleeperMaterial, railMaterial, hoodieMaterial, pantsMaterial, skinMaterial, hairMaterial, packMaterial, packTrimMaterial, shoeMaterial, shadowMaterial];
    const sleeperCount = 64;
    const sleeperInstances: THREE.InstancedMesh[] = [];
    const movingTrains: Array<{ group: THREE.Group; speed: number; dispose: () => void }> = [];
    const transform = new THREE.Object3D();

    for (const centerX of trackCenters) {
      const bed = new THREE.Mesh(bedGeometry, bedMaterial);
      bed.position.set(centerX, -0.02 * trainScale, trackCenterZ);
      scene.add(bed);

      const sleepers = new THREE.InstancedMesh(sleeperGeometry, sleeperMaterial, sleeperCount);
      for (let index = 0; index < sleeperCount; index += 1) {
        transform.position.set(centerX, 0.12 * trainScale, 12 - index * 2.55 * trainScale);
        transform.updateMatrix();
        sleepers.setMatrixAt(index, transform.matrix);
      }
      sleepers.instanceMatrix.needsUpdate = true;
      scene.add(sleepers);
      sleeperInstances.push(sleepers);

      for (const railOffset of [-0.78 * trainScale, 0.78 * trainScale]) {
        const rail = new THREE.Mesh(railGeometry, railMaterial);
        rail.position.set(centerX + railOffset, 0.28 * trainScale, trackCenterZ);
        scene.add(rail);
      }
    }

    const createTrain = (laneIndex: number) => {
      const lines: CharlieRunLine[] = ["orange", "blue", "red"];
      const model = createCharlieRunTrain(lines[Math.floor(Math.random() * lines.length)]);
      model.group.scale.setScalar(trainScale);
      model.group.position.set(trackCenters[laneIndex], 0.38 * trainScale - 0.48 * trainScale, -132);
      scene.add(model.group);
      movingTrains.push({ group: model.group, speed: 17 + Math.random() * 4, dispose: model.dispose });
    };

    const runner = new THREE.Group();
    runner.position.set(0, 0.19, 2);
    runner.scale.setScalar(1.5);
    runner.rotation.x = -0.19;
    scene.add(runner);
    const upperBody = new THREE.Group();
    upperBody.position.y = 0.78;
    runner.add(upperBody);

    const backpackShape = new THREE.Shape();
    backpackShape.moveTo(-0.22, 0);
    backpackShape.lineTo(0.22, 0);
    backpackShape.quadraticCurveTo(0.27, 0, 0.27, 0.07);
    backpackShape.lineTo(0.27, 0.47);
    backpackShape.quadraticCurveTo(0.27, 0.55, 0.19, 0.55);
    backpackShape.lineTo(-0.19, 0.55);
    backpackShape.quadraticCurveTo(-0.27, 0.55, -0.27, 0.47);
    backpackShape.lineTo(-0.27, 0.07);
    backpackShape.quadraticCurveTo(-0.27, 0, -0.22, 0);
    const backpackGeometry = new THREE.ExtrudeGeometry(backpackShape, {
      depth: 0.16,
      bevelEnabled: true,
      bevelSegments: 3,
      bevelSize: 0.018,
      bevelThickness: 0.018,
      curveSegments: 8,
    });

    const characterParts: Array<{ geometry: THREE.BufferGeometry; material: THREE.Material; position: [number, number, number]; rotation?: [number, number, number]; scale?: [number, number, number] }> = [
      { geometry: new THREE.CircleGeometry(0.88, 32), material: shadowMaterial, position: [0, 0.01, 0.18], rotation: [-Math.PI / 2, 0, 0], scale: [1, 0.5, 1] },
      { geometry: new THREE.CapsuleGeometry(0.31, 0.67, 5, 10), material: hoodieMaterial, position: [0, 1.2, 0] },
      { geometry: backpackGeometry, material: packMaterial, position: [0, 1.05, 0.24] },
      { geometry: new THREE.BoxGeometry(0.32, 0.2, 0.06), material: packTrimMaterial, position: [0, 1.2, 0.44] },
      { geometry: new THREE.BoxGeometry(0.35, 0.07, 0.07), material: packMaterial, position: [0, 1.35, 0.45] },
      { geometry: new THREE.BoxGeometry(0.045, 0.48, 0.035), material: packTrimMaterial, position: [-0.21, 1.3, 0.455], rotation: [0, 0, -0.06] },
      { geometry: new THREE.BoxGeometry(0.045, 0.48, 0.035), material: packTrimMaterial, position: [0.21, 1.3, 0.455], rotation: [0, 0, 0.06] },
      { geometry: new THREE.BoxGeometry(0.1, 0.19, 0.18), material: packTrimMaterial, position: [-0.27, 1.14, 0.32] },
      { geometry: new THREE.BoxGeometry(0.1, 0.19, 0.18), material: packTrimMaterial, position: [0.27, 1.14, 0.32] },
      { geometry: new THREE.TorusGeometry(0.09, 0.022, 6, 12, Math.PI), material: packTrimMaterial, position: [0, 1.63, 0.32] },
      { geometry: new THREE.CylinderGeometry(0.105, 0.105, 0.18, 12), material: skinMaterial, position: [0, 1.76, 0] },
      { geometry: new THREE.SphereGeometry(0.25, 16, 12), material: skinMaterial, position: [0, 1.99, 0] },
      { geometry: new THREE.SphereGeometry(0.255, 16, 8), material: hairMaterial, position: [0, 2.1, 0.015], scale: [1, 0.54, 1.04] },
    ];

    let groundShadow: THREE.Mesh | null = null;
    for (const part of characterParts) {
      geometries.push(part.geometry);
      const mesh = new THREE.Mesh(part.geometry, part.material);
      const isGroundShadow = part.material === shadowMaterial;
      mesh.position.set(part.position[0], part.position[1] - (isGroundShadow ? 0 : upperBody.position.y), part.position[2]);
      if (part.rotation) mesh.rotation.set(...part.rotation);
      if (part.scale) mesh.scale.set(...part.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      if (isGroundShadow) {
        mesh.position.set(0, runner.position.y + part.position[1], runner.position.z + part.position[2]);
        mesh.scale.set(1.5, 0.75, 1.5);
        scene.add(mesh);
        groundShadow = mesh;
      } else {
        upperBody.add(mesh);
      }
    }

    const makeLimb = (position: [number, number, number], material: THREE.Material, geometry: THREE.BufferGeometry, geometryPosition: [number, number, number], parent: THREE.Group = runner) => {
      geometries.push(geometry);
      const pivot = new THREE.Group();
      pivot.position.set(...position);
      const limb = new THREE.Mesh(geometry, material);
      limb.position.set(...geometryPosition);
      limb.castShadow = true;
      pivot.add(limb);
      parent.add(pivot);
      return pivot;
    };

    const makeRunningLeg = (x: number) => {
      const hip = new THREE.Group();
      hip.position.set(x, 0.86, 0);
      const thighGeometry = new THREE.CapsuleGeometry(0.125, 0.34, 4, 8);
      const thigh = new THREE.Mesh(thighGeometry, pantsMaterial);
      thigh.position.y = -0.2;
      thigh.castShadow = true;
      hip.add(thigh);
      geometries.push(thighGeometry);

      const knee = new THREE.Group();
      knee.position.y = -0.43;
      hip.add(knee);
      const shinGeometry = new THREE.CapsuleGeometry(0.105, 0.25, 4, 8);
      const shin = new THREE.Mesh(shinGeometry, pantsMaterial);
      shin.position.y = -0.18;
      shin.castShadow = true;
      knee.add(shin);
      geometries.push(shinGeometry);

      const shoeGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.46);
      const shoe = new THREE.Mesh(shoeGeometry, shoeMaterial);
      shoe.position.set(0, -0.36, -0.08);
      shoe.castShadow = true;
      knee.add(shoe);
      geometries.push(shoeGeometry);
      runner.add(hip);
      return { hip, knee };
    };

    const leftLeg = makeRunningLeg(-0.17);
    const rightLeg = makeRunningLeg(0.17);

    const leftArm = makeLimb([-0.41, 0.7, 0], hoodieMaterial, new THREE.CapsuleGeometry(0.095, 0.48, 4, 8), [0, -0.24, 0], upperBody);
    const rightArm = makeLimb([0.41, 0.7, 0], hoodieMaterial, new THREE.CapsuleGeometry(0.095, 0.48, 4, 8), [0, -0.24, 0], upperBody);
    const leftHand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), skinMaterial);
    leftHand.position.set(0, -0.53, 0);
    leftArm.add(leftHand);
    geometries.push(leftHand.geometry);
    const rightHand = new THREE.Mesh(new THREE.SphereGeometry(0.105, 10, 8), skinMaterial);
    rightHand.position.set(0, -0.53, 0);
    rightArm.add(rightHand);
    geometries.push(rightHand.geometry);

    const handleLaneKey = (event: KeyboardEvent) => {
      if (event.repeat || event.altKey || event.ctrlKey || event.metaKey) return;
      const key = event.key.toLowerCase();
      if (key !== "a" && key !== "d") return;
      const target = event.target;
      if (target instanceof HTMLElement && (target.isContentEditable || target.closest("input, textarea, select, button, [contenteditable='true']"))) return;

      const nextLane = currentLane + (key === "a" ? -1 : 1);
      if (nextLane < 0 || nextLane >= trackCenters.length) return;
      event.preventDefault();
      currentLane = nextLane;
      targetLaneX = trackCenters[currentLane];
    };
    window.addEventListener("keydown", handleLaneKey);
    let nextTrainSpawnAt = 900;

    const resize = () => {
      const { width, height } = mount.getBoundingClientRect();
      if (width <= 0 || height <= 0) return;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      renderer.render(scene, camera);
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(mount);
    resize();

    let animationFrame = 0;
    let previousFrameTime = 0;
    let trackTravel = 0;
    const animate = (time: number) => {
      const stride = time * 0.01;
      const delta = previousFrameTime === 0 ? 0 : Math.min((time - previousFrameTime) / 1000, 0.05);
      previousFrameTime = time;
      const leftDrive = Math.sin(stride);
      const rightDrive = Math.sin(stride + Math.PI);
      leftLeg.hip.rotation.x = leftDrive * 0.9;
      rightLeg.hip.rotation.x = rightDrive * 0.9;
      leftLeg.knee.rotation.x = Math.max(0, Math.cos(stride)) * 1.25;
      rightLeg.knee.rotation.x = Math.max(0, Math.cos(stride + Math.PI)) * 1.25;
      leftArm.rotation.x = -leftDrive * 0.95;
      rightArm.rotation.x = -rightDrive * 0.95;
      runner.position.y = 0.19 + Math.max(0, Math.sin(stride * 2)) * 0.12;
      runner.position.x += (targetLaneX - runner.position.x) * 0.18;
      if (Math.abs(targetLaneX - runner.position.x) < 0.01) runner.position.x = targetLaneX;
      if (groundShadow) groundShadow.position.x = runner.position.x;

      trackTravel = (trackTravel + 17 * delta) % (2.55 * trainScale);
      for (let trackIndex = 0; trackIndex < sleeperInstances.length; trackIndex += 1) {
        const sleepers = sleeperInstances[trackIndex];
        for (let index = 0; index < sleeperCount; index += 1) {
          transform.position.set(trackCenters[trackIndex], 0.12 * trainScale, 12 - index * 2.55 * trainScale + trackTravel);
          transform.updateMatrix();
          sleepers.setMatrixAt(index, transform.matrix);
        }
        sleepers.instanceMatrix.needsUpdate = true;
      }

      if (time >= nextTrainSpawnAt) {
        if (movingTrains.length < 5) createTrain(Math.floor(Math.random() * trackCenters.length));
        nextTrainSpawnAt = time + 1700 + Math.random() * 1500;
      }
      for (let index = movingTrains.length - 1; index >= 0; index -= 1) {
        const train = movingTrains[index];
        train.group.position.z += train.speed * delta;
        if (train.group.position.z > 25) {
          scene.remove(train.group);
          train.dispose();
          movingTrains.splice(index, 1);
        }
      }
      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(animate);
    };
    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("keydown", handleLaneKey);
      resizeObserver.disconnect();
      renderer.dispose();
      renderer.domElement.remove();
      movingTrains.forEach((train) => train.dispose());
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((material) => material.dispose());
      sleeperInstances.forEach((instance) => instance.dispose());
      scene.clear();
    };
  }, []);

  return <section ref={mountRef} className="charlie-run-scene" role="application" aria-label="Charlie Run. Press A or D to move one track left or right." />;
}
