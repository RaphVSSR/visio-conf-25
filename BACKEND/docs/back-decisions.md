# Backend Decisions -- VisioConf

Structural FAQ of the backend. Each entry follows: question --> reflection --> solution --> why.

---

# 1. Architecture & Pattern

## Why replace BetterAuth with a custom auth?

**Observation:** BetterAuth worked via REST HTTP routes (`toNodeHandler(...)`). Everything else in the app goes through Socket.io + controleur.js (pub/sub). Two exchange systems coexisted for no reason.

**Solution:** A custom auth that goes **entirely through Socket.io + controleur.js**, like all other components.

**Founding principle:** The frontend reads and displays, the server decides and modifies. The frontend uses available data (cookie, expiresAt) to display modals, but never makes decisions -- if something needs a "higher" decision, the server handles it.

---

## Why this backend file tree?

**Starting point: it's MVC.** Even in a modern SPA, the MVC pattern applies -- the View is simply the entire frontend (FRONTENDV2). That doesn't mean the backend isn't MVC, it means the V/MC split happens at the project level, not the backend level. The backend only contains the **M** and the **C**.

**The C is unique.** In this app, controleur.js is the only true Controller in the MVC sense. There isn't a layer of multiple controllers dispatching to services -- there is **one** pub/sub message bus. Everything that isn't this bus is part of the Model: data, services, infrastructure.

**Consequence on folders:** The backend structure directly reflects this MVC reality:
- `controller/` = the **C** -- the pub/sub bus, its Socket.io bridge, and the TypeScript wrapper around it
- `models/` = the **M** -- everything else: data models, business services, core infrastructure

```
src/
+-- index.ts                            <-- Entry point
+-- controller/                         <-- C -- The pub/sub pattern
|   +-- controleur.js                   <-- Message bus (OFF-LIMITS)
|   +-- canalsocketio.js                <-- Socket.io <-> controleur bridge (OFF-LIMITS)
|   +-- Controller.types.ts             <-- TS types for the controleur
|   +-- Controller.service.ts           <-- Abstract class ControllerService
+-- models/                             <-- M -- Everything else
|   +-- ListeMessages.ts                <-- Message catalogue
|   +-- clearUploads.ts                 <-- Upload cleanup utility
|   +-- core/                           <-- Fundamental infrastructure
|   |   +-- HTTPServer.ts
|   |   +-- Collection.ts
|   |   +-- TracedError.ts
|   |   +-- TestEnvironement.ts
|   +-- services/                       <-- Business services
|   |   +-- Database.ts
|   |   +-- FileSystem.ts
|   |   +-- RestService.ts
|   |   +-- AccessRoleGuard.ts
|   |   +-- UserService.ts
|   |   +-- TeamService.ts
|   |   +-- ChannelService.ts
|   |   +-- authentication/
|   |       +-- AuthService.ts
|   |       +-- SessionManager.ts
|   +-- User.ts, Team.ts, Channel.ts... <-- Data models
+-- routes/                             <-- HTTP routes
+-- uploads/                            <-- Uploaded files
```

**Why each folder exists:**

| Folder | Reason |
|--------|--------|
| `src/` (root) | The entry point (`index.ts`). Minimal -- everything else lives in `controller/` or `models/`. |
| `controller/` | The **C** of MVC. controleur.js (unique pub/sub bus), canalsocketio.js (Socket.io bridge), and TypeScript wrappers: types, abstract `ControllerService`. Lives at the same level as `models/` because these are the two halves of the backend -- C and M. |
| `models/` | The **M** of MVC, broadly. In MVC, the Model isn't just "database schemas" -- it's all business logic, data, and infrastructure. Everything that isn't the controleur is a model: a data model (User, Team), a service model (AuthService, Database), or an infrastructure model (HTTPServer). |
| `models/core/` | Infrastructure that **everything else depends on**, but that doesn't depend on business logic. Remove core, nothing starts. Remove a service or business model, core keeps running. This dependency asymmetry defines what is "core". |
| `models/services/` | Business services that **register with the controleur** and react to messages, or that provide cross-cutting capabilities (DB, filesystem). The difference with Core: a service carries business or application logic. |
| `routes/` | Residual cases that go through HTTP instead of Socket.io (file uploads, etc.). This folder is intentionally small -- most traffic goes through the pub/sub bus. |

---

## Why are controleur.js and canalsocketio.js untouchable?

**Observation:** These two files are the core of the app's pub/sub pattern. The controleur is the only true "Controller" in the MVC sense. Everything else is either a Model or a Service.

**Reflection:**
- controleur.js is a symmetric message bus: the same file runs on backend and frontend (though frontend now uses MessageClientAdapter instead)
- canalsocketio.js bridges the controleur and Socket.io
- Components register via `inscription()`, send via `envoie()`, receive via `traitementMessage()`
- Modifying these files would break the symmetry and all components that plug into them

**Solution:** All adaptation happens **around** these files, never inside. TypeScript types and abstractions (`Controller.types.ts`, `ControllerService` abstract class) are added on top without touching the JS.

---

## Why static classes everywhere?

**Observation:** `Database`, `FileSystem` -- these are static.

**Why:** These services are functional singletons. There are never two instances of `Database`. The static pattern eliminates the need for instantiation and dependency injection. Each service is self-contained and consistent with its functional name.

**AuthService note:** AuthService is no longer static. It uses `new AuthService(controleur, name)` + `authService.register()` -- an instance-based standalone pattern. It implements the same `nomDInstance` + `traitementMessage` interface as ControllerService but manages its own registration independently.

**Other services (UserService, TeamService, ChannelService):** These extend the abstract `ControllerService` class and are instantiated via `new`. Registration happens automatically in the ControllerService constructor.

---

# 2. Sessions

## What is a session, concretely?

**Initial doubt:** What is an active session? Inactive? Why maintain a session if user data is already in DB? Does the session store credentials?

**Reflection:**
- The session doesn't store anything sensitive -- just a `userId` mapping
- It's a user <-> socket(s) mapping with persistence
- It exists = it's active. It's deleted = it's terminated
- No `isActive` field, no `token` field -- the existence of the session is the only source of truth

**Solution:** Minimalist session managed by `connect-mongodb-session` (cookie-based). `SessionManager.ts` handles in-memory socket-to-user mapping. No dedicated MongoDB Session model.

---

## Where to store sessions?

**Options considered:** Redis, in-memory, MongoDB.

**Why cookie-based with MongoDB store:** The app uses `express-session` with `connect-mongodb-session` for session persistence. The cookie is auto-sent by the browser on every request. Socket-to-user mapping is in-memory via `SessionManager` (fast lookups, no DB writes on connect/disconnect).

**Open doubt:** When a user closes the browser without disconnecting, the session stays in the store until TTL. This is intentional (reconnection possible via cookie). At scale, do orphan sessions become a problem?

**Partial answer:** Redis can be added later as a session store without changing the architecture.

---

## How to map a socket to a user?

**Solution:** `SessionManager` maintains an in-memory bidirectional map between socketId and userId.

**Why:** After `authenticate`, the socket is trusted (persistent TCP connection = trust anchor). Any service can call `SessionManager.getSessionBySocket(socketId)` to identify the user. In-memory map means zero DB overhead for lookups.

**Trade-off:** The in-memory map is lost on server restart. But sessions persist in the cookie store -- clients simply re-authenticate on reconnect.

---

## How is the session persisted client-side?

**Solution:** Cookie-based via `express-session` + `connect-mongodb-session`.

**Why cookies:**
- Auto-sent by the browser on every request (including Socket.io handshake)
- `httpOnly` prevents JavaScript access (XSS protection)
- No manual sessionId management on the frontend
- No `sessionStorage` / `localStorage` needed
- The multi-session approval flow handles multi-tab/device scenarios at the application level

**Previous approach (replaced):** `sessionStorage` was used for per-tab isolation. This has been replaced by cookies because the server-side session store with cookie transport is simpler, more secure, and handles the Socket.io use case natively.

---

## Why 1 session = 1 socket, but 1 user = N sessions?

**Initial doubt:** Each browser tab creates its own Socket.io connection (its own `socketId`). Should a tab reuse another tab's session, or have its own?

**Reflection:**
- If multiple tabs share a session, socket binding would overwrite the previous `socketId` -- the first tab silently loses its binding and stops receiving messages
- A user may legitimately want to be connected from multiple tabs/devices
- The multi-session flow (approval) serves as a second factor -- but it must apply everywhere, not just on `login`

**Solution:** Each connection gets its own session. `authenticate` (via cookie) goes through the same approval flow as `login` if an active socket already exists for that user. On approval --> new session created (same `userId`). On rejection --> `login_response { status: "failure" }` --> back to login.

---

## Why no new token in session_response { status: "refreshed" }?

**Answer:** The session identity is managed by the cookie, which doesn't change. A refresh only extends the expiration in the store. The client only needs the new `expiresAt` to update its local timer.

---

# 3. Authentication

## Why no JWT?

**Initial doubt:** JWT is standard, it allows stateless verification without DB calls. Why skip it?

**Reflection:**
- What good is JWT if each `authenticate` already queries the store for the session AND the DB for the user?
- When is JWT useful without a DB call? --> When multiple services don't all have access to the same DB (distributed microservices)
- Discord uses tokens AND sessions: the token serves for lightweight verification between microservices, the session manages the account. Two distinct roles
- Is our app multi-service? --> No, single-server. JWT would just be a signed wrapper around a session that ends up verified in DB anyway

**Solution:** Use cookie-based sessions via `connect-mongodb-session`. No JWT.

**Why it holds:** The cookie is signed by `express-session`. Verification happens in the store on each reconnection -- exactly as before, but without an unnecessary JWT layer.

**Open doubt:** At what growth point would the DB bottleneck justify reintroducing JWT? No answer -- "when user count or service count makes store lookups too costly". Keep in mind.

---

## Why SHA256 and not bcrypt/argon2?

**Answer:** Deliberate choice. SHA256 (`js-sha256`) is fast, simple, no native dependencies. bcrypt/argon2 require native compilation. For development, SHA256 suffices.

**Why it's safe for now:** `hashPassword`/`verifyPassword` are isolated in `AuthService`. Upgrading to bcrypt/argon2 = one file to modify.

**Open doubt:** SHA256 is a fast hash = vulnerable to brute force. Migrate before production.

---

## Why a multi-session approval flow?

**Need:** If a user already has an active session and a login comes from another device, existing sessions must validate or reject the new connection.

**Why:** The legitimate session acts as a second factor. If credentials are compromised, the attacker cannot connect without the legitimate user's approval.

**How it works:**
- The notification is sent only to sockets of the **same user**, not to all sockets
- `pendingRequests` are in-memory (ephemeral -- losing them on restart = the login simply times out)
- Configurable timeout --> auto-reject if no response
- First response wins, late responses ignored

**Design evolution:** `SessionManager` handles the in-memory socket mapping, while the multi-session approval logic lives in `AuthService`. SessionManager is a focused utility for socket <-> user binding, not a full session model.

**Open doubt:** Is the UX good? A user on their phone who wants to connect on their PC must go back to their phone to approve. Is this too constraining for non-technical users?

---

# 4. Data Model

## Why are user statuses limited to waiting/active?

**Initial doubt:** Do we need a `banned` status? `deleted`? `inactive`?

**Reflection:**
- `banned` implies an admin action -- not yet implemented
- `deleted` is contradictory -- if deleted, the document no longer exists
- `inactive` is ambiguous -- inactive since when? why?

**Solution:** Two statuses only: `waiting` (registration pending validation) and `active`. Others will be added when the need arises.

---

# 5. Open Doubts

| Subject | Doubt | Lead |
|---------|-------|------|
| JWT | When would the DB bottleneck justify JWT? | When multi-service or too many store lookups |
| Orphan sessions | Do sessions without active sockets cause problems at scale? | Redis as store, or periodic sweep |
| Multi-session UX | Is approval too constraining? | Test with real users |
| SHA256 | Vulnerable to brute force | Migrate to bcrypt/argon2 before prod (1 file) |
| Cookie security | Session hijacking via network sniffing | WSS + secure flag mandatory in prod |
| User statuses | `banned`/`deleted` missing | Add when the need arises |
