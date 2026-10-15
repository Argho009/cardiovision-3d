import os
import sys
import subprocess
import webbrowser
import time

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))

def ensure_models_trained():
    models_dir = os.path.join(PROJECT_ROOT, 'models')
    cad_model = os.path.join(models_dir, 'cath_model.joblib')
    
    if not os.path.exists(cad_model):
        print("=" * 60)
        print("CardioVision 3D: Initializing & Training Prediction Models...")
        print("=" * 60)
        train_script = os.path.join(PROJECT_ROOT, 'src', 'ml', 'train.py')
        res = subprocess.run([sys.executable, train_script], cwd=PROJECT_ROOT)
        if res.returncode != 0:
            print("Warning: Model training exited with code", res.returncode)
    else:
        print("[CardioVision 3D] Found trained model artifacts in models/")

def run_app():
    ensure_models_trained()
    
    backend_script = os.path.join(PROJECT_ROOT, 'src', 'backend', 'app.py')
    port = 5000
    url = f"http://127.0.0.1:{port}"
    
    print("=" * 60)
    print(f"CardioVision 3D Web Application starting at: {url}")
    print("Interactive 3D Heart + Clinical Decision Dashboard Ready!")
    print("Press Ctrl+C to stop the server.")
    print("=" * 60)
    
    # Open browser after a brief delay
    def open_browser():
        time.sleep(1.5)
        webbrowser.open(url)
        
    import threading
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Run server
    subprocess.run([sys.executable, backend_script], cwd=PROJECT_ROOT)

if __name__ == '__main__':
    run_app()
