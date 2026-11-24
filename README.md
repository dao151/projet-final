# Liste des tâches

Liste des tâches permet d’ajouter, de modifier et de suivre des tâches dans le navigateur. Les tâches et le thème sont enregistrés dans localStorage, puis rechargés à l’ouverture de la page.

**Auteur :** [dao151](https://github.com/dao151)  
**Site :** https://dao151.github.io/[projet final]/  
**Dépôt :** https://github.com/dao151/[projet final]

## Aperçu

![Aperçu de la liste de tâches](apercu.png)

Placez le fichier `apercu.png` à la racine du dépôt pour afficher la capture ci-dessus.

## Fonctionnalités

- Ajouter une tâche avec le champ texte et le bouton, ou avec la touche Entrée. Un texte vide est refusé.
- Modifier le texte d’une tâche par double-clic.
- Supprimer une tâche avec son bouton.
- Marquer une tâche comme terminée avec une case à cocher. Le texte est alors barré.
- Filtrer l’affichage : Toutes, Actives, Terminées.
- Afficher le nombre de tâches restantes.
- Supprimer d’un coup les tâches terminées.
- Retrouver les tâches après rechargement grâce à localStorage.
- Basculer entre le thème clair et le thème foncé. Le choix est mémorisé. Au premier lancement, le thème suit le réglage du système.

## Technologies utilisées

- HTML
- CSS
- JavaScript
- localStorage
- GitHub Pages

Le projet n’utilise ni framework ni bibliothèque externe.

## Installation et lancement

Clonez le dépôt, puis ouvrez `index.html` dans le navigateur :

```bash
git clone https://github.com/dao151/[projet final].git
```

Vous pouvez aussi télécharger le dépôt depuis GitHub et ouvrir `index.html` directement. Aucune commande d’installation n’est nécessaire.

## Structure des fichiers

```text
[projet final]/
├── index.html    # structure de la page
├── style.css     # mise en page, thèmes et animations
├── script.js     # ajout, modification, filtres, sauvegarde et thème
├── apercu.png    # capture d’écran utilisée dans ce README
└── README.md
```

## Déploiement GitHub Pages

1. Poussez ce dépôt vers https://github.com/dao151/[projet final].
2. Dans le dépôt, ouvrez **Settings**, puis **Pages**.
3. Sous **Build and deployment**, choisissez **Deploy from a branch**.
4. Sélectionnez la branche `main` et le dossier `/ (root)`, puis enregistrez.
5. Après la publication, le site est accessible à https://dao151.github.io/[projet final]/.

`index.html` doit rester à la racine du dépôt. Les tâches enregistrées restent dans le navigateur de chaque visiteur : GitHub Pages ne les stocke pas.

## Améliorations futures

- Réordonner les tâches par glisser-déposer.
- Ajouter une date d’échéance.
- Exporter et importer la liste (fichier JSON).
- Classer les tâches par catégorie.
