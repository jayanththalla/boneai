# BoneAI — Sprain vs Fracture Triage App

BoneAI is a sprain vs fracture clinical triage application designed specifically for Indian Tier-2/3 healthcare facilities. It helps health workers make fast, safe, and reliable decisions at the point of care by combining clinical symptom analysis (NLP-driven) with conditional X-ray fracture detection (PyTorch Deep Learning).

---

## 🏗️ Architecture & Stack

### Frontend
- **Framework**: React 18 + Vite (SPA)
- **Styling**: Tailwind CSS v4
- **Typography**: Geist Sans & Geist Mono (self-hosted via `@fontsource`)
- **Key Features**: 
  - Dynamic 3-step clinical triage wizard
  - Conditional drag-and-drop X-ray upload (only triggered for high-severity/uncertain cases)
  - Interactive result dashboard with probability gauges, Grad-CAM heatmap visualization, and clinical action cards (RICE protocol vs. Specialist referral)
  - Radiologist triage queue for case escalation and review

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **ML Engine**: PyTorch + `timm` (EfficientNet-B4 architecture)
- **Image Preprocessing**: OpenCV with CLAHE (Contrast Limited Adaptive Histogram Equalization) for X-ray enhancement
- **Uncertainty Estimation**: Monte Carlo (MC) Dropout (runs 30 forward passes to estimate predictive uncertainty; standard deviation $\ge 0.15$ flags the case for Radiologist Review)
- **Keyword NLP**: English and transliterated Hindi keyword scoring for local symptom descriptions

---

## 📂 Project Structure

```text
boneai/
├── backend/                  # FastAPI Application
│   ├── app/
│   │   ├── core/             # Configuration, CORS, and singleton model loader
│   │   ├── models/           # Pydantic schemas
│   │   ├── routers/          # API endpoints (health, triage, dashboard cases)
│   │   ├── services/         # Business logic (NLP, quality gate, ML prediction, Grad-CAM, MC Dropout)
│   │   └── main.py           # Application entry point
│   ├── models/               # Model weights & binary artifacts (moved from root)
│   │   ├── best_fracture_model.pt       # PyTorch model weights (EfficientNet-B4)
│   │   ├── best_fracture_model.onnx     # ONNX model definition
│   │   └── best_fracture_model.onnx.data# ONNX weight data
│   ├── requirements.txt      # Python dependencies
│   └── venv/                 # Python virtual environment (created)
├── frontend/                 # Vite + React Frontend
│   ├── src/
│   │   ├── api/              # Axios client and API methods
│   │   ├── components/       # Layouts (Navbar, PageShell) & UI Atoms (Button, Badge, Card, Input, Spinner)
│   │   ├── hooks/            # Custom hooks (form wizard state, X-ray drop-zone upload)
│   │   ├── pages/            # Landing, Triage Wizard, Results, and Radiologist Dashboard
│   │   ├── index.css         # Tailwind v4 theme setup & custom styling variables
│   │   └── main.jsx          # Entry point & Font imports
│   ├── package.json          # Node dependencies
│   └── vite.config.js        # Vite build configuration
└── notebookb71d0157b3.ipynb  # EfficientNet-B4 Model Training Notebook
```

---

## 🚀 Getting Started

Follow the instructions below to set up and run BoneAI locally.

### 1. Prerequisites
- **Node.js** (v18 or higher)
- **Python** (v3.10 or higher)

---

### 2. Backend Setup

Open a terminal (Command Prompt or PowerShell on Windows) and navigate to the `backend` directory:

```bash
cd backend
```

#### Step A: Create Python Virtual Environment (Already Created)
If you need to recreate it, run:
```bash
python -m venv venv
```

#### Step B: Activate the Virtual Environment
- **Windows (PowerShell)**:
  ```powershell
  .\venv\Scripts\Activate.ps1
  ```
- **Windows (Command Prompt)**:
  ```cmd
  .\venv\Scripts\activate.bat
  ```
- **macOS / Linux**:
  ```bash
  source venv/bin/activate
  ```

#### Step C: Install Dependencies
```bash
pip install -r requirements.txt
```

#### Step D: Run the FastAPI Server
Ensure you are in the `backend` directory with your virtual environment activated, then run:
```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```
The API documentation will be available at `http://127.0.0.1:8000/docs`.

---

### 3. Frontend Setup

Open a new terminal window and navigate to the `frontend` directory:

```bash
cd frontend
```

#### Step A: Install Node Packages
```bash
npm install
```

#### Step B: Run the Frontend Development Server
```bash
npm run dev
```
The application will be running locally at `http://localhost:5173`.

---

## 🩺 Triage Logic & Safety Gates

1. **Text Triage**: Health workers describe symptoms in English or transliterated Hindi.
2. **Quality Gate**: Uploaded X-rays are checked for blurriness (using Laplacian variance) and under/over-exposure (mean pixel intensities) before processing.
3. **Certainty Check**: The machine learning model runs Monte Carlo Dropout inference (30 passes). 
   - If predictive standard deviation is $\ge 0.15$ (high uncertainty), the case is flagged and queued for a **Radiologist Review** on the dashboard.
   - If certain, the app issues a **Fracture** (high probability) or **Sprain** (low probability) recommendation.
