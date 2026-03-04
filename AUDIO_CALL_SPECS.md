# Specifications techniques — Systeme d'appel audio WebRTC

## 1. Vue d'ensemble

Le systeme permet a des utilisateurs connectes de passer des appels audio en temps reel. Il repose sur trois piliers :

- **Socket.IO** pour la signalisation (echange de metadonnees d'appel)
- **WebRTC** pour le transport audio peer-to-peer
- **React Context** pour la gestion d'etat cote frontend

---

## 2. Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      FRONTEND                           │
│                                                         │
│  AudioCallContext (state + logique WebRTC)              │
│     ├── ContactPickerModal  (declenchement d'appel)     │
│     ├── IncomingCallModal   (reception d'appel)         │
│     ├── AudioCallOverlay    (appel en cours)            │
│     └── ParticipantBubble   (affichage participant)     │
│                                                         │
│  Controller.ts  (singleton socket.io-client)            │
└────────────────────┬────────────────────────────────────┘
                     │ Socket.IO
┌────────────────────┴────────────────────────────────────┐
│                      BACKEND                            │
│                                                         │
│  SocketIO.ts         (connexion, auth, contacts:list)   │
│  CallSignaling.ts    (routage de la signalisation)      │
│  ActiveCallStore.ts  (stockage en memoire des appels)   │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Arborescence des fichiers

```
BACKEND/src/
├── models/
│   ├── ActiveCall.ts                    # Store en memoire des appels actifs
│   └── services/
│       ├── SocketIO.ts                  # Serveur Socket.IO, auth, contacts:list
│       └── CallSignaling.ts             # Routage signalisation WebRTC
│
FRONTENDV2/src/
├── types/
│   └── Call.ts                          # Types TypeScript (CallStatus, CallParticipant, etc.)
├── core/
│   └── Controller.ts                    # Singleton socket.io-client
├── contexts/
│   └── AudioCallContext.tsx             # Context React (state, WebRTC, socket listeners)
├── components/call/
│   ├── index.ts                         # Barrel exports
│   ├── ContactPickerModal/
│   │   ├── ContactPickerModal.tsx       # Modal selection de contact
│   │   └── ContactPickerModal.scss
│   ├── IncomingCallModal/
│   │   ├── IncomingCallModal.tsx        # Modal appel entrant
│   │   └── IncomingCallModal.scss
│   ├── AudioCallOverlay/
│   │   ├── AudioCallOverlay.tsx         # Overlay appel en cours
│   │   └── AudioCallOverlay.scss
│   └── ParticipantBubble/
│       ├── ParticipantBubble.tsx        # Bulle participant
│       └── ParticipantBubble.scss
└── routing/
    └── UserAuth.tsx                     # CallEndedToast + montage des composants globaux
```

---

## 4. Modeles de donnees

### 4.1 Frontend — `types/Call.ts`

| Type               | Champs                                                                         | Description                   |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------- |
| `CallStatus`       | `"idle" \| "outgoing" \| "incoming" \| "active"`                               | Etats possibles d'un appel    |
| `CallParticipant`  | `userId, socketId, firstname, lastname, picture, isMuted, isConnected`         | Un participant dans l'appel   |
| `ActiveCallState`  | `callId, status, isGroupCall, participants[], initiatorId, startTime, isMuted` | Etat complet de l'appel actif |
| `IncomingCallInfo` | `callId, callerId, callerName, callerPicture, isGroupCall`                     | Infos d'un appel entrant      |

### 4.2 Backend — `ActiveCall.ts`

| Type                    | Champs                                                                              | Description              |
| ----------------------- | ----------------------------------------------------------------------------------- | ------------------------ |
| `ServerCallParticipant` | `userId, socketId, firstname, lastname, picture, joinedAt`                          | Participant cote serveur |
| `ServerActiveCall`      | `callId, initiatorId, isGroupCall, participants (Map), invitedUserIds[], createdAt` | Appel actif en memoire   |

### 4.3 Backend — `ActiveCallStore` (stockage en memoire)

| Propriete    | Type                            | Description                                   |
| ------------ | ------------------------------- | --------------------------------------------- |
| `calls`      | `Map<callId, ServerActiveCall>` | Tous les appels actifs                        |
| `userToCall` | `Map<userId, callId>`           | Index inverse : quel user est dans quel appel |

| Methode                                                       | Description                                |
| ------------------------------------------------------------- | ------------------------------------------ |
| `createCall(callId, initiatorId, targetUserIds, isGroupCall)` | Cree un appel et le stocke                 |
| `addParticipant(callId, participant)`                         | Ajoute un participant + met a jour l'index |
| `removeParticipant(callId, userId)`                           | Retire un participant                      |
| `getCall(callId)`                                             | Recupere un appel par ID                   |
| `getCallByUserId(userId)`                                     | Recupere l'appel d'un user                 |
| `deleteCall(callId)`                                          | Supprime l'appel et nettoie l'index        |
| `isUserInCall(userId)`                                        | Verifie si un user est deja en appel       |

---

## 5. Protocole de signalisation — Evenements Socket.IO

### 5.1 Authentification

| Evenement              | Direction        | Payload               | Description                       |
| ---------------------- | ---------------- | --------------------- | --------------------------------- |
| `authenticate`         | Client → Serveur | `token: string` (JWT) | Auth par token JWT                |
| `authenticate:session` | Client → Serveur | `userId: string`      | Auth par ID de session BetterAuth |

### 5.2 Liste de contacts

| Evenement                | Direction        | Payload                                             | Description                       |
| ------------------------ | ---------------- | --------------------------------------------------- | --------------------------------- |
| `contacts:list`          | Client → Serveur | `{ excludeEmail?: string }`                         | Demande la liste des utilisateurs |
| `contacts:list:response` | Serveur → Client | `[{ id, firstname, lastname, picture, is_online }]` | Reponse avec les contacts         |

### 5.3 Cycle de vie d'un appel

| Evenement                | Direction           | Payload                                                                        | Description                                          |
| ------------------------ | ------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------- |
| `call:initiate`          | Client → Serveur    | `{ callId, targetUserIds[], callerName, callerPicture, isGroupCall }`          | Demarre un appel                                     |
| `call:incoming`          | Serveur → Client(s) | `{ callId, callerId, callerName, callerPicture, isGroupCall, participants[] }` | Notifie le(s) destinataire(s)                        |
| `call:accept`            | Client → Serveur    | `{ callId, userName, userPicture }`                                            | Accepte un appel entrant                             |
| `call:reject`            | Client → Serveur    | `{ callId }`                                                                   | Refuse un appel entrant                              |
| `call:hangup`            | Client → Serveur    | `{ callId }`                                                                   | Raccroche                                            |
| `call:user-joined`       | Serveur → Room      | `{ callId, userId, userName, userPicture, socketId }`                          | Un participant a rejoint                             |
| `call:user-left`         | Serveur → Room      | `{ callId, userId }`                                                           | Un participant a quitte                              |
| `call:user-rejected`     | Serveur → Room      | `{ callId, userId }`                                                           | Un participant a refuse                              |
| `call:ended`             | Serveur → Room      | `{ callId }`                                                                   | L'appel est termine                                  |
| `call:error`             | Serveur → Client    | `{ message }`                                                                  | Erreur (ex: deja en appel)                           |
| `call:participants-list` | Serveur → Client    | `{ callId, participants[] }`                                                   | Liste des participants existants (envoye au nouveau) |

### 5.4 Negociation WebRTC

| Evenement            | Direction                 | Payload                                       | Description  |
| -------------------- | ------------------------- | --------------------------------------------- | ------------ |
| `call:offer`         | Client → Serveur → Client | `{ callId, fromUserId, toUserId, sdp }`       | Offre SDP    |
| `call:answer`        | Client → Serveur → Client | `{ callId, fromUserId, toUserId, sdp }`       | Reponse SDP  |
| `call:ice-candidate` | Client → Serveur → Client | `{ callId, fromUserId, toUserId, candidate }` | Candidat ICE |

### 5.5 Controle en cours d'appel

| Evenement          | Direction               | Payload                                               | Description |
| ------------------ | ----------------------- | ----------------------------------------------------- | ----------- |
| `call:mute-toggle` | Client → Serveur → Room | `{ callId, isMuted }` / `{ callId, userId, isMuted }` | Mute/unmute |

---

## 6. Flux detailles

### 6.1 Initiation d'un appel (User A appelle User B)

```
User A (frontend)                    Serveur                         User B (frontend)
      │                                │                                   │
      │─── call:initiate ─────────────>│                                   │
      │    {callId, targetUserIds,     │                                   │
      │     callerName, callerPicture} │                                   │
      │                                │                                   │
      │                                │── Verifie A pas deja en appel     │
      │                                │── Cree ServerActiveCall           │
      │                                │── Ajoute A comme participant      │
      │                                │── A rejoint room "call:{callId}"  │
      │                                │                                   │
      │                                │── call:incoming ─────────────────>│
      │                                │   {callId, callerId,             │
      │                                │    callerName, callerPicture}     │
      │                                │                                   │
      │  state = "outgoing"            │                     IncomingCallModal s'affiche
```

### 6.2 Acceptation de l'appel

```
User B (frontend)                    Serveur                         User A (frontend)
      │                                │                                   │
      │── call:accept ────────────────>│                                   │
      │   {callId, userName,           │                                   │
      │    userPicture}                │                                   │
      │                                │── Ajoute B comme participant      │
      │                                │── B rejoint room "call:{callId}"  │
      │                                │                                   │
      │                                │── call:user-joined ──────────────>│
      │                                │   {callId, userId, userName}      │
      │                                │                                   │
      │<── call:participants-list ─────│                                   │
      │    {callId, participants:[A]}  │                                   │
      │                                │                                   │
      │  state = "active"              │                      state = "active"
```

### 6.3 Negociation WebRTC (apres acceptation)

```
User B                               Serveur                         User A
      │                                │                                   │
      │  createOffer(A)                │                                   │
      │── call:offer ─────────────────>│── call:offer ────────────────────>│
      │   {sdp, fromUserId:B,          │   {sdp, fromUserId:B}            │
      │    toUserId:A}                 │                                   │
      │                                │                    handleOffer()  │
      │                                │                    setRemoteDesc  │
      │                                │                    createAnswer   │
      │                                │                                   │
      │                                │<── call:answer ──────────────────│
      │<── call:answer ────────────────│    {sdp, fromUserId:A,            │
      │    {sdp, fromUserId:A}         │     toUserId:B}                   │
      │                                │                                   │
      │  setRemoteDesc                 │                                   │
      │                                │                                   │
      │<──────────── ICE candidates echanges dans les 2 sens ────────────>│
      │                                │                                   │
      │  ═══════════ Connexion P2P etablie ═ Audio coule ════════════════>│
```

### 6.4 Raccrochage

```
User A                               Serveur                         User B
      │                                │                                   │
      │── call:hangup ────────────────>│                                   │
      │   {callId}                     │                                   │
      │                                │── Retire A de l'appel             │
      │  cleanupCall()                 │── 1 seul participant restant      │
      │  state = null                  │   (pas group) → endCall()         │
      │                                │                                   │
      │                                │── call:ended ────────────────────>│
      │                                │   {callId}                        │
      │                                │                                   │
      │                                │── Supprime l'appel du store       │
      │                                │── Tous quittent la room           │
      │                                │                                   │
      │                                │                     onEnded()     │
      │                                │                     notification  │
      │                                │                     cleanupCall() │
```

### 6.5 Refus d'appel

```
User B                               Serveur                         User A
      │                                │                                   │
      │── call:reject ───────────────>│                                   │
      │   {callId}                     │                                   │
      │                                │── call:user-rejected ───────────>│
      │  incomingCall = null           │   {callId, userId:B}              │
      │                                │                                   │
      │                                │── Si 1v1 et 0-1 participants     │
      │                                │   → endCall()                     │
      │                                │── call:ended ───────────────────>│
      │                                │                    cleanupCall()  │
```

---

## 7. Composants UI

### 7.1 `ContactPickerModal`

- **Declencheur** : bouton "Demarrer un appel" dans le Dashboard
- **Comportement** : emet `contacts:list` a l'ouverture, affiche la liste, appelle `initiateCall()` au clic
- **Props** : `isOpen: boolean`, `onClose: () => void`
- **Style** : modal dark theme (`#1e293b`), backdrop blur, z-index 2000

### 7.2 `IncomingCallModal`

- **Declencheur** : `incomingCall !== null` dans le contexte
- **Affiche** : avatar avec animation pulse, nom de l'appelant, type d'appel
- **Actions** : Accepter (`acceptCall()`) / Refuser (`rejectCall()`)
- **Style** : modal centree, fond `#1e293b`, border-radius 20px

### 7.3 `AudioCallOverlay`

- **Declencheur** : `callState !== null && status !== "idle"`
- **Mode normal** : liste des participants (bulles), timer, boutons mute/raccrocher
- **Mode minimise** : barre compacte draggable avec timer et nombre de participants
- **Style** : overlay draggable (Framer Motion), z-index 1500

### 7.4 `ParticipantBubble`

- **Props** : `participant: CallParticipant`
- **Affiche** : avatar, nom, indicateur de connexion (vert/orange), badge mute
- **Style** : bordure verte si connecte, orange si en cours de connexion, animation pulse

### 7.5 `CallEndedToast`

- **Declencheur** : `callEndedNotice !== null`
- **Comportement** : toast fixe en haut centre, auto-dismiss apres 4 secondes, dismiss au clic
- **Style** : fond `#1e293b`, icone rouge `PhoneOff`, z-index 3000

---

## 8. AudioCallContext — API publique

Le contexte expose les valeurs et methodes suivantes via `useAudioCall()` :

| Propriete / Methode        | Type                       | Description                                        |
| -------------------------- | -------------------------- | -------------------------------------------------- |
| `callState`                | `ActiveCallState \| null`  | Etat de l'appel en cours                           |
| `incomingCall`             | `IncomingCallInfo \| null` | Infos de l'appel entrant                           |
| `callEndedNotice`          | `string \| null`           | Message de notification fin d'appel                |
| `initiateCall(targets)`    | `(users[]) => void`        | Demarre un appel vers un ou plusieurs utilisateurs |
| `acceptCall()`             | `() => void`               | Accepte l'appel entrant                            |
| `rejectCall()`             | `() => void`               | Refuse l'appel entrant                             |
| `hangUp()`                 | `() => void`               | Raccroche l'appel en cours                         |
| `toggleMute()`             | `() => void`               | Active/desactive le micro                          |
| `dismissCallEndedNotice()` | `() => void`               | Ferme la notification de fin d'appel               |

### Refs internes (non exposees)

| Ref                 | Type                                 | Description                                  |
| ------------------- | ------------------------------------ | -------------------------------------------- |
| `peerConnections`   | `Map<userId, RTCPeerConnection>`     | Une connexion WebRTC par participant distant |
| `localStream`       | `MediaStream \| null`                | Flux micro de l'utilisateur                  |
| `remoteAudios`      | `Map<userId, HTMLAudioElement>`      | Element audio par participant distant        |
| `pendingCandidates` | `Map<userId, RTCIceCandidateInit[]>` | Buffer ICE candidates avant connexion        |

---

## 9. Configuration WebRTC

| Parametre     | Valeur                                                          |
| ------------- | --------------------------------------------------------------- |
| Serveurs STUN | `stun:stun.l.google.com:19302`, `stun:stun1.l.google.com:19302` |
| Serveurs TURN | Aucun                                                           |
| Audio         | `getUserMedia({ audio: true, video: false })`                   |
| Video         | Non supporte                                                    |

---

## 10. Regles metier

| Regle                                                         | Implementation                                                                     |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Un utilisateur ne peut etre que dans un seul appel a la fois  | `ActiveCallStore.isUserInCall()` verifie avant `call:initiate`                     |
| Un appel 1-a-1 se termine quand un participant quitte         | `removeUserFromCall()` : si `participants.size <= 1 && !isGroupCall` → `endCall()` |
| Un appel de groupe continue tant qu'il reste des participants | `removeUserFromCall()` : si `participants.size === 0` → `endCall()`                |
| Un appel entrant est ignore si deja en appel                  | `onIncoming` : `if (callState) return`                                             |
| La deconnexion socket equivaut a raccrocher                   | `handleDisconnect()` appelle `removeUserFromCall()`                                |
| Notification de fin d'appel                                   | `onEnded` affiche un toast pendant 4 secondes                                      |

---

## 11. Limitations connues

| Limitation                | Detail                                                                      |
| ------------------------- | --------------------------------------------------------------------------- |
| Pas de TURN server        | Les appels echouent derriere NAT symetrique ou firewalls restrictifs        |
| Stockage en memoire       | Les appels actifs sont perdus si le serveur redemarre                       |
| Pas de sonnerie audio     | L'appel entrant est visuel uniquement (modal)                               |
| Pas d'historique d'appels | Aucune persistance des appels en base de donnees                            |
| Auth socket simplifiee    | `authenticate:session` envoie un userId brut sans verification cote serveur |
| Pas de timeout d'appel    | Un appel sortant sans reponse reste en etat "outgoing" indefiniment         |
