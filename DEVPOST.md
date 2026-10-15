# CardioVision 3D: Multimodal Cardiovascular Risk & Coronary Stenosis Mapping

> **Bridging Clinical Statistics with Spatial Anatomy:** An explainable AI decision-support platform that predicts vessel-specific coronary stenosis from non-invasive clinical biomarkers and projects predictions in real time onto an interactive, photorealistic 3D digital twin of the human heart.

---

## Inspiration

Cardiovascular disease (CVD) is the world’s leading cause of death, claiming an estimated 17.9 million lives each year. While modern predictive algorithms can estimate cardiovascular risk with impressive statistical precision, clinicians and patients are routinely confronted with abstract numerical probabilities (e.g., *"78% CAD risk"*) or dense tabular spreadsheets.

Raw numbers fail to convey spatial, physiological intuition:
- *Which specific coronary vessel is compromised?*
- *Is it the Left Anterior Descending ("widow-maker") artery, the Left Circumflex, or the Right Coronary Artery?*
- *What physiological drivers (precordial ST-elevation, regional wall motion abnormalities, atherogenic lipid ratios) are driving the prediction?*

We built **CardioVision 3D** to bridge the gap between predictive machine learning and spatial clinical reality. By pairing zero-leakage ensemble predictive models with an interactive, photorealistic 3D digital twin, CardioVision 3D empowers cardiologists, primary care physicians, and patients to explore disease progression where it physically happens.

---

## What it does

CardioVision 3D provides an end-to-end clinical workflow connecting multimodal patient inputs to 3D spatial risk maps:

1. **Vessel-Specific Stenosis Prediction (Zero Target Leakage)**:
   - Predicts overall **Coronary Artery Disease (CAD)** status.
   - Predicts vessel-specific stenosis ($\ge 50\%$ lumen narrowing) for:
     - **LAD (Left Anterior Descending)**: Supplies the anterior ventricular wall and apex.
     - **LCX (Left Circumflex)**: Supplies the posterolateral left ventricle.
     - **RCA (Right Coronary Artery)**: Supplies the right ventricle, inferior wall, and conduction system.
   - Strictly excludes `LAD`, `LCX`, `RCA`, and `Cath` from the training feature matrix to guarantee clinical validity and eliminate target leakage.

2. **Photorealistic 3D Anatomical Human Heart**:
   - Built on a high-fidelity 3D anatomical organ model with baked PBR textures: striated helical myocardial muscle fibers, epicardial adipose fat cushions along the sulci, aortic arch with 3 supra-aortic branches, pulmonary trunk with bifurcation, and vena cavae.
   - **Wet Serosa Physical Shading**: Realistic pericardial fluid clearcoat reflections (`clearcoat: 0.88`, `clearcoatRoughness: 0.14`) and multi-source surgical studio lighting.
   - **Physiological Biomechanics**: Bi-phasic ventricular contraction with Torrent-Guasp helical apex wringing torsion synchronized to the patient’s real heart rate (BPM).

3. **Surface-Mapped Coronary Risk Tree**:
   - The LAD (with D1 & D2 diagonals), LCX (with OM1 & OM2 marginals), RCA (with Acute Marginal & PDA), and Great Cardiac Vein follow the exact anatomical sulci on the organ's surface.
   - Color-coded via an accessible, continuous colorblind-safe risk ramp:
     $$\text{Risk Color} = \begin{cases} \text{Teal } (\#10\text{b}981) & \text{if } p < 30\% \text{ (Normal)} \\ \text{Amber } (\#\text{f}59\text{e}0\text{b}) & \text{if } 30\% \le p < 60\% \text{ (Borderline)} \\ \text{Red } (\#\text{ef}4444) & \text{if } p \ge 60\% \text{ (Significant Stenosis)} \end{cases}$$
   - Pulsing emissive halos dynamically highlight critical stenosis warning sites.

4. **Dual Anatomical Modes & Opacity Slider**:
   - **🫀 100% Solid Red Heart**: Solid, deeply saturated crimson cardiac muscle with glistening serosa reflections.
   - **🔍 Transparent Heart**: 12% opacity glass transmission allowing physicians to inspect internal coronary branching through translucent myocardium.
   - **Granular Opacity Slider**: Smooth continuous control from 8% to 100% opacity.

5. **Explainable AI (TreeSHAP)**:
   - Decomposes every prediction into patient-specific risk drivers (e.g., precordial ST-elevation, echocardiographic RWMA, TyG index, LDL/HDL ratio), ensuring transparent clinical decision auditing.

6. **Comprehensive Input & Upload Suite**:
   - **Direct Input Form**: Instant editing of vitals, demographics, ECG, and blood labs.
   - **Drag-and-Drop File Upload**: Instant parser for custom `.json` or `.csv` patient records.
   - **Pre-Built Benchmark Cases**: 5 pre-packaged clinical archetypes (Severe Triple-Vessel CAD, Anterior Ischemia, Healthy Control, Borderline Angina, and RCA Stenosis).

---

## How we built it

CardioVision 3D was engineered with a modular, decoupled full-stack architecture:

### 1. Machine Learning & Statistical Modeling
- **Dataset**: Built upon the *Z-Alizadeh Sani* dataset comprising demographic, physical examination, laboratory, ECG, and echocardiographic features.
- **Ensemble Pipelines**: Multi-target classification pipelines using **XGBoost**, **LightGBM**, and **Random Forest** with calibrated probability outputs.
- **Loss Optimization**: Trained with binary cross-entropy loss across all 4 clinical targets:
  $$\mathcal{L} = -\frac{1}{N} \sum_{i=1}^N \Big[ y_i \ln \hat{p}_i + (1 - y_i) \ln (1 - \hat{p}_i) \Big]$$
- **Explainability**: Integrated **TreeSHAP** based on cooperative game theory to compute exact marginal feature attributions:
  $$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \Big[ f_x(S \cup \{i\}) - f_x(S) \Big]$$

### 2. 3D Graphics & Biomechanical Simulation
- **Three.js & WebGL**: Custom GLTF loader pipeline with PBR `MeshPhysicalMaterial` parameters.
- **Parametric Splines**: Catmull-Rom 3D curves aligned with millimeter precision to the ventricular sulci.
- **Interactive Raycasting**: Mouse hover and click hit-testing for anatomical vessel inspection and camera focus tracking.

### 3. Backend & Frontend Architecture
- **Backend**: Python 3.12, Flask REST API with zero-cache control headers and CORS.
- **Frontend**: Vanilla ES6+ JavaScript, CSS3 Design Tokens with dark-mode glassmorphism, responsive CSS Grid/Flexbox, and accessible typography.

---

## Challenges we ran into

1. **Target Leakage Prevention**: In cardiovascular tabular data, certain variables (e.g., catheterization findings or direct vessel flags) can easily leak into training sets. We enforced strict clinical feature separation to ensure predictions rely solely on non-invasive vitals, labs, and ECG.
2. **Anatomical Alignment in 3D Space**: Aligning mathematical Catmull-Rom spline curves to the organic, irregular sulcal valleys of a 3D heart mesh required calculating surface normals across multiple cross-sectional slices to avoid vessels clipping inside muscle walls.
3. **Balancing Biological Shading with 60 FPS Performance**: Achieving lifelike organic tissue with clearcoat serosa glistening without frame drops required optimized PBR texture caching and efficient shadow-map bias tuning.
4. **Environment & Binary Dependencies**: Resolving Windows Code Integrity and Smart App Control policies for scientific C-extensions by locking compatible, signed wheels (`numpy==2.2.0`).

---

## Accomplishments that we're proud of

- **Strict Zero Target Leakage**: Successfully trained 4 robust clinical classifiers (CAD, LAD, LCX, RCA) achieving strong diagnostic ROC-AUC without using any invasive catheterization inputs.
- **Photorealistic Medical Visual Fidelity**: Elevating the 3D heart from simple geometric primitives to an authentic anatomical human heart with living tissue textures, epicardial fat pads, and glistening serosa clearcoat.
- **Fluid Multi-Modal Interaction**: Seamlessly connecting raw patient JSON/CSV uploads to real-time 3D vessel recoloring, SHAP feature waterfalls, and pulse rate synchronization in under 150 milliseconds.
- **Intuitive Dual Appearance Modes**: Implementing both a 100% solid red muscular heart and a 100% transparent glass heart with smooth opacity controls to satisfy both anatomical realism and internal vessel diagnostic inspection.

---

## What we learned

- **Clinical Feature Interactions**: How composite markers like the Triglyceride-Glucose (TyG) index and Rate-Pressure Product (RPP) significantly amplify the predictive power of classical ECG findings.
- **The Value of Spatial UI in Medicine**: In clinical AI, *how* you communicate risk is just as critical as the algorithm's AUC score. A 3D spatial twin builds immediate trust and understanding compared to a black-box percentage.
- **WebGL Shader Optimization**: How clearcoat, transmission, and roughness parameters in `MeshPhysicalMaterial` interact with multi-source lighting to simulate wet biological tissues.

---

## What's next for CardioVision 3D

- **DICOM CT/MRI Ingestion**: Automated patient-specific mesh generation directly from standard Coronary Computed Tomography Angiography (CCTA) scans.
- **Deep 1D-CNN Raw ECG Waveform Processing**: Processing full 12-lead raw rhythm strips instead of tabularized ECG flags.
- **Time-Series Longitudinal Tracking**: Visualizing coronary plaque progression or regression across multi-year patient checkups in 3D.
- **Multi-Language Patient Explainer**: Generating natural-language patient summaries in layman's terms to empower shared decision-making between doctors and patients.
