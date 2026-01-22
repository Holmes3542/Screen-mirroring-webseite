#!/bin/bash
# setup.sh
echo "Setting up project structure..."

# Aktuelles Verzeichnis ausgeben
echo "Current directory: $(pwd)"
echo "Files:"
ls -la

# Package.json an mehrere Orte kopieren
cp package.json /opt/render/project/src/
cp package.json ./
cp package.json /tmp/

# Dependencies installieren
npm install

echo "Setup complete!"
