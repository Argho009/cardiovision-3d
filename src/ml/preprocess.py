import os
import json
import numpy as np
import pandas as pd

RAW_DATA_PATH = os.path.join(os.path.dirname(__file__), '../../data/raw/extention of Z-Alizadeh sani dataset.xlsx')
PROCESSED_DATA_DIR = os.path.join(os.path.dirname(__file__), '../../data/processed')

# Targets to exclude from predictor features
TARGET_COLS = ['Cath', 'LAD', 'LCX', 'RCA']

# Mapping dictionary for clean labels
BINARY_YN_MAP = {'Y': 1, 'N': 0, 'y': 1, 'n': 0, '1': 1, '0': 0, 1: 1, 0: 0}
SEX_MAP = {'Male': 1, 'male': 1, 'Fmale': 0, 'Female': 0, 'female': 0}

TARGET_MAPS = {
    'Cath': {'CAD': 1, 'Normal': 0},
    'LAD': {'Stenotic': 1, 'Normal': 0},
    'LCX': {'Stenotic': 1, 'Normal': 0},
    'RCA': {'Stenotic': 1, 'Normal': 0}
}

def load_and_preprocess_data(raw_path=RAW_DATA_PATH):
    """
    Loads raw Excel dataset and performs clinically compliant data cleaning,
    encoding, and strict target separation.
    """
    if not os.path.exists(raw_path):
        raise FileNotFoundError(f"Raw data file not found at: {raw_path}")
        
    df = pd.read_excel(raw_path)
    df.columns = df.columns.str.strip()

    # Drop constant columns with 0 variance
    if 'Exertional CP' in df.columns:
        df = df.drop(columns=['Exertional CP'])

    # Standardize Sex column
    if 'Sex' in df.columns:
        df['Sex'] = df['Sex'].map(SEX_MAP)

    # Encode binary Y/N clinical columns
    binary_cols = [
        'Obesity', 'CRF', 'CVA', 'Airway disease', 'Thyroid Disease',
        'CHF', 'DLP', 'Weak Peripheral Pulse', 'Lung rales',
        'Systolic Murmur', 'Diastolic Murmur', 'Dyspnea',
        'Atypical', 'Nonanginal', 'LowTH Ang', 'LVH', 'Poor R Progression'
    ]
    for col in binary_cols:
        if col in df.columns:
            df[col] = df[col].map(BINARY_YN_MAP).fillna(0).astype(int)

    # Multi-category categorical columns: BBB, VHD
    if 'BBB' in df.columns:
        # 'N', 'LBBB', 'RBBB' -> dummy or ordinal
        df['BBB_LBBB'] = (df['BBB'] == 'LBBB').astype(int)
        df['BBB_RBBB'] = (df['BBB'] == 'RBBB').astype(int)
        df = df.drop(columns=['BBB'])

    if 'VHD' in df.columns:
        # Ordinal mapping: N=0, mild=1, Moderate=2, Severe=3
        vhd_map = {'N': 0, 'mild': 1, 'Moderate': 2, 'Severe': 3}
        df['VHD'] = df['VHD'].map(vhd_map).fillna(0).astype(int)

    # Target extraction & encoding
    y_dict = {}
    for target in TARGET_COLS:
        if target in df.columns:
            y_dict[target] = df[target].map(TARGET_MAPS[target]).astype(int)
            df = df.drop(columns=[target])

    # Convert all feature columns to float64
    for col in df.columns:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(df[col].median() if df[col].dtype.kind in 'bif' else 0)

    # ---------------------------------------------------------
    # Clinical Domain Feature Engineering
    # ---------------------------------------------------------
    # 1. Atherogenic Lipid Biomarkers
    hdl_safe = np.maximum(df['HDL'], 5.0)
    df['LDL_HDL_ratio'] = df['LDL'] / hdl_safe
    df['TG_HDL_ratio'] = df['TG'] / hdl_safe
    df['AIP'] = np.log10(np.maximum(df['TG'], 1.0) / hdl_safe)
    
    # 2. Metabolic Syndrome & Plaque Index
    df['TyG_index'] = np.log((df['FBS'] * df['TG']) / 2.0 + 1.0)
    
    # 3. Hemodynamic Cardiac Workload
    df['RPP'] = (df['BP'] * df['PR']) / 100.0
    
    # 4. Composite Electrophysiological Ischemia
    df['ECG_ischemia_score'] = df['Q Wave'] + df['St Elevation'] + df['St Depression'] + df['Tinversion']
    
    # 5. Ventricular Mechanical Burden Index
    df['Echo_risk'] = df['Region RWMA'] * (100.0 - df['EF-TTE']) / 100.0

    feature_names = list(df.columns)
    return df, y_dict, feature_names

def save_processed_artifacts():
    os.makedirs(PROCESSED_DATA_DIR, exist_ok=True)
    X, y_dict, feature_names = load_and_preprocess_data()
    
    # Save processed features and targets
    processed_df = X.copy()
    for target, y in y_dict.items():
        processed_df[f'TARGET_{target}'] = y
        
    csv_path = os.path.join(PROCESSED_DATA_DIR, 'processed_cardio_data.csv')
    processed_df.to_csv(csv_path, index=False)
    
    # Save feature metadata with medians, min, max for UI defaults and validation
    stats = {}
    for col in feature_names:
        stats[col] = {
            'mean': float(X[col].mean()),
            'median': float(X[col].median()),
            'min': float(X[col].min()),
            'max': float(X[col].max()),
            'std': float(X[col].std())
        }
        
    meta_path = os.path.join(PROCESSED_DATA_DIR, 'feature_metadata.json')
    with open(meta_path, 'w') as f:
        json.dump({'feature_names': feature_names, 'stats': stats}, f, indent=2)
        
    print(f"Data saved to {csv_path}")
    print(f"Features count: {len(feature_names)}")
    print(f"Samples: {len(X)}")
    return X, y_dict, feature_names

if __name__ == '__main__':
    save_processed_artifacts()
