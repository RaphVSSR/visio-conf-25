# Référence du composant AuthToasts — VisioConf

**Fichier source** : `FRONTENDV2/src/components/AuthToasts/AuthToasts.tsx`
**Styles** : `FRONTENDV2/src/components/AuthToasts/AuthToasts.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`AuthToasts` est le composant global de notifications d'authentification. Il affiche des toasts pour les demandes de session multi-appareil et l'avertissement d'expiration de session. Monté en dehors du router dans `App.tsx` — visible sur toutes les pages.

Remplace les modales `SessionExpiryModal` et `SessionPendingModal` par des toasts non-intrusifs.

---

## 2. State local

| State | Type | Description |
|-------|------|-------------|
| `timeLeft` | `string` | Temps restant formaté "M:SS" pour l'expiration |

---

## 3. State depuis useAuth

| Propriété | Utilisation |
|-----------|-------------|
| `showExpiryWarning` | Condition d'affichage du toast d'expiration |
| `expiresAt` | Calcul du compte à rebours |
| `refreshSession` | Action "Prolonger" sur le toast d'expiration |
| `dismissExpiryWarning` | Action "Ignorer" sur le toast d'expiration |
| `pendingSessionRequests` | Liste des demandes multi-session → un toast par demande |
| `respondToPendingSession` | Actions "Accepter"/"Refuser" sur les toasts de demande |

---

## 4. Structure HTML sémantique

```html
<aside class="authToasts" aria-live="assertive">
    <AnimatePresence mode="popLayout">

        <!-- Un toast par demande de session -->
        {pendingSessionRequests.map(request =>
            <Toast
                variant="warning"
                message="Nouvelle demande de connexion"
                subtitle="{requesterInfo}\n{deviceInfo}"
                actions={[Accepter, Refuser]}
            />
        )}

        <!-- Toast d'expiration (si showExpiryWarning) -->
        <Toast
            variant="info"
            message="Session bientôt expirée"
            subtitle="Expire dans {timeLeft}"
            actions={[Prolonger, Ignorer]}
        />

    </AnimatePresence>
</aside>
```

---

## 5. Toasts affichés

| Toast | Variant | Condition | Actions |
|-------|---------|-----------|---------|
| Demande de session | `warning` | `pendingSessionRequests.length > 0` | Accepter (primary), Refuser (ghost) |
| Expiration de session | `info` | `showExpiryWarning` | Prolonger (primary), Ignorer (ghost) |

---

## 6. Accessibilité

- `aria-live="assertive"` : annonce immédiate aux screen readers (priorité haute car les demandes de session sont urgentes)
- Chaque toast a des boutons d'action cliquables

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | AuthToasts utilise useAuth() | Toutes les propriétés d'expiration et multi-session |
| `Toast` | AuthToasts rend des Toast | Primitif UI du design system |
| `App` | App monte AuthToasts | En dehors du BrowserRouter |
| `SessionExpiryModal` | Remplacé par AuthToasts | Alternative modale (non montée) |
| `SessionPendingModal` | Remplacé par AuthToasts | Alternative modale (non montée) |
