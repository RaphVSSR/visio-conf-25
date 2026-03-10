# Référence du ChannelsService — VisioConf

**Fichier source** : `FRONTENDV2/src/services/teams/ChannelsService.ts`
**Classe parente** : `ControllerService`

---

## 1. Description

`ChannelsService` est le service frontend qui communique avec le backend via le controleur pour les opérations sur les canaux, posts et réponses. Utilise un pattern de callbacks pour notifier les composants.

---

## 2. Callbacks

```typescript
interface ChannelsServiceCallbacks {
    onChannelsListReceived: (channels: Channel[]) => void
    onChannelsListError: (error: string) => void
    onChannelCreated: (channel: Channel) => void
    onChannelCreateError: (error: string) => void
    onChannelUpdated: (channel: Channel) => void
    onChannelUpdateError: (error: string) => void
    onChannelDeleted: () => void
    onChannelDeleteError: (error: string) => void
    onChannelMembersReceived: (members: ChannelMember[]) => void
    onChannelMembersError: (error: string) => void
    onPostsReceived: (posts: ChannelPost[]) => void
    onPostsError: (error: string) => void
    onPostCreated: (post: ChannelPost) => void
    onPostCreateError: (error: string) => void
    onPostResponseCreated: (postId: string, response: ChannelPostResponse) => void
    onPostResponseCreateError: (error: string) => void
}
```

---

## 3. Méthodes publiques

| Méthode | Paramètres | Description |
|---------|------------|-------------|
| `requestChannelsList` | `teamId: string` | Demande les canaux d'une équipe |
| `createChannel` | `{ name, teamId, isPublic }` | Crée un canal |
| `updateChannel` | `{ id, name, teamId, isPublic }` | Met à jour un canal |
| `deleteChannel` | `channelId: string` | Supprime un canal |
| `requestChannelMembers` | `channelId: string` | Demande les membres d'un canal |
| `requestPosts` | `channelId: string` | Demande les posts d'un canal |
| `createPost` | `channelId: string, content: string` | Publie un post |
| `createPostResponse` | `postId: string, content: string` | Répond à un post |

---

## 4. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `ControllerService` | ChannelsService extends ControllerService | Classe parente |
| `ChannelView` | ChannelView utilise ChannelsService (via controleur) | Consommateur (posts) |
| `ChannelForm` | ChannelForm utilise ChannelsService (via controleur) | Consommateur (CRUD canal) |
| `TeamsPage` | TeamsPage utilise ChannelsService (via controleur) | Consommateur (liste canaux) |
