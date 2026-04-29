# Référence du composant SessionExpiryModal — VisioConf

**Fichier source** : `FRONTENDV2/src/components/SessionExpiryModal/SessionExpiryModal.tsx`
**Styles** : `FRONTENDV2/src/components/SessionExpiryModal/SessionExpiryModal.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`SessionExpiryModal` est la modale d'avertissement d'expiration de session. Elle s'affiche quand `showExpiryWarning` est `true` (déclenché par le timer d'AuthService, environ 30 minutes avant l'expiration). Affiche un compte à rebours en temps réel et propose de prolonger ou d'ignorer.

**Note :** Ce composant utilise l'élément `<dialog>` mais n'est pas actuellement monté dans l'arbre de l'app — `AuthToasts` le remplace avec des toasts. Conservé comme alternative modale.

---

## 2. State local

| State | Type | Description |
|-------|------|-------------|
| `timeLeft` | `string` | Temps restant formaté "M:SS" (mis à jour chaque seconde) |

---

## 3. State depuis useAuth

| Propriété | Utilisation |
|-----------|-------------|
| `showExpiryWarning` | Condition d'affichage de la modale |
| `expiresAt` | Calcul du compte à rebours |
| `refreshSession` | Action "Prolonger la session" |
| `dismissExpiryWarning` | Action "Ignorer" |

---

## 4. Structure HTML sémantique

```html
<dialog class="sessionExpiryOverlay" open>
    <article class="sessionExpiryModal">
        <h2>Session bientôt expirée</h2>
        <p>Votre session expire dans <strong>{timeLeft}</strong>.</p>
        <p>Souhaitez-vous prolonger votre session ?</p>
        <footer class="sessionExpiryActions">
            <button class="extendBtn" onClick={refreshSession}>
                Prolonger la session
            </button>
            <button class="dismissBtn" onClick={dismissExpiryWarning}>
                Ignorer
            </button>
        </footer>
    </article>
</dialog>
```

---

## 5. Timer du compte à rebours

```
useEffect([showExpiryWarning, expiresAt])
    │
    setInterval(1000ms) {
        remaining = expiresAt - Date.now()
        if (remaining <= 0) → "0:00", clearInterval
        else → "M:SS"
    }
    │
    return () => clearInterval
```

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | SessionExpiryModal utilise useAuth() | showExpiryWarning, expiresAt, refreshSession, dismissExpiryWarning |
| `AuthToasts` | Remplace ce composant dans l'app actuelle | Alternative toast plutôt que modale |
