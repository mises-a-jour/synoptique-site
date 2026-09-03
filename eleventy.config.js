module.exports = function (eleventyConfig) {
  // Copie des fichiers statiques
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "src/admin": "admin" });
  eleventyConfig.addPassthroughCopy({ "src/contact.php": "contact.php" });

  // Collections
  eleventyConfig.addCollection("livres", (c) =>
    c.getFilteredByGlob("src/livres/*.md").sort((a, b) =>
      (b.data.annee || 0) - (a.data.annee || 0)
    )
  );
  eleventyConfig.addCollection("nouveautes", (c) =>
    c
      .getFilteredByGlob("src/livres/*.md")
      .filter((i) => i.data.nouveaute)
      .sort((a, b) => (b.data.annee || 0) - (a.data.annee || 0))
  );
  eleventyConfig.addCollection("auteurs", (c) =>
    c.getFilteredByGlob("src/auteurs/*.md").sort((a, b) =>
      // Tri par patronyme (« tri ») — comparer « tri » à « tri », et non au
      // nom complet, sans quoi l'ordre est incohérent (bogue historique).
      (a.data.tri || a.data.nom).localeCompare(b.data.tri || b.data.nom, "fr")
    )
  );

  // Filtre : retrouver un auteur par son slug
  eleventyConfig.addFilter("auteurParSlug", function (auteurs, slug) {
    return (auteurs || []).find((a) => a.data.slug === slug);
  });
  // Filtre : livres d'un auteur donné
  eleventyConfig.addFilter("livresDeLAuteur", function (livres, slug) {
    return (livres || []).filter((l) => l.data.auteur === slug);
  });
  // Filtre : livres d'une maison donnée (synoptique | presses)
  eleventyConfig.addFilter("parMaison", function (livres, m) {
    return (livres || []).filter((l) => l.data.maison === m);
  });
  // Filtre : livres d'une collection donnée
  eleventyConfig.addFilter("parCollection", function (livres, c) {
    return (livres || []).filter((l) => l.data.collection === c);
  });
  // Filtre : livres d'un genre donné (insensible à la casse et aux accents)
  eleventyConfig.addFilter("parGenre", function (livres, g) {
    const norm = (s) => String(s || "").toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return (livres || []).filter((l) => norm(l.data.genre) === norm(g));
  });
  // Filtre : événements à venir (date >= aujourd'hui), triés du plus proche au plus lointain
  eleventyConfig.addFilter("evenementsAvenir", function (evenements) {
    const auj = new Date().toISOString().slice(0, 10);
    return (evenements || []).filter((e) => e.date >= auj)
      .sort((a, b) => a.date.localeCompare(b.date));
  });
  // Filtre : événements passés (date < aujourd'hui), triés du plus récent au plus ancien
  eleventyConfig.addFilter("evenementsPasses", function (evenements) {
    const auj = new Date().toISOString().slice(0, 10);
    return (evenements || []).filter((e) => e.date < auj)
      .sort((a, b) => b.date.localeCompare(a.date));
  });
  // Filtre : auteurs triés par patronyme (champ "tri")
  eleventyConfig.addFilter("sortByTri", function (auteurs) {
    return [...(auteurs || [])].sort((a, b) =>
      String(a.data.tri || a.data.nom).localeCompare(String(b.data.tri || b.data.nom), "fr")
    );
  });
  // Filtre : extraire un attribut (chemin pointé) de chaque item
  eleventyConfig.addFilter("pluck", function (arr, path) {
    const keys = String(path).split(".");
    return (arr || []).map((item) =>
      keys.reduce((o, k) => (o == null ? o : o[k]), item)
    );
  });
  // Filtre : trier une liste de noms complets par patronyme.
  // « distinct » trie sur la chaîne entière, donc sur le prénom (Jean Buridan,
  // Nathalie de Grandpré, Patrick Dionne). Patrick veut l'ordre des patronymes
  // (Buridan, Dionne, de Grandpré) : on va chercher le champ « tri » de chaque
  // fiche d'auteur, avec repli sur le dernier mot du nom.
  eleventyConfig.addFilter("parPatronyme", function (noms, auteurs) {
    const cle = (nom) => {
      // Certains livres portent une mention entre parenthèses absente de la
      // fiche d'auteur (« Claude-Henri Grignon (Valdombre) ») : on l'écarte
      // avant la recherche, sinon le tri se ferait sur « (Valdombre) ».
      const propre = String(nom || "").replace(/\s*\([^)]*\)/g, "").trim();
      const fiche = (auteurs || []).find(
        (a) => a.data.nom === nom || a.data.nom === propre
      );
      if (fiche && fiche.data.tri) return String(fiche.data.tri);
      return propre.split(/\s+/).pop();
    };
    return [...(noms || [])].sort((a, b) =>
      cle(a).localeCompare(cle(b), "fr")
    );
  });

  // Filtre : valeurs distinctes triées (pour les facettes)
  eleventyConfig.addFilter("distinct", function (arr) {
    return [...new Set(arr.filter(Boolean))].sort((a, b) =>
      String(a).localeCompare(String(b), "fr")
    );
  });

  // ─────────────────────────────────────────────────────────────
  // Filtre « typo » : règles typographiques françaises appliquées
  // globalement (références, sources, notices). Évite de corriger
  // les mêmes fautes à la main sur chaque fiche.
  //   • no 61      → nᵒ 61      (exposant)
  //   • XXe siècle → XXᵉ siècle (exposant, chiffres romains)
  //   • '          → ’          (apostrophe typographique)
  //   • titres de revues et d'œuvres → italiques
  // ─────────────────────────────────────────────────────────────
  const TITRES_ITALIQUES = [
    "Égards", "L’Incorrect", "L’Action nationale", "Reconquête",
    "Le Verbe", "Un livre à la foi", "Questions d’actualité", "Présent",
  ];

  eleventyConfig.addFilter("typo", function (s) {
    if (!s) return s;
    let t = String(s);

    // Apostrophes typographiques (avant tout le reste : les titres en dépendent)
    t = t.replace(/'/g, "\u2019");

    // Guillemets liés à leur mot par une espace insécable : sans cela, la
    // coupure de ligne peut laisser un « ou un » seul en bout de ligne
    // (les « guillemets orphelins » signalés par Patrick).
    t = t.replace(/«[\s\u00a0\u202f]*/g, "«\u00a0");
    t = t.replace(/[\s\u00a0\u202f]*»/g, "\u00a0»");

    // « no 61 » → « nᵒ 61 » (uniquement devant un nombre)
    t = t.replace(/\bno\s*(\d)/gi, "n<sup>o</sup>\u00a0$1");

    // « XXe », « XIXe », « XIVe »… → exposant sur le e.
    // Deux caractères minimum ET majuscules strictes : sans quoi « De »
    // (D = 500) et « Vie » (V+I) seraient pris pour des siècles.
    t = t.replace(/\b([IVXLCDM]{2,})e\b/g, "$1<sup>e</sup>");

    // Titres de revues / d'œuvres en italiques (hors balise déjà posée).
    // Frontières Unicode : \b ne reconnaît pas les accents (le « É »
    // d'Égards n'est pas un caractère de mot au sens de \w).
    for (const titre of TITRES_ITALIQUES) {
      const esc = titre.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      t = t.replace(
        new RegExp(`(?<![\\p{L}>])${esc}(?![\\p{L}<])`, "gu"),
        `<em>${titre}</em>`
      );
    }
    return t;
  });

  // Filtre « insec » : version légère de « typo » pour les longs corps de
  // citation, où l'on ne veut ni exposants ni italiques automatiques —
  // seulement les apostrophes et les guillemets insécables.
  eleventyConfig.addFilter("insec", function (s) {
    if (!s) return s;
    return String(s)
      .replace(/'/g, "\u2019")
      .replace(/«[\s\u00a0\u202f]*/g, "«\u00a0")
      .replace(/[\s\u00a0\u202f]*»/g, "\u00a0»");
  });

  eleventyConfig.ignores.add("src/admin/index.html");

  return {
    dir: { input: "src", includes: "_includes", data: "_data", output: "_site" },
    htmlTemplateEngine: "njk",
    markdownTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
};
