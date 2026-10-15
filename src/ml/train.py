import os
import sys
import json
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from preprocess import load_and_preprocess_data

MODELS_DIR = os.path.join(os.path.dirname(__file__), '../../models')

from ensemble import CardioEnsemble

def stratified_kfold_split(y, n_splits=5, random_state=42):
    rng = np.random.RandomState(random_state)
    pos_idx = np.where(y == 1)[0]
    neg_idx = np.where(y == 0)[0]
    
    rng.shuffle(pos_idx)
    rng.shuffle(neg_idx)
    
    pos_splits = np.array_split(pos_idx, n_splits)
    neg_splits = np.array_split(neg_idx, n_splits)
    
    folds = []
    for i in range(n_splits):
        val_idx = np.concatenate([pos_splits[i], neg_splits[i]])
        rng.shuffle(val_idx)
        train_idx = np.setdiff1d(np.arange(len(y)), val_idx)
        folds.append((train_idx, val_idx))
    return folds

def compute_classification_metrics(y_true, y_pred, y_prob):
    tp = int(np.sum((y_true == 1) & (y_pred == 1)))
    fp = int(np.sum((y_true == 0) & (y_pred == 1)))
    fn = int(np.sum((y_true == 1) & (y_pred == 0)))
    tn = int(np.sum((y_true == 0) & (y_pred == 0)))
    
    total = len(y_true)
    accuracy = (tp + tn) / total if total > 0 else 0.0
    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = 2 * precision * recall / (precision + recall) if (precision + recall) > 0 else 0.0
    
    n_pos = int(np.sum(y_true == 1))
    n_neg = int(np.sum(y_true == 0))
    if n_pos == 0 or n_neg == 0:
        roc_auc = 0.5
    else:
        order = np.argsort(y_prob)
        ranks = np.empty_like(order, dtype=float)
        ranks[order] = np.arange(len(y_prob)) + 1
        pos_rank_sum = np.sum(ranks[y_true == 1])
        roc_auc = (pos_rank_sum - n_pos * (n_pos + 1) / 2.0) / (n_pos * n_neg)
        
    return {
        'accuracy': float(accuracy),
        'precision': float(precision),
        'recall': float(recall),
        'f1': float(f1),
        'roc_auc': float(roc_auc)
    }

def find_optimal_threshold(y_true, y_prob):
    best_t = 0.5
    best_f1 = 0.0
    for t in np.linspace(0.35, 0.65, 31):
        pred = (y_prob >= t).astype(int)
        tp = np.sum((y_true == 1) & (pred == 1))
        fp = np.sum((y_true == 0) & (pred == 1))
        fn = np.sum((y_true == 1) & (pred == 0))
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0
        f1 = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0
        if f1 > best_f1:
            best_f1 = f1
            best_t = t
    return best_t

def evaluate_and_train():
    os.makedirs(MODELS_DIR, exist_ok=True)
    X, y_dict, feature_names = load_and_preprocess_data()
    
    results = {}
    models = {}
    importances = {}
    
    target_names = ['Cath', 'LAD', 'LCX', 'RCA']
    
    for target in target_names:
        y = y_dict[target].values
        pos_rate = float(np.mean(y))
        scale_pos_weight = (1.0 - pos_rate) / pos_rate if pos_rate > 0 else 1.0
        
        print(f"\n==========================================")
        print(f"Training Dual Ensemble for Target: {target} (Positive rate: {pos_rate:.1%})")
        print(f"==========================================")
        
        folds = stratified_kfold_split(y, n_splits=5, random_state=42)
        cv_metrics = {'accuracy': [], 'precision': [], 'recall': [], 'f1': [], 'roc_auc': []}
        optimal_thresholds = []
        
        for fold, (train_idx, val_idx) in enumerate(folds):
            X_tr, y_tr = X.iloc[train_idx], y[train_idx]
            X_va, y_val = X.iloc[val_idx], y[val_idx]
            
            # Model 1: Regularized XGBoost
            m_xgb = xgb.XGBClassifier(
                n_estimators=110,
                max_depth=3,
                learning_rate=0.045,
                subsample=0.85,
                colsample_bytree=0.75,
                reg_alpha=0.6,
                reg_lambda=2.0,
                scale_pos_weight=scale_pos_weight,
                eval_metric='logloss',
                random_state=42 + fold
            )
            m_xgb.fit(X_tr, y_tr)
            
            # Model 2: Regularized LightGBM
            m_lgb = lgb.LGBMClassifier(
                n_estimators=100,
                max_depth=3,
                num_leaves=7,
                learning_rate=0.045,
                subsample=0.85,
                colsample_bytree=0.75,
                reg_alpha=0.6,
                reg_lambda=2.0,
                scale_pos_weight=scale_pos_weight,
                random_state=42 + fold,
                verbose=-1
            )
            m_lgb.fit(X_tr, y_tr)
            
            # Out-of-fold Blended Probabilities
            p_tr = 0.5 * m_xgb.predict_proba(X_tr)[:, 1] + 0.5 * m_lgb.predict_proba(X_tr)[:, 1]
            opt_t = find_optimal_threshold(y_tr, p_tr)
            optimal_thresholds.append(opt_t)
            
            p_va = 0.5 * m_xgb.predict_proba(X_va)[:, 1] + 0.5 * m_lgb.predict_proba(X_va)[:, 1]
            y_pred = (p_va >= opt_t).astype(int)
            
            m = compute_classification_metrics(y_val, y_pred, p_va)
            for k in cv_metrics:
                cv_metrics[k].append(m[k])
                
        mean_metrics = {k: float(np.mean(v)) for k, v in cv_metrics.items()}
        std_metrics = {k: float(np.std(v)) for k, v in cv_metrics.items()}
        final_opt_threshold = float(np.mean(optimal_thresholds))
        
        print(f"[{target}] 5-Fold Stratified CV Performance (Tuned Ensemble):")
        print(f"  Accuracy:  {mean_metrics['accuracy']:.3f} +/- {std_metrics['accuracy']:.3f}")
        print(f"  Precision: {mean_metrics['precision']:.3f} +/- {std_metrics['precision']:.3f}")
        print(f"  Recall:    {mean_metrics['recall']:.3f} +/- {std_metrics['recall']:.3f}")
        print(f"  F1-Score:  {mean_metrics['f1']:.3f} +/- {std_metrics['f1']:.3f}")
        print(f"  ROC-AUC:   {mean_metrics['roc_auc']:.3f} +/- {std_metrics['roc_auc']:.3f}")
        print(f"  Opt Cutoff: {final_opt_threshold:.3f}")
        
        results[target] = {
            'metrics': mean_metrics,
            'std': std_metrics,
            'optimal_threshold': final_opt_threshold
        }
        
        # Train final production ensemble on all 303 samples
        final_xgb = xgb.XGBClassifier(
            n_estimators=130,
            max_depth=3,
            learning_rate=0.045,
            subsample=0.85,
            colsample_bytree=0.75,
            reg_alpha=0.6,
            reg_lambda=2.0,
            scale_pos_weight=scale_pos_weight,
            eval_metric='logloss',
            random_state=42
        )
        final_xgb.fit(X, y)
        
        final_lgb = lgb.LGBMClassifier(
            n_estimators=120,
            max_depth=3,
            num_leaves=7,
            learning_rate=0.045,
            subsample=0.85,
            colsample_bytree=0.75,
            reg_alpha=0.6,
            reg_lambda=2.0,
            scale_pos_weight=scale_pos_weight,
            random_state=42,
            verbose=-1
        )
        final_lgb.fit(X, y)
        
        ensemble = CardioEnsemble(final_xgb, final_lgb, final_opt_threshold)
        models[target] = ensemble
        
        # Save model using joblib
        model_filename = os.path.join(MODELS_DIR, f"{target.lower()}_model.joblib")
        joblib.dump(ensemble, model_filename)
        
        # Feature importances
        feat_imp = ensemble.feature_importances_
        sorted_idx = np.argsort(feat_imp)[::-1]
        importances[target] = [
            {'feature': feature_names[i], 'importance': float(feat_imp[i])}
            for i in sorted_idx
        ]
        
    with open(os.path.join(MODELS_DIR, 'model_metrics.json'), 'w') as f:
        json.dump(results, f, indent=2)
        
    with open(os.path.join(MODELS_DIR, 'feature_importances.json'), 'w') as f:
        json.dump(importances, f, indent=2)
        
    print("\nOptimized dual ensembles persisted to models/ successfully!")
    return results, models, importances

if __name__ == '__main__':
    evaluate_and_train()
