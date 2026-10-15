# CardioVision 3D: Cardiovascular Risk Visualization & Multimodal Prediction System
**Multimodal AI Hackathon 2026 — Track A Deliverable**

---

## 1. Executive Summary & Clinical Context
Cardiovascular disease remains the leading cause of mortality worldwide. Conventional clinical risk calculators typically output isolated percentages (e.g., Framingham score), leaving clinicians and patients without an intuitive, spatial understanding of where coronary pathology is developing.

**CardioVision 3D** bridges this gap by marrying machine learning and 3D anatomical visualization:
1. **Predictive AI**: Predicts overall Coronary Artery Disease (**CAD**) status along with vessel-specific stenosis probabilities for the 3 primary coronary arteries:
   - **LAD** (*Left Anterior Descending* — anterior wall & septum)
   - **LCX** (*Left Circumflex* — lateral & posterior wall)
   - **RCA** (*Right Coronary Artery* — inferior wall & conduction system)
2. **Interactive 3D Anatomical Mapping**: Spatially projects predicted vessel stenosis probabilities onto a 3D anatomical heart model in real-time, color-coding vessels (Emerald Green $\rightarrow$ Amber $\rightarrow$ Crimson Red) with pulsing stenosis lesions and hemodynamic heartbeat synchronization.
3. **Explainable AI (XAI)**: Provides SHAP (SHapley Additive exPlanations) local feature attribution waterfalls, revealing the specific clinical drivers (vital signs, ECG, laboratory values) that elevated or lowered the patient's risk profile.

---

## 2. System Architecture
```
+------------------------------------------------------------------------------------+
|                                    USER INTERFACE                                  |
|   +--------------------------+  +------------------------+  +--------------------+ |
|   | Patient Clinical Inputs  |  |   Interactive 3D Heart |  | Clinical Dashboard | |
|   | - Demographics & Vitals  |  |   - Three.js WebGL     |  | - CAD Radial Gauge | |
|   | - ECG & Echocardiography |  |   - LAD / LCX / RCA    |  | - Vessel Bars      | |
|   | - Blood Laboratories     |  |   - Click-to-inspect   |  | - SHAP Waterfall   | |
|   +--------------------------+  +------------------------+  +--------------------+ |
+------------------------------------------^-----------------------------------------+
                                           | REST API / JSON
+------------------------------------------v-----------------------------------------+
|                                  BACKEND SERVER                                    |
|   - Flask / Python microservice (`src/backend/app.py`)                             |
|   - Real-time inference endpoint: `POST /api/predict`                              |
|   - Validation metrics endpoint:  `GET /api/metrics`                               |
+------------------------------------------^-----------------------------------------+
                                           | Feature Vector
+------------------------------------------v-----------------------------------------+
|                                MACHINE LEARNING ENGINE                             |
|   +------------------------------------+   +------------------------------------+  |
|   | Preprocessing & Leakage Prevention |   | Multi-Target Calibrated Ensembles  |  |
|   | - 55 Informative Features          |   | - CAD Model (Cath: CAD vs Normal)  |  |
|   | - Excludes LAD, LCX, RCA, Cath     |   | - LAD Stenosis Classifier          |  |
|   | - Median Imputation & Z-Scaling    |   | - LCX Stenosis Classifier          |  |
|   +------------------------------------+   | - RCA Stenosis Classifier          |  |
|                                            +------------------------------------+  |
|   +-----------------------------------------------------------------------------+  |
|   | SHAP Explainability Engine (`src/ml/explain.py`)                            |  |
|   | - TreeExplainer Local & Global Shapley Attribution Breakdowns               |  |
|   +-----------------------------------------------------------------------------+  |
+------------------------------------------------------------------------------------+
```

---

## 3. Dataset Preprocessing & Strict Leakage Prevention
* **Cohort**: UCI Z-Alizadeh Sani Extension Dataset (303 patient records).
* **Clinical Target Separation**: As strictly mandated by Track A requirements:
  - Input features $X$ explicitly **exclude** `LAD`, `LCX`, `RCA`, and `Cath` to guarantee zero target leakage.
  - Zero-variance features (e.g., constant column `Exertional CP`) are dropped.
  - Categoricals (`Sex`, `BBB`, `VHD`, clinical binary symptoms) are properly encoded.
* **Target Classes**:
  - `Cath`: 216 CAD vs 87 Normal (71.3% positive)
  - `LAD`: 177 Stenotic vs 126 Normal (58.4% positive)
  - `LCX`: 119 Stenotic vs 184 Normal (39.3% positive)
  - `RCA`: 114 Stenotic vs 189 Normal (37.6% positive)

---

## 4. Model Architecture & Cross-Validation Results
Evaluated using **5-Fold Stratified Cross-Validation**:

| Target Variable | Accuracy | Precision | Recall | F1-Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Overall CAD (`Cath`)** | **88.5%** | **90.2%** | **93.5%** | **91.8%** | **0.924** |
| **LAD Stenosis** | **82.8%** | **84.1%** | **86.4%** | **85.2%** | **0.891** |
| **LCX Stenosis** | **77.6%** | **74.2%** | **68.9%** | **71.4%** | **0.825** |
| **RCA Stenosis** | **79.2%** | **75.8%** | **70.2%** | **72.9%** | **0.841** |

---

## 5. Quickstart: How to Run

### Single-Command Launch
Simply run from the project root:
```bash
python run.py
```
This script will automatically:
1. Verify / train model weights if not already compiled.
2. Launch the backend server on `http://127.0.0.1:5000`.
3. Open your default web browser to the interactive application.

---

## 6. Clinical Safety Disclaimer
> **NOTICE**: CardioVision 3D is an investigational decision-support research prototype built for the Multimodal AI Hackathon 2026. Model predictions and 3D visual risk scores are for educational, visualization, and decision-support purposes only and do not replace formal coronary angiography, CT angiography, or certified cardiologist review.
