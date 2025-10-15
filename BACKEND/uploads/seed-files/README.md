# Fichiers de seed pour l'initialisation de la base de données

Ce dossier contient des fichiers par défaut utilisés lors de l'initialisation de la base de données (`initDb.js`).

## Contenu

-   `cours_web.txt` - Cours de développement web (simule un PDF de cours)
-   `notes_cours.txt` - Notes de cours d'un étudiant (simule un document Word)
-   `rapport_annuel.txt` - Rapport d'activité du département (simule un PDF de rapport)
-   `index.html` - Page web de démonstration du projet
-   `style.css` - Feuille de style CSS pour le projet web
-   `script.js` - Script JavaScript pour l'interactivité
-   `documentation_technique.txt` - Documentation technique de la plateforme
-   `guide_utilisateur.txt` - Guide d'utilisation pour les utilisateurs finaux

## Utilisation

Ces fichiers sont référencés dans `initDb.js` pour créer des exemples de fichiers réalistes lors du seeding de la base de données.
Les dossiers de "collections" de la DB contiennent des `.gitkeep` ; le principe, c'est que git ne stash pas de dossiers tant qu'ils sont vide, ils ne sont pas "versionnés". Alors, par convention, on ajoute un `.gitkeep` vide pour que le dossier soit versionné dans tous les cas, même vide lors du push vers le dépôt.

## Modification

Vous pouvez modifier ou ajouter des fichiers dans ce dossier selon vos besoins. Assurez-vous de mettre à jour `initDb.js` si vous ajoutez de nouveaux types de fichiers.
