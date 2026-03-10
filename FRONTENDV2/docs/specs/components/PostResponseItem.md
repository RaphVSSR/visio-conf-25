# Référence du composant PostResponseItem — VisioConf

**Fichier source** : `FRONTENDV2/src/components/PostResponseItem/PostResponseItem.tsx`
**Styles** : `FRONTENDV2/src/components/PostResponseItem/PostResponseItem.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`PostResponseItem` affiche une réponse à un post de canal avec les informations de l'auteur et la date relative.

---

## 2. Props

```typescript
interface PostResponseItemProps {
    response: any
    currentUserId: string
    id?: string
}
```

---

## 3. Comportement

- **Avatar** : Photo de profil ou initiales de l'auteur
- **Badge "You"** : Affiché si la réponse est de l'utilisateur courant
- **Date relative** : Même logique que `PostItem.formatRelativeDate()`
- **Classe CSS** : Variante de style si l'auteur est l'utilisateur courant

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `PostItem` | PostItem rend des PostResponseItem | Composant parent |
