# Referentiel du composant AuthToasts — VisioConf

**Fichier source** : `FRONTENDV2/src/components/AuthToasts/AuthToasts.tsx`
**Styles** : `FRONTENDV2/src/components/AuthToasts/AuthToasts.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`AuthToasts` est le composant global de notifications d'authentification. Il affiche un toast pour l'avertissement d'expiration de session. Monte en dehors du router dans `App.tsx` — visible sur toutes les pages.

Affiche les notifications d'authentification sous forme de toast non-intrusif.

---

## 2. State local

| State | Type | Description |
|-------|------|-------------|
| `timeLeft` | `string` | Temps restant formate "M:SS" pour l'expiration |

---

## 3. State depuis useAuth

| Propriete | Utilisation |
|-----------|-------------|
| `showExpiryWarning` | Condition d'affichage du toast d'expiration |
| `expiresAt` | Calcul du compte a rebours |
| `refreshSession` | Action "Prolonger" sur le toast d'expiration |
| `dismissExpiryWarning` | Action "Ignorer" sur le toast d'expiration |

---

## 4. Structure HTML semantique

```html
<aside class="authToasts" aria-live="assertive">
    <AnimatePresence mode="popLayout">

        <!-- Toast d'expiration (si showExpiryWarning) -->
        <Toast
            variant="info"
            message="Session bientot expiree"
            subtitle="Expire dans {timeLeft}"
            actions={[Prolonger, Ignorer]}
        />

    </AnimatePresence>
</aside>
```

---

## 5. Toasts affiches

| Toast | Variant | Condition | Actions |
|-------|---------|-----------|---------|
| Expiration de session | `info` | `showExpiryWarning` | Prolonger (primary), Ignorer (ghost) |

---

## 6. Accessibilite

- `aria-live="assertive"` : annonce immediate aux screen readers
- Chaque toast a des boutons d'action cliquables

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | AuthToasts utilise useAuth() | showExpiryWarning, expiresAt, refreshSession, dismissExpiryWarning |
| `Toast` | AuthToasts rend des Toast | Primitif UI du design system |
| `App` | App monte AuthToasts | En dehors du BrowserRouter |

