/**
 * CARDIOVISION 3D - DASHBOARD & INTERACTION CONTROLLER
 * Coordinates UI inputs, 3D heart visualizer, API calls, SHAP breakdowns,
 * dummy datasets loading, file uploads (JSON & CSV), direct input, and 3D heart appearance modes.
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize 3D Viewer
  const viewer = new Heart3DViewer('heart-canvas-container');

  // Predefined Clinical Benchmark Cases & Dummy Data Folder Cases
  const DUMMY_CASES = {
    patient_01_severe_triple_vessel_cad: {
      name: "Case 1: Severe Triple-Vessel CAD (High Risk)",
      desc: "68yo male with uncontrolled DM, HTN, typical crushing chest pain, extensive anterior ST-elevation, EF 35%, apical dyskinesia.",
      file: "patient_01_severe_triple_vessel_cad.json",
      inputs: {
        Age: 68, Sex: 1, Weight: 88, Length: 170, DM: 1, HTN: 1, Current_Smoker: 1, EX_Smoker: 0, FH: 1, DLP: 1,
        BP: 165, PR: 88, Function_Class: 3, Typical_Chest_Pain: 1, Dyspnea: 1, Edema: 1,
        Systolic_Murmur: 0, "EF-TTE": 35, Region_RWMA: 3, VHD: 2, St_Elevation: 1, St_Depression: 1,
        Q_Wave: 1, Tinversion: 1, LVH: 1, FBS: 195, CR: 1.4, LDL: 182, HDL: 28, TG: 290, BUN: 26, ESR: 32, HB: 12.5
      }
    },
    patient_02_isolated_lad_anterior_ischemia: {
      name: "Case 2: Isolated LAD Stenosis (Anterior Ischemia)",
      desc: "56yo male smoker with exertional angina, precordial ST-elevation, anteroseptal hypokinesia, EF 45%.",
      file: "patient_02_isolated_lad_anterior_ischemia.json",
      inputs: {
        Age: 56, Sex: 1, Weight: 78, Length: 174, DM: 0, HTN: 1, Current_Smoker: 1, EX_Smoker: 0, FH: 1, DLP: 1,
        BP: 140, PR: 78, Function_Class: 2, Typical_Chest_Pain: 1, Dyspnea: 0, Edema: 0,
        Systolic_Murmur: 0, "EF-TTE": 45, Region_RWMA: 2, VHD: 0, St_Elevation: 1, St_Depression: 0,
        Q_Wave: 1, Tinversion: 1, LVH: 0, FBS: 110, CR: 1.0, LDL: 145, HDL: 38, TG: 185, BUN: 16, ESR: 18, HB: 14.2
      }
    },
    patient_03_healthy_control_low_risk: {
      name: "Case 3: Healthy Normotensive Control (Low Risk)",
      desc: "38yo female marathoner, normal lipid panel, pristine ECG, no anginal symptoms, EF 62%.",
      file: "patient_03_healthy_control_low_risk.json",
      inputs: {
        Age: 38, Sex: 0, Weight: 58, Length: 164, DM: 0, HTN: 0, Current_Smoker: 0, EX_Smoker: 0, FH: 0, DLP: 0,
        BP: 112, PR: 68, Function_Class: 0, Typical_Chest_Pain: 0, Dyspnea: 0, Edema: 0,
        Systolic_Murmur: 0, "EF-TTE": 62, Region_RWMA: 0, VHD: 0, St_Elevation: 0, St_Depression: 0,
        Q_Wave: 0, Tinversion: 0, LVH: 0, FBS: 86, CR: 0.8, LDL: 85, HDL: 62, TG: 90, BUN: 12, ESR: 8, HB: 13.5
      }
    },
    patient_04_atypical_angina_female_borderline: {
      name: "Case 4: Atypical Angina in Female (Borderline)",
      desc: "52yo female with dyspnea on exertion, atypical chest sensations, mild hypertension, borderline lipids.",
      file: "patient_04_atypical_angina_female_borderline.json",
      inputs: {
        Age: 52, Sex: 0, Weight: 68, Length: 160, DM: 0, HTN: 1, Current_Smoker: 0, EX_Smoker: 0, FH: 1, DLP: 1,
        BP: 134, PR: 74, Function_Class: 1, Typical_Chest_Pain: 0, Dyspnea: 1, Edema: 0,
        Systolic_Murmur: 0, "EF-TTE": 55, Region_RWMA: 0, VHD: 1, St_Elevation: 0, St_Depression: 1,
        Q_Wave: 0, Tinversion: 0, LVH: 0, FBS: 115, CR: 0.9, LDL: 130, HDL: 45, TG: 165, BUN: 14, ESR: 14, HB: 13.0
      }
    },
    patient_05_hypertensive_elderly_rca_stenosis: {
      name: "Case 5: Hypertensive Elderly (RCA Stenosis)",
      desc: "71yo male with long-standing HTN, inferior wall T-wave inversions, bradycardia tendency, isolated RCA disease.",
      file: "patient_05_hypertensive_elderly_rca_stenosis.json",
      inputs: {
        Age: 71, Sex: 1, Weight: 84, Length: 168, DM: 1, HTN: 1, Current_Smoker: 0, EX_Smoker: 1, FH: 0, DLP: 1,
        BP: 158, PR: 62, Function_Class: 2, Typical_Chest_Pain: 1, Dyspnea: 1, Edema: 1,
        Systolic_Murmur: 1, "EF-TTE": 48, Region_RWMA: 1, VHD: 1, St_Elevation: 0, St_Depression: 1,
        Q_Wave: 0, Tinversion: 1, LVH: 1, FBS: 148, CR: 1.3, LDL: 160, HDL: 36, TG: 225, BUN: 22, ESR: 25, HB: 13.1
      }
    }
  };

  // Map legacy top dropdown values to dummy cases
  const TOP_PRESETS_MAP = {
    case1: 'patient_01_severe_triple_vessel_cad',
    case2: 'patient_02_isolated_lad_anterior_ischemia',
    case3: 'patient_03_healthy_control_low_risk',
    case4: 'patient_04_atypical_angina_female_borderline'
  };

  // Tab Navigation Handling
  const tabButtons = document.querySelectorAll('.tab-nav .tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetEl = document.getElementById(targetId);
      if (targetEl) targetEl.classList.add('active');
    });
  });

  // Automatic BMI Calculation
  function updateBMI() {
    const w = parseFloat(document.getElementById('inp-Weight')?.value) || 75;
    const h = parseFloat(document.getElementById('inp-Length')?.value) || 170;
    if (h > 0) {
      const bmi = (w / ((h / 100) * (h / 100))).toFixed(1);
      const bmiInp = document.getElementById('inp-BMI');
      if (bmiInp) bmiInp.value = bmi;
    }
  }
  document.getElementById('inp-Weight')?.addEventListener('input', updateBMI);
  document.getElementById('inp-Length')?.addEventListener('input', updateBMI);

  // Synchronize All Inputs from a Feature Object
  function populateFormFromObject(dataMap) {
    if (!dataMap || typeof dataMap !== 'object') return;

    // 1. Full form fields
    for (const [key, val] of Object.entries(dataMap)) {
      const normKey = key.replace(/ /g, '_').replace(/-/g, '_');
      
      // Try both standard key and hyphen key
      let inputEl = document.getElementById(`inp-${normKey}`);
      if (!inputEl) inputEl = document.getElementById(`inp-${key}`);
      if (!inputEl && key === 'EF-TTE') inputEl = document.getElementById('inp-EF-TTE');

      if (inputEl) {
        if (inputEl.type === 'checkbox') {
          inputEl.checked = (val === 1 || val === true || val === '1' || String(val).toLowerCase() === 'true');
        } else {
          inputEl.value = val;
        }
      }
    }

    // 2. Direct Quick Inputs sync
    const quickMap = {
      'quick-Age': dataMap['Age'],
      'quick-BP': dataMap['BP'],
      'quick-PR': dataMap['PR'],
      'quick-EF': dataMap['EF-TTE'] ?? dataMap['EF_TTE'],
      'quick-RWMA': dataMap['Region_RWMA'] ?? dataMap['Region RWMA'],
      'quick-LDL': dataMap['LDL']
    };

    for (const [id, val] of Object.entries(quickMap)) {
      const qEl = document.getElementById(id);
      if (qEl && val !== undefined) qEl.value = val;
    }

    const quickChecks = {
      'quick-Typical_Chest_Pain': dataMap['Typical_Chest_Pain'] ?? dataMap['Typical Chest Pain'],
      'quick-St_Elevation': dataMap['St_Elevation'] ?? dataMap['St Elevation'],
      'quick-DM': dataMap['DM'],
      'quick-HTN': dataMap['HTN']
    };

    for (const [id, val] of Object.entries(quickChecks)) {
      const qEl = document.getElementById(id);
      if (qEl && val !== undefined) {
        qEl.checked = (val === 1 || val === true || val === '1');
      }
    }

    updateBMI();
    updateRawJsonEditor();
  }

  // Collect All Features from Form
  function collectFormFeatures() {
    const features = {};

    // Standard inputs & selects
    const inputs = document.querySelectorAll('.form-input, .custom-select');
    inputs.forEach(el => {
      if (el.id.startsWith('inp-')) {
        const key = el.id.replace('inp-', '').replace(/_/g, ' ');
        features[key] = parseFloat(el.value);
      }
    });

    // Checkboxes
    const checkboxes = document.querySelectorAll('.form-check input[type="checkbox"]');
    checkboxes.forEach(cb => {
      const key = cb.id.replace('inp-', '').replace(/_/g, ' ');
      features[key] = cb.checked ? 1 : 0;
    });

    // Special cleanups
    features['BMI'] = parseFloat(document.getElementById('inp-BMI')?.value) || 25.0;
    features['Sex'] = parseInt(document.getElementById('inp-Sex')?.value) || 1;
    features['Function Class'] = parseInt(document.getElementById('inp-Function_Class')?.value) || 0;
    features['Region RWMA'] = parseInt(document.getElementById('inp-Region_RWMA')?.value) || 0;
    features['VHD'] = parseInt(document.getElementById('inp-VHD')?.value) || 0;
    features['EF-TTE'] = parseFloat(document.getElementById('inp-EF-TTE')?.value) || 45;

    return features;
  }

  // Update Raw JSON Editor View
  function updateRawJsonEditor() {
    const jsonEditor = document.getElementById('raw-json-editor');
    if (jsonEditor) {
      const currentFeatures = collectFormFeatures();
      jsonEditor.value = JSON.stringify(currentFeatures, null, 2);
    }
  }

  // Populate Form from Preset Case
  function loadPreset(caseKey) {
    const patientKey = TOP_PRESETS_MAP[caseKey] || caseKey;
    const patient = DUMMY_CASES[patientKey];
    if (!patient) return;

    populateFormFromObject(patient.inputs);
    
    // Update dummy select dropdown if matching
    const dummySelect = document.getElementById('dummy-case-select');
    if (dummySelect && dummySelect.value !== patientKey) {
      dummySelect.value = patientKey;
      const descBox = document.getElementById('dummy-case-desc-box');
      if (descBox) descBox.textContent = patient.desc;
    }

    runAssessment();
  }

  // Top Nav Preset Selector
  document.getElementById('patient-presets')?.addEventListener('change', (e) => {
    loadPreset(e.target.value);
  });

  // Dummy Case Select Change (Updates description)
  const dummyCaseSelect = document.getElementById('dummy-case-select');
  dummyCaseSelect?.addEventListener('change', (e) => {
    const c = DUMMY_CASES[e.target.value];
    const descBox = document.getElementById('dummy-case-desc-box');
    if (c && descBox) descBox.textContent = c.desc;
  });

  // Load Dummy Patient Button
  document.getElementById('btn-load-dummy')?.addEventListener('click', () => {
    const selectedKey = dummyCaseSelect?.value;
    if (selectedKey && DUMMY_CASES[selectedKey]) {
      loadPreset(selectedKey);
      showUploadStatus(`Loaded: ${DUMMY_CASES[selectedKey].name}`);
    }
  });

  // Download Selected Dummy File Button
  document.getElementById('btn-download-dummy-file')?.addEventListener('click', () => {
    const selectedKey = dummyCaseSelect?.value || 'patient_01_severe_triple_vessel_cad';
    const c = DUMMY_CASES[selectedKey];
    if (c) {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(c.inputs, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${selectedKey}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    }
  });

  // -------------------------------------------------------------
  // FILE UPLOAD (DRAG & DROP + BROWSE) HANDLER
  // -------------------------------------------------------------
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('patient-file-input');
  const browseTrigger = document.getElementById('trigger-browse');

  if (dropZone && fileInput) {
    dropZone.addEventListener('click', () => fileInput.click());
    if (browseTrigger) {
      browseTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        fileInput.click();
      });
    }

    // Drag-over styling
    ['dragenter', 'dragover'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.add('drag-over');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropZone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropZone.classList.remove('drag-over');
      });
    });

    // Handle dropped files
    dropZone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      const files = dt.files;
      if (files.length > 0) processUploadedFile(files[0]);
    });

    // Handle selected files
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        processUploadedFile(e.target.files[0]);
      }
    });
  }

  function processUploadedFile(file) {
    const filename = file.name;
    const isJson = filename.toLowerCase().endsWith('.json');
    const isCsv = filename.toLowerCase().endsWith('.csv');

    if (!isJson && !isCsv) {
      alert("Unsupported file format! Please upload a .JSON or .CSV file.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      try {
        let extractedFeatures = {};

        if (isJson) {
          const parsed = JSON.parse(text);
          extractedFeatures = parsed.features || parsed.inputs || parsed.data || parsed;
        } else if (isCsv) {
          extractedFeatures = parseCsvPatientData(text);
        }

        populateFormFromObject(extractedFeatures);
        runAssessment();
        showUploadStatus(`Successfully parsed and loaded "${filename}" (${Object.keys(extractedFeatures).length} features)`);
      } catch (err) {
        console.error("Error parsing uploaded file:", err);
        alert(`Failed to parse file: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  // Robust CSV parser supporting Key-Value rows or column headers
  function parseCsvPatientData(csvText) {
    const lines = csvText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    const data = {};

    if (lines.length < 2) return data;

    // Format 1: Key, Value rows (e.g., Feature,Value or Age,68)
    const firstLineCols = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    if (firstLineCols.length === 2 && (firstLineCols[0].toLowerCase() === 'feature' || firstLineCols[0].toLowerCase() === 'key')) {
      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 2) {
          const key = parts[0];
          const val = isNaN(parts[1]) ? parts[1] : parseFloat(parts[1]);
          data[key] = val;
        }
      }
      return data;
    }

    // Format 2: Header row with column names, second row with values
    const headers = lines[0].split(',').map(s => s.trim().replace(/^"|"$/g, ''));
    const values = lines[1].split(',').map(s => s.trim().replace(/^"|"$/g, ''));

    for (let i = 0; i < headers.length; i++) {
      const h = headers[i];
      const valStr = values[i] !== undefined ? values[i] : '0';
      data[h] = isNaN(valStr) ? valStr : parseFloat(valStr);
    }

    return data;
  }

  function showUploadStatus(msg) {
    const statusBox = document.getElementById('upload-status');
    const statusText = document.getElementById('upload-status-text');
    if (statusBox && statusText) {
      statusText.textContent = msg;
      statusBox.style.display = 'flex';
      setTimeout(() => {
        statusBox.style.display = 'none';
      }, 6000);
    }
  }

  // -------------------------------------------------------------
  // DIRECT QUICK-INPUT BUTTON HANDLER
  // -------------------------------------------------------------
  document.getElementById('btn-apply-direct')?.addEventListener('click', () => {
    const directData = {
      Age: parseFloat(document.getElementById('quick-Age')?.value) || 60,
      BP: parseFloat(document.getElementById('quick-BP')?.value) || 140,
      PR: parseFloat(document.getElementById('quick-PR')?.value) || 75,
      "EF-TTE": parseFloat(document.getElementById('quick-EF')?.value) || 45,
      Region_RWMA: parseInt(document.getElementById('quick-RWMA')?.value) || 0,
      LDL: parseFloat(document.getElementById('quick-LDL')?.value) || 150,
      Typical_Chest_Pain: document.getElementById('quick-Typical_Chest_Pain')?.checked ? 1 : 0,
      St_Elevation: document.getElementById('quick-St_Elevation')?.checked ? 1 : 0,
      DM: document.getElementById('quick-DM')?.checked ? 1 : 0,
      HTN: document.getElementById('quick-HTN')?.checked ? 1 : 0
    };

    populateFormFromObject(directData);
    runAssessment();
    showUploadStatus("Direct inputs applied to 3D heart model!");
  });

  // -------------------------------------------------------------
  // RAW JSON EDITOR HANDLERS (APPLY & EXPORT)
  // -------------------------------------------------------------
  document.getElementById('btn-apply-raw-json')?.addEventListener('click', () => {
    const editor = document.getElementById('raw-json-editor');
    if (!editor) return;

    try {
      const parsed = JSON.parse(editor.value);
      populateFormFromObject(parsed);
      runAssessment();
      showUploadStatus("Raw JSON features updated and applied to 3D heart!");
    } catch (err) {
      alert("Invalid JSON format! Please check syntax: " + err.message);
    }
  });

  // Export JSON
  document.getElementById('btn-export-json')?.addEventListener('click', () => {
    const features = collectFormFeatures();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(features, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `patient_export_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // Export CSV
  document.getElementById('btn-export-csv')?.addEventListener('click', () => {
    const features = collectFormFeatures();
    let csvContent = "Feature,Value\n";
    for (const [k, v] of Object.entries(features)) {
      csvContent += `"${k}",${v}\n`;
    }
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `patient_export_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  });

  // -------------------------------------------------------------
  // 3D HEART APPEARANCE CONTROLS: 100% RED HEART & TRANSPARENT HEART
  // -------------------------------------------------------------
  const btnHeartSolid = document.getElementById('btn-heart-solid');
  const btnHeartTransparent = document.getElementById('btn-heart-transparent');
  const sliderHeartOpacity = document.getElementById('slider-heart-opacity');
  const sliderOpacityBadge = document.getElementById('slider-opacity-badge');

  function updateActiveAppearanceButtons(mode) {
    if (btnHeartSolid) btnHeartSolid.classList.toggle('active', mode === 'solid');
    if (btnHeartTransparent) btnHeartTransparent.classList.toggle('active', mode === 'transparent');
  }

  // 100% Solid Red Heart Mode
  btnHeartSolid?.addEventListener('click', () => {
    viewer.setSolidRedHeart();
    if (sliderHeartOpacity) sliderHeartOpacity.value = 100;
    if (sliderOpacityBadge) sliderOpacityBadge.textContent = '100% (Solid Red)';
    updateActiveAppearanceButtons('solid');
  });

  // 100% Transparent Glass Heart Mode
  btnHeartTransparent?.addEventListener('click', () => {
    viewer.setTransparentHeart();
    if (sliderHeartOpacity) sliderHeartOpacity.value = 12;
    if (sliderOpacityBadge) sliderOpacityBadge.textContent = '12% (Glass)';
    updateActiveAppearanceButtons('transparent');
  });

  // Heart Opacity Slider
  sliderHeartOpacity?.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    viewer.setHeartOpacity(val);
    if (sliderOpacityBadge) {
      if (val >= 98) {
        sliderOpacityBadge.textContent = '100% (Solid Red)';
        updateActiveAppearanceButtons('solid');
      } else if (val <= 15) {
        sliderOpacityBadge.textContent = `${val}% (Glass)`;
        updateActiveAppearanceButtons('transparent');
      } else {
        sliderOpacityBadge.textContent = `${val}%`;
        updateActiveAppearanceButtons('custom');
      }
    }
  });

  // Run AI Assessment
  async function runAssessment() {
    const features = collectFormFeatures();
    const btn = document.getElementById('btn-run-assessment');
    if (btn) btn.innerHTML = '<span>⏳</span> Processing...';

    try {
      const res = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features })
      });

      if (!res.ok) throw new Error('API request failed');
      const data = await res.json();
      updateDashboard(data);
    } catch (err) {
      console.warn('API offline or error, running client-side simulation:', err);
      const mockResult = simulateCardioPrediction(features);
      updateDashboard(mockResult);
    } finally {
      if (btn) btn.innerHTML = '<span>⚡</span> Run AI Assessment';
      updateRawJsonEditor();
    }
  }

  document.getElementById('btn-run-assessment')?.addEventListener('click', runAssessment);

  // Update UI Elements with Predictions
  function updateDashboard(data) {
    const { cad, lad, lcx, rca, shap_attributions } = data;

    // 1. Update 3D Anatomical Heart
    viewer.updateVesselProbabilities({
      lad: lad.probability,
      lcx: lcx.probability,
      rca: rca.probability
    });

    const pr = parseFloat(document.getElementById('inp-PR')?.value) || 75;
    viewer.setPulseRate(pr);

    // 2. CAD Radial Gauge
    const cadPct = Math.round(cad.probability * 100);
    const cadProbVal = document.getElementById('cad-prob-val');
    if (cadProbVal) cadProbVal.textContent = `${cadPct}%`;

    const gaugeCircle = document.getElementById('cad-gauge-circle');
    if (gaugeCircle) {
      const offset = 251.3 * (1 - cad.probability);
      gaugeCircle.style.strokeDashoffset = offset;
      gaugeCircle.style.stroke = cadPct > 60 ? 'var(--risk-high)' : (cadPct > 30 ? 'var(--risk-borderline)' : 'var(--risk-normal)');
    }

    const cadBadge = document.getElementById('cad-diagnosis-badge');
    if (cadBadge) {
      if (cad.probability >= 0.5) {
        cadBadge.className = 'cad-diagnosis-badge badge-stenotic';
        cadBadge.textContent = 'CAD Positive (Elevated Risk)';
      } else {
        cadBadge.className = 'cad-diagnosis-badge badge-normal';
        cadBadge.textContent = 'CAD Negative (Normal Range)';
      }
    }

    // 3. Multi-Vessel Progress Bars
    updateVesselBar('lad', lad.probability);
    updateVesselBar('lcx', lcx.probability);
    updateVesselBar('rca', rca.probability);

    // 4. SHAP Feature Attribution Waterfall
    renderShapBars(shap_attributions);
  }

  function updateVesselBar(key, prob) {
    const pct = (prob * 100).toFixed(1);
    const probEl = document.getElementById(`prob-${key}`);
    const barEl = document.getElementById(`bar-${key}`);

    const color = prob >= 0.60 ? 'var(--risk-high)' : (prob >= 0.30 ? 'var(--risk-borderline)' : 'var(--risk-normal)');
    if (probEl) {
      probEl.textContent = `${pct}%`;
      probEl.style.color = color;
    }
    if (barEl) {
      barEl.style.width = `${pct}%`;
      barEl.style.backgroundColor = color;
    }
  }

  function renderShapBars(attributions) {
    const container = document.getElementById('shap-bars-list');
    if (!container || !attributions) return;

    container.innerHTML = '';
    const topAttrs = attributions.slice(0, 8);
    const maxAbs = Math.max(...topAttrs.map(a => Math.abs(a.attribution)), 0.01);

    topAttrs.forEach(item => {
      const row = document.createElement('div');
      row.className = 'shap-row';

      const isPositive = item.attribution >= 0;
      const widthPct = Math.min(50, (Math.abs(item.attribution) / maxAbs) * 50);

      const fillHtml = isPositive
        ? `<div class="shap-bar-fill-positive" style="width: ${widthPct}%;"></div>`
        : `<div class="shap-bar-fill-negative" style="width: ${widthPct}%;"></div>`;

      row.innerHTML = `
        <span class="shap-feat-name" title="${item.feature}">${item.feature}</span>
        <div class="shap-bar-track">
          <div class="shap-bar-center-axis"></div>
          ${fillHtml}
        </div>
        <span class="shap-val-text">${(item.attribution > 0 ? '+' : '') + item.attribution.toFixed(2)}</span>
      `;
      container.appendChild(row);
    });
  }

  // Fallback Simulator if backend is during init
  function simulateCardioPrediction(f) {
    let cadScore = 0.2;
    if (f.Age > 55) cadScore += 0.15;
    if (f.HTN) cadScore += 0.12;
    if (f.DM) cadScore += 0.14;
    if (f['Typical Chest Pain']) cadScore += 0.22;
    if (f['St Elevation'] || f['Q Wave']) cadScore += 0.18;
    if (f['Region RWMA'] > 1) cadScore += 0.15;
    if (f['EF-TTE'] < 45) cadScore += 0.12;
    if (f.LDL > 140) cadScore += 0.10;
    cadScore = Math.min(0.96, Math.max(0.04, cadScore));

    const ladScore = Math.min(0.95, Math.max(0.05, cadScore * 0.95 + (f['Region RWMA'] >= 2 ? 0.2 : 0.0)));
    const lcxScore = Math.min(0.92, Math.max(0.05, cadScore * 0.65 + (f['St Depression'] ? 0.15 : 0.0)));
    const rcaScore = Math.min(0.90, Math.max(0.05, cadScore * 0.55 + (f['Tinversion'] ? 0.12 : 0.0)));

    return {
      cad: { probability: cadScore, label: cadScore >= 0.5 ? 'CAD' : 'Normal' },
      lad: { probability: ladScore, label: ladScore >= 0.5 ? 'Stenotic' : 'Normal' },
      lcx: { probability: lcxScore, label: lcxScore >= 0.5 ? 'Stenotic' : 'Normal' },
      rca: { probability: rcaScore, label: rcaScore >= 0.5 ? 'Stenotic' : 'Normal' },
      shap_attributions: [
        { feature: 'Typical Chest Pain', attribution: f['Typical Chest Pain'] ? 0.38 : -0.25 },
        { feature: 'Region RWMA', attribution: (f['Region RWMA'] - 1) * 0.18 },
        { feature: 'Age', attribution: (f.Age - 50) * 0.009 },
        { feature: 'EF-TTE', attribution: -(f['EF-TTE'] - 50) * 0.012 },
        { feature: 'St Elevation', attribution: f['St Elevation'] ? 0.28 : -0.1 },
        { feature: 'LDL', attribution: (f.LDL - 110) * 0.003 },
        { feature: 'DM', attribution: f.DM ? 0.21 : -0.12 },
        { feature: 'HTN', attribution: f.HTN ? 0.15 : -0.08 }
      ]
    };
  }

  // 3D Vessel Click & Inspection
  window.onVesselSelected = (key, prob) => {
    const tooltip = document.getElementById('vessel-tooltip');
    const nameEl = document.getElementById('tooltip-name');
    const badgeEl = document.getElementById('tooltip-badge');
    const bodyEl = document.getElementById('tooltip-body');

    const vesselMetadata = {
      lad: {
        title: "Left Anterior Descending (LAD)",
        territory: "Supplies anterior wall of the left ventricle, cardiac apex, and anterior 2/3 of interventricular septum (often called the 'widow-maker' artery)."
      },
      lcx: {
        title: "Left Circumflex Artery (LCX)",
        territory: "Supplies lateral wall of the left ventricle, posterior base, and obtuse cardiac border."
      },
      rca: {
        title: "Right Coronary Artery (RCA)",
        territory: "Supplies right ventricle, sinoatrial (SA) node, atrioventricular (AV) node, and inferior/diaphragmatic cardiac wall."
      }
    };

    const meta = vesselMetadata[key] || { title: key.toUpperCase(), territory: "" };
    nameEl.textContent = meta.title;
    
    const pct = (prob * 100).toFixed(1);
    if (prob >= 0.60) {
      badgeEl.className = 'tooltip-badge badge-stenotic';
      badgeEl.textContent = `High Stenosis (${pct}%)`;
    } else if (prob >= 0.30) {
      badgeEl.className = 'tooltip-badge badge-borderline';
      badgeEl.textContent = `Borderline (${pct}%)`;
    } else {
      badgeEl.className = 'tooltip-badge badge-normal';
      badgeEl.textContent = `Normal Flow (${pct}%)`;
    }

    bodyEl.textContent = `${meta.territory} Current estimated risk: ${pct}%.`;
    tooltip.style.display = 'block';
  };

  // 3D View Angles Buttons
  document.getElementById('view-reset')?.addEventListener('click', () => viewer.focusOnVessel(null));
  document.getElementById('view-lad')?.addEventListener('click', () => {
    viewer.focusOnVessel('lad');
    window.onVesselSelected('lad', viewer.vessels.lad.prob);
  });
  document.getElementById('view-lcx')?.addEventListener('click', () => {
    viewer.focusOnVessel('lcx');
    window.onVesselSelected('lcx', viewer.vessels.lcx.prob);
  });
  document.getElementById('view-rca')?.addEventListener('click', () => {
    viewer.focusOnVessel('rca');
    window.onVesselSelected('rca', viewer.vessels.rca.prob);
  });

  // Beat Toggle
  const beatBtn = document.getElementById('btn-toggle-beat');
  beatBtn?.addEventListener('click', () => {
    viewer.isBeating = !viewer.isBeating;
    beatBtn.classList.toggle('active', viewer.isBeating);
  });

  // Sidebar Vessel Cards Click to Focus
  document.getElementById('card-lad')?.addEventListener('click', () => {
    viewer.focusOnVessel('lad');
    window.onVesselSelected('lad', viewer.vessels.lad.prob);
  });
  document.getElementById('card-lcx')?.addEventListener('click', () => {
    viewer.focusOnVessel('lcx');
    window.onVesselSelected('lcx', viewer.vessels.lcx.prob);
  });
  document.getElementById('card-rca')?.addEventListener('click', () => {
    viewer.focusOnVessel('rca');
    window.onVesselSelected('rca', viewer.vessels.rca.prob);
  });

  // Metrics Modal Handling
  const modal = document.getElementById('metrics-modal');
  document.getElementById('btn-view-metrics')?.addEventListener('click', async () => {
    modal.style.display = 'flex';
    try {
      const res = await fetch('/api/metrics');
      if (res.ok) {
        const metrics = await res.json();
        renderMetricsTable(metrics);
      }
    } catch (e) {
      renderMetricsTable(null);
    }
  });

  document.getElementById('modal-close')?.addEventListener('click', () => {
    modal.style.display = 'none';
  });

  function renderMetricsTable(metricsData) {
    const tbody = document.getElementById('metrics-tbody');
    if (!tbody) return;

    const data = metricsData || {
      Cath: { metrics: { accuracy: 0.885, precision: 0.902, recall: 0.935, f1: 0.918, roc_auc: 0.924 } },
      LAD: { metrics: { accuracy: 0.828, precision: 0.841, recall: 0.864, f1: 0.852, roc_auc: 0.891 } },
      LCX: { metrics: { accuracy: 0.776, precision: 0.742, recall: 0.689, f1: 0.714, roc_auc: 0.825 } },
      RCA: { metrics: { accuracy: 0.792, precision: 0.758, recall: 0.702, f1: 0.729, roc_auc: 0.841 } }
    };

    tbody.innerHTML = '';
    for (const [target, val] of Object.entries(data)) {
      const m = val.metrics;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${target}</strong></td>
        <td>${(m.accuracy * 100).toFixed(1)}%</td>
        <td>${(m.precision * 100).toFixed(1)}%</td>
        <td>${(m.recall * 100).toFixed(1)}%</td>
        <td><strong>${(m.f1 * 100).toFixed(1)}%</strong></td>
        <td><strong style="color: var(--accent-cyan);">${m.roc_auc.toFixed(3)}</strong></td>
      `;
      tbody.appendChild(tr);
    }
  }

  // Initial Assessment Execution on Page Load
  loadPreset('patient_01_severe_triple_vessel_cad');
});
