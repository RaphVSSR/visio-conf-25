# Wizard E2E Test Plan — design spec

**Status** — design (pre-implementation). **Audience** — senior tester running the plan. **Scope** — end-to-end real-install tests of `setup.sh` on one physical machine, two terminals: WSL Debian + Windows POSIX host. **Out of scope** — macOS, unit re-test of wizard internals (existing mock suite under `wizard/tests/` stay untouched), performance, upgrade-from-old.

> **Big warning — me say loud.** Tests do REAL install of Docker, MongoDB, Node, Nginx on the host. Same physical machine runs both phases. Tests try clean after each flow but cleanup is best-effort, never perfect. Run only on disposable laptop OR accept real dev-machine changes stick. If box is shared or production-ish, STOP — spin separate testbed first.

---

## 1. Why this plan exist

Caveman mission — prove wizard lead clean empty machine to fully working MMI-VisioConf app, zero manual tweak, zero crash, every menu branch. Two OS supports — WSL Debian + Windows POSIX host. One test, one cleanup, one next test. Halt on dirty. After all green, audit doc written with graphs + recommendations (each recommendation tested + approved before offered).

Me do not change wizard files. Me only read wizard, drive wizard, assert outcome, clean, write docs.

---

## 2. Test host rules

| Rule | Value |
|---|---|
| Physical machine | one dev box, disposable-ish |
| Terminal 1 | WSL Debian (fresh) — Phase 1 |
| Terminal 2 | Windows POSIX host (MINGW / MSYS2 / Cygwin — whatever give `uname -s` match `MINGW*\|MSYS*\|CYGWIN*\|*NT`) — Phase 2 |
| Shebang everywhere | `#!/bin/sh` strict — no `[[`, no arrays, no `<<<`, no `pipefail`. `local` keyword allowed (wizard itself relies on it; supported by dash/ash/bash on every target host) |
| Working dir | Each test runs from a scratch dir `wizard/tests/e2e/_work/<test-id>/` — wizard clones `visio-conf-25/` into it. Scratch dir rm-rf'd in paired cleanup |
| Phase order | Phase 1 → Phase 2 (never parallel) |
| Env order inside phase | always DEV first, PROD after |
| Halt rule | any test fail OR any post-cleanup dirty-check fail → suite abort |
| Re-run rule | after abort, user must manual clean remaining dirt before rerun |

---

## 3. Coverage — what tests cover

Every menu path user can click from `setup.sh`.

| Menu path | Covered in | OS |
|---|---|---|
| Boot → `setup_prereqs` → `ensure_services` | T01 / W01 | both |
| Main menu render + all 4 options exist | T01 / W01 | both |
| Main → Docker → dev → install/launch/status/stop | T03 / W03 | both |
| Main → Docker → prod → install/launch/status/stop | T04 / W04 | both |
| Main → Legacy → Linux → dev → install/launch/reload/status/stop/ssl | T05 | WSL only |
| Main → Legacy → Linux → prod → install/launch/reload/status/stop/ssl | T06 | WSL only |
| Main → Legacy → Windows → dev → install/launch/reload/status/stop/ssl | W05 | Windows only |
| Main → Legacy → Windows → prod → install/launch/reload/status/stop/ssl | W06 | Windows only |
| Main → Generate .env → dev + prod defaults | T02 / W02 | both |
| Main → Quit | T07 / W07 | both |

SSL sub-branches tested in both accept + decline branches where real public cert impossible (certbot → always decline; mkcert → accept if installable, decline otherwise).

Skip rule: if needed prerequisite absent AFTER wizard install try (e.g. Docker Desktop unavailable on Windows testbed), test MARK skipped — not fail. Skip count ≤ 2 per phase or suite fail (coverage hole).

---

## 4. Run architecture

```
                      ┌─────────────────────────────┐
                      │   run_e2e.sh (driver)       │
                      │   detect OS → load phase    │
                      └──────────────┬──────────────┘
                                     │
            ┌────────────────────────┴────────────────────────┐
            ▼                                                 ▼
   ┌─────────────────┐                               ┌─────────────────┐
   │ linux/ phase    │                               │ windows/ phase  │
   │ T01 → T02 → ... │                               │ W01 → W02 → ... │
   └────────┬────────┘                               └────────┬────────┘
            │                                                 │
            │ per test                                        │
            ▼                                                 ▼
   ┌─────────────────┐    ┌──────────────┐    ┌─────────────────┐
   │ pre (skip? env) │───▶│ drive wizard │───▶│ assert outcome  │
   └─────────────────┘    └──────────────┘    └────────┬────────┘
                                                       │
                                  ┌────────────────────▼────────────────────┐
                                  │ cleanup (paired <test>_cleanup.sh)      │
                                  └────────────────────┬────────────────────┘
                                                       │
                                             ┌─────────▼─────────┐
                                             │ verify_clean gate │
                                             └────┬─────────┬────┘
                                       clean     │         │ dirty
                                                 ▼         ▼
                                        ┌─────────────┐ ┌─────────────┐
                                        │ next test   │ │ ABORT suite │
                                        └─────────────┘ └─────────────┘
```

---

## 5. Folder shape

```
wizard/tests/e2e/
  run_e2e.sh                  ← driver, halt-on-dirty, log mgmt
  README.md                   ← how to run on each phase
  lib/
    e2e_helpers.sh            ← asserts, drive_wizard, skip_if_*, log_line
    cleanup_gate.sh           ← verify_clean() reusable, dirty reports
    inputs.sh                 ← canned input strings per flow
    ports.sh                  ← PORTS_DEV / PORTS_PROD constants
  linux/
    T01_boot.sh
    T02_generate_env.sh
    T02_generate_env_cleanup.sh
    T03_docker_dev.sh
    T03_docker_dev_cleanup.sh
    T04_docker_prod.sh
    T04_docker_prod_cleanup.sh
    T05_legacy_dev.sh
    T05_legacy_dev_cleanup.sh
    T06_legacy_prod.sh
    T06_legacy_prod_cleanup.sh
    T07_quit.sh
  windows/
    W01_boot.sh
    W02_generate_env.sh
    W02_generate_env_cleanup.sh
    W03_docker_dev.sh
    W03_docker_dev_cleanup.sh
    W04_docker_prod.sh
    W04_docker_prod_cleanup.sh
    W05_legacy_dev.sh
    W05_legacy_dev_cleanup.sh
    W06_legacy_prod.sh
    W06_legacy_prod_cleanup.sh
    W07_quit.sh
  logs/
    <run-id>/
      suite.log               ← driver summary
      <test-id>.log           ← stdout + stderr per test
      <test-id>.clean.log     ← cleanup output per test
      dirty.log               ← written only on dirty-abort
  audit/
    TEMPLATE.md               ← filled after run by tester
```

New folder `wizard/tests/e2e/` separated from existing mock suite `wizard/tests/{flows,units,mocks,...}` — zero overlap, zero reuse, zero risk of mock leaking into real run. Existing mock tests untouched.

---

## 6. Test anatomy (every script identical shape)

```
┌─────────────┐   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐
│ PRE         │──▶│ DRIVE       │──▶│ ASSERT       │──▶│ CLEANUP     │──▶│ REPORT       │
│ skip_if_*   │   │ printf \\n  │   │ port / HTTP  │   │ paired .sh  │   │ PASS/FAIL    │
│ env check   │   │ pipe setup  │   │ file / proc  │   │ verify gate │   │ + log path   │
│ pre-snap    │   │ timeout cap │   │ stdout grep  │   │ abort dirty │   │ + duration   │
└─────────────┘   └─────────────┘   └──────────────┘   └─────────────┘   └──────────────┘
```

### How drive_wizard() work

Input piping. Caveman pseudocode:

```sh
drive_wizard() {
    input_str="$1"     # e.g. "\n1\n1\n1\n./\n" for docker dev install
    timeout_sec="$2"   # e.g. 900 for install, 60 for status
    log_file="$3"
    printf '%b' "$input_str" | timeout "$timeout_sec" ./setup.sh > "$log_file" 2>&1
    return $?
}
```

Input strings live in `lib/inputs.sh`. Each flow has named variable, e.g.:

```sh
INPUT_DOCKER_DEV_INSTALL='\n1\n1\n1\n./\ny\n...'  # menu answers + path + consent
INPUT_DOCKER_DEV_LAUNCH='\n1\n1\n2\n'
...
```

### Pre-step skip rules

| Rule | If true → skip test (not fail) |
|---|---|
| `skip_if_no_internet` | `curl -fsSL --max-time 5 https://example.com` fails |
| `skip_if_no_docker` | on Windows and Docker Desktop not running |
| `skip_if_no_systemd` | on WSL without systemd (only for prod legacy launch path) |

Total skip budget ≤ 2 per phase else suite fail.

---

## 7. Pass / fail criteria

| Flow kind | Green when ALL true |
|---|---|
| boot / nav | exit 0, menu ASCII seen in log, quit exit 0 |
| generate env | `BACKEND/.env` + `FRONTENDV2/.env` exist, required keys present + non-empty |
| install | exit 0, `command -v <tool>` for every dep, key artifact exists (.env / node_modules / dist / docker image) |
| launch | exit 0, expected port listening, `curl -fsS` returns 200 on matching endpoint, process alive |
| reload | same as launch + PID changed (proof real restart) |
| stop | exit 0, port free, process gone, container down |
| status | exit 0, stdout contains expected line pattern for each monitored service |
| ssl (accept) | cert file exists, permission OK, wizard reports success |
| ssl (decline) | wizard skips cert flow, reports "HTTP seul" warning, continues |

Red = any check fail. Yellow = warning step in wizard (e.g. port check warn but exit 0) → log + flag for audit.

### Expected port matrix

| Env | MongoDB | Backend | Frontend | Nginx |
|---|---|---|---|---|
| Docker dev | 27017 | 3220 | 3000 | — |
| Docker prod | — (internal) | — (internal) | — (internal) | 80 + 443 |
| Legacy dev | 27017 | 3220 | 3000 | — |
| Legacy prod | 27017 | 3220 (pm2) | — | 80 + 443 |

### HTTP probes

| Env | URL | Expected |
|---|---|---|
| dev backend | `http://localhost:3220/` | 200 OR 404 (route-dependent, but alive) |
| dev frontend | `http://localhost:3000/` | 200 with `<div id="root"` in body |
| prod | `http://localhost/` | 200 or 301→443 |

---

## 8. Cleanup gate — hard rule

Every cleanup script try undo every action of its paired test. After cleanup runs, `verify_clean()` re-check host state. Dirty = suite abort.

### What each cleanup do

| Paired to | Cleanup steps |
|---|---|
| T02 / W02 generate env | rm `BACKEND/.env`, rm `FRONTENDV2/.env`, rm any `.env.bak` |
| T03 docker dev | `docker compose down -v --remove-orphans`, `docker rmi $(docker images -q 'visio-*')`, `docker volume prune -f`, rm test project dir |
| T04 docker prod | same as T03 + ensure port 80/443 free |
| T05 legacy linux dev | kill pids on 3000/3220 via `find_port_pid`, `sudo systemctl stop mongod` if running, rm node_modules, rm build/, rm .env, rm mkcert CA trust (`mkcert -uninstall` if installed), rm project dir |
| T06 legacy linux prod | `pm2 delete all && pm2 kill`, `sudo systemctl stop nginx mongod`, `sudo rm -rf /etc/nginx/sites-enabled/visioconf*`, rm project dir. Apt-purge of docker/mongod/nginx gated behind `CLEAN_SYSTEM=1` env (too destructive for default) |
| W03 docker dev / W04 docker prod | same as T03/T04 via Docker Desktop |
| W05 legacy win dev | stop mongo service (`sc.exe stop MongoDB`), kill pwsh/node windows, rm mkcert CA, rm project dir |
| W06 legacy win prod | `pm2 kill`, `nginx -s stop` via `_win_nginx_exe`, `sc.exe stop MongoDB`, rm project dir |

### What `verify_clean()` check

Caveman list — ALL must be true:
- Port 3000 free, port 3220 free, port 27017 free (Linux + Windows both)
- Port 80 free, port 443 free (prod only)
- `docker ps -a --filter 'name=visio' -q` empty (Docker phases)
- `pm2 list 2>/dev/null | grep visioconf` empty (Legacy prod phases)
- `pgrep -f 'node.*visioconf\|mongod'` empty on Linux / `tasklist | grep -i 'node\|mongod'` empty on Windows
- No `visio-conf-25/` in test working dir
- No `docker image ls` entry matching `visio-*`

Any fail → write `logs/<run-id>/dirty.log` with diff of dirty artifacts + abort suite.

### What cleanup does NOT touch (safety)

- Node.js system install (kept, too much churn to rip + reinstall each run)
- Docker engine / Docker Desktop install (kept)
- Apt keys for mongodb-org, docker-ce (kept)
- User groups (no add/remove of `docker` group membership)
- Global npm packages except `pm2` (which cleanup does kill + uninstall)

Nuclear wipe: user manually runs `wizard/tests/e2e/clean_all.sh` (separate script — NOT auto) which does apt-purge and full reset. Not part of regular suite.

---

## 9. Phase 1 — WSL Debian sequence

```
 ┌─────────┐   ┌─────────┐   ┌─────────────┐   ┌──────────────┐   ┌─────────────┐   ┌──────────────┐   ┌─────────┐
 │ T01     │──▶│ T02     │──▶│ T03         │──▶│ T04          │──▶│ T05         │──▶│ T06          │──▶│ T07     │
 │ boot    │   │ genv    │   │ docker dev  │   │ docker prod  │   │ legacy dev  │   │ legacy prod  │   │ quit    │
 └─────────┘   └─────────┘   └─────────────┘   └──────────────┘   └─────────────┘   └──────────────┘   └─────────┘
      │             │              │                  │                  │                   │              │
      │             ▼              ▼                  ▼                  ▼                   ▼              │
      │        ┌───────┐      ┌───────┐           ┌───────┐          ┌───────┐           ┌───────┐          │
      │        │ clean │      │ clean │           │ clean │          │ clean │           │ clean │          │
      │        └───────┘      └───────┘           └───────┘          └───────┘           └───────┘          │
      │             │              │                  │                  │                   │              │
      └─────────────┴──────────────┴──────────────────┴──────────────────┴───────────────────┴──────────────┘
                                                     gate
```

### T01 boot

- Input: single `\n` + `4` (quit). Nothing else.
- Assert: wizard prints header, main menu shows 4 items, exit 0 on quit. OS detected as linux/debian/bookworm (or codename present).
- Cleanup: none (read-only).

### T02 generate env

- Run main menu option 3 twice — once dev defaults, once prod defaults. Exit.
- Assert: both `.env` files created. Keys come from `BACKEND/.env.template` + `FRONTENDV2/.env.template` (wizard reads templates at runtime). Test asserts — for each key line in each template, same key exists in generated `.env` with a non-empty value. Structural check, no hardcoded key list.
- Cleanup: rm `.env` files.

### T03 docker dev lifecycle

- Drive: Docker → dev → install (path=`./`, consent clone + install deps + generate env). Then Docker → dev → launch. Then status. Then stop.
- Assert install: `docker --version` OK, `compose.yaml` present in cloned project, `docker images` includes project images, exit 0.
- Assert launch: port 3000, 3220, 27017 listening. `curl http://localhost:3000/` returns 200 + body contains `<div id="root"`.
- Assert status: stdout contains `MongoDB`, `Backend`, `Frontend` lines with alive markers.
- Assert stop: ports free, `docker ps -q --filter name=visio` empty.
- Cleanup: `docker compose down -v --remove-orphans`, `docker rmi`, rm project dir. Verify-clean gate.

### T04 docker prod lifecycle

- Drive: Docker → prod → install/launch/status/stop.
- Assert install: as T03 + `compose.prod.yaml` used.
- Assert launch: port 80 + 443 listening. `curl http://localhost/` returns 200 or 301.
- Assert status: nginx up, backend alive through proxy.
- Assert stop: containers down, ports free.
- Cleanup: same as T03 + port 80/443 verify free.

### T05 legacy linux dev lifecycle

- Drive: Legacy → Linux → dev → install (choose SSL decline first, then re-run with accept if mkcert available). Launch. Status. Reload. Stop.
- Assert install: `node --version` OK, `mongod --version` OK, `BACKEND/node_modules`, `FRONTENDV2/node_modules` non-empty, `.env` present with `VERBOSE=true`.
- Assert launch: port 3000 + 3220 listening, backend + frontend processes alive.
- Assert reload: new PIDs on 3000 + 3220 after reload.
- Assert stop: ports free.
- Assert SSL accept branch (if `mkcert` available or installable): cert files present in expected dir, `https://localhost:3000/` cert chain OK via `curl -k`.
- Cleanup: kill pids, `mongod` stop, rm node_modules + build + .env, `mkcert -uninstall`, rm project.

### T06 legacy linux prod lifecycle

- Drive: Legacy → Linux → prod → install (decline certbot branch, HTTP-only warn). Launch. Status. Reload. Stop. (Separate run for cert install not feasible without public DNS → only decline branch tested.)
- Assert install: `pm2`, `nginx`, `node`, `mongod` all present. Backend `dist/index.js` built. Frontend `build/index.html` built.
- Assert launch: pm2 shows `visioconf-backend` online. nginx listening 80.
- Assert reload: pm2 restart counter increments; nginx reload exit 0.
- Assert status: dashboard prints pm2 + nginx + mongo rows. Capture 1 refresh then Ctrl+C (SIGINT via timeout).
- Assert stop: pm2 stopped, nginx stopped, ports free.
- Cleanup: `pm2 kill`, `systemctl stop nginx mongod`, remove sites-enabled entry, rm project.

### T07 quit

- Drive: open setup.sh, answer `4`. Assert exit 0, no stderr.

---

## 10. Phase 2 — Windows POSIX host sequence

Same shape as Phase 1, skipping linux-only flows and exercising Windows branches.

| # | Test | Notes |
|---|---|---|
| W01 | boot + menu nav | confirm OS detected as windows. Check `winget` or `choco` available (guard). |
| W02 | generate env | same as T02, Windows paths |
| W03 | docker dev lifecycle | SKIP if Docker Desktop not running. If present, same asserts as T03. |
| W04 | docker prod lifecycle | same rule as W03 |
| W05 | legacy windows dev lifecycle | winget install node + mongod service + mkcert. Launch opens new windows; test uses `tasklist` to verify processes + `curl` for HTTP. |
| W06 | legacy windows prod lifecycle | winget install nginx + pm2 (npm). Nginx found via `_win_nginx_dir`. Service wrapper for mongo. Certbot decline branch only. |
| W07 | quit | same as T07 |

Windows cleanup specifics:
- Stop mongod service: `sc.exe stop MongoDB`
- Stop nginx: `"$(_win_nginx_exe)" -s stop`
- Kill node windows: `taskkill /IM node.exe /F`
- Remove `mkcert` root CA: `mkcert -uninstall`
- Uninstall winget packages gated by `CLEAN_SYSTEM=1` env (not default; too destructive)

---

## 11. Driver behavior — `run_e2e.sh`

```
run_e2e.sh
  ├─ detect OS (uname -s)
  ├─ route → linux/ or windows/
  ├─ mkdir logs/<run-id>/
  ├─ for test in ordered_list:
  │   ├─ run test → capture exit + log
  │   ├─ if fail → write suite.log, exit 1 (abort)
  │   ├─ run paired cleanup → capture log
  │   ├─ verify_clean() → if dirty: write dirty.log, exit 2 (abort)
  │   └─ next
  ├─ write suite.log summary table
  └─ exit 0
```

Options:
- `--only <id>` — run single test (skip sequence, skip gate)
- `--from <id>` — resume from specific test (assume prior clean)
- `--dry-run` — list tests + estimated time, no execution
- `--clean-system` — export `CLEAN_SYSTEM=1` for nuclear cleanup

---

## 12. Known gotcha — baked in test design

| Gotcha | Mitigation in tests |
|---|---|
| WSL Debian no systemd by default | Probe `systemctl is-system-running` → skip legacy prod launch assert if absent, write audit flag |
| `sudo` prompts for password in WSL | Harness runs `sudo -v` once at phase start → cached timestamp |
| `clear` in setup.sh writes escapes to log | Filter via `sed 's/\x1b\[[0-9;]*[a-zA-Z]//g'` before grep |
| `sleep 3` after boot | Tests account for 10s minimum per wizard invocation |
| `wait_enter` prompts | Input string always ends with extra `\n\n` padding |
| `setup_prereqs` asks consent | Input pre-feeds `O\n` (oui = yes) |
| Port check race | Assert uses retry loop 5× 2s between tries |
| Docker Desktop on Windows — interactive UAC | Pre-test step: user must have Docker Desktop running before Phase 2. WSL integration setting does not matter (Phase 1 already ran + cleaned in WSL, so no resource fight). If Docker Desktop not running → W03/W04 SKIP (within skip budget). |
| `timeout` command not POSIX | `timeout` ships with GNU coreutils and MSYS2 / MINGW / Cygwin, but is not POSIX. Harness falls back to a portable inline shell timeout (`( cmd & pid=$!; sleep N && kill $pid ) &`) if `command -v timeout` fails. |
| winget non-interactive | Wizard already passes `--accept-source-agreements --accept-package-agreements` |
| certbot requires public DNS | Tests only drive "decline install" branch, audit flag for manual cert test later |
| mkcert CA trust needs admin | On Windows, trigger UAC prompt once during install — user accepts manually first run (documented in harness README) |

---

## 13. Audit deliverable — next round

After full suite green on both phases, tester writes `specs/YYYY-MM-DD-wizard-e2e-audit.md`:

- Suite summary matrix: test × phase × result × duration
- Per-failure section: root cause, reproducer, log excerpt
- Per-yellow-flag section: wizard warning seen but exit 0 — recommend fix / accept
- Flow diagrams (ASCII, same style as `wizard.specs/pipelines.md`) annotated with pass/fail points
- Recommendations list, each tagged:
  - `TESTED ✓` — tester ran a patch (in fork, NOT on real wizard) that fixes issue; patch diff attached
  - `PROPOSED` — not yet validated; needs own test round before applying
- No wizard code change from this audit session. User reviews recommendations + picks which to apply later.

---

## 14. What the suite produce

After one full run (both phases green):

```
wizard/tests/e2e/logs/2026-04-19T11-00-00/
  suite.log                 ← summary table
  T01_boot.log              ← wizard stdout
  T02_generate_env.log
  T02_generate_env.clean.log
  T03_docker_dev.log
  T03_docker_dev.clean.log
  ...
  W01_boot.log
  ...
  W07_quit.log
```

Sample `suite.log`:

```
PHASE 1 — WSL Debian
  T01 boot                      PASS   00:08
  T02 generate_env              PASS   00:12
  T03 docker_dev                PASS   14:22
  T04 docker_prod               PASS   10:51
  T05 legacy_dev                PASS   21:05
  T06 legacy_prod               PASS   28:40
  T07 quit                      PASS   00:03
PHASE 2 — Windows POSIX host
  W01 boot                      PASS   00:11
  W02 generate_env              PASS   00:14
  W03 docker_dev                SKIP   reason: Docker Desktop not running
  W04 docker_prod               SKIP
  W05 legacy_dev                PASS   32:18
  W06 legacy_prod               PASS   40:02
  W07 quit                      PASS   00:04
TOTAL time: 2h28m — SKIPS: 2/14 (within budget)
OVERALL: PASS
```

---

## 15. Estimated runtime

| Test | Est. duration |
|---|---|
| T01 / W01 boot | <1 min |
| T02 / W02 generate env | ~1 min |
| T03 / W03 docker dev | 10-20 min (first-time image pull) |
| T04 / W04 docker prod | 10-15 min |
| T05 legacy linux dev | 15-25 min (node + mongo install) |
| T06 legacy linux prod | 25-35 min (+ nginx + build) |
| W05 legacy win dev | 25-35 min (winget installs slow) |
| W06 legacy win prod | 30-45 min |
| T07 / W07 quit | <1 min |
| **Full suite** | **~2h30 - 3h30** |

---

## 16. Out of scope — explicit

- macOS tests (no hardware available)
- Upgrade flows (old wizard → new wizard)
- Multi-user / concurrent wizard invocations
- Network-failure edge cases (DNS down, apt mirror timeout) beyond skip-on-no-internet
- Performance / load on the running app
- Security review of wizard itself (certbot key storage, sudo usage, etc.)
- `wizard/tests/` mock suite — untouched, orthogonal, separate purpose

---

## 17. Success criteria for this plan

Plan is done when:
- [ ] All 7 Linux tests + 7 Windows tests defined with named inputs + asserts + paired cleanup
- [ ] `run_e2e.sh` driver works end-to-end on both phases on one dev box
- [ ] First full run produces `suite.log` with explicit PASS/FAIL/SKIP per test
- [ ] First audit doc fills `audit/TEMPLATE.md` with tested + proposed recommendations

---

## 18. Next step after spec approval

Me invoke `superpowers:writing-plans` skill to produce step-by-step implementation plan for writing the POSIX sh test scripts. Plan gets broken into discrete steps, each step reviewable and testable. Then implementation proceeds file by file, no wizard edit.
