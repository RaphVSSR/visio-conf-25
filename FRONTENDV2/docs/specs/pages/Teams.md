# Référence de la page Teams — VisioConf

**Fichier source** : `FRONTENDV2/src/pages/Teams/TeamsPage.tsx`
**Styles** : `FRONTENDV2/src/pages/Teams/TeamsPage.scss`
**Types** : `FRONTENDV2/src/pages/Teams/Teams.types.ts`
**Type** : Composant React fonctionnel — Page

---

## 1. Description

`TeamsPage` est la page principale de gestion des équipes et de leurs canaux. Compose la sidebar des équipes, les onglets de canaux, la vue canal et les formulaires de création/édition. Protégée par la garde `UserAuth`.

---

## 2. Structure HTML sémantique

```html
<main id="teamsPage">
    <TeamsSidebar />                    ← Liste des équipes

    <section id="teamsContent">
        <!-- Si formulaire ouvert -->
        <TeamForm /> | <ChannelForm />

        <!-- Sinon, contenu équipe -->
        <header id="teamHeader">
            <h1>{team.name}</h1>
        </header>
        <ChannelTabs />                 ← Onglets des canaux
        <ChannelView />                 ← Vue du canal sélectionné
    </section>
</main>
```

---

## 3. State

| Variable | Type | Source | Description |
|----------|------|--------|-------------|
| `isLoadingTeams` | `boolean` | local | Chargement de la liste des équipes |
| `isLoadingChannels` | `boolean` | local | Chargement des canaux de l'équipe |
| `teams, selectedTeam, teamFormMode` | — | `useTeamManager` | État des équipes |
| `channels, selectedChannel, channelFormMode` | — | `useChannelManager` | État des canaux |

---

## 4. Hooks utilisés

| Hook | Rôle |
|------|------|
| `useAuth()` | Utilisateur courant et controleur |
| `useTeamManager()` | Gestion d'état des équipes. Callback `onTeamSelected` → charge les canaux |
| `useChannelManager()` | Gestion d'état des canaux |

---

## 5. Comportement clé

- **Chargement initial** : Demande la liste des équipes au montage
- **Sélection équipe** : Charge les canaux de l'équipe sélectionnée, sélectionne le premier canal
- **Formulaires overlay** : TeamForm et ChannelForm s'affichent par dessus le contenu
- **Réactivité** : Les réponses de création/mise à jour/suppression de canaux mettent à jour la liste et la sélection
- **État vide** : Message d'invitation quand aucune équipe sélectionnée

---

## 6. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `TeamsSidebar` | `components/` | Sidebar de sélection d'équipe |
| `TeamForm` | `components/` | Formulaire création/édition d'équipe |
| `ChannelTabs` | `components/` | Onglets de navigation des canaux |
| `ChannelView` | `components/` | Vue principale du canal sélectionné |
| `ChannelForm` | `components/` | Formulaire création/édition de canal |

---

## 7. Types (Teams.types.ts)

```typescript
interface Team {
    id: string
    name: string
    description?: string
    picture?: string
    createdBy: string
    createdAt: string
    updatedAt: string
    role?: "admin" | "member"
}

interface Channel {
    id: string
    name: string
    teamId: string
    createdBy: string
    isPublic: boolean
    createdAt: string
}

interface ChannelMember {
    id: string
    userId: string
    role: "admin" | "member"
    firstname?: string
    lastname?: string
    picture?: string
}

interface ChannelPost {
    id: string
    channelId: string
    content: string
    authorId: string
    authorName: string
    authorAvatar?: string
    createdAt: string
    responseCount: number
    responses?: ChannelPostResponse[]
}

interface ChannelPostResponse {
    id: string
    postId: string
    content: string
    authorId: string
    authorName: string
    authorAvatar?: string
    createdAt: string
}
```

---

## 8. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | TeamsPage utilise useAuth() | State d'auth et controleur |
| `useTeamManager` | TeamsPage utilise useTeamManager() | Gestion d'état des équipes |
| `useChannelManager` | TeamsPage utilise useChannelManager() | Gestion d'état des canaux |
| `UserAuth` | TeamsPage est protégé par UserAuth | Garde de route |
