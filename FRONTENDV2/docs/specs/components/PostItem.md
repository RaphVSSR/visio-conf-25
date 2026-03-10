# Référence du composant PostItem — VisioConf

**Fichier source** : `FRONTENDV2/src/components/PostItem/PostItem.tsx`
**Styles** : `FRONTENDV2/src/components/PostItem/PostItem.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`PostItem` affiche un post de canal avec les informations de l'auteur, la date relative, les réponses et un formulaire de réponse intégré.

---

## 2. Props

```typescript
interface PostItemProps {
    post: any
    currentUserId: string
    onAddResponse: (content: string) => void
    isAdmin: boolean
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `showReplyForm` | `boolean` | `false` | Formulaire de réponse visible |
| `replyContent` | `string` | `""` | Contenu de la réponse |
| `replyInputRef` | `RefObject` | — | Focus auto sur le textarea |
| `responses` | `any[]` | `post.responses` | Réponses au post |

---

## 4. Fonctions utilitaires

| Fonction | Description |
|----------|-------------|
| `formatRelativeDate(dateString)` | Convertit une date en format relatif ("Il y a 5 minutes", "Hier", etc.) |

---

## 5. Comportement

- **Badge auteur** : Affiché si le post est de l'utilisateur courant
- **Réponses** : Affichées en dessous du post, avec compteur
- **Formulaire de réponse** : Toggle via bouton "Répondre", textarea avec envoi
- **Animation** : Framer Motion fade-in à l'apparition

---

## 6. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `PostResponseItem` | `components/` | Affichage d'une réponse |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `ChannelView` | ChannelView rend des PostItem | Composant parent |
| `PostResponseItem` | PostItem rend des PostResponseItem | Sous-composant |
