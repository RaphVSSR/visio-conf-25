# Référence du composant ChannelTabs — VisioConf

**Fichier source** : `FRONTENDV2/src/components/ChannelTabs/ChannelTabs.tsx`
**Styles** : `FRONTENDV2/src/components/ChannelTabs/ChannelTabs.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`ChannelTabs` affiche les canaux d'une équipe sous forme d'onglets horizontaux scrollables. Trie les canaux alphabétiquement et distingue public/privé par icône.

---

## 2. Props

```typescript
export interface ChannelTabsProps {
    channels: Channel[]
    selectedChannel: Channel | null
    onSelectChannel: (channel: Channel) => void
    onCreateChannel: () => void
}
```

---

## 3. State local

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `canScrollLeft` | `boolean` | `false` | Bouton scroll gauche visible |
| `canScrollRight` | `boolean` | `false` | Bouton scroll droite visible |

---

## 4. Comportement

- **Tri** : Canaux triés alphabétiquement par nom
- **Icônes** : Lock pour privé, Hash pour public
- **Scroll** : Smooth scroll horizontal de 200px, boutons flèches apparaissent quand le contenu dépasse
- **ResizeObserver** : Surveille le conteneur pour mettre à jour la visibilité des boutons de scroll
- **Bouton +** : Création d'un nouveau canal

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `TeamsPage` | TeamsPage rend ChannelTabs | Composant parent |
| `Channel` | Affiche les données Channel | Type de données |
