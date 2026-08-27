# Éditions Synoptique — site web

Site statique généré avec **Eleventy** (11ty). Phase 1 : structure et design — terminée.

---

## Visualiser le site

Le dossier `_site/` contient le site prêt à l'emploi.

- **En local** : double-clic sur `_site/index.html` — ça s'ouvre dans le navigateur.
- **En ligne** : déposer le contenu de `_site/` sur le serveur de destination (Cloudflare Pages, etc.).

Les chemins sont relatifs : un seul dossier sert dans les deux cas.

---

## Travailler sur le site

Pré-requis : Node.js (≥ 18) et Python 3.

```bash
npm install         # installe Eleventy (la première fois)
./build.sh          # régénère tout le site dans _site/
npm start           # serveur local avec rechargement : http://localhost:8080
```

Le script `build.sh` enchaîne deux étapes :
1. `npx @11ty/eleventy` — génère le HTML avec chemins absolus
2. `python3 rendre-relatifs.py` — convertit les chemins en relatifs pour que `_site/` fonctionne en double-clic ET en déploiement

---

## Arborescence

```
src/
  _data/
    site.js              → nom, navigation, pied de page
    evenements.js        → événements de l'agenda
  _includes/             → gabarits (base, livre, auteur, emblème) + macros
  livres/*.md            → une fiche par titre
  auteurs/*.md           → une fiche par auteur (ou collaborateur)
  collections/*.njk      → pages des collections
  assets/css/            → feuille de style de la maison
  assets/covers/         → couvertures
  assets/img/            → photos (Valdombre, portraits, logo)
  + toutes les pages racines (.njk) : accueil, catalogue, genres, légales, etc.
eleventy.config.js       → collections, filtres, copie des assets
rendre-relatifs.py       → post-traitement (chemins relatifs)
build.sh                 → orchestration build complet
```

---

## Ajouter / modifier un livre

Créer (ou éditer) un fichier dans `src/livres/`, p. ex. `mon-titre.md` :

```markdown
---
titre: "Mon titre"
slug: mon-titre
auteur: patrick-dionne          # slug de l'auteur
auteurNom: "Patrick Dionne"
annee: 2026
pages: 120
genre: Aphorismes
maison: synoptique              # ou "presses"
prixCAD: 20
prixEUR: 14
isbn: "978-2-924712-XX-X"
cover: mon-titre.jpg            # déposer l'image dans src/assets/covers/
nouveaute: true                 # facultatif : place le titre en Nouveautés
---
Texte de présentation du livre.
```

La page du titre, sa présence au catalogue, dans les Nouveautés, sur la page
de l'auteur et dans la page de son genre se mettent à jour automatiquement.

---

## Ajouter un événement à l'Agenda

Éditer `src/_data/evenements.js` et y ajouter un objet :

```javascript
module.exports = [
  {
    titre: "Lancement de L'Heure venue",
    type: "Lancement",                       // Lancement, Signature, Salon, Conférence…
    date: "2026-09-12",                      // ISO 8601
    dateLisible: "12 septembre 2026",        // optionnel
    lieu: "Librairie Pantoute, Québec",
    description: "En présence de Patrick Dionne."  // optionnel
  }
];
```

---

## Pages légales

Trois pages-modèles ont été rédigées selon les standards québécois (Loi 25
sur les renseignements personnels, Loi sur la protection du consommateur)
avec adaptations RGPD :

- `src/mentions-legales.njk` — 10 sections
- `src/confidentialite.njk` — 14 sections
- `src/cgv.njk` — 16 sections

Chacune comporte un disclaimer rappelant que le texte est un modèle conforme
aux usages, **à faire valider par un conseiller juridique avant publication**.
Les éléments `[à compléter]` doivent être remplis (raison sociale, NEQ, adresse,
district judiciaire, courriels, dates de mise à jour, etc.).

---

## À faire dans les phases suivantes

- **Phase 2** — module d'édition (Sveltia/Decap CMS) sur `/admin`, pour gérer
  livres, auteurs, événements et textes de La Maison sans toucher au code.
- **Phase 3** — vente (Snipcart) : activer « Ajouter au panier », taxes (TPS/TVQ)
  et frais de port au poids (champ `poids` déjà présent sur chaque fiche).
- **Phase 4** — formulaire de contact actif + infolettre (Brevo).
