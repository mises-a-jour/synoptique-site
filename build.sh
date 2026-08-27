#!/bin/bash
# Build complet : Eleventy + conversion des chemins en relatifs (pour ouverture
# locale par double-clic ET pour déploiement sur tout serveur statique).
set -e
npx @11ty/eleventy
python3 versionner-couvertures.py
python3 rendre-relatifs.py
