#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Run Python build steps
python3 -m nltk.downloader -d /opt/nltk_data punkt stopwords
python3 manage.py collectstatic --noinput

# Run Node.js build steps
npm install --ignore-scripts
chmod +x ./node_modules/.bin/vite
npm run build

echo "Build script finished successfully."