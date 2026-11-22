import * as THREE from "three";

export type CharlieRunLine = "orange" | "red" | "blue";

type VehicleSpec = {
  line: CharlieRunLine;
  length: number;
  width: number;
  height: number;
  doorsPerSide: number;
  numberStart: number;
  numberCount: number;
  destination: string;
  fleet: "crrc" | "siemens";
};

const VEHICLES: Record<CharlieRunLine, VehicleSpec> = {
  orange: {
    line: "orange",
    length: 19.812,
    width: 2.819,
    height: 3.753,
    doorsPerSide: 3,
    numberStart: 1400,
    numberCount: 152,
    destination: "OAK GROVE",
    fleet: "crrc",
  },
  red: {
    line: "red",
    length: 21.184,
    width: 3.048,
    height: 3.753,
    doorsPerSide: 4,
    numberStart: 1900,
    numberCount: 252,
    destination: "ALEWIFE",
    fleet: "crrc",
  },
  blue: {
    line: "blue",
    length: 14.884,
    width: 2.819,
    height: 3.899,
    doorsPerSide: 2,
    numberStart: 700,
    numberCount: 94,
    destination: "WONDERLAND",
    fleet: "siemens",
  },
};

const LINE_COLORS: Record<CharlieRunLine, string> = {
  orange: "#ED8B00",
  red: "#DA291C",
  blue: "#003DA5",
};

const BODY_BOTTOM = 0.48;
const WHEEL_RADIUS = 0.39;
const END_Z = 0;

function roundedPanel(width: number, height: number, radius: number, depth: number) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2 + radius, -height / 2);
  shape.lineTo(width / 2 - radius, -height / 2);
  shape.quadraticCurveTo(width / 2, -height / 2, width / 2, -height / 2 + radius);
  shape.lineTo(width / 2, height / 2 - radius);
  shape.quadraticCurveTo(width / 2, height / 2, width / 2 - radius, height / 2);
  shape.lineTo(-width / 2 + radius, height / 2);
  shape.quadraticCurveTo(-width / 2, height / 2, -width / 2, height / 2 - radius);
  shape.lineTo(-width / 2, -height / 2 + radius);
  shape.quadraticCurveTo(-width / 2, -height / 2, -width / 2 + radius, -height / 2);
  return new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    curveSegments: 10,
  });
}

function makeWindshieldPane(width: number, height: number, side: -1 | 1) {
  const shape = new THREE.Shape();
  if (side < 0) {
    shape.moveTo(-width / 2 + 0.035, -height / 2);
    shape.lineTo(width / 2 - 0.035, -height / 2);
    shape.lineTo(width / 2 - 0.035, height / 2);
    shape.lineTo(-width / 2 + 0.16, height / 2);
  } else {
    shape.moveTo(-width / 2 + 0.035, -height / 2);
    shape.lineTo(width / 2 - 0.035, -height / 2);
    shape.lineTo(width / 2 - 0.16, height / 2);
    shape.lineTo(-width / 2 + 0.035, height / 2);
  }
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.045,
    bevelEnabled: true,
    bevelSegments: 3,
    bevelSize: 0.016,
    bevelThickness: 0.012,
    curveSegments: 8,
  });
}

function makeBodyGeometry(width: number, height: number, length: number) {
  const top = height;
  const side = width / 2;
  const shoulder = 0.25;
  const profile = new THREE.Shape();
  profile.moveTo(-side + shoulder, BODY_BOTTOM);
  profile.lineTo(side - shoulder, BODY_BOTTOM);
  profile.quadraticCurveTo(side, BODY_BOTTOM, side, BODY_BOTTOM + shoulder);
  profile.lineTo(side, top - shoulder * 1.4);
  profile.quadraticCurveTo(side, top - shoulder * 0.35, side - shoulder, top);
  profile.lineTo(-side + shoulder, top);
  profile.quadraticCurveTo(-side, top - shoulder * 0.35, -side, top - shoulder * 1.4);
  profile.lineTo(-side, BODY_BOTTOM + shoulder);
  profile.quadraticCurveTo(-side, BODY_BOTTOM, -side + shoulder, BODY_BOTTOM);
  return new THREE.ExtrudeGeometry(profile, {
    depth: length,
    bevelEnabled: true,
    bevelSegments: 4,
    bevelSize: 0.025,
    bevelThickness: 0.025,
    curveSegments: 12,
  });
}

function textTexture(text: string, fontSize: number, color: string, background: string) {
  const canvas = document.createElement("canvas");
  canvas.width = 768;
  canvas.height = 160;
  const context = canvas.getContext("2d");
  if (context) {
    context.fillStyle = background;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = color;
    context.font = `700 ${fontSize}px Arial, sans-serif`;
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2, canvas.width - 28);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function addBeam(
  group: THREE.Group,
  geometries: THREE.BufferGeometry[],
  from: THREE.Vector3,
  to: THREE.Vector3,
  radius: number,
  material: THREE.Material,
) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 8);
  geometries.push(geometry);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  group.add(mesh);
}

/** Build a single MBTA subway car, with line-specific dimensions and exterior details. */
export function createCharlieRunTrain(line: CharlieRunLine) {
  const spec = VEHICLES[line];
  const lineColor = LINE_COLORS[line];
  const isSiemens = spec.fleet === "siemens";
  const length = spec.length;
  const width = spec.width;
  const roof = spec.height;
  const group = new THREE.Group();
  const materials: THREE.Material[] = [];
  const geometries: THREE.BufferGeometry[] = [];
  const textures: THREE.Texture[] = [];

  const material = (options: THREE.MeshStandardMaterialParameters) => {
    const value = new THREE.MeshStandardMaterial(options);
    materials.push(value);
    return value;
  };
  const boxMaterial = material({ color: "#bec5c5", metalness: 0.64, roughness: 0.39 });
  const brushedMetal = material({ color: "#d3d7d4", metalness: 0.72, roughness: 0.3 });
  const roofMaterial = material({ color: "#929a99", metalness: 0.55, roughness: 0.47 });
  const darkTrim = material({ color: "#20292c", metalness: 0.32, roughness: 0.4 });
  const blackGlass = material({ color: "#0d1a20", emissive: "#09141a", metalness: 0.42, roughness: 0.19 });
  const windowReflection = material({ color: "#9eb6bc", transparent: true, opacity: 0.19, roughness: 0.2, depthWrite: false });
  const doorMaterial = material({ color: "#7d8989", metalness: 0.64, roughness: 0.42 });
  const lineMaterial = material({ color: lineColor, metalness: 0.18, roughness: 0.48 });
  const cabMaterial = material({ color: isSiemens ? "#aeb7b6" : lineColor, metalness: isSiemens ? 0.63 : 0.15, roughness: isSiemens ? 0.38 : 0.5 });
  const whiteLight = material({ color: "#fff2d0", emissive: "#ffd77c", emissiveIntensity: 1.15, roughness: 0.25 });
  const redLight = material({ color: "#dc3029", emissive: "#8f0909", emissiveIntensity: 0.7, roughness: 0.3 });
  const logoBlue = material({ color: "#003da5", roughness: 0.5 });
  const logoWhite = material({ color: "#fffdf4", roughness: 0.4 });
  const rubber = material({ color: "#252a2b", metalness: 0.38, roughness: 0.7 });
  const metal = material({ color: "#aeb7b5", metalness: 0.86, roughness: 0.28 });

  const addMesh = <T extends THREE.BufferGeometry>(
    geometry: T,
    surface: THREE.Material,
    position: [number, number, number],
    rotation?: [number, number, number],
  ) => {
    geometries.push(geometry);
    const mesh = new THREE.Mesh(geometry, surface);
    mesh.position.set(...position);
    if (rotation) mesh.rotation.set(...rotation);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    return mesh;
  };
  const addBox = (
    dimensions: [number, number, number],
    surface: THREE.Material,
    position: [number, number, number],
    rotation?: [number, number, number],
  ) => addMesh(new THREE.BoxGeometry(...dimensions), surface, position, rotation);
  const addPanel = (
    panelWidth: number,
    panelHeight: number,
    radius: number,
    depth: number,
    surface: THREE.Material,
    position: [number, number, number],
    rotation?: [number, number, number],
  ) => addMesh(roundedPanel(panelWidth, panelHeight, radius, depth), surface, position, rotation);

  const body = addMesh(makeBodyGeometry(width, spec.height, length), boxMaterial, [0, 0, -length]);
  body.material = boxMaterial;

  // Lower skirt, stainless side belt, car end panels and the line-colored sill.
  addBox([width + 0.025, 0.52, length - 0.12], brushedMetal, [0, 0.83, -length / 2]);
  addBox([width + 0.04, 0.16, length - 0.12], lineMaterial, [0, 1.18, -length / 2]);
  addBox([width + 0.03, 0.1, length - 0.12], darkTrim, [0, 0.57, -length / 2]);
  addBox([width - 0.12, 0.075, length - 0.5], roofMaterial, [0, roof - 0.03, -length / 2]);

  // Roof-mounted HVAC enclosures and vent grilles visible on the CRRC and Siemens fleets.
  const roofUnitCount = Math.max(2, Math.round(length / 6.3));
  for (let index = 0; index < roofUnitCount; index += 1) {
    const z = -2.5 - index * ((length - 5) / Math.max(1, roofUnitCount - 1));
    addBox([1.18, 0.34, 2.05], roofMaterial, [0, roof + 0.17, z]);
    for (const side of [-1, 1]) {
      for (let vent = 0; vent < 4; vent += 1) {
        addBox([0.035, 0.1, 0.62], darkTrim, [side * 0.43, roof + 0.355, z - 0.53 + vent * 0.35]);
      }
    }
  }

  // Siemens 0700-series Blue Line cars use overhead pantographs as well as third rail.
  if (isSiemens) {
    const insulator = material({ color: "#363d3e", metalness: 0.22, roughness: 0.7 });
    for (const x of [-0.48, 0.48]) {
      addBox([0.18, 0.18, 0.52], insulator, [x, roof + 0.32, -length / 2]);
    }
    const yBottom = roof + 0.43;
    const yTop = roof + 1.18;
    const pantographMaterial = metal;
    const pantoZ = -length / 2;
    const footLeft = new THREE.Vector3(-0.53, yBottom, pantoZ);
    const footRight = new THREE.Vector3(0.53, yBottom, pantoZ);
    const kneeLeft = new THREE.Vector3(-0.18, yTop - 0.16, pantoZ);
    const kneeRight = new THREE.Vector3(0.18, yTop - 0.16, pantoZ);
    const contactLeft = new THREE.Vector3(-0.56, yTop, pantoZ);
    const contactRight = new THREE.Vector3(0.56, yTop, pantoZ);
    addBeam(group, geometries, footLeft, kneeRight, 0.045, pantographMaterial);
    addBeam(group, geometries, footRight, kneeLeft, 0.045, pantographMaterial);
    addBeam(group, geometries, kneeLeft, contactLeft, 0.04, pantographMaterial);
    addBeam(group, geometries, kneeRight, contactRight, 0.04, pantographMaterial);
    addBeam(group, geometries, contactLeft, contactRight, 0.035, pantographMaterial);
  }

  // End cab: CRRC cars have the colored cab surround; Siemens 0700 cars retain a stainless end.
  const faceWidth = width - (isSiemens ? 0.22 : 0.08);
  const faceHeight = (spec.height - BODY_BOTTOM) * (isSiemens ? 0.48 : 0.56);
  const faceCenterY = BODY_BOTTOM + (spec.height - BODY_BOTTOM) * (isSiemens ? 0.73 : 0.7);
  addPanel(faceWidth, faceHeight, 0.2, 0.075, cabMaterial, [0, faceCenterY, END_Z + 0.035]);
  addBox([width - 0.14, 0.19, 0.055], lineMaterial, [0, line === "blue" ? 1.55 : 1.18, 0.145]);

  const signY = roof - 0.18;
  const signTexture = textTexture(spec.destination, 74, "#ffd45e", "#10181b");
  textures.push(signTexture);
  const signMaterial = new THREE.MeshBasicMaterial({ map: signTexture, toneMapped: false });
  materials.push(signMaterial);
  addPanel(1.48, 0.34, 0.055, 0.08, darkTrim, [0, signY, 0.135]);
  const sign = addMesh(new THREE.PlaneGeometry(1.34, 0.23), signMaterial, [0, signY, 0.225]);
  sign.renderOrder = 3;

  // A dark framed twin-pane windshield sits below the destination board.
  const windshieldY = roof - 0.93;
  const windshieldWidth = width * 0.79;
  const windshieldHeight = 0.79;
  addPanel(windshieldWidth + 0.16, windshieldHeight + 0.14, 0.13, 0.07, darkTrim, [0, windshieldY, 0.13]);
  for (const side of [-1, 1] as const) {
    const paneWidth = (windshieldWidth - 0.1) / 2;
    const pane = addMesh(makeWindshieldPane(paneWidth, windshieldHeight, side), blackGlass, [side * (paneWidth / 2 + 0.025), windshieldY, 0.21]);
    pane.renderOrder = 2;
    const reflection = addMesh(
      new THREE.BoxGeometry(0.055, windshieldHeight * 0.78, 0.012),
      windowReflection,
      [side * (paneWidth / 2 + 0.14), windshieldY + 0.01, 0.268],
      [0, 0, side * -0.17],
    );
    reflection.renderOrder = 4;
    addBox([0.025, windshieldHeight * 0.86, 0.045], metal, [side * windshieldWidth * 0.49, windshieldY, 0.205]);
    addBox([paneWidth * 0.55, 0.025, 0.035], darkTrim, [side * (paneWidth / 2 + 0.025), windshieldY - 0.23, 0.27], [0, 0, side * 0.04]);
  }
  addBox([0.052, windshieldHeight + 0.04, 0.055], metal, [0, windshieldY, 0.24]);

  // Operator's end door, EXIT panel, T roundel, number plate and lower coupler.
  const doorWidth = 1.04;
  const frontDoorHeight = 2.02;
  const frontDoorY = BODY_BOTTOM + frontDoorHeight / 2 + 0.08;
  addPanel(doorWidth + 0.12, frontDoorHeight + 0.1, 0.055, 0.08, darkTrim, [0, frontDoorY, 0.11]);
  addPanel(doorWidth, frontDoorHeight, 0.045, 0.045, doorMaterial, [0, frontDoorY, 0.2]);
  addPanel(0.49, 0.62, 0.035, 0.035, blackGlass, [0, frontDoorY + 0.43, 0.265]);
  const exitTexture = textTexture("EXIT", 82, "#efffdb", "#17452d");
  textures.push(exitTexture);
  const exitMaterial = new THREE.MeshBasicMaterial({ map: exitTexture, toneMapped: false });
  materials.push(exitMaterial);
  addMesh(new THREE.PlaneGeometry(0.49, 0.13), exitMaterial, [0, frontDoorY + 0.91, 0.27]);

  const carNumber = spec.numberStart + Math.floor(Math.random() * spec.numberCount);
  const numberTexture = textTexture(String(carNumber).padStart(4, "0"), 76, "#f4f4ef", "#11191c");
  textures.push(numberTexture);
  const numberMaterial = new THREE.MeshBasicMaterial({ map: numberTexture, toneMapped: false });
  materials.push(numberMaterial);
  const frontNumberY = windshieldY - windshieldHeight / 2 - 0.19;
  addPanel(0.91, 0.25, 0.035, 0.05, darkTrim, [0, frontNumberY, 0.12]);
  addMesh(new THREE.PlaneGeometry(0.81, 0.16), numberMaterial, [0, frontNumberY, 0.18]);
  for (const side of [-1, 1] as const) {
    addMesh(new THREE.PlaneGeometry(0.68, 0.18), numberMaterial, [side * (width / 2 + 0.067), BODY_BOTTOM + 1.45, -2.1], [0, side * Math.PI / 2, 0]);
  }

  const roundelY = BODY_BOTTOM + 0.44;
  addMesh(new THREE.CircleGeometry(0.27, 40), logoBlue, [0, roundelY, 0.31]);
  addBox([0.075, 0.24, 0.045], logoWhite, [0, roundelY, 0.34]);
  addBox([0.19, 0.06, 0.045], logoWhite, [0, roundelY + 0.14, 0.34]);

  const lightSocket = material({ color: "#273033", metalness: 0.48, roughness: 0.38 });
  for (const side of [-1, 1]) {
    const x = side * (width * 0.35);
    addMesh(new THREE.CylinderGeometry(0.16, 0.16, 0.12, 24), lightSocket, [x, BODY_BOTTOM + 0.43, 0.2], [Math.PI / 2, 0, 0]);
    addMesh(new THREE.CylinderGeometry(0.12, 0.12, 0.14, 24), whiteLight, [x, BODY_BOTTOM + 0.43, 0.285], [Math.PI / 2, 0, 0]);
    for (let marker = 0; marker < 3; marker += 1) {
      addMesh(new THREE.CylinderGeometry(0.055, 0.055, 0.09, 16), redLight, [side * (width * 0.42), BODY_BOTTOM + 1.62 + marker * 0.15, 0.16], [Math.PI / 2, 0, 0]);
    }
  }
  addBox([0.55, 0.18, 0.55], rubber, [0, BODY_BOTTOM - 0.02, 0.28]);
  addBox([0.22, 0.28, 0.34], metal, [0, BODY_BOTTOM - 0.05, 0.62]);
  addBox([0.92, 0.12, 0.14], rubber, [0, BODY_BOTTOM + 0.1, 0.69]);

  // Passenger doors, glazed windows, car number plaques and panel seams on both sides.
  for (const side of [-1, 1] as const) {
    const x = side * (width / 2 + 0.028);
    const rotation: [number, number, number] = [0, side * Math.PI / 2, 0];
    const doorCenters = Array.from({ length: spec.doorsPerSide }, (_, index) => -length * (index + 1) / (spec.doorsPerSide + 1));
    for (const center of doorCenters) {
      addPanel(1.78, 2.48, 0.07, 0.06, darkTrim, [x, BODY_BOTTOM + 1.48, center], rotation);
      for (const leaf of [-1, 1]) {
        const leafZ = center + leaf * 0.39;
        addPanel(0.7, 2.34, 0.045, 0.055, doorMaterial, [x + side * 0.06, BODY_BOTTOM + 1.48, leafZ], rotation);
        addPanel(0.42, 0.72, 0.045, 0.045, blackGlass, [x + side * 0.115, BODY_BOTTOM + 1.83, leafZ], rotation);
      }
      addBox([0.028, 0.13, 0.12], metal, [x + side * 0.12, BODY_BOTTOM + 1.3, center]);
    }

    const windowCenters: number[] = [];
    for (let z = -1.25; z > -length + 0.6; z -= 1.73) {
      if (!doorCenters.some((center) => Math.abs(center - z) < 1.55)) windowCenters.push(z);
    }
    for (const z of windowCenters) {
      const sideWindowY = BODY_BOTTOM + 1.94;
      addPanel(1.18, 0.98, 0.12, 0.045, roofMaterial, [x, sideWindowY, z], rotation);
      const glass = addPanel(1.04, 0.84, 0.09, 0.04, blackGlass, [x + side * 0.055, sideWindowY, z], rotation);
      glass.renderOrder = 2;
      addBox([0.05, 0.7, 0.012], windowReflection, [x + side * 0.1, sideWindowY, z - 0.19], rotation);
    }

    for (const end of [-1.0, -length + 1.0]) {
      const logoZ = end;
      addMesh(new THREE.CircleGeometry(0.21, 36), logoBlue, [x + side * 0.02, BODY_BOTTOM + 1.02, logoZ], rotation);
      addBox([0.06, 0.2, 0.035], logoWhite, [x + side * 0.06, BODY_BOTTOM + 1.02, logoZ], rotation);
      addBox([0.17, 0.055, 0.035], logoWhite, [x + side * 0.06, BODY_BOTTOM + 1.14, logoZ], rotation);
    }

    for (let seam = -2.15; seam > -length + 0.8; seam -= 3.1) {
      addBox([0.035, spec.height * 0.54, 0.022], roofMaterial, [side * (width / 2 + 0.035), BODY_BOTTOM + 1.85, seam]);
    }
    addBox([0.028, 0.19, length - 0.18], lineMaterial, [side * (width / 2 + 0.025), line === "blue" ? 1.55 : 1.18, -length / 2]);
    addBox([0.035, 0.045, length - 0.25], metal, [side * (width / 2 + 0.03), BODY_BOTTOM + 3.0, -length / 2]);
  }

  // Trucks, axles, wheel faces and underfloor equipment, dimensioned to the car length.
  addBox([width * 0.72, 0.43, length * 0.62], darkTrim, [0, BODY_BOTTOM + 0.18, -length / 2]);
  for (const truckZ of [-1.9, -length + 1.9]) {
    addBox([width * 0.76, 0.22, 1.78], rubber, [0, BODY_BOTTOM + 0.2, truckZ]);
    addBox([width * 0.66, 0.15, 1.1], roofMaterial, [0, BODY_BOTTOM + 0.36, truckZ]);
    for (const axleOffset of [-0.55, 0.55]) {
      const axleZ = truckZ + axleOffset;
      addMesh(new THREE.CylinderGeometry(0.075, 0.075, width * 0.74, 16), metal, [0, BODY_BOTTOM + WHEEL_RADIUS, axleZ], [0, 0, Math.PI / 2]);
      for (const side of [-1, 1]) {
        const x = side * (width / 2 + 0.1);
        addMesh(new THREE.CylinderGeometry(WHEEL_RADIUS, WHEEL_RADIUS, 0.2, 32), rubber, [x, BODY_BOTTOM + WHEEL_RADIUS, axleZ], [0, 0, Math.PI / 2]);
        addMesh(new THREE.CylinderGeometry(0.2, 0.2, 0.215, 24), metal, [x + side * 0.12, BODY_BOTTOM + WHEEL_RADIUS, axleZ], [0, 0, Math.PI / 2]);
      }
    }
  }

  return {
    group,
    dispose() {
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((entry) => entry.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
