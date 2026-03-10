# Référence du composant Dashboard — VisioConf

**Fichier source** : `FRONTENDV2/src/components/Dashboard/Dashboard.tsx`
**Styles** : `FRONTENDV2/src/components/Dashboard/Dashboard.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`Dashboard` est le tableau de bord de la page d'accueil. Il affiche des cartes de résumé (messages non lus, appels manqués, contacts actifs), des actions rapides, et une section d'activités récentes.

**État actuel :** Toutes les valeurs dynamiques sont commentées (placeholder). Les cartes affichent la structure sans données. À connecter aux services quand disponibles.

---

## 2. Structure HTML sémantique

```html
<motion.section id="homeDash">
    <h1 class="sectionTitle"><Zap /> Tableau de bord</h1>

    <section id="summaryCards">
        <Card icon="MessageSquare" borderColor="#1E3664">
            <h3>Messages non lus</h3>
        </Card>
        <Card icon="PhoneCall" borderColor="#F59E0B">
            <h3>Appels manqués</h3>
        </Card>
        <Card icon="Users" borderColor="#10B981">
            <h3>Contacts actifs</h3>
        </Card>
    </section>

    <aside id="dashQuickActions">
        <Button text="Nouvelle Discussion" icon="MessageSquare" />
        <Button text="Démarrer un appel" icon="Video" />
    </aside>

    <motion.section id="recentActivity">
        <h2 class="sectionTitle"><Activity /> Activités récentes</h2>
        <ul id="activitiesList">
            <li class="emptyActivities">Aucune activité récente</li>
        </ul>
    </motion.section>
</motion.section>
```

---

## 3. Cards de résumé

| Card | Icône | Couleur de bordure | Donnée (à connecter) |
|------|-------|--------------------|----------------------|
| Messages non lus | `MessageSquare` | `#1E3664` (bleu foncé) | `getUnreadReceivedMessagesCount()` |
| Appels manqués | `PhoneCall` | `#F59E0B` (ambre) | `getMissedCallsCount()` |
| Contacts actifs | `Users` | `#10B981` (vert) | `getActiveContactsCount()` |

---

## 4. Actions rapides

| Action | Icône | Handler (à connecter) |
|--------|-------|-----------------------|
| Nouvelle Discussion | `MessageSquare` | — |
| Démarrer un appel | `Video` | `handleStartCall()` |

---

## 5. Animations (framer-motion)

| Élément | Animation | Delay |
|---------|-----------|-------|
| `#homeDash` | Fade in + slide up (y: 20 → 0) | 0s |
| `#recentActivity` | Fade in + slide up (y: 20 → 0) | 0.3s |

---

## 6. Composants utilisés

| Composant | Source | Rôle |
|-----------|--------|------|
| `Button` | `design-system/` | Actions rapides |
| `Card` | `design-system/` | Cartes de résumé avec icônes et bordures colorées |

---

## 7. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Home` | Home rend Dashboard | Composant parent |
| `Card` | Dashboard rend des Card | Primitifs UI pour les résumés |
| `Button` | Dashboard rend des Button | Primitifs UI pour les actions |
