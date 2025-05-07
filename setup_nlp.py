import subprocess
import sys

def install_spacy_model():
    print("Installing spaCy English model...")
    try:
        subprocess.check_call([sys.executable, "-m", "spacy", "download", "en_core_web_sm"])
        print("spaCy model installed successfully!")
    except subprocess.CalledProcessError:
        print("Error installing spaCy model. Please run manually: python -m spacy download en_core_web_sm")

if __name__ == "__main__":
    install_spacy_model()
