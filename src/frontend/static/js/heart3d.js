/**
 * CARDIOVISION 3D - REALISTIC ANATOMICAL HUMAN HEART VISUALIZER
 * 
 * Medical & Anatomical Precision Features:
 * - High-Resolution Anatomical 3D Mesh (GLB) with Baked PBR Textures:
 *   Photorealistic myocardial muscle striations, epicardial adipose fat pads,
 *   aorta with arch, pulmonary trunk with bifurcation, vena cavae, atria & auricles.
 * - Dynamic Physical Shaders:
 *   Living wet serosa clearcoat, organic specular highlights, and subsurface feel.
 * - Surface-Mapped Coronary Artery Trees (LAD, LCX, RCA) with branches (D1, D2, OM, AM, PDA)
 *   and companion cardiac veins (Great Cardiac Vein, Coronary Sinus).
 * - Real-Time Colorblind-Safe Risk Color Ramp:
 *   Teal (<30%) -> Amber (30-60%) -> Red (>60%) with pulsating emissive warning halos.
 * - 100% Solid Red Heart Mode & 100% Transparent Glass Mode with smooth 8%-100% opacity slider.
 * - Physiological Cardiac Cycle Beating with Torrent-Guasp helical apex torsion.
 */

class Heart3DViewer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`Container #${containerId} not found`);
      return;
    }

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();
    
    // Meshes and groups
    this.heartGroup = new THREE.Group();
    this.modelMeshes = [];
    this.originalMaterials = new Map();
    this.vessels = {
      lad: { mesh: null, glow: null, prob: 0.15, name: 'LAD (Left Anterior Descending)' },
      lcx: { mesh: null, glow: null, prob: 0.15, name: 'LCX (Left Circumflex Artery)' },
      rca: { mesh: null, glow: null, prob: 0.15, name: 'RCA (Right Coronary Artery)' }
    };
    this.interactiveVesselMeshes = [];
    
    // Animation state
    this.heartRate = 75; // BPM
    this.isBeating = true;
    this.isXRay = false;
    this.heartAppearanceMode = 'default';
    this.selectedVesselKey = null;
    this.clock = new THREE.Clock();

    this.initScene();
    this.loadRealisticHeartModel();
    this.buildSurfaceCoronaryArteries();
    this.setupInteractions();
    this.animate();
  }

  // -----------------------------------------------------------------
  // 1. SCENE & CINEMATIC SURGICAL THEATER LIGHTING
  // -----------------------------------------------------------------
  initScene() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x060913);
    this.scene.fog = new THREE.FogExp2(0x060913, 0.025);

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 0.1, 5.8);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.35;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(this.renderer.domElement);

    if (typeof THREE.OrbitControls !== 'undefined') {
      this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
      this.controls.enableDamping = true;
      this.controls.dampingFactor = 0.06;
      this.controls.minDistance = 2.8;
      this.controls.maxDistance = 12;
      this.controls.target.set(0, 0.0, 0);
    }

    // Professional Multi-Source Surgical Lighting:
    // 1. Soft Ambient Illumination
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.95);
    this.scene.add(ambientLight);

    // 2. Main Surgical Overhead Key Light
    const surgicalKey = new THREE.DirectionalLight(0xffffff, 1.8);
    surgicalKey.position.set(4, 7, 5);
    surgicalKey.castShadow = true;
    surgicalKey.shadow.bias = -0.0005;
    this.scene.add(surgicalKey);

    // 3. Cool Cyan Rim Light (Outlines aortic arch and muscular borders)
    const cyanRim = new THREE.DirectionalLight(0x38bdf8, 1.3);
    cyanRim.position.set(-5, 0.5, -4);
    this.scene.add(cyanRim);

    // 4. Warm Cavity Subsurface Bounce (Deep living tissue glow)
    const cavityBounce = new THREE.PointLight(0xf43f5e, 1.2, 12);
    cavityBounce.position.set(0, -2.5, 2.5);
    this.scene.add(cavityBounce);

    // 5. Fill Light from Right Lateral
    const lateralFill = new THREE.DirectionalLight(0xffedd5, 1.0);
    lateralFill.position.set(5, -1, 3);
    this.scene.add(lateralFill);

    this.scene.add(this.heartGroup);
    window.addEventListener('resize', () => this.onWindowResize());
  }

  // -----------------------------------------------------------------
  // 2. LOAD HIGH-RESOLUTION ANATOMICAL 3D HEART MODEL (GLB)
  // -----------------------------------------------------------------
  loadRealisticHeartModel() {
    if (typeof THREE.GLTFLoader === 'undefined') {
      console.warn('GLTFLoader not available, building fallback model');
      this.buildFallbackModel();
      return;
    }

    const loader = new THREE.GLTFLoader();
    loader.load(
      '/static/models/heart.glb',
      (gltf) => {
        const model = gltf.scene;

        // Traverse all meshes and configure biological materials
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            // Enhance material with glistening serosa clearcoat
            if (child.material) {
              const origMat = child.material.clone();
              this.originalMaterials.set(child, origMat);

              child.material.roughness = 0.32;
              child.material.metalness = 0.05;
              child.material.clearcoat = 0.88;
              child.material.clearcoatRoughness = 0.14;
              child.material.transparent = true;
              child.material.opacity = 0.96;
            }

            this.modelMeshes.push(child);
          }
        });

        // Center and scale the model for optimal camera framing
        model.scale.set(2.4, 2.4, 2.4);
        model.position.set(0, 0.05, 0);

        this.heartGroup.add(model);
        this.heartModel = model;

        console.log('✅ Realistic Anatomical Human Heart Model Loaded Successfully');
      },
      undefined,
      (err) => {
        console.warn('Could not load /static/models/heart.glb, building fallback model', err);
        this.buildFallbackModel();
      }
    );
  }

  // Procedural anatomical fallback in case model file cannot load
  buildFallbackModel() {
    const geo = new THREE.SphereGeometry(1.4, 48, 48);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      if (y < 0.2) {
        const taper = 1.0 + (y / 1.4) * 0.55;
        x *= Math.max(0.2, taper);
        z *= Math.max(0.2, taper);
        x -= (y / 1.4) * 0.45;
      }
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      color: 0x9b1c2b,
      roughness: 0.35,
      metalness: 0.08,
      clearcoat: 0.85,
      transparent: true,
      opacity: 0.95
    });
    const mesh = new THREE.Mesh(geo, mat);
    this.heartGroup.add(mesh);
    this.modelMeshes.push(mesh);
  }

  // -----------------------------------------------------------------
  buildSurfaceCoronaryArteries() {
    const addBranch = (points, radius, mat, name, isTargetKey = null) => {
      const curve = new THREE.CatmullRomCurve3(points);
      const geo = new THREE.TubeGeometry(curve, 44, radius, 16, false);
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = true;
      if (isTargetKey) {
        mesh.userData = { key: isTargetKey, name: name };
        this.vessels[isTargetKey].mesh = mesh;
        this.interactiveVesselMeshes.push(mesh);
      }
      this.heartGroup.add(mesh);
      return mesh;
    };

    // 1. LAD - LEFT ANTERIOR DESCENDING ARTERY (Target Vessel 1)
    // Runs right along the anterior interventricular sulcus down to the cardiac apex
    const ladPoints = [
      new THREE.Vector3(-0.02, 0.55, 1.02),   // Origin from Left Main
      new THREE.Vector3(-0.20, 0.24, 1.12),
      new THREE.Vector3(-0.16, -0.05, 1.18),
      new THREE.Vector3(-0.12, -0.36, 1.21),  // Mid-LAD (anterior sulcus crest)
      new THREE.Vector3(-0.22, -0.72, 1.14),  // Distal LAD
      new THREE.Vector3(-0.02, -1.10, 0.96),
      new THREE.Vector3(0.09, -1.50, 0.74),   // Pre-apex
      new THREE.Vector3(0.20, -1.80, 0.44)    // Cardiac apex
    ];
    const ladMat = this.createVesselMaterial(this.vessels.lad.prob);
    addBranch(ladPoints, 0.055, ladMat, 'LAD (Left Anterior Descending)', 'lad');

    // LAD Diagonal 1 (D1) branch - courses across anterolateral LV wall
    addBranch([
      new THREE.Vector3(-0.16, -0.05, 1.18),
      new THREE.Vector3(-0.48, -0.15, 1.10),
      new THREE.Vector3(-0.82, -0.38, 0.92),
      new THREE.Vector3(-1.08, -0.72, 0.62)
    ], 0.038, ladMat, 'LAD Diagonal 1 (D1)');

    // LAD Diagonal 2 (D2) branch
    addBranch([
      new THREE.Vector3(-0.22, -0.72, 1.14),
      new THREE.Vector3(-0.48, -0.78, 1.05),
      new THREE.Vector3(-0.75, -0.95, 0.78)
    ], 0.032, ladMat, 'LAD Diagonal 2 (D2)');

    // 2. LCX - LEFT CIRCUMFLEX ARTERY (Target Vessel 2)
    // Traverses left atrioventricular groove under left auricle
    const lcxPoints = [
      new THREE.Vector3(-0.18, 0.52, 0.85),   // Left Main bifurcation
      new THREE.Vector3(-0.55, 0.44, 0.55),
      new THREE.Vector3(-0.95, 0.32, 0.28),
      new THREE.Vector3(-1.30, 0.18, 0.05),   // Left obtuse margin
      new THREE.Vector3(-1.38, -0.08, -0.15),
      new THREE.Vector3(-1.26, -0.32, -0.36),
      new THREE.Vector3(-0.85, -0.45, -0.55)  // Posterior left ventricle
    ];
    const lcxMat = this.createVesselMaterial(this.vessels.lcx.prob);
    addBranch(lcxPoints, 0.052, lcxMat, 'LCX (Left Circumflex Artery)', 'lcx');

    // LCX Obtuse Marginal 1 (OM1) branch
    addBranch([
      new THREE.Vector3(-1.30, 0.18, 0.05),
      new THREE.Vector3(-1.35, -0.15, 0.04),
      new THREE.Vector3(-1.26, -0.55, 0.12),
      new THREE.Vector3(-1.05, -0.95, 0.22)
    ], 0.038, lcxMat, 'LCX Obtuse Marginal (OM1)');

    // LCX Obtuse Marginal 2 (OM2) branch
    addBranch([
      new THREE.Vector3(-1.38, -0.08, -0.15),
      new THREE.Vector3(-1.28, -0.45, -0.22),
      new THREE.Vector3(-1.08, -0.82, -0.22)
    ], 0.032, lcxMat, 'LCX Marginal 2 (OM2)');

    // 3. RCA - RIGHT CORONARY ARTERY (Target Vessel 3)
    // Arises from right aortic sinus, descends along right atrioventricular groove
    const rcaPoints = [
      new THREE.Vector3(0.20, 0.52, 0.72),    // Right aortic sinus
      new THREE.Vector3(0.58, 0.42, 0.42),
      new THREE.Vector3(0.95, 0.22, -0.05),   // Right AV groove
      new THREE.Vector3(1.02, -0.15, -0.22),
      new THREE.Vector3(0.96, -0.55, -0.20),
      new THREE.Vector3(0.75, -0.85, -0.32),  // Crux of heart
      new THREE.Vector3(0.40, -1.15, -0.42)   // Posterior Descending Artery (PDA)
    ];
    const rcaMat = this.createVesselMaterial(this.vessels.rca.prob);
    addBranch(rcaPoints, 0.054, rcaMat, 'RCA (Right Coronary Artery)', 'rca');

    // RCA Acute Marginal (AM) branch across RV wall
    addBranch([
      new THREE.Vector3(0.98, -0.15, 0.02),
      new THREE.Vector3(0.85, -0.48, 0.22),
      new THREE.Vector3(0.65, -0.88, 0.32)
    ], 0.036, rcaMat, 'RCA Acute Marginal (AM)');

    // 4. COMPANION CARDIAC VEINS (Venous Drainage in Cyan-Blue)
    const veinMat = new THREE.MeshStandardMaterial({
      color: 0x0284c7,
      roughness: 0.32,
      metalness: 0.15,
      transparent: true,
      opacity: 0.85
    });

    // Great Cardiac Vein (accompanies LAD up anterior sulcus)
    addBranch([
      new THREE.Vector3(0.08, -1.45, 0.78),
      new THREE.Vector3(-0.04, -1.05, 0.99),
      new THREE.Vector3(-0.20, -0.68, 1.18),
      new THREE.Vector3(-0.08, -0.32, 1.25),
      new THREE.Vector3(-0.14, -0.02, 1.22),
      new THREE.Vector3(-0.18, 0.28, 1.15),
      new THREE.Vector3(-0.04, 0.58, 1.05)
    ], 0.048, veinMat, 'Great Cardiac Vein');

    // Coronary Sinus (Large posterior venous trunk)
    addBranch([
      new THREE.Vector3(-0.85, -0.45, -0.55),
      new THREE.Vector3(-0.35, -0.42, -0.62),
      new THREE.Vector3(0.15, -0.38, -0.58),
      new THREE.Vector3(0.65, -0.32, -0.42)
    ], 0.075, veinMat, 'Coronary Sinus');

    // 5. Pulsing Emissive Warning Markers on High-Stenosis Sites
    ['lad', 'lcx', 'rca'].forEach(k => {
      const glowGeo = new THREE.SphereGeometry(0.11, 16, 16);
      const glowMat = new THREE.MeshBasicMaterial({
        color: 0xef4444,
        transparent: true,
        opacity: 0.80
      });
      const glow = new THREE.Mesh(glowGeo, glowMat);
      glow.visible = false;
      this.heartGroup.add(glow);
      this.vessels[k].glow = glow;
    });

    this.vessels.lad.glow.position.set(-0.12, -0.36, 1.21);
    this.vessels.lcx.glow.position.set(-1.30, 0.18, 0.05);
    this.vessels.rca.glow.position.set(0.98, -0.15, 0.02);
  }

  // -----------------------------------------------------------------
  // 4. COLORBLIND-SAFE RISK MATERIALS & APPEARANCE MODES
  // -----------------------------------------------------------------
  createVesselMaterial(prob) {
    const color = this.getRiskColor(prob);
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: 0.24,
      metalness: 0.25,
      emissive: prob >= 0.60 ? color : new THREE.Color(0x000000),
      emissiveIntensity: prob >= 0.60 ? 0.45 : 0.0
    });
  }

  getRiskColor(prob) {
    // Teal/Emerald (<30%) -> Amber/Yellow (30-60%) -> Red (>60%)
    if (prob < 0.30) {
      const t = prob / 0.30;
      return new THREE.Color(0x10b981).lerp(new THREE.Color(0xf59e0b), t);
    } else {
      const t = Math.min(1.0, (prob - 0.30) / 0.70);
      return new THREE.Color(0xf59e0b).lerp(new THREE.Color(0xef4444), t);
    }
  }

  updateVesselProbabilities(probMap) {
    for (const [key, prob] of Object.entries(probMap)) {
      if (this.vessels[key]) {
        this.vessels[key].prob = prob;
        const color = this.getRiskColor(prob);
        if (this.vessels[key].mesh) {
          this.vessels[key].mesh.material.color.copy(color);
          if (prob >= 0.60) {
            this.vessels[key].mesh.material.emissive.copy(color);
            this.vessels[key].mesh.material.emissiveIntensity = 0.45;
          } else {
            this.vessels[key].mesh.material.emissive.setHex(0x000000);
            this.vessels[key].mesh.material.emissiveIntensity = 0.0;
          }
        }
        if (this.vessels[key].glow) {
          this.vessels[key].glow.material.color.copy(color);
          this.vessels[key].glow.visible = prob >= 0.30;
        }
      }
    }
  }

  setPulseRate(bpm) {
    this.heartRate = Math.max(40, Math.min(180, bpm));
  }

  // 100% Solid Red Heart Mode
  setSolidRedHeart() {
    this.heartAppearanceMode = 'solid';
    this.isXRay = false;
    this.modelMeshes.forEach(mesh => {
      mesh.material.transparent = false;
      mesh.material.opacity = 1.0;
      mesh.material.roughness = 0.30;
      mesh.material.metalness = 0.06;
      mesh.material.clearcoat = 0.95;
      mesh.material.clearcoatRoughness = 0.12;
      mesh.material.transmission = 0.0;
      if (mesh.material.color) {
        mesh.material.color.setHex(0xa11d27); // Solid deep cardiac red
      }
    });
  }

  // 100% Transparent Glass Heart Mode
  setTransparentHeart() {
    this.heartAppearanceMode = 'transparent';
    this.isXRay = true;
    this.modelMeshes.forEach(mesh => {
      mesh.material.transparent = true;
      mesh.material.opacity = 0.14;
      mesh.material.roughness = 0.06;
      mesh.material.metalness = 0.10;
      if (mesh.material.transmission !== undefined) {
        mesh.material.transmission = 0.94;
      }
      if (mesh.material.color) {
        mesh.material.color.setHex(0xffffff);
      }
    });
  }

  // Smooth Granular Opacity Slider (8% - 100%)
  setHeartOpacity(percent) {
    const p = Math.max(0.08, Math.min(1.0, percent / 100.0));
    if (p >= 0.98) {
      this.setSolidRedHeart();
    } else if (p <= 0.15) {
      this.setTransparentHeart();
    } else {
      this.heartAppearanceMode = 'custom';
      this.isXRay = p < 0.45;
      this.modelMeshes.forEach(mesh => {
        mesh.material.transparent = true;
        mesh.material.opacity = p;
        mesh.material.roughness = 0.10 + (p * 0.25);
        mesh.material.clearcoat = 0.85;
        if (mesh.material.transmission !== undefined) {
          mesh.material.transmission = Math.max(0, 0.65 * (1 - p));
        }
        if (mesh.material.color) {
          mesh.material.color.setHex(0xa11d27);
        }
      });
    }
  }

  setXRayMode(enabled) {
    if (enabled) {
      this.setTransparentHeart();
    } else {
      this.setHeartOpacity(96);
    }
  }

  // -----------------------------------------------------------------
  // 5. CAMERA FOCUS & RAYCASTER INTERACTION
  // -----------------------------------------------------------------
  focusOnVessel(vesselKey) {
    this.selectedVesselKey = vesselKey;
    let targetPos = new THREE.Vector3(0, 0.1, 5.8);

    if (vesselKey === 'lad') {
      // Anterior focus on LAD down the anterior sulcus
      targetPos.set(-0.25, -0.2, 4.4);
    } else if (vesselKey === 'lcx') {
      // Left lateral focus on LCX obtuse margin
      targetPos.set(-4.2, 0.1, 1.8);
    } else if (vesselKey === 'rca') {
      // Right lateral focus on RCA along AV groove
      targetPos.set(4.2, 0.1, 1.8);
    } else {
      // Default orbit perspective
      targetPos.set(0, 0.1, 5.8);
    }

    this.animateCameraTo(targetPos);
  }

  animateCameraTo(targetPosition) {
    const startPos = this.camera.position.clone();
    const duration = 650;
    const startTime = performance.now();

    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1.0);
      const ease = progress < 0.5 
        ? 4 * progress * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      this.camera.position.lerpVectors(startPos, targetPosition, ease);
      if (this.controls) this.controls.target.set(0, 0, 0);

      if (progress < 1.0) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  setupInteractions() {
    this.container.addEventListener('mousemove', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveVesselMeshes);

      if (intersects.length > 0) {
        this.container.style.cursor = 'pointer';
      } else {
        this.container.style.cursor = 'grab';
      }
    });

    this.container.addEventListener('click', (e) => {
      const rect = this.container.getBoundingClientRect();
      this.mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      this.mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      this.raycaster.setFromCamera(this.mouse, this.camera);
      const intersects = this.raycaster.intersectObjects(this.interactiveVesselMeshes);

      if (intersects.length > 0) {
        const clickedVessel = intersects[0].object.userData.key;
        if (clickedVessel) {
          this.focusOnVessel(clickedVessel);
          if (window.onVesselSelected) {
            window.onVesselSelected(clickedVessel, this.vessels[clickedVessel].prob);
          }
        }
      }
    });
  }

  // -----------------------------------------------------------------
  // 6. PHYSIOLOGICAL CARDIAC CYCLE BEATING ANIMATION
  // -----------------------------------------------------------------
  animate() {
    requestAnimationFrame(() => this.animate());

    const elapsedTime = this.clock.getElapsedTime();

    if (this.isBeating) {
      const freq = (this.heartRate / 60) * Math.PI * 2;
      const t = elapsedTime * freq;

      // Realistic bi-phasic cardiac contraction
      const systole = Math.pow(Math.max(0, Math.sin(t)), 4);
      const pulseScaleY = 1.0 - systole * 0.040; // longitudinal shortening
      const pulseScaleXZ = 1.0 + systole * 0.048; // radial recoil
      this.heartGroup.scale.set(pulseScaleXZ, pulseScaleY, pulseScaleXZ);

      // Helical apex wringing torsion (Torrent-Guasp biomechanics)
      this.heartGroup.rotation.y = Math.sin(t) * 0.028;

      // Pulsing glow warning on high-risk vessels
      ['lad', 'lcx', 'rca'].forEach(k => {
        if (this.vessels[k].glow && this.vessels[k].glow.visible) {
          const glowScale = 1.0 + Math.sin(elapsedTime * 6) * 0.28;
          this.vessels[k].glow.scale.set(glowScale, glowScale, glowScale);
        }
      });
    }

    if (this.controls) this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  onWindowResize() {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}

window.Heart3DViewer = Heart3DViewer;
