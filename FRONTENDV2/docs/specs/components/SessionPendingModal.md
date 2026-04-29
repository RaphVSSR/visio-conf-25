# Référence du composant SessionPendingModal — VisioConf

**Fichier source** : `FRONTENDV2/src/components/SessionExpiryModal/SessionPendingModal.tsx`
**Styles** : `FRONTENDV2/src/components/SessionExpiryModal/SessionPendingModal.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`SessionPendingModal` est la modale d'approbation de nouvelle session. Elle s'affiche côté session existante quand un autre appareil tente de se connecter au même compte. L'utilisateur peut accepter ou refuser la nouvelle connexion.

**Note :** Comme `SessionExpiryModal`, ce composant utilise `<dialog>` et n'est pas monté dans l'app actuelle — `AuthToasts` le remplace. Conservé comme alternative modale.

---

## 2. State depuis useAuth

| Propriété | Utilisation |
|-----------|-------------|
| `pendingSessionRequests` | Liste des demandes en attente. Affiche la première (`[0]`) |
| `respondToPendingSession` | Action Accepter/Refuser |

---

## 3. Structure HTML sémantique

```html
<dialog class="sessionPendingOverlay" open>
    <article class="sessionPendingModal">
        <h2>Nouvelle connexion</h2>
        <p>Un nouvel appareil tente de se connecter à votre compte :</p>
        <section class="deviceInfoBlock">
            <p><strong>Appareil :</strong> {request.deviceInfo}</p>
            <p><strong>Utilisateur :</strong> {request.requesterInfo}</p>
        </section>
        <p>Souhaitez-vous autoriser cette connexion ?</p>
        <footer class="sessionPendingActions">
            <button class="acceptBtn" onClick={() => respondToPendingSession(requestId, true)}>
                Autoriser
            </button>
            <button class="rejectBtn" onClick={() => respondToPendingSession(requestId, false)}>
                Refuser
            </button>
        </footer>
    </article>
</dialog>
```

---

## 4. Informations affichées

| Champ | Source | Description |
|-------|--------|-------------|
| `deviceInfo` | `PendingSessionRequest.deviceInfo` | User agent du nouvel appareil |
| `requesterInfo` | `PendingSessionRequest.requesterInfo` | Identité du demandeur (nom, email) |

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | SessionPendingModal utilise useAuth() | pendingSessionRequests, respondToPendingSession |
| `AuthToasts` | Remplace ce composant dans l'app actuelle | Alternative toast plutôt que modale |
