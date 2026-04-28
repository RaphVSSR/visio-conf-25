# Confort de développement - 2025/2026

## Organisation générale
1. Toute contribution au projet passe par une branche dédiée et une revue de code avant intégration dans `main`.

2. Les issues GitHub sont un impératif lorsqu'il s'agit de découper les besoins actuels du projet pour les prioriser, et enfin les assigner.

3. Avant de commencer une tâche, elle doit être clairement définie, et attribuée sur Github.

4. Lors du développement, chaque membre doit toujours viser la lisibilité, la maintenabilité et la cohérence de son code et du code existant. Si il y a besoin de modifications pour mieux comprendre alors c'est ce qu'il sera fait.

## Gestion des branches

   - 1 tâche = 1 branche (aucune branche ne doit regrouper plusieurs fonctionnalités).
     - feature/nom-fonctionnalité_ou_nom-de-la-tache
     - modif/titre-de-la-modif
     - fix/description-bug

   - Toute fusion de branche doit satisfaire ces conditions :
     - Des commits propres et clairs.
     - Des gestions d'erreurs mises en place.
     - Une validation par au moins un autre développeur. 

<br>

>[!IMPORTANT]
> Si la branche n'existe pas alors il faut la créer en dupliquant le code actuel dans celle-ci puis en nommant les prochains commits en conséquence au sein de celle-ci.<br><br>
> Un titre de commit doit comporter une très brève description du travail apporté, suivi du code de la tâche sur laquelle il a travaillé :<br>
> `ajout de données dans l'entête #3`<br><br>
> L'objectif est de reconnaitre la fonction du commit au premier coup d'oeil puis d'avoir les détails de ce qui en est dans la description de celui-ci.<br>

>[!WARNING]
> La branche principale `main`, ne peut pas être fusionnée directement depuis la ligne de commande via un merge.<br><br>
> Pour empécher toutes complications dû à des merges mal préparés, cette branche ne peut accepter uniquement les fusions via des PR (Pull Requests).<br>
> Question pratique, d'interface UI mais surtout ça nous force à faire et déclarer des revues de code pour validation. ✨

>[!TIP]
> Pour créer un commit :
> ```git
> > git add . (ou les fichiers concernés par le commit)
>
> > git commit -m "Titre du commit #codeDeTache" -m "Description du commit"
>
> > git push
>```
>
> Pour créer une nouvelle branche :
> 
>```git
> > git branch nouvelleBranche
>```
> Liste toutes les branches locales
>```git
> > git branch
>```
> Liste toutes les branches du repo mêmes celles qui n'ont pas été récupérées
>```git
> > git branch -a
>```
> Switcher de branches sans avoir de risques de dupliquer le code en même temps
>```git
> > git switch nom-de-la-branche-visée
>```
> Envoyer des commits sur une branche pas encore liée au repo lors du push
>```git
> > git push --set-upstream origin nom-de-la-branche-a-envoyer-au-repo
>```

## Gestion des tâches (issues)
Toutes les modifications passent par une issue : aucune branche ne doit être créée sans une tâche associée.

### Une issue doit contenir :

1. Un titre explicite.

2. Une description claire du besoin ou du problème.

3. Les critères d’acceptation (si besoin).

4. Un développeur assigné.

<br>

>[!NOTE]
>L’issue est close uniquement après validation de l'intégrité du code (si ça fonctionne tout le temps ou pas) et de la fusion de la branche correspondante.

## Revue de code
Chaque tâche finie doit être revue par au moins un autre membre de l’équipe.

### L’objectif de la revue est de garantir :

1. La qualité du code (structure, performances, complexité).

2. La conformité avec le cahier des charges du projet et de ses spécifications.

3. L’absence de régression.

<br>

>[!NOTE]
> L'abscence de régression c'est le fait de vérifier si avec l'ajout de cette feature/modification/fix, aucunes autres features ne seront impactés négativement

>[!WARNING]
>**Les retours doivent être constructifs, précis et respectueux.**

## Standards de code
- Respect majoritaires des guides établi par les promos précédentes.

- Le code doit pouvoir "s'auto commenter", c'est à dire qu'on doit le comprendre en le lisant. Si ce n'est pas possible, reformatez ou joignez une documentation avec un fichier en .md.

  - Les noms de variables, fonctions et classes doivent être explicites et en anglais.

- Le code mort ou non utilisé doit être nettoyé.

## Tests et qualité
Chaque features doit avoir été testée pour prouver son fonctionnement ou pour trouver de potentiels bugs.

## Communication d’équipe
- Les échanges techniques doivent se faire sur le canal officiel choisi (ex. Slack, Discord, Teams).

- Les décisions importantes (changements d’architecture, choix technologiques, etc.) doivent être documentées dans les documentations du projet.

<br>

>[!NOTE]
> Les réunions de suivi permettent de lever les blocages et de réévaluer les prioritées.