"""
Post-traitement après `npx @11ty/eleventy` : convertit tous les chemins absolus
(href="/...", src="/...") en chemins relatifs, calculés selon la profondeur de chaque page.

Les liens internes vers des pages (ex. /livres/foo/) reçoivent un `index.html` final pour
que l'ouverture par double-clic (file://) fonctionne — sans gêner le déploiement sur serveur.

Le résultat : `_site/` est utilisable directement par double-clic, et déployable tel quel.
"""
import re
from pathlib import Path

site = Path("_site")
ATTR_RE = re.compile(r'''(href|src)=(["'])/([^"'>]*?)\2''')

def relativize(html_path):
    rel = html_path.relative_to(site)
    depth = len(rel.parts) - 1
    prefix = "" if depth == 0 else "../" * depth

    text = html_path.read_text(encoding="utf-8")

    def repl(m):
        attr, quote, path = m.group(1), m.group(2), m.group(3)

        # Isoler une éventuelle ancre (#…) ou requête (?…) : sans cela,
        # « /catalogue/#recherche » ne se termine pas par « / » et n'obtient
        # jamais son index.html — le lien casse en ouverture locale (file://),
        # où un dossier ne se résout pas tout seul vers index.html.
        # C'est le bogue de la loupe dans la barre d'outils.
        suffix = ""
        for sep in ("#", "?"):
            i = path.find(sep)
            if i != -1:
                suffix = path[i:] + suffix
                path = path[:i]

        if path == "":
            path = "index.html" if not suffix else ""
        elif attr == "href" and path.endswith("/"):
            path = path + "index.html"

        return f"{attr}={quote}{prefix}{path}{suffix}{quote}"

    new_text = ATTR_RE.sub(repl, text)
    if new_text != text:
        html_path.write_text(new_text, encoding="utf-8")

count = sum(1 for h in site.rglob("*.html") if (relativize(h), True)[1])
print(f"[rendre-relatifs] {count} pages converties")
