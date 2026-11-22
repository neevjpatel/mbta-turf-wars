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
    scene.fog = new THREE.Fog(skyColor, 75, 285);

    const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 360);
    // Establish the crossing in a steady medium-wide shot.
    camera.position.set(8, 7, 30);
    camera.lookAt(4.3, 1, 0);

    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute("aria-hidden", "true");
    mount.appendChild(renderer.domElement);

    scene.add(new THREE.HemisphereLight("#dce7e4", "#302e2b", 2.1));
    const sunlight = new THREE.DirectionalLight("#fff0d2", 2.4);
    sunlight.position.set(-12, 24, 18);
    scene.add(sunlight);

    const floorMaterial = new THREE.MeshStandardMaterial({ color: "#626862", roughness: 1 });
    const bedMaterial = new THREE.MeshStandardMaterial({ color: "#424743", roughness: 1 });
    const sleeperMaterial = new THREE.MeshStandardMaterial({ color: "#806246", roughness: 0.95 });
    const railMaterial = new THREE.MeshStandardMaterial({ color: "#d5dddc", metalness: 0.72, roughness: 0.3 });
    const hoodieMaterial = new THREE.MeshStandardMaterial({ color: "#df4938", roughness: 0.84 });
    const pantsMaterial = new THREE.MeshStandardMaterial({ color: "#26364a", roughness: 0.92 });
    const skinMaterial = new THREE.MeshStandardMaterial({ color: "#bd805f", roughness: 0.9 });
    const hairMaterial = new THREE.MeshStandardMaterial({ color: "#30241e", roughness: 1 });
    const packMaterial = new THREE.MeshStandardMaterial({ color: "#e19b33", roughness: 0.9 });
    const packTrimMaterial = new THREE.MeshStandardMaterial({ color: "#814626", roughness: 0.95 });
    const shoeMaterial = new THREE.MeshStandardMaterial({ color: "#e7e1d5", roughness: 0.8 });
    const shadowMaterial = new THREE.MeshBasicMaterial({ color: "#161616", transparent: true, opacity: 0.34, depthWrite: false });
    const trainScale = 1.25;
    const trackRearZ = 110;
    const trackRunLength = 240 * trainScale;
    const trackCenterZ = trackRearZ - trackRunLength / 2;
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(520, 660), floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -0.2, -140);
    scene.add(floor);

    const trackSpacing = 4.2 * trainScale;
    const trackCenters = [-trackSpacing, 0, trackSpacing];
    let currentLane = 1;
    let targetLaneX = trackCenters[currentLane];
    const bedGeometry = new THREE.BoxGeometry(3.0 * trainScale, 0.22 * trainScale, trackRunLength);
    const sleeperGeometry = new THREE.BoxGeometry(3.25 * trainScale, 0.15 * trainScale, 0.48 * trainScale);
    const railGeometry = new THREE.BoxGeometry(0.13 * trainScale, 0.2 * trainScale, trackRunLength);
    const geometries: THREE.BufferGeometry[] = [floor.geometry, bedGeometry, sleeperGeometry, railGeometry];
    const materials: THREE.Material[] = [floorMaterial, bedMaterial, sleeperMaterial, railMaterial, hoodieMaterial, pantsMaterial, skinMaterial, hairMaterial, packMaterial, packTrimMaterial, shoeMaterial, shadowMaterial];
    const sleeperCount = 96;
    const sleeperInstances: THREE.InstancedMesh[] = [];
    const movingTrains: Array<{ group: THREE.Group; speed: number; direction: -1 | 1; dispose: () => void }> = [];
    const scenerySegments: THREE.Group[] = [];
    const sceneryInstances: THREE.InstancedMesh[] = [];
    const transform = new THREE.Object3D();

    for (const centerX of trackCenters) {
      const bed = new THREE.Mesh(bedGeometry, bedMaterial);
      bed.position.set(centerX, -0.02 * trainScale, trackCenterZ);
      scene.add(bed);

      const sleepers = new THREE.InstancedMesh(sleeperGeometry, sleeperMaterial, sleeperCount);
      for (let index = 0; index < sleeperCount; index += 1) {
        transform.position.set(centerX, 0.12 * trainScale, trackRearZ - 2 - index * 2.55 * trainScale);
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

    const cityBoxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cityWindowGeometry = new THREE.BoxGeometry(1, 1, 1);
    const cityGableShape = new THREE.Shape();
    cityGableShape.moveTo(-0.5, 0);
    cityGableShape.lineTo(0.5, 0);
    cityGableShape.lineTo(0, 0.48);
    cityGableShape.closePath();
    const cityGableRoofGeometry = new THREE.ExtrudeGeometry(cityGableShape, { depth: 1, bevelEnabled: false });
    cityGableRoofGeometry.translate(0, 0, -0.5);
    const cityTreeTrunkGeometry = new THREE.CylinderGeometry(0.18, 0.28, 1, 8);
    const cityTreeBranchGeometry = new THREE.CylinderGeometry(0.07, 0.15, 1, 10);
    const cityTreeCrownGeometry = new THREE.IcosahedronGeometry(1, 2);
    const cityShrubGeometry = new THREE.IcosahedronGeometry(1, 1);
    const trashBodyGeometry = new THREE.CylinderGeometry(0.33, 0.38, 1.2, 16);
    const trashLidGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.12, 16);
    const hydrantBodyGeometry = new THREE.CylinderGeometry(0.24, 0.3, 0.8, 16);
    const hydrantCapGeometry = new THREE.CylinderGeometry(0.26, 0.26, 0.16, 16);
    const hydrantNozzleGeometry = new THREE.CylinderGeometry(0.1, 0.13, 0.3, 12);
    hydrantNozzleGeometry.rotateZ(Math.PI / 2);
    const streetLampPoleGeometry = new THREE.CylinderGeometry(0.09, 0.16, 6.8, 12);
    const streetLampHeadGeometry = new THREE.BoxGeometry(0.6, 0.24, 0.95);
    const benchSeatGeometry = new THREE.BoxGeometry(1.7, 0.12, 0.48);
    const benchBackGeometry = new THREE.BoxGeometry(1.7, 0.65, 0.1);
    const benchLegGeometry = new THREE.BoxGeometry(0.13, 0.68, 0.42);
    const pedestrianTorsoGeometry = new THREE.CapsuleGeometry(0.17, 0.46, 4, 8);
    const pedestrianHeadGeometry = new THREE.SphereGeometry(0.14, 10, 8);
    const pedestrianHairGeometry = new THREE.SphereGeometry(0.145, 10, 6);
    const pedestrianArmGeometry = new THREE.CapsuleGeometry(0.06, 0.32, 3, 6);
    const pedestrianLegGeometry = new THREE.CapsuleGeometry(0.075, 0.4, 3, 6);
    const pedestrianFootGeometry = new THREE.BoxGeometry(0.17, 0.09, 0.28);
    const cityBodyMaterial = new THREE.MeshStandardMaterial({ color: "#b57b5c", roughness: 0.88 });
    const cityRoofMaterial = new THREE.MeshStandardMaterial({ color: "#535957", roughness: 0.88 });
    const cityWindowMaterial = new THREE.MeshStandardMaterial({ color: "#293b43", emissive: "#16262b", metalness: 0.18, roughness: 0.42 });
    const cityGrassMaterial = new THREE.MeshStandardMaterial({ color: "#63804d", roughness: 1 });
    const citySidewalkMaterial = new THREE.MeshStandardMaterial({ color: "#979791", roughness: 1 });
    const cityCurbMaterial = new THREE.MeshStandardMaterial({ color: "#c3c0b5", roughness: 0.92 });
    const cityJointMaterial = new THREE.MeshStandardMaterial({ color: "#777a77", roughness: 1 });
    const cityMetalMaterial = new THREE.MeshStandardMaterial({ color: "#293737", metalness: 0.68, roughness: 0.42 });
    const cityHydrantMaterial = new THREE.MeshStandardMaterial({ color: "#c84132", metalness: 0.22, roughness: 0.58 });
    const cityBenchMaterial = new THREE.MeshStandardMaterial({ color: "#70503c", roughness: 0.78 });
    const cityLampMaterial = new THREE.MeshStandardMaterial({ color: "#252d2c", metalness: 0.72, roughness: 0.35 });
    const cityLampGlowMaterial = new THREE.MeshStandardMaterial({ color: "#fff0bb", emissive: "#ffce68", emissiveIntensity: 0.48, roughness: 0.35 });
    const cityTrashMaterial = new THREE.MeshStandardMaterial({ color: "#24564a", metalness: 0.36, roughness: 0.68 });
    const cityBarkMaterial = new THREE.MeshStandardMaterial({ color: "#634637", roughness: 1 });
    const cityCanopyMaterial = new THREE.MeshStandardMaterial({ color: "#537947", roughness: 1 });
    const cityShrubMaterial = new THREE.MeshStandardMaterial({ color: "#66834d", roughness: 1 });
    const cityAwningMaterials = ["#b94336", "#355b52", "#c39b58"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.85 }));
    const pedestrianShirtMaterials = ["#364f67", "#8b4f3e", "#d2a44d", "#62784e", "#704b72", "#e1ddd0"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.9 }));
    const pedestrianPantsMaterials = ["#293a49", "#4a4a43", "#51596a", "#45362f"].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.95 }));
    geometries.push(cityBoxGeometry, cityWindowGeometry, cityGableRoofGeometry, cityTreeTrunkGeometry, cityTreeBranchGeometry, cityTreeCrownGeometry, cityShrubGeometry, trashBodyGeometry, trashLidGeometry, hydrantBodyGeometry, hydrantCapGeometry, hydrantNozzleGeometry, streetLampPoleGeometry, streetLampHeadGeometry, benchSeatGeometry, benchBackGeometry, benchLegGeometry, pedestrianTorsoGeometry, pedestrianHeadGeometry, pedestrianHairGeometry, pedestrianArmGeometry, pedestrianLegGeometry, pedestrianFootGeometry);
    materials.push(cityBodyMaterial, cityRoofMaterial, cityWindowMaterial, cityGrassMaterial, citySidewalkMaterial, cityCurbMaterial, cityJointMaterial, cityMetalMaterial, cityHydrantMaterial, cityBenchMaterial, cityLampMaterial, cityLampGlowMaterial, cityTrashMaterial, cityBarkMaterial, cityCanopyMaterial, cityShrubMaterial, ...cityAwningMaterials, ...pedestrianShirtMaterials, ...pedestrianPantsMaterials);

    const scenerySegmentLength = 120;
    const scenerySegmentCount = 4;
    const sceneryWindowCapacity = 8192;
    const buildingPalette = ["#9d4c3b", "#b46045", "#c77d56", "#d0ad87", "#ded0b7", "#a7a69a", "#758486", "#536c70", "#856c5e", "#b18d69", "#766052", "#c1c7ba", "#8b584d", "#aab7b5"];
    const roofPalette = ["#343e40", "#4a4d4a", "#56616a", "#66564d", "#75736c"];
    const foliagePalette = ["#486b43", "#5d7e4c", "#718c50", "#3f684c", "#829454"];
    const pedestrians: Array<{ group: THREE.Group; leftArm: THREE.Group; rightArm: THREE.Group; leftLeg: THREE.Group; rightLeg: THREE.Group; direction: -1 | 1; speed: number; phase: number }> = [];
    const runnerScale = 1.35;
    const pedestrianScale = runnerScale * (2.355 / 1.835);

    const addInstance = (
      mesh: THREE.InstancedMesh,
      index: number,
      position: [number, number, number],
      scale: [number, number, number],
      rotationY = 0,
    ) => {
      transform.position.set(...position);
      transform.scale.set(...scale);
      transform.rotation.set(0, rotationY, 0);
      transform.updateMatrix();
      mesh.setMatrixAt(index, transform.matrix);
    };

    for (let segmentIndex = 0; segmentIndex < scenerySegmentCount; segmentIndex += 1) {
      const segment = new THREE.Group();
      segment.position.z = -42 - segmentIndex * scenerySegmentLength;

      const bodies = new THREE.InstancedMesh(cityBoxGeometry, cityBodyMaterial, 12);
      const roofs = new THREE.InstancedMesh(cityBoxGeometry, cityRoofMaterial, 12);
      const gableRoofs = new THREE.InstancedMesh(cityGableRoofGeometry, cityRoofMaterial, 12);
      const sideWindows = new THREE.InstancedMesh(cityWindowGeometry, cityWindowMaterial, sceneryWindowCapacity);
      const endWindows = new THREE.InstancedMesh(cityWindowGeometry, cityWindowMaterial, sceneryWindowCapacity);
      const sideWindowSills = new THREE.InstancedMesh(cityBoxGeometry, cityCurbMaterial, sceneryWindowCapacity);
      const endWindowSills = new THREE.InstancedMesh(cityBoxGeometry, cityCurbMaterial, sceneryWindowCapacity);
      const storefronts = new THREE.InstancedMesh(cityBoxGeometry, cityWindowMaterial, 12);
      const shopDoors = new THREE.InstancedMesh(cityBoxGeometry, cityMetalMaterial, 12);
      const shopAwnings = new THREE.InstancedMesh(cityBoxGeometry, cityAwningMaterials[0], 12);
      const shopSigns = new THREE.InstancedMesh(cityBoxGeometry, cityCurbMaterial, 12);
      const cornices = new THREE.InstancedMesh(cityBoxGeometry, cityRoofMaterial, 12);
      const sidewalks = new THREE.InstancedMesh(cityBoxGeometry, citySidewalkMaterial, 2);
      const curbs = new THREE.InstancedMesh(cityBoxGeometry, cityCurbMaterial, 2);
      const grass = new THREE.InstancedMesh(cityBoxGeometry, cityGrassMaterial, 2);
      const joints = new THREE.InstancedMesh(cityBoxGeometry, cityJointMaterial, 120);
      const trashBodies = new THREE.InstancedMesh(trashBodyGeometry, cityTrashMaterial, 6);
      const trashLids = new THREE.InstancedMesh(trashLidGeometry, cityMetalMaterial, 6);
      const hydrantBodies = new THREE.InstancedMesh(hydrantBodyGeometry, cityHydrantMaterial, 6);
      const hydrantCaps = new THREE.InstancedMesh(hydrantCapGeometry, cityHydrantMaterial, 6);
      const hydrantNozzles = new THREE.InstancedMesh(hydrantNozzleGeometry, cityHydrantMaterial, 12);
      const lampPoles = new THREE.InstancedMesh(streetLampPoleGeometry, cityLampMaterial, 4);
      const lampHeads = new THREE.InstancedMesh(streetLampHeadGeometry, cityLampMaterial, 4);
      const lampGlows = new THREE.InstancedMesh(streetLampHeadGeometry, cityLampGlowMaterial, 4);
      const benchSeats = new THREE.InstancedMesh(benchSeatGeometry, cityBenchMaterial, 4);
      const benchBacks = new THREE.InstancedMesh(benchBackGeometry, cityBenchMaterial, 4);
      const benchLegs = new THREE.InstancedMesh(benchLegGeometry, cityMetalMaterial, 8);
      const trunks = new THREE.InstancedMesh(cityTreeTrunkGeometry, cityBarkMaterial, 12);
      const crowns = new THREE.InstancedMesh(cityTreeCrownGeometry, cityCanopyMaterial, 36);
      const shrubs = new THREE.InstancedMesh(cityShrubGeometry, cityShrubMaterial, 24);

      let buildingIndex = 0;
      let sideWindowIndex = 0;
      let endWindowIndex = 0;
      let gableRoofIndex = 0;
      const buildingCentersX = [23.5, 40.5, 62.8];
      const buildingWidths = [11.3, 15.4, 18.5];
      const moduleSpacing = [20, 24, 30];
      const moduleCounts = [6, 5, 4];
      for (const side of [-1, 1] as const) {
        for (let tier = 0; tier < 1; tier += 1) {
          for (let moduleIndex = 0; moduleIndex < moduleCounts[tier]; moduleIndex += 1) {
            // Each layer fills the whole 120 m scenery segment with adjoining lots.
            const width = (buildingWidths[tier] + Math.random() * 1.4) * 1.25;
            const depth = moduleSpacing[tier] + 0.7;
            const height = (12 + tier * 8 + Math.random() * (tier === 2 ? 24 : 14)) * 1.25;
            const x = side * buildingCentersX[tier];
            const z = -scenerySegmentLength / 2 + moduleSpacing[tier] / 2 + moduleIndex * moduleSpacing[tier];
            const baseY = -0.16;
            const centerY = baseY + height / 2;
            addInstance(bodies, buildingIndex, [x, centerY, z], [width, height, depth]);
            const buildingColor = new THREE.Color(buildingPalette[Math.floor(Math.random() * buildingPalette.length)]);
            bodies.setColorAt(buildingIndex, buildingColor);
            addInstance(roofs, buildingIndex, [x, baseY + height + 0.16, z], [width * 0.94, 0.32, depth * 0.94]);
            roofs.setColorAt(buildingIndex, new THREE.Color(roofPalette[Math.floor(Math.random() * roofPalette.length)]));
            if ((tier === 0 && moduleIndex % 2 === 1) || (tier === 1 && moduleIndex % 3 === 1)) {
              addInstance(gableRoofs, gableRoofIndex, [x, baseY + height, z], [width * 1.04, 5 + Math.random() * 2, depth * 1.01]);
              gableRoofs.setColorAt(gableRoofIndex, new THREE.Color(roofPalette[Math.floor(Math.random() * roofPalette.length)]));
              gableRoofIndex += 1;
            }

            const firstWindowRowY = baseY + 3.25;
            const lastWindowRowY = baseY + height - 1.45;
            const windowRowSpan = lastWindowRowY - firstWindowRowY;
            const floors = Math.max(3, Math.floor(windowRowSpan / 3.35) + 1);
            const windowRowSpacing = windowRowSpan / (floors - 1);
            const sideColumns = Math.max(3, Math.floor((depth - 3) / 4.6) + 1);
            const endColumns = Math.max(3, Math.floor((width - 2) / 4.1) + 1);
            for (let floorIndex = 0; floorIndex < floors; floorIndex += 1) {
              const y = firstWindowRowY + floorIndex * windowRowSpacing;
              for (let column = 0; column < sideColumns; column += 1) {
                if (sideWindowIndex >= sceneryWindowCapacity) break;
                const windowZ = z - depth / 2 + (column + 0.5) * depth / sideColumns;
                const facadeX = x - side * (width / 2 + 0.055);
                addInstance(sideWindows, sideWindowIndex, [facadeX, y, windowZ], [0.1, 1.45, 1.3]);
                addInstance(sideWindowSills, sideWindowIndex, [facadeX - side * 0.03, y - 0.78, windowZ], [0.2, 0.11, 1.5]);
                sideWindowIndex += 1;
              }
              for (let column = 0; column < endColumns; column += 1) {
                if (endWindowIndex >= sceneryWindowCapacity) break;
                const windowX = x - width / 2 + (column + 0.5) * width / endColumns;
                const facadeZ = z + depth / 2 + 0.055;
                addInstance(endWindows, endWindowIndex, [windowX, y, facadeZ], [1.45, 1.45, 0.1]);
                addInstance(endWindowSills, endWindowIndex, [windowX, y - 0.78, facadeZ + 0.03], [1.6, 0.11, 0.2]);
                endWindowIndex += 1;
              }
            }

            const facadeX = x - side * (width / 2 + 0.09);
            addInstance(storefronts, buildingIndex, [facadeX, 1.1, z], [0.12, 2.25, depth * 0.84]);
            addInstance(shopDoors, buildingIndex, [facadeX - side * 0.09, 1.02, z - depth * 0.24], [0.15, 2.04, Math.min(1.05, depth * 0.25)]);
            addInstance(shopAwnings, buildingIndex, [facadeX - side * 0.43, 2.52, z], [0.78, 0.22, depth * 0.96]);
            addInstance(shopSigns, buildingIndex, [facadeX - side * 0.18, 2.93, z], [0.18, 0.42, depth * 0.7]);
            shopAwnings.setColorAt(buildingIndex, new THREE.Color(cityAwningMaterials[buildingIndex % cityAwningMaterials.length].color));
            addInstance(cornices, buildingIndex, [facadeX, baseY + height - 0.25, z], [0.24, 0.3, depth * 1.08]);

            if (tier === 2 && moduleIndex % 2 === 1) {
              const rooftopTank = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 2.6, 10), cityRoofMaterial);
              rooftopTank.position.set(x, baseY + height + 1.5, z);
              segment.add(rooftopTank);
              geometries.push(rooftopTank.geometry);
            }
            buildingIndex += 1;
          }
        }
      }
      bodies.instanceMatrix.needsUpdate = true;
      if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
      roofs.instanceMatrix.needsUpdate = true;
      if (roofs.instanceColor) roofs.instanceColor.needsUpdate = true;
      gableRoofs.count = gableRoofIndex;
      gableRoofs.instanceMatrix.needsUpdate = true;
      if (gableRoofs.instanceColor) gableRoofs.instanceColor.needsUpdate = true;
      sideWindows.count = sideWindowIndex;
      endWindows.count = endWindowIndex;
      sideWindows.instanceMatrix.needsUpdate = true;
      endWindows.instanceMatrix.needsUpdate = true;
      sideWindowSills.count = sideWindowIndex;
      endWindowSills.count = endWindowIndex;
      sideWindowSills.instanceMatrix.needsUpdate = true;
      endWindowSills.instanceMatrix.needsUpdate = true;
      storefronts.instanceMatrix.needsUpdate = true;
      shopDoors.instanceMatrix.needsUpdate = true;
      shopAwnings.instanceMatrix.needsUpdate = true;
      if (shopAwnings.instanceColor) shopAwnings.instanceColor.needsUpdate = true;
      shopSigns.instanceMatrix.needsUpdate = true;
      cornices.instanceMatrix.needsUpdate = true;

      for (const side of [-1, 1] as const) {
        const sideIndex = side === -1 ? 0 : 1;
        addInstance(sidewalks, sideIndex, [side * 9.85, -0.105, 0], [4.2, 0.19, scenerySegmentLength]);
        addInstance(curbs, sideIndex, [side * 7.62, -0.005, 0], [0.24, 0.27, scenerySegmentLength]);
        addInstance(grass, sideIndex, [side * 14.0, -0.12, 0], [4.0, 0.12, scenerySegmentLength]);
        for (let slab = 0; slab < 60; slab += 1) {
          addInstance(joints, sideIndex * 60 + slab, [side * 9.85, 0.001, -59 + slab * 2], [4.05, 0.018, 0.035]);
        }

        for (let fixtureIndex = 0; fixtureIndex < 3; fixtureIndex += 1) {
          const fixtureZ = -44 + fixtureIndex * 38;
          const fixtureOffset = sideIndex * 3 + fixtureIndex;
          const trashZ = fixtureZ + 13;
          const benchZ = fixtureZ + 22;
          const lampIndex = sideIndex * 2 + (fixtureIndex % 2);
          const lampZ = -36 + fixtureIndex * 72;
          addInstance(trashBodies, fixtureOffset, [side * 11.45, 0.59, trashZ], [1, 1, 1]);
          addInstance(trashLids, fixtureOffset, [side * 11.45, 1.25, trashZ], [1, 1, 1]);
          addInstance(hydrantBodies, fixtureOffset, [side * 8.1, 0.39, fixtureZ], [1, 1, 1]);
          addInstance(hydrantCaps, fixtureOffset, [side * 8.1, 0.87, fixtureZ], [1, 1, 1]);
          for (let nozzleIndex = 0; nozzleIndex < 2; nozzleIndex += 1) {
            const yaw = side === 1 ? Math.PI : 0;
            addInstance(hydrantNozzles, fixtureOffset * 2 + nozzleIndex, [side * 8.1, 0.42, fixtureZ + (nozzleIndex === 0 ? -0.14 : 0.14)], [1, 1, 1], yaw);
          }
          if (fixtureIndex < 2) {
            addInstance(lampPoles, lampIndex, [side * 11.45, 3.39, lampZ], [1, 1, 1]);
            addInstance(lampHeads, lampIndex, [side * 11.15, 6.7, lampZ], [1, 1, 1], side === 1 ? Math.PI / 2 : -Math.PI / 2);
            addInstance(lampGlows, lampIndex, [side * 11.15, 6.55, lampZ], [0.62, 0.28, 0.82], side === 1 ? Math.PI / 2 : -Math.PI / 2);
          }
          if (fixtureIndex < 2) {
            const yaw = Math.PI / 2;
            const benchIndex = sideIndex * 2 + fixtureIndex;
            addInstance(benchSeats, benchIndex, [side * 10.65, 0.52, benchZ], [1, 1, 1], yaw);
            addInstance(benchBacks, benchIndex, [side * 11.01, 0.98, benchZ], [1, 1, 1], yaw);
            addInstance(benchLegs, benchIndex * 2, [side * 10.65 - 0.42, 0.34, benchZ], [1, 1, 1], yaw);
            addInstance(benchLegs, benchIndex * 2 + 1, [side * 10.65 + 0.42, 0.34, benchZ], [1, 1, 1], yaw);
          }
        }
      }
      sidewalks.instanceMatrix.needsUpdate = true;
      curbs.instanceMatrix.needsUpdate = true;
      grass.instanceMatrix.needsUpdate = true;
      joints.instanceMatrix.needsUpdate = true;

      for (let treeIndex = 0; treeIndex < 12; treeIndex += 1) {
        const side = treeIndex % 2 === 0 ? -1 : 1;
        const z = (-34 + Math.floor(treeIndex / 2) * 12.5 + Math.random() * 3) * 1.5;
        const x = side * (14.0 + Math.random() * 1.1);
        const height = 13 + Math.random() * 6;
        const crownScale = 3.1 + Math.random() * 0.9;
        addInstance(trunks, treeIndex, [x, -0.16 + height / 2, z], [0.9, height, 0.9]);
        const branchGroup = new THREE.Group();
        branchGroup.position.set(x, -0.16, z);
        for (const branchSide of [-1, 1]) {
          const branch = new THREE.Mesh(cityTreeBranchGeometry, cityBarkMaterial);
          branch.position.set(branchSide * height * 0.13, height * 0.58, 0);
          branch.scale.set(1, height * 0.31, 1);
          branch.rotation.z = -branchSide * 0.74;
          branch.castShadow = false;
          branch.receiveShadow = false;
          branchGroup.add(branch);
        }
        segment.add(branchGroup);
        for (let crownPart = 0; crownPart < 3; crownPart += 1) {
          const index = treeIndex * 3 + crownPart;
          const layerScale = crownScale * (crownPart === 1 ? 0.82 : 1);
          const layerY = -0.16 + height * (0.68 + crownPart * 0.105);
          const offsetX = (crownPart - 1) * crownScale * 0.58;
          const offsetZ = (crownPart % 2 === 0 ? 1 : -1) * crownScale * 0.13;
          addInstance(crowns, index, [x + offsetX, layerY, z + offsetZ], [layerScale, layerScale * 0.92, layerScale]);
          crowns.setColorAt(index, new THREE.Color(foliagePalette[(treeIndex + crownPart) % foliagePalette.length]));
        }
      }
      trunks.instanceMatrix.needsUpdate = true;
      crowns.instanceMatrix.needsUpdate = true;
      if (crowns.instanceColor) crowns.instanceColor.needsUpdate = true;

      for (let shrubIndex = 0; shrubIndex < 24; shrubIndex += 1) {
        const side = shrubIndex % 2 === 0 ? -1 : 1;
        const row = Math.floor(shrubIndex / 2);
        const scale = 1.5 + Math.random() * 1.0;
        addInstance(shrubs, shrubIndex, [side * (13.0 + Math.random() * 1.0), -0.16 + scale * 0.54, (-36 + row * 6.2) * 1.5], [scale * 1.7, scale, scale]);
        shrubs.setColorAt(shrubIndex, new THREE.Color(foliagePalette[Math.floor(Math.random() * foliagePalette.length)]));
      }
      shrubs.instanceMatrix.needsUpdate = true;
      if (shrubs.instanceColor) shrubs.instanceColor.needsUpdate = true;

      for (const mesh of [bodies, roofs, gableRoofs, sideWindows, endWindows, sideWindowSills, endWindowSills, storefronts, shopDoors, shopAwnings, shopSigns, cornices, sidewalks, curbs, grass, joints, trashBodies, trashLids, hydrantBodies, hydrantCaps, hydrantNozzles, lampPoles, lampHeads, lampGlows, benchSeats, benchBacks, benchLegs, trunks, crowns, shrubs]) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        segment.add(mesh);
        sceneryInstances.push(mesh);
      }

      for (const side of [-1, 1] as const) {
        for (let walkerIndex = 0; walkerIndex < 3; walkerIndex += 1) {
          const direction: -1 | 1 = walkerIndex % 2 === 0 ? 1 : -1;
          const walker = new THREE.Group();
          walker.scale.setScalar(pedestrianScale);
          walker.position.set(side * (8.5 + (walkerIndex % 2) * 1.45), -0.01 - 0.125 * pedestrianScale, (-27 + walkerIndex * 27) * 1.5);
          walker.rotation.y = direction === 1 ? 0 : Math.PI;
          const shirt = pedestrianShirtMaterials[(segmentIndex * 3 + walkerIndex * 2 + (side === 1 ? 1 : 0)) % pedestrianShirtMaterials.length];
          const pants = pedestrianPantsMaterials[(segmentIndex + walkerIndex + (side === 1 ? 1 : 0)) % pedestrianPantsMaterials.length];
          const makePart = (geometry: THREE.BufferGeometry, material: THREE.Material, position: [number, number, number]) => {
            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(...position);
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            walker.add(mesh);
          };
          makePart(pedestrianTorsoGeometry, shirt, [0, 1.03, 0]);
          makePart(pedestrianHeadGeometry, skinMaterial, [0, 1.61, 0]);
          makePart(pedestrianHairGeometry, hairMaterial, [0, 1.69, -0.01]);
          const leftArm = new THREE.Group();
          leftArm.position.set(-0.22, 1.28, 0);
          const leftArmMesh = new THREE.Mesh(pedestrianArmGeometry, shirt);
          leftArmMesh.position.y = -0.2;
          leftArm.add(leftArmMesh);
          walker.add(leftArm);
          const rightArm = new THREE.Group();
          rightArm.position.set(0.22, 1.28, 0);
          const rightArmMesh = new THREE.Mesh(pedestrianArmGeometry, shirt);
          rightArmMesh.position.y = -0.2;
          rightArm.add(rightArmMesh);
          walker.add(rightArm);
          const leftLeg = new THREE.Group();
          leftLeg.position.set(-0.105, 0.68, 0);
          const leftLegMesh = new THREE.Mesh(pedestrianLegGeometry, pants);
          leftLegMesh.position.y = -0.25;
          leftLeg.add(leftLegMesh);
          const leftFoot = new THREE.Mesh(pedestrianFootGeometry, shoeMaterial);
          leftFoot.position.set(0, -0.51, 0.06);
          leftLeg.add(leftFoot);
          walker.add(leftLeg);
          const rightLeg = new THREE.Group();
          rightLeg.position.set(0.105, 0.68, 0);
          const rightLegMesh = new THREE.Mesh(pedestrianLegGeometry, pants);
          rightLegMesh.position.y = -0.25;
          rightLeg.add(rightLegMesh);
          const rightFoot = new THREE.Mesh(pedestrianFootGeometry, shoeMaterial);
          rightFoot.position.set(0, -0.51, 0.06);
          rightLeg.add(rightFoot);
          walker.add(rightLeg);
          segment.add(walker);
          pedestrians.push({ group: walker, leftArm, rightArm, leftLeg, rightLeg, direction, speed: 0.7 + Math.random() * 0.45, phase: Math.random() * Math.PI * 2 });
        }
      }
      segment.traverse((child) => {
        if (child instanceof THREE.Mesh && !(child instanceof THREE.InstancedMesh)) {
          child.castShadow = false;
          child.receiveShadow = false;
        }
      });
      scene.add(segment);
      scenerySegments.push(segment);
    }

    // Two continuous skyline rows close the far horizon behind the moving street blocks.
    const distantCity = new THREE.Group();
    for (let row = 0; row < 2; row += 1) {
      const buildingCount = 86;
      const skylineBodies = new THREE.InstancedMesh(cityBoxGeometry, cityBodyMaterial, buildingCount);
      const skylineRoofs = new THREE.InstancedMesh(cityBoxGeometry, cityRoofMaterial, buildingCount);
      const skylineWindows = new THREE.InstancedMesh(cityWindowGeometry, cityWindowMaterial, sceneryWindowCapacity);
      let skylineWindowIndex = 0;
      const rowZ = row === 0 ? -182 : -258;
      for (let index = 0; index < buildingCount; index += 1) {
        const x = (index - (buildingCount - 1) / 2) * 6.15 + (row === 1 ? 3.05 : 0);
        const width = 6.5 + Math.random() * 0.9;
        const depth = row === 0 ? 12 + Math.random() * 5 : 10 + Math.random() * 6;
        const centerFactor = Math.max(0, 1 - Math.abs(x) / 175);
        const height = row === 0
          ? 17 + centerFactor * 29 + Math.random() * 11
          : 12 + centerFactor * 18 + Math.random() * 10;
        const centerY = -0.16 + height / 2;
        addInstance(skylineBodies, index, [x, centerY, rowZ], [width, height, depth]);
        skylineBodies.setColorAt(index, new THREE.Color(buildingPalette[Math.floor(Math.random() * buildingPalette.length)]));
        addInstance(skylineRoofs, index, [x, -0.16 + height + 0.14, rowZ], [width * 0.94, 0.28, depth * 0.94]);
        skylineRoofs.setColorAt(index, new THREE.Color(roofPalette[Math.floor(Math.random() * roofPalette.length)]));

        const floors = Math.floor((height - 2) / 2.6);
        for (let floorIndex = 0; floorIndex < floors; floorIndex += 2) {
          const y = -0.16 + 1.55 + floorIndex * 2.6;
          for (const columnOffset of [-1, 1]) {
            if (skylineWindowIndex >= sceneryWindowCapacity) break;
            const windowX = x + columnOffset * (width * 0.27);
            addInstance(skylineWindows, skylineWindowIndex, [windowX, y, rowZ + depth / 2 + 0.05], [0.68, 0.8, 0.08]);
            skylineWindowIndex += 1;
          }
        }
      }
      skylineWindows.count = skylineWindowIndex;
      skylineBodies.instanceMatrix.needsUpdate = true;
      if (skylineBodies.instanceColor) skylineBodies.instanceColor.needsUpdate = true;
      skylineRoofs.instanceMatrix.needsUpdate = true;
      if (skylineRoofs.instanceColor) skylineRoofs.instanceColor.needsUpdate = true;
      skylineWindows.instanceMatrix.needsUpdate = true;
      for (const mesh of [skylineBodies, skylineRoofs, skylineWindows]) {
        mesh.castShadow = false;
        mesh.receiveShadow = false;
        distantCity.add(mesh);
        sceneryInstances.push(mesh);
      }
    }
    scene.add(distantCity);

    const createTrain = (laneIndex: number, line?: CharlieRunLine, startZ = -132, speed?: number, direction: -1 | 1 = 1) => {
      const lines: CharlieRunLine[] = ["orange", "blue", "red"];
      const model = createCharlieRunTrain(line ?? lines[Math.floor(Math.random() * lines.length)]);
      model.group.scale.setScalar(trainScale);
      model.group.position.set(trackCenters[laneIndex], 0.38 * trainScale - 0.48 * trainScale, startZ);
      if (direction === -1) model.group.rotation.y = Math.PI;
      scene.add(model.group);
      movingTrains.push({ group: model.group, speed: speed ?? 17 + Math.random() * 4, direction, dispose: model.dispose });
    };

    const runner = new THREE.Group();
    runner.position.set(9.6, 0.02, 2);
    runner.scale.setScalar(runnerScale);
    runner.rotation.x = -0.19;
    runner.rotation.y = Math.PI / 2;
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
        mesh.position.set(runner.position.x, runner.position.y + part.position[1], runner.position.z + part.position[2]);
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

    let introComplete = false;
    const handleLaneKey = (event: KeyboardEvent) => {
      if (!introComplete) return;
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
    let nextTrainSpawnAt = Number.POSITIVE_INFINITY;
    const introStartedAt = performance.now();
    const introDuration = 4500;
    const easeInOut = (progress: number) => {
      const clamped = THREE.MathUtils.clamp(progress, 0, 1);
      return clamped * clamped * (3 - 2 * clamped);
    };
    // These trains start far enough away to be seen approaching, while
    // leaving the runner room to accelerate down the tracks.
    createTrain(0, "orange", 78, -20, -1);
    createTrain(1, "blue", 81, -21, -1);
    createTrain(2, "red", 84, -22, -1);

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
      const delta = previousFrameTime === 0 ? 0 : Math.min((time - previousFrameTime) / 1000, 0.05);
      previousFrameTime = time;
      const introElapsed = Math.max(0, time - introStartedAt);
      const sidewaysWalk = !introComplete && introElapsed < 1500;
      const lookingForTrains = !introComplete && introElapsed >= 1500 && introElapsed < 1900;
      const gaitPhase = time * (sidewaysWalk ? 0.0055 : 0.01);
      const gaitStrength = sidewaysWalk ? 0.34 : lookingForTrains ? 0.06 : 1;
      const stride = gaitPhase;
      const leftDrive = Math.sin(stride);
      const rightDrive = Math.sin(stride + Math.PI);
      leftLeg.hip.rotation.x = leftDrive * 0.9 * gaitStrength;
      rightLeg.hip.rotation.x = rightDrive * 0.9 * gaitStrength;
      leftLeg.knee.rotation.x = Math.max(0, Math.cos(stride)) * 1.25 * gaitStrength;
      rightLeg.knee.rotation.x = Math.max(0, Math.cos(stride + Math.PI)) * 1.25 * gaitStrength;
      leftArm.rotation.x = -leftDrive * 0.95 * gaitStrength;
      rightArm.rotation.x = -rightDrive * 0.95 * gaitStrength;
      if (!introComplete) {
        const crossStreetProgress = easeInOut(introElapsed / 1500);
        const runStartProgress = easeInOut((introElapsed - 1900) / 1300);
        const turnToLookBack = easeInOut((introElapsed - 1450) / 350);
        const flinchProgress = THREE.MathUtils.clamp((introElapsed - 1500) / 450, 0, 1);
        const flinchJump = Math.sin(flinchProgress * Math.PI) * 0.95;
        // He crosses onto the center track, flinches at the approaching trains,
        // then sprints down the rails faster than they can close the gap.
        runner.position.x = 9.6 * (1 - crossStreetProgress);
        runner.position.z = 2 - 28 * Math.max(0, introElapsed - 1900) / 1000;
        runner.position.y = 0.02 + flinchJump + 0.17 * runStartProgress + Math.max(0, Math.sin(stride * 2)) * (sidewaysWalk ? 0.025 : 0.12);
        leftArm.rotation.z = flinchJump * 0.42;
        rightArm.rotation.z = -flinchJump * 0.42;

        if (introElapsed < 1450) {
          runner.rotation.y = Math.PI / 2;
        } else if (introElapsed < 1800) {
          runner.rotation.y = Math.PI / 2 + Math.PI / 2 * turnToLookBack;
        } else if (introElapsed < 1900) {
          runner.rotation.y = Math.PI;
        } else {
          runner.rotation.y = Math.PI + Math.PI * runStartProgress;
        }

        if (introElapsed >= 1900) {
          // One steady tracking shot carries the run into gameplay.
          const runCameraFollow = easeInOut((introElapsed - 1900) / (4050 - 1900));
          camera.position.set(
            8 * (1 - runCameraFollow),
            7,
            30 * (1 - runCameraFollow) + (runner.position.z + 13) * runCameraFollow,
          );
          camera.lookAt(
            4.3 * (1 - runCameraFollow),
            1 * (1 - runCameraFollow),
            (runner.position.z - 15) * runCameraFollow,
          );
        } else if (introElapsed >= 850 && introElapsed < 1350) {
          // A deliberate reverse cut shows the three approaching trains.
          camera.position.set(8, 7, 20);
          camera.lookAt(0, 1.4, 56);
        } else {
          // Return to the same crossing composition for the flinch.
          camera.position.set(8, 7, 30);
          camera.lookAt(4.3, 1, 0);
        }

        if (introElapsed >= introDuration) {
          introComplete = true;
          for (let trainIndex = movingTrains.length - 1; trainIndex >= 0; trainIndex -= 1) {
            if (movingTrains[trainIndex].direction !== -1) continue;
            const introTrain = movingTrains[trainIndex];
            scene.remove(introTrain.group);
            introTrain.dispose();
            movingTrains.splice(trainIndex, 1);
          }
          currentLane = 1;
          targetLaneX = trackCenters[currentLane];
          runner.position.x = targetLaneX;
          runner.position.y = 0.19;
          runner.rotation.y = 0;
          camera.position.set(0, 7, runner.position.z + 13);
          camera.lookAt(0, 0, runner.position.z - 15);
          nextTrainSpawnAt = time + 650;
        }
      } else {
        runner.position.y = 0.19 + Math.max(0, Math.sin(stride * 2)) * 0.12;
        runner.position.x += (targetLaneX - runner.position.x) * 0.18;
        if (Math.abs(targetLaneX - runner.position.x) < 0.01) runner.position.x = targetLaneX;
      }
      if (groundShadow) {
        groundShadow.position.set(runner.position.x, runner.position.y + 0.01, runner.position.z + 0.18);
      }

      if (introComplete) {
        for (const pedestrian of pedestrians) {
          pedestrian.group.position.z += pedestrian.direction * pedestrian.speed * delta;
          if (pedestrian.group.position.z > 54) pedestrian.group.position.z -= scenerySegmentLength;
          if (pedestrian.group.position.z < -54) pedestrian.group.position.z += scenerySegmentLength;
          const walkCycle = Math.sin(time * 0.004 + pedestrian.phase) * 0.42;
          pedestrian.leftLeg.rotation.x = walkCycle;
          pedestrian.rightLeg.rotation.x = -walkCycle;
          pedestrian.leftArm.rotation.x = -walkCycle * 0.8;
          pedestrian.rightArm.rotation.x = walkCycle * 0.8;
        }
      }

      if (introComplete) {
        for (const segment of scenerySegments) {
          segment.position.z += 17 * delta;
          if (segment.position.z > 78) segment.position.z -= scenerySegmentLength * scenerySegmentCount;
        }
      }

      if (introComplete) {
        trackTravel = (trackTravel + 17 * delta) % (2.55 * trainScale);
        for (let trackIndex = 0; trackIndex < sleeperInstances.length; trackIndex += 1) {
          const sleepers = sleeperInstances[trackIndex];
          for (let index = 0; index < sleeperCount; index += 1) {
            transform.position.set(trackCenters[trackIndex], 0.12 * trainScale, trackRearZ - 2 - index * 2.55 * trainScale + trackTravel);
            transform.updateMatrix();
            sleepers.setMatrixAt(index, transform.matrix);
          }
          sleepers.instanceMatrix.needsUpdate = true;
        }
      }

      if (time >= nextTrainSpawnAt) {
        if (movingTrains.length < 5) createTrain(Math.floor(Math.random() * trackCenters.length));
        nextTrainSpawnAt = time + 1700 + Math.random() * 1500;
      }
      for (let index = movingTrains.length - 1; index >= 0; index -= 1) {
        const train = movingTrains[index];
        train.group.position.z += train.speed * delta;
        if ((train.direction === 1 && train.group.position.z > 25) || (train.direction === -1 && train.group.position.z < -205)) {
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
      sceneryInstances.forEach((instance) => instance.dispose());
      scene.clear();
    };
  }, []);

  return <section ref={mountRef} className="charlie-run-scene" role="application" aria-label="Charlie Run. Press A or D to move one track left or right." />;
}
