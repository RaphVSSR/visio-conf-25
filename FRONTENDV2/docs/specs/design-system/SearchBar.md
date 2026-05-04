# Référence du composant SearchBar — VisioConf Design System

**Fichier source** : `FRONTENDV2/src/design-system/components/SearchBar/SearchBar.tsx`
**Styles** : `FRONTENDV2/src/design-system/components/SearchBar/SearchBar.scss`
**Type** : Composant React fonctionnel (générique) — Primitif UI

---

## 1. Description

`SearchBar` est la barre de recherche générique du design system. Supporte un mode avec dropdown de suggestions (générique via TypeScript) et un mode sans dropdown. Le composant est un input avec icône de recherche.

**État actuel :** Le dropdown de suggestions est un placeholder (TODO). La fonctionnalité de recherche (value, onChange, clear) est commentée.

---

## 2. Types

```typescript
type SearchBarProps<suggestingType> = {
    placeholder: string
} & (
    | { dDownNeeded: "true", suggestingList: suggestingType[] }
    | { dDownNeeded: "false", suggestingList?: undefined }
) & HTMLAttributes<HTMLDivElement>
```

---

## 3. Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `placeholder` | `string` | oui | Texte placeholder de l'input |
| `dDownNeeded` | `"true" \| "false"` | oui | Active le dropdown de suggestions |
| `suggestingList` | `suggestingType[]` | si dDownNeeded="true" | Liste de suggestions typée |
| `...props` | `HTMLAttributes<HTMLDivElement>` | non | Props HTML du conteneur div |

**Union discriminée :** Si `dDownNeeded` est `"true"`, `suggestingList` est obligatoire.

**Note :** `dDownNeeded` est un string `"true"/"false"` et non un boolean — choix de design pour la discrimination.

---

## 4. Structure HTML

```html
<>
    <div class="searchBar" {...props}>
        <Search class="searchIcon" size={16} />
        <input class="searchInput" type="text" placeholder={placeholder} />
    </div>
    {dDownNeeded === "true" && <div class="searchSuggestions">
        <!-- TODO -->
    </div>}
</>
```

---

## 5. Relations avec autres classes

| Classe | Relation | Description |
|--------|----------|-------------|
| `Home` | Home rend SearchBar | Recherche de contacts |

---

## 6. Exemples

```tsx
<SearchBar dDownNeeded="false" placeholder="Rechercher un contact..." />

<SearchBar dDownNeeded="true" suggestingList={users} placeholder="Rechercher..." />
```
