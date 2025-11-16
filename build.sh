#!/bin/bash

# Source the Nixpacks environment variables. This is the key step to make `python3` and `npm` available.
. /etc/profile.d/nix.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run Python build steps
echo "--- Running Python build steps ---"
python3 -m spacy download en_core_web_sm
python3 -m nltk.downloader -d /opt/nltk_data punkt stopwords
# Run Node.js build steps
echo "--- Running Node.js build steps ---"
# Use npm ci for a clean, reliable install in build environments
npm ci
npm run build

echo "Build script finished successfully."