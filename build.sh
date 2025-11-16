#!/bin/bash

# Source the Nixpacks environment variables to make tools like `python3` and `npm` available.
. /etc/profile.d/nix.sh

# Exit immediately if a command exits with a non-zero status.
set -e

# Run Python build steps
echo "--- Running Python build steps ---"
python3 -m spacy download en_core_web_sm
python3 -m nltk.downloader -d /opt/nltk_data punkt stopwords

# Run Node.js build steps
echo "--- Running Node.js build steps ---"
npm install --ignore-scripts
chmod +x ./node_modules/.bin/vite
npm run build

echo "Build script finished successfully."