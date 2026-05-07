# Restore Frontend Controleur + CanalSocketio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-establish the spec-mandated frontend bus chain `component → controleur.js → canalsocketio.js → socket.io`, replacing the bypass introduced by `MessageClientAdapter.ts`.

**Architecture:**
- `FRONTENDV2/src/controller/controleur.js` = byte-identical copy of `BACKEND/src/controller/controleur.js` (single source of truth — pub/sub class).
- `FRONTENDV2/src/controller/canalsocketio.js` = frontend-specific Socket.io bridge (constructs `socket.io-client`, performs `demande_liste`/`donne_liste` handshake, fans `socket.on("message")` into `controleur.envoie`).
- `MessageClientAdapter.ts` is repurposed into a thin React bridge subscriber (`nomDInstance: "ReactBridge"`) that exposes the same `on/off/send/onReady/onReconnect/disconnect` API consumers already use, but routes everything through `controleur` instead of holding its own socket.

**Tech Stack:** TypeScript, React 19, socket.io-client, controleur.js (plain JS, identical to backend).

---

## File Structure

| File | Action | Responsibility |
|------|--------|----------------|
| `FRONTENDV2/src/controller/controleur.js` | Create | Pub/sub bus — verbatim copy of backend |
| `FRONTENDV2/src/controller/canalsocketio.js` | Create | Socket.io client bridge (frontend version, restored from `6facd3e^`) |
| `FRONTENDV2/src/services/MessageClientAdapter.ts` | Rewrite | Thin React subscriber wired to controleur, same public API |
| `FRONTENDV2/docs/specs/core/ControllerService.md` | Modify | Update file paths from `Controller/` → `controller/`, remove obsolete refs |

Consumers untouched (API preserved):
- `FRONTENDV2/src/contexts/AuthContext.tsx`
- `FRONTENDV2/src/services/auth/AuthSync.ts`
- `FRONTENDV2/src/services/auth/AuthSync.types.ts`
- `FRONTENDV2/src/hooks/call/usePeerConnections.ts`
- `FRONTENDV2/src/hooks/call/useCallBase.ts`
- `FRONTENDV2/src/hooks/call/useCallSocketListeners.ts`

---

### Task 1: Restore `controleur.js` identical to backend

**Files:**
- Create: `FRONTENDV2/src/controller/controleur.js`

- [ ] **Step 1: Copy backend file verbatim**

```bash
cp BACKEND/src/controller/controleur.js FRONTENDV2/src/controller/controleur.js
```

- [ ] **Step 2: Verify byte-identity**

Run (PowerShell):
```powershell
(Get-FileHash BACKEND/src/controller/controleur.js).Hash -eq (Get-FileHash FRONTENDV2/src/controller/controleur.js).Hash
```
Expected: `True`

- [ ] **Step 3: Commit**

```bash
git add FRONTENDV2/src/controller/controleur.js
git commit -m "feat(frontend): restore controleur.js identical to backend" -m "Re-introduces the shared pub/sub bus per ControllerService spec. Same source as BACKEND/src/controller/controleur.js (single source of truth)."
```

---

### Task 2: Restore frontend-specific `canalsocketio.js`

**Files:**
- Create: `FRONTENDV2/src/controller/canalsocketio.js`

- [ ] **Step 1: Restore deleted file from history**

```bash
git show 6facd3e^:FRONTENDV2/src/Controller/canalsocketio.js > FRONTENDV2/src/controller/canalsocketio.js
```

- [ ] **Step 2: Patch socket.io options for cookie-session**

Open the file. The constructor builds:
```js
this.socket = io(
    process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220",
    {
        autoConnect: true,
        reconnection: true,
    }
)
```
Add `withCredentials: true` (the cookie-session backend requires it — preserved from current `MessageClientAdapter.ts:14`):
```js
this.socket = io(
    process.env.REACT_APP_BACKEND_API_URL || "http://localhost:3220",
    {
        autoConnect: true,
        reconnection: true,
        withCredentials: true,
    }
)
```

- [ ] **Step 3: Verify file shape**

Run:
```bash
grep -E "controleur\.envoie|socket\.emit\(.message.|donne_liste|demande_liste" FRONTENDV2/src/controller/canalsocketio.js
```
Expected: 4 matches — `controleur.envoie`, `socket.emit("message"`, `donne_liste`, `demande_liste`.

- [ ] **Step 4: Commit**

```bash
git add FRONTENDV2/src/controller/canalsocketio.js
git commit -m "feat(frontend): restore canalsocketio.js bridge" -m "Restores frontend-specific Socket.io bridge from 6facd3e^ with withCredentials enabled for cookie-session auth."
```

---

### Task 3: Rewrite `MessageClientAdapter.ts` as a controleur subscriber

**Files:**
- Modify: `FRONTENDV2/src/services/MessageClientAdapter.ts`

The adapter must keep its existing public API (`on/off/send/onReady/onReconnect/disconnect`) so all 5 consumer files compile unchanged. Internally it constructs `Controleur` + `CanalSocketio` and registers itself as a subscriber. Dynamic registration is driven by `on()`/`send()` calls — the bridge inscribes itself for each message name on first use, leveraging the controleur's existing inscription tables.

- [ ] **Step 1: Rewrite the adapter**

Replace the full content of `FRONTENDV2/src/services/MessageClientAdapter.ts` with:

```typescript
import Controleur from "controller/controleur.js"
import CanalSocketio from "controller/canalsocketio.js"

type MessageHandler = (payload: any) => void

export default class MessageClientAdapter {

	readonly nomDInstance = "ReactBridge"

	private controleur: any
	private canal: any
	private handlers = new Map<string, Set<MessageHandler>>()
	private inscribedEmission = new Set<string>()
	private inscribedAbonnement = new Set<string>()
	private readyCallbacks: (() => void)[] = []
	private ready = false
	private reconnectCallbacks: (() => void)[] = []

	constructor(_url: string) {
		this.controleur = new Controleur()
		this.canal = new CanalSocketio(this.controleur, "canalsocketio")

		const originalInscription = this.controleur.inscription.bind(this.controleur)
		this.controleur.inscription = (emetteur: any, emis: string[], recus: string[]) => {
			originalInscription(emetteur, emis, recus)
			if (emetteur === this.canal) {
				this.controleur.inscription(this, recus, emis)
				this.ready = true
				this.readyCallbacks.forEach(cb => cb())
				this.readyCallbacks = []
			}
		}

		this.canal.socket.io.on("reconnect", () => {
			this.reconnectCallbacks.forEach(cb => cb())
		})
	}

	traitementMessage(mesg: Record<string, any>): void {
		for (const action of Object.keys(mesg)) {
			if (action === "id") continue
			const handlers = this.handlers.get(action)
			if (!handlers) continue
			for (const handler of handlers) handler(mesg[action])
		}
	}

	onReady(callback: () => void): void {
		if (this.ready) callback()
		else this.readyCallbacks.push(callback)
	}

	on(messageName: string, handler: MessageHandler): void {
		if (!this.handlers.has(messageName)) this.handlers.set(messageName, new Set())
		this.handlers.get(messageName)!.add(handler)

		if (!this.inscribedAbonnement.has(messageName)) {
			this.controleur.inscription(this, [], [messageName])
			this.inscribedAbonnement.add(messageName)
		}
	}

	off(messageName: string, handler: MessageHandler): void {
		this.handlers.get(messageName)?.delete(handler)
	}

	send(messageName: string, payload: unknown = {}): void {
		if (!this.inscribedEmission.has(messageName)) {
			this.controleur.inscription(this, [messageName], [])
			this.inscribedEmission.add(messageName)
		}
		this.controleur.envoie(this, { [messageName]: payload })
	}

	onReconnect(callback: () => void): void {
		this.reconnectCallbacks.push(callback)
	}

	disconnect(): void {
		this.canal.socket.disconnect()
	}
}
```

**Why each piece:**
- `nomDInstance + traitementMessage` makes the adapter a valid `ControllerSubscriber`.
- The `inscription` wrapper hooks the moment `CanalSocketio` finishes the `donne_liste` handshake (it's the only place CanalSocketio inscribes). At that point we cross-register the bridge: bridge emits whatever the canal received and vice versa, then fire `onReady` callbacks.
- `on`/`send` perform lazy per-message inscription so consumers can use any `call:*`, `auth:*` etc. action without a static registry.
- `send` calls `controleur.envoie(this, { [name]: payload })` — the controleur looks up `listeAbonnement[name]` (canalsocketio is registered there for all server-emitted messages, but our bridge needs the inverse: the canal must be the abonné when bridge emits). Since CanalSocketio's `inscription` from the canal side already registered `listes.emission` as canal's emission list — meaning canal will *receive* (abonné) messages bridge sends. That's why we cross-register `recus` as bridge's abonnement and `emis` as bridge's emission lists.
- `onReconnect` taps `socket.io` reconnect manager (preserved behavior).
- `disconnect` reaches into `canal.socket.disconnect()`.

- [ ] **Step 2: Add TS module declarations for the JS imports**

Create `FRONTENDV2/src/controller/controleur.d.ts`:
```typescript
export default class Controleur {
	listeEmission: Record<string, Record<string, any>>
	listeAbonnement: Record<string, Record<string, any>>
	verbose: boolean
	verboseall: boolean
	inscription(emetteur: any, liste_emission: string[], liste_abonnement: string[]): void
	desincription(emetteur: any, liste_emission: string[], liste_abonnement: string[]): void
	envoie(emetteur: any, t: Record<string, unknown>): void
}
```

Create `FRONTENDV2/src/controller/canalsocketio.d.ts`:
```typescript
import type { Socket } from "socket.io-client"
import type Controleur from "./controleur"

export default class CanalSocketio {
	controleur: Controleur
	nomDInstance: string
	socket: Socket
	listeDesMessagesEmis: string[]
	listeDesMessagesRecus: string[]
	verbose: boolean
	constructor(c: Controleur, nom: string)
	traitementMessage(mesg: Record<string, unknown>): void
}
```

- [ ] **Step 3: Build & type-check**

Run:
```bash
cd FRONTENDV2 && npm run build
```
Expected: build succeeds, no TS errors. If consumer files break (`socket?.send`, `socket.on(...)` call sites in hooks), revisit Task 3 — the public API must match `MessageClientAdapter` before the rewrite.

- [ ] **Step 4: Smoke test**

Start backend + frontend, log in with `dev@visioconf.com / d3vV1s10C0nf`, verify:
- Login round-trip succeeds (`login` → `login_response`).
- `authenticate` sent on socket-ready and after reconnect.
- An audio call between two browser tabs completes the SDP+ICE handshake (covers `call:offer`, `call:answer`, `call:ice-candidate`, `call:participants-list`).

- [ ] **Step 5: Commit**

```bash
git add FRONTENDV2/src/services/MessageClientAdapter.ts FRONTENDV2/src/controller/controleur.d.ts FRONTENDV2/src/controller/canalsocketio.d.ts
git commit -m "refactor(frontend): route MessageClientAdapter through controleur" -m "Adapter becomes a ControllerSubscriber (nomDInstance: ReactBridge). All sends now go component → adapter → controleur.envoie → canalsocketio.traitementMessage → socket. Public API unchanged so AuthSync, AuthContext and call hooks stay byte-identical."
```

---

### Task 4: Update spec doc paths

**Files:**
- Modify: `FRONTENDV2/docs/specs/core/ControllerService.md`

- [ ] **Step 1: Fix file path references**

In `FRONTENDV2/docs/specs/core/ControllerService.md`:
- Replace `FRONTENDV2/src/Controller/` → `FRONTENDV2/src/controller/` (lowercase, 2 occurrences in header).
- Update §5 "Services inscrits" table to add the `ReactBridge` row:

| Service | nomDInstance | Émis | Reçus |
|---------|-------------|------|-------|
| `CanalSocketio` | `"canalsocketio"` | (lists from server `donne_liste`) | (lists from server `donne_liste`) |
| `ReactBridge` (`MessageClientAdapter`) | `"ReactBridge"` | dynamique (par `send()`) | dynamique (par `on()`) |
| `AuthService` | `"AuthService"` | 6 messages auth | 13 messages auth |

- [ ] **Step 2: Commit**

```bash
git add FRONTENDV2/docs/specs/core/ControllerService.md
git commit -m "docs(spec): align ControllerService spec with restored bus" -m "Lowercase controller/ paths and document ReactBridge dynamic subscriber."
```

---

## Self-Review

**1. Spec coverage:**
- "data should pass through controleur.js then canalsocketio.js" — Task 3 makes this true: `send()` → `controleur.envoie()` → `canal.traitementMessage()`. ✅
- "canalsocketio is a specific version" — Task 2 restores the deleted frontend file (not the backend's). ✅
- "controleur same as backend" — Task 1 enforces byte-identity. ✅

**2. Placeholder scan:** No TBD/TODO. All steps include exact code. ✅

**3. Type/name consistency:**
- `nomDInstance: "ReactBridge"` and `traitementMessage` match `ControllerSubscriber` shape used in spec.
- `CanalSocketio` constructor signature `(c, nom)` matches the restored file (Task 2). Backend's signature is `(s, c, nom)` — different on purpose; frontend creates its own socket internally.
- The `inscription` wrapper triggers `onReady` exactly once when `CanalSocketio` receives `donne_liste` — this is the same readiness signal `MessageClientAdapter`'s old code used.

**Risks / open questions:**
- The cross-registration trick in Task 3 Step 1 assumes `CanalSocketio` only calls `controleur.inscription` once (in the `donne_liste` handler). If the deleted version inscribes elsewhere, the `if (emetteur === this.canal)` guard still keeps it correct, but ready may fire late — verify in Step 4 smoke test.
- If Ben's call code expects `socket?.send` to be available before `onReady`, the lazy inscription in `send()` will silently noop (controleur logs `ERREUR ... n'est pas enregistré`). Consumers already gate on `useAuth().isAuthenticated`, which only flips after `authenticate_response`, which itself requires `onReady` → safe in practice.
