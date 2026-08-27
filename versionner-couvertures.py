"""
Versionnage des images par empreinte de contenu (« fingerprinting »).

Après le build Eleventy et AVANT `rendre-relatifs.py` :
chaque image de `_site/assets/covers/` ET `_site/assets/img/` est renommée avec
un suffixe calculé sur son contenu — ex. `theophile.jpg` -> `theophile.a1b2c3d4.jpg`
— et toutes les références dans le HTML sont mises à jour.

Effet : dès qu'une image change (couverture, photo d'auteur, bandeau...), son
empreinte change, donc son nom de fichier change ; le navigateur recharge
automatiquement la nouvelle version au lieu de servir une copie en cache.
Comme ce sont de vrais noms de fichiers, l'ouverture par double-clic (file://)
fonctionne dans tous les navigateurs.

Les fichiers sources (`src/assets/covers/...`, `src/assets/img/...`) ne sont pas
touchés : seul `_site/` reçoit les noms versionnés.
"""
import hashlib
import re
from pathlib import Path

site = Path("_site")
DOSSIERS = [site / "assets" / "covers", site / "assets" / "img"]
EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"}
HASHED = re.compile(r"\.[0-9a-f]{8}\.(jpg|jpeg|png|webp|gif|svg)$", re.I)

mapping = {}
total = 0

for dossier in DOSSIERS:
    if not dossier.is_dir():
        continue

    # 1. Nettoyer d'éventuels restes versionnés d'un build précédent.
    for f in dossier.iterdir():
        if f.is_file() and HASHED.search(f.name):
            f.unlink()

    # 2. Calculer l'empreinte et renommer.
    for f in sorted(dossier.iterdir()):
        if f.is_file() and f.suffix.lower() in EXT:
            h = hashlib.md5(f.read_bytes()).hexdigest()[:8]
            new = f"{f.stem}.{h}{f.suffix}"
            f.rename(dossier / new)
            mapping[f"{dossier.name}/{f.name}"] = f"{dossier.name}/{new}"
            total += 1

if not mapping:
    print("[versionner] aucune image trouvée — étape ignorée")
    raise SystemExit(0)

# 3. Réécrire les références dans le HTML (les chemins sont encore absolus ici :
#    « .../assets/covers/NOM.ext » ou « .../assets/img/NOM.ext »).
for html in site.rglob("*.html"):
    txt = html.read_text(encoding="utf-8")
    orig = txt
    for old, new in mapping.items():
        txt = txt.replace(old, new)
    if txt != orig:
        html.write_text(txt, encoding="utf-8")

print(f"[versionner] {total} images versionnées")
