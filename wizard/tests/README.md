# wizard/tests

Suite de tests du wizard POSIX sh. Double usage : filet de regression pour la reecriture bash -> sh, et garde-fou pre-release pour le legacy.

## Lancement

```sh
./wizard/tests/run.sh              # toutes les couches
./wizard/tests/run.sh --layer 1    # soundness seulement
./wizard/tests/run.sh --layer 2    # flows seulement
./wizard/tests/run.sh --matrix     # delegue a matrix.sh (alpine/debian/bash)
```

Prerequis : `sh`, `shellcheck`. Pour `--matrix` : `docker`.

## Codes de sortie

| Code | Sens |
|---|---|
| 0 | PASS |
| 1 | Au moins un fichier de test a echoue |
| 2 | Prerequis manquant ou usage invalide |

## Couches

| Couche | Dossier | Role |
|---|---|---|
| 1 - Soundness | `units/` | Parse, shellcheck `-s sh`, presence de fonctions, nommage, units helpers |
| 2 - Flows | `flows/` | Scenarios menu de bout en bout avec mocks PATH-shadow et fixture projet |

## Mocks

`mocks/` contient des binaires factices (docker, pm2, nginx, systemctl, apt, brew, winget, git, openssl, mongod, sc.exe, powershell.exe). Generes par `mocks/_install.sh`. Actives via `setup_mocks` dans `lib/test_helpers.sh` : prepend `mocks/` au `PATH` et redirige les appels vers `$MOCK_LOG/<nom>.log`. Assertions : `assert_mock_called`, `assert_mock_not_called`.

## Fixture

`fixtures/fake-project/` : arborescence projet minimale (BACKEND, FRONTENDV2, .git). Genere par `fixtures/_make.sh`. Expose via `$FIXTURE_PROJECT`.

## Ajouter un test

1. Couche 1 : creer `units/test_<sujet>.sh`, sourcer `lib/test_helpers.sh` et `$SHUNIT2`.
2. Couche 2 : creer `flows/test_<flow>.sh`, appeler `setup_mocks` en setup, piper l'entree menu au wizard, asserter via `assert_mock_called`.
3. Chaque fichier doit etre executable par `sh` pur (aucune bashisme) et passer `shellcheck -s sh`.
4. `run.sh` le ramasse automatiquement via le glob `test_*.sh`.
