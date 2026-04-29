# Référence de la page Home — VisioConf

**Fichier source** : `FRONTENDV2/src/pages/Home/Home.tsx`
**Styles** : `FRONTENDV2/src/pages/Home/Home.scss`
**Type** : Composant React fonctionnel (FC) — Page

---

## 1. Description

`Home` est la page d'accueil principale de l'application, affichée après authentification. Elle compose la barre de navigation, le tableau de bord (Dashboard), et la section contacts. Protégée par la garde `UserAuth`.

---

## 2. Structure HTML sémantique

```html
<main id="homePage">
    <motion.nav id="topBar">              ← Barre supérieure
        <span id="topBarGreeting">        ← "Bonjour, {firstname}"
        <Button id="disconnectBtn">       ← Bouton déconnexion
    </motion.nav>

    <Dashboard />                          ← Composant tableau de bord

    <motion.section id="friendsSection">  ← Section contacts
        <header id="friendsHeader">
            <h2>Contacts</h2>
            <SearchBar />
        </header>
        <section id="noFriends">          ← Placeholder "Aucun contact"
            ...
        </section>
    </motion.section>
</main>
```

---

## 3. Props et state

| Source | Propriété | Utilisation |
|--------|-----------|-------------|
| `useAuth()` | `isAuthenticated` | Redirection vers /login si false |
| `useAuth()` | `user` | Affichage du prénom dans la barre |
| `useAuth()` | `logout` | Action du bouton déconnexion |

---

## 4. Animations (framer-motion)

| Élément | Animation | Delay |
|---------|-----------|-------|
| `nav#topBar` | Fade in + slide down (y: -12 → 0) | 0s |
| `section#friendsSection` | Fade in + slide left (x: 20 → 0) | 0.3s |

---

## 5. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `Dashboard` | `components/` | Tableau de bord avec cards et actions rapides |
| `Button` | `design-system/` | Bouton déconnexion avec icône LogOut |
| `SearchBar` | `design-system/` | Barre de recherche contacts (sans dropdown) |

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `useAuth` | Home utilise useAuth() | State d'auth et action logout |
| `Dashboard` | Home rend Dashboard | Sous-composant principal |
| `UserAuth` | Home est protégé par UserAuth | Garde de route |
