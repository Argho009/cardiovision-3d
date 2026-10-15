import numpy as np

class CardioEnsemble:
    """
    High-performance dual ensemble combining XGBoost and LightGBM
    with probability blending and optimal decision thresholding.
    """
    def __init__(self, xgb_model, lgb_model, optimal_threshold=0.5):
        self.xgb_model = xgb_model
        self.lgb_model = lgb_model
        self.optimal_threshold = float(optimal_threshold)
        self.feature_importances_ = 0.5 * (
            xgb_model.feature_importances_ + lgb_model.feature_importances_
        )
        
    def predict_proba(self, X):
        p_xgb = self.xgb_model.predict_proba(X)
        p_lgb = self.lgb_model.predict_proba(X)
        return 0.5 * p_xgb + 0.5 * p_lgb
        
    def predict(self, X):
        probs = self.predict_proba(X)[:, 1]
        return (probs >= self.optimal_threshold).astype(int)
