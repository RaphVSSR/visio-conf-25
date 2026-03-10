# Référence du composant ChannelView — VisioConf

**Fichier source** : `FRONTENDV2/src/components/ChannelView/ChannelView.tsx`
**Styles** : `FRONTENDV2/src/components/ChannelView/ChannelView.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`ChannelView` est la vue principale d'un canal. Affiche les posts, permet la publication et les réponses, et donne accès au panneau des membres.

---

## 2. Props

```typescript
interface ChannelViewProps {
    channel: Channel
    userId: string
    onEditChannel: () => void
    onChannelDeleted?: () => void
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `posts` | `any[]` | `[]` | Liste des posts du canal |
| `members` | `any[]` | `[]` | Liste des membres du canal |
| `newPostContent` | `string` | `""` | Contenu du nouveau post |
| `isLoading` | `boolean` | `true` | Chargement initial |
| `showMembers` | `boolean` | `false` | Panneau des membres visible |
| `messagesEndRef` | `RefObject` | — | Ref pour auto-scroll vers le bas |
| `inputRef` | `RefObject` | — | Ref pour focus sur l'input |

---

## 4. Comportement clé

- **Restriction de publication** : Seul le créateur du canal peut poster (les autres peuvent uniquement répondre)
- **Auto-scroll** : Défile automatiquement vers le dernier message
- **Panneau membres** : Toggle du panneau latéral avec rôles affichés
- **État vide** : Message quand aucun post

---

## 6. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `PostItem` | `components/` | Affichage d'un post individuel |
| `LucideIcons` | `design-system/` | Icônes (Settings, Users, Send) |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `TeamsPage` | TeamsPage rend ChannelView | Composant parent |
| `PostItem` | ChannelView rend des PostItem | Sous-composant |
| `useAuth` | ChannelView utilise useAuth() | Controleur |
