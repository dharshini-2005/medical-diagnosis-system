from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
import os

app = FastAPI(title="Medical Diagnosis ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "..", "rules_dataset")

# ── Load & train on startup ────────────────────────────────────────────────────
print("📦 Loading datasets...")

df            = pd.read_csv(os.path.join(DATASET_DIR, "dataset.csv"))
desc_df       = pd.read_csv(os.path.join(DATASET_DIR, "symptom_Description.csv"))
precaution_df = pd.read_csv(os.path.join(DATASET_DIR, "symptom_precaution.csv"))
severity_df   = pd.read_csv(os.path.join(DATASET_DIR, "Symptom-severity.csv"))

for frame in [df, desc_df, precaution_df, severity_df]:
    frame.columns = frame.columns.str.strip()

# ── Lookup maps ────────────────────────────────────────────────────────────────
desc_map = dict(zip(
    desc_df["Disease"].str.strip().str.lower(),
    desc_df["Description"]
))

precaution_map = {}
for _, row in precaution_df.iterrows():
    disease = str(row["Disease"]).strip().lower()
    precs   = [str(row[c]).strip() for c in precaution_df.columns
               if "Precaution" in c and pd.notna(row[c]) and str(row[c]).strip()]
    precaution_map[disease] = precs

# ── Feature matrix ─────────────────────────────────────────────────────────────
symptom_cols = [c for c in df.columns if "symptom" in c.lower()]

all_symptoms = sorted({
    str(df[c][i]).strip().lower()
    for c in symptom_cols
    for i in df.index
    if pd.notna(df[c][i]) and str(df[c][i]).strip()
})

print(f"✅ {len(all_symptoms)} unique symptoms found")

def row_to_vector(row):
    present = {str(row[c]).strip().lower() for c in symptom_cols if pd.notna(row[c])}
    return [1 if s in present else 0 for s in all_symptoms]

X = np.array([row_to_vector(df.iloc[i]) for i in range(len(df))])
y = df["Disease"].str.strip()

# ── Train RandomForest ─────────────────────────────────────────────────────────
print("🤖 Training RandomForest model...")
le    = LabelEncoder()
y_enc = le.fit_transform(y)

model = RandomForestClassifier(n_estimators=120, random_state=42, n_jobs=-1)
model.fit(X, y_enc)

print(f"✅ Model trained — {len(X)} samples, {len(le.classes_)} diseases")

# ── Schemas ────────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    symptoms: List[str]

class DiseaseResult(BaseModel):
    disease: str
    confidence: float
    description: str
    precautions: List[str]

class PredictResponse(BaseModel):
    predictions: List[DiseaseResult]
    top_disease: str

# ── Endpoints ──────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"status": "ok", "message": "ML service is running"}

@app.get("/health")
def health():
    return {
        "status": "ok",
        "model": "RandomForestClassifier",
        "diseases": len(le.classes_),
        "symptoms": len(all_symptoms)
    }

@app.get("/symptoms")
def get_symptoms():
    return {"symptoms": all_symptoms}

@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if not req.symptoms:
        raise HTTPException(status_code=400, detail="Provide at least one symptom")

    input_set = {s.strip().lower() for s in req.symptoms}
    vector    = np.array([1 if s in input_set else 0 for s in all_symptoms]).reshape(1, -1)

    proba    = model.predict_proba(vector)[0]
    top5_idx = np.argsort(proba)[::-1][:5]

    results = []
    for idx in top5_idx:
        if proba[idx] < 0.001:
            continue
        disease     = le.classes_[idx]
        disease_key = disease.strip().lower()
        results.append(DiseaseResult(
            disease     = disease,
            confidence  = round(float(proba[idx]), 4),
            description = desc_map.get(disease_key, "No description available."),
            precautions = precaution_map.get(disease_key, ["Consult a doctor."])
        ))

    if not results:
        raise HTTPException(status_code=404, detail="No predictions found")

    return PredictResponse(
        predictions = results,
        top_disease = results[0].disease
    )
