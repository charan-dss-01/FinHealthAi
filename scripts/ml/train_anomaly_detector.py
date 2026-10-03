"""
================================================================================
FINHEALTH AI - UNSUPERVISED ANOMALY DETECTION TRAINING PIPELINE
================================================================================
Educational Guide: Transaction Anomaly Detection Engine
Model Architecture: Isolation Forest (scikit-learn)

How Isolation Forest Works:
---------------------------
1. Isolation Forest isolates anomalies by randomly selecting a feature and splitting
   the data values.
2. Anomalies (e.g., unusually large payments or sudden personal spend spikes)
   require fewer splits to isolate, resulting in shorter path lengths in isolation trees.
3. Path lengths are converted to an Anomaly Score between 0 and 1.
================================================================================
"""

import json
import os
import numpy as np

# Try importing scikit-learn
try:
    from sklearn.ensemble import IsolationForest

    print("========================================================")
    print("STEP 1: Generating Transaction Feature Matrix")
    print("========================================================")
    
    # Generate synthetic transaction features [Amount, Day_Of_Month, Is_Personal_Tag]
    np.random.seed(42)
    normal_amounts = np.random.normal(loc=3500, scale=1200, size=500) # Normal SMB purchases
    anomalous_amounts = np.array([85000, 120000, 45000, 95000, 68000, 150000]) # Outlier spikes
    
    amounts = np.concatenate([normal_amounts, anomalous_amounts])
    amounts = np.clip(amounts, 100, 200000)
    
    X = amounts.reshape(-1, 1)
    print(f"Feature matrix created with {X.shape[0]} transactions.")

    print("\n========================================================")
    print("STEP 2: Training Isolation Forest Model")
    print("========================================================")
    clf = IsolationForest(contamination=0.02, random_state=42)
    clf.fit(X)

    scores = clf.decision_function(X)
    predictions = clf.predict(X) # -1 = Anomaly, 1 = Normal

    anomalies_detected = np.where(predictions == -1)[0]
    print(f"Total anomalies detected: {len(anomalies_detected)} out of {X.shape[0]} transactions.")
    
    print("\nDetected Anomaly Examples:")
    for idx in anomalies_detected[:5]:
        print(f"  - Transaction Amount: INR {X[idx][0]:,.2f} (Anomaly Score: {scores[idx]:.4f})")

    # Compute statistical threshold (3 Standard Deviations above mean)
    mean_val = float(np.mean(normal_amounts))
    std_val = float(np.std(normal_amounts))
    z_threshold = mean_val + (3 * std_val)

    print(f"\nCalculated Statistical Z-Score Threshold (Mean + 3*Std): INR {z_threshold:,.2f}")

except ImportError:
    print("\n[NOTE] scikit-learn not available. Fallback to Z-Score Statistical Model.")
    mean_val = 3500.0
    std_val = 1200.0
    z_threshold = 7100.0

# Export anomaly thresholds for TS runtime engine
os.makedirs("src/lib/ml/models", exist_ok=True)
anomaly_model_payload = {
    "model_name": "Isolation_Forest_ZScore_Anomaly_Detector_v1",
    "mean_expense_amount": round(mean_val, 2),
    "std_expense_amount": round(std_val, 2),
    "z_score_threshold_amount": round(z_threshold, 2),
    "anomaly_contamination_rate": 0.02,
}

with open("src/lib/ml/models/anomaly_model.json", "w", encoding="utf-8") as f:
    json.dump(anomaly_model_payload, f, indent=2)

print("\n========================================================")
print("STEP 3: Anomaly Model Exported Successfully!")
print("========================================================")
print("Saved model configuration to: src/lib/ml/models/anomaly_model.json")
