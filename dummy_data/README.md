# Dummy Clinical Datasets for CardioVision 3D

This directory contains pre-configured realistic clinical patient cases formatted in both **JSON** and **CSV** for testing, demonstration, and validation of the multimodal coronary stenosis risk models.

## Available Cases

| File Name | Clinical Profile | Expected Risk Profile |
| :--- | :--- | :--- |
| `patient_01_severe_triple_vessel_cad` | 68M with DM, HTN, typical crushing chest pain, extensive anterior ST-elevation, EF 35%, apical dyskinesia | **High Risk CAD (85-95%)**, Triple-Vessel Stenosis (LAD, LCX, RCA) |
| `patient_02_isolated_lad_anterior_ischemia` | 56M smoker with exertional angina, anterior ST-elevation, anteroseptal hypokinesia, EF 45% | **CAD Positive**, Isolated Severe **LAD Stenosis (80%+)** |
| `patient_03_healthy_control_low_risk` | 38F athlete, normal lipids, normal ECG, asymptomatic, EF 62% | **Low Risk CAD (<15%)**, All Vessels Normal |
| `patient_04_atypical_angina_female_borderline` | 52F with exertional dyspnea, atypical chest sensations, borderline lipids | **Borderline Risk (35-50%)**, Mild LCX/LAD concern |
| `patient_05_hypertensive_elderly_rca_stenosis` | 71M with long-standing HTN, inferior T-wave inversions, bradycardia | **CAD Positive**, Dominant **RCA Stenosis (70%+)** |

## How to Upload in the Web App
1. Open the **"📁 User Input & Upload"** tab in the left panel of CardioVision 3D.
2. Either drag-and-drop any `.json` or `.csv` from this folder into the upload box, or pick from the **"Quick Load Dummy Case"** dropdown.
3. The application will parse the parameters, populate all demographic, vital, ECG, and lab inputs, and update the 3D heart visualization with live stenosis color-coding.
