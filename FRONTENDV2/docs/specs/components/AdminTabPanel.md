# Référence du composant AdminTabPanel — VisioConf

**Fichier source** : `FRONTENDV2/src/components/AdminTabPanel/AdminTabPanel.tsx`
**Styles** : `FRONTENDV2/src/components/AdminTabPanel/AdminTabPanel.scss`
**Type** : Composant React fonctionnel (FC)

---

## 1. Description

`AdminTabPanel` est le panel détaillé d'un onglet d'administration. Il affiche l'en-tête de l'onglet sélectionné (icône, titre, bouton fermer) et la liste des sous-options. Remplace l'ancien composant `AdminMenu`.

**État actuel :** Les conditions de permission sur les sous-options sont commentées. À connecter au système de permissions quand disponible.

---

## 2. Props

```typescript
type AdminTabProps = {
    tabSelected: string                              // Nom de l'onglet ("Utilisateurs", "Rôles", etc.)
    setTabSelected: Dispatch<SetStateAction<string | null>>  // Setter pour fermer (null)
}
```

---

## 3. Types

```typescript
type AdminTabType = {
    name: string
    icon: LucideIcon
    subOption: {
        label: string
        condition: boolean    // Commenté — à connecter aux permissions
    }[]
}
```

---

## 4. Onglets et sous-options

| Onglet | Icône | Sous-options |
|--------|-------|--------------|
| Utilisateurs | `UsersRound` | Lister, Modifier, Valider, Désactiver, Bannir |
| Rôles | `Drama` | Lister, Créer, Dupliquer, Modifier, Supprimer |
| Permissions | `ListChecks` | Lister, Créer, Modifier |
| Equipes | `MessagesSquare` | Lister, Créer, Modifier, Supprimer |

---

## 5. Structure HTML sémantique

```html
<section id="adminTab">
    <section id="tabHeader">
        <div id="row1">
            <div class="col1">
                {icon}
                <p id="tabTitle">{name}</p>
            </div>
            <div class="col2">
                <X id="backIco" onClick={() => setTabSelected(null)} />
            </div>
        </div>
        <ul id="tabOptions">
            <li class="option">
                <p class="optionLabel">{label}</p>
            </li>
        </ul>
    </section>
</section>
```

---

## 6. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `AdminPanel` | AdminPanel rend AdminTabPanel | Composant parent |
