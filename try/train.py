"""Train CAD + LAD/LCX/RCA classifiers on the Z-Alizadeh Sani extension dataset.
Usage: python train.py data.csv|data.xlsx   ->  writes model.json (load it in the viewer)
Needs: pandas scikit-learn openpyxl
LAD, LCX, RCA and Cath are never used as inputs (leakage guard below)."""
import sys, re, json, pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import make_pipeline

path = sys.argv[1]
df = pd.read_excel(path) if path.lower().endswith(("xlsx", "xls")) else pd.read_csv(path)
df.columns = [re.sub(r"[^a-z0-9]", "", str(c).lower()) for c in df.columns]

# viewer key -> normalised column name (edit if your header differs)
FEATS = {"age": "age", "bp": "bp", "pr": "pr", "fbs": "fbs", "ldl": "ldl", "rwma": "regionrwma",
         "htn": "htn", "dm": "dm", "cp": "typicalchestpain", "ste": "stelevation",
         "ti": "tinversion", "lvh": "lvh"}
TARGETS = {"cad": "cath", "lad": "lad", "lcx": "lcx", "rca": "rca"}
assert not set(FEATS.values()) & set(TARGETS.values()) | {"cath"} & set(FEATS.values()), "target leakage"

YES = {"y", "yes", "1", "true", "cad", "stenotic", "present", "abnormal"}
def num(s):
    if pd.api.types.is_numeric_dtype(s): return s.astype(float)
    return s.astype(str).str.strip().str.lower().isin(YES).astype(float)
def label(s):
    y = num(s)
    return (y >= 50) if y.max() > 1 else (y > 0)   # percent stenosis -> >=50%

X = pd.DataFrame({k: num(df[c]) for k, c in FEATS.items()})
X = X.fillna(X.median())
cv = StratifiedKFold(5, shuffle=True, random_state=0)
out = {"bias": {}, "features": {k: {"w": {}} for k in FEATS}, "metrics": {}}
for t, col in TARGETS.items():
    y = label(df[col]).astype(int)
    print(t, "positives:", y.sum(), "of", len(y), "(check this matches the dataset)")
    pipe = make_pipeline(StandardScaler(), LogisticRegression(C=0.5, max_iter=2000))
    p = cross_val_predict(pipe, X, y, cv=cv, method="predict_proba")[:, 1]
    yh = (p >= .5).astype(int)
    out["metrics"][t] = dict(acc=accuracy_score(y, yh), precision=precision_score(y, yh),
                             recall=recall_score(y, yh), f1=f1_score(y, yh), auc=roc_auc_score(y, p))
    print({k: round(v, 3) for k, v in out["metrics"][t].items()})
    pipe.fit(X, y)
    sc, lr = pipe[0], pipe[1]
    out["bias"][t] = float(lr.intercept_[0])        # log-odds for an average patient
    for i, k in enumerate(FEATS):
        out["features"][k].update(mean=float(sc.mean_[i]), std=float(sc.scale_[i]))
        out["features"][k]["w"][t] = float(lr.coef_[0][i])   # per 1 SD; SHAP = w * z
json.dump(out, open("model.json", "w"), indent=1)
print("wrote model.json")
