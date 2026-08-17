# CSS & SCSS Styling Modularization Reference Guide

This guide establishes structural guidelines, nesting limits, class naming conventions, and theme variables for styling in the React frontend to prevent monolithic styling sheets and CSS specificity issues.

---

## 1. Modular Stylesheet Structure

Avoid writing large, generic stylesheets (e.g., `directorypreview.scss`) that bundle styling rules for multiple different view components.

### 1:1 Component Styling Rule
1. **Directory Pairing**: Keep component code (`.tsx`) and styling (`.scss`) files in the same directory.
2. **Naming Alignment**: The stylesheet filename must match the component filename exactly.
   - Example: `directory-thumbnail-card.tsx` pairs with `directory-thumbnail-card.scss`.
3. **Encapsulation (CSS Modules)**: Prefer CSS Modules (`[name].module.scss`) where possible to prevent global namespace collisions.
4. **No Deep Import Paths**: Sub-components should not import parent stylesheets, and parent stylesheets should not import sub-component rules.

---

## 2. Nesting Depth Limits in SCSS

While SCSS makes it easy to nest CSS selectors, deep nesting creates bloated compiled CSS, slow rendering performance, and high selector specificity that is difficult to override.

### Limit Rules
1. **Nesting Limit**: Selector nesting in SCSS is restricted to a maximum of **3 levels** deep.
   ```scss
   // Good (2 levels)
   .dir-thumb-card {
       border: 1px solid rgba(255, 255, 255, 0.08);

       &:hover {
           border-color: var(--accent-color);
       }
   }
   
   // Forbidden (4 levels)
   .dir-thumbnail-view {
       .dir-thumbnail-grid {
           .dir-thumbnail-card {
               .card-filename {
                   color: #fff; // Too specific and nested
               }
           }
       }
   }
   ```
2. **Flat Class Design**: Use flatter, descriptive class names (e.g., `.dir-card-title` instead of `.dir-card .title-area .title`) to keep selector hierarchies shallow.

---

## 3. Design Tokens & Theme Variables

Do not hardcode hex, rgb, or color names directly in local stylesheets. Always use CSS variable tokens.

### Theme Variables Enforcements
1. **Color Variables**: Use root-level theme tokens to support light/dark modes and custom accent colors:
   - Backgrounds: `var(--bg-color)`, `var(--bg-card)`
   - Accents: `var(--accent-color)` (e.g., purple/blue glows)
   - Borders: `var(--border-color)`
   - Text: `var(--text-color)`, `var(--text-muted)`
2. **Hex Code Prohibition**: Raw hex codes (e.g., `#a855f7`) are forbidden in component SCSS files unless defining theme variables in a central design system file.
3. **Glassmorphism Presets**: Utilize central utility variables for glassmorphic properties (such as backdrop blurs and semi-transparent backgrounds):
   - `background: rgba(255, 255, 255, 0.02); backdrop-filter: blur(10px);`

---

## 4. Specificity & Clean Selectors

Avoid selector hacks that increase code complexity and degrade layout rendering.

### Specificity Guidelines
1. **No Inline Styling**: Styling should not be written inline within React components (e.g., `<div style={{ padding: "10px" }}>`) unless the values are calculated dynamically (like slider widths or coordinates).
2. **Restrict `!important`**: The `!important` declaration is strictly prohibited except when overriding external third-party library classes that cannot be targeted otherwise.
3. **Flavored Class Naming (BEM or CSS Modules)**:
   - For standard SCSS, follow the BEM (Block-Element-Modifier) pattern:
     - Block: `.dir-card`
     - Element: `.dir-card__title`
     - Modifier: `.dir-card--active`
4. **Remove Unused CSS Rules**: When deleting or refactoring a UI element, immediately delete the corresponding CSS rules from the stylesheet.
