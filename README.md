# Braise

Compose tes séances kettlebell, visualise les muscles engagés sur une carte
interactive, exporte vers ta montre Garmin (.FIT) et partage l'image de ta
séance sur Strava. 100 % statique : aucun compte, aucun tracking, tes données
restent dans ton navigateur.

## Fonctionnalités

- Carte musculaire interactive (15 groupes, silhouettes face et dos vectorisées
  depuis l'illustration originale du projet) : sélection au doigt, visualisation
  d'une séance avec allumage progressif des braises.
- Générateur déterministe de séances : muscles cibles, durée (20/30/40 min),
  1 ou 2 kettlebells, niveau, poids ; couverture des cibles en sollicitation
  principale, patterns équilibrés, tours calculés pour tenir la durée, bouton
  Variante (seed aléatoire).
- 12 routines fournies : 9 Intégrales full body de 20 min (3 variantes par
  niveau), Double Fonte (2 KB), EMOM Swing et Snatch, Core Express.
- Export .FIT encodé dans le navigateur avec le SDK officiel `@garmin/fitsdk`
  (identifiants d'exercices Garmin vérifiés) ; test de non-régression par
  décodage round-trip.
- Export PNG 1200 × 1740 de la carte musculaire de la séance, dans la mise en
  page de l'illustration d'origine, avec partage natif (feuille de partage
  iOS et Android) quand le navigateur le permet.
- Échauffement détaillé : 4 mouvements de 60 s choisis selon les muscles de la
  séance, affichés sur la fiche et inscrits dans les notes du fichier .FIT.
- Fonctionne hors ligne : toute l'app est précachée par un service worker et
  se met à jour automatiquement à chaque déploiement.
- Séances sauvegardées en localStorage, renommage, suppression, export et
  import JSON.
- 3 thèmes commutables (Braise, Acier, Fusion), tokens gérés dans
  `src/themes/`, polices OFL self-hostées.
- Guide d'installation Garmin, Strava et Apple Watch intégré.
- Bibliothèque de 35 exercices avec fiches complètes : photos de position
  (free-exercise-db, domaine public, auto-hébergées) et liens vidéo vérifiés
  (MuscleWiki en français, kettlebellsworkouts.com pour les mouvements
  balistiques). Régénération : `python3 assets-src/fetch_media.py`.

## Installation

```bash
npm install
```

## Développement

```bash
npm run dev
```

L'app tourne sur `http://localhost:5173/braise/`.

## Tests

```bash
npm test -- --run
```

Quatre suites vitest : round-trip FIT (encode puis décode avec le décodeur
officiel), générateur (couverture, focus, patterns, durée, déterminisme),
presets (conformité des identifiants FIT du brief, durées), export PNG.

## Build et déploiement

```bash
npm run build
```

Le déploiement est automatique : le workflow GitHub Actions
`.github/workflows/deploy.yml` teste, construit et publie `dist/` sur GitHub
Pages à chaque push sur `main`. Dans les réglages du dépôt, activer
Pages avec la source « GitHub Actions ». La base Vite est `/braise/` : si le
dépôt change de nom, adapter `base` dans `vite.config.ts`.

## Structure

```
src/
  data/        muscles, exercices (ids FIT vérifiés), presets, config générateur
  themes/      braise / acier / fusion : tokens appliqués en variables CSS
  lib/         generator, session (temps et muscles), fit/encoder, pngExport, storage
  components/  MuscleMap, SessionBuilder, SessionCard, PresetGallery,
               ExerciseSheet, GarminGuide, ThemePicker
assets-src/    pipeline python de vectorisation de l'illustration source
               (trace_muscles.py, build_svg.py) ; hors bundle
tests/         vitest
.github/       workflow de déploiement Pages
```

## Régénérer la carte musculaire

Les paths SVG de `src/data/muscleShapes.ts` sont tracés depuis l'illustration
source avec potrace. Pour les régénérer (nouvelle image, nettoyage) :

```bash
brew install potrace
pip3 install pillow numpy scipy
python3 assets-src/trace_muscles.py
python3 assets-src/build_svg.py
```

## Licences

Le code de l'app appartient au projet. Les polices embarquées (Archivo,
Instrument Sans, JetBrains Mono, Anton, Public Sans, IBM Plex Mono, Syne,
Figtree, Space Mono) sont sous licence SIL OFL via Fontsource. Le protocole
FIT est utilisé via le SDK officiel Garmin sous sa licence FIT.
