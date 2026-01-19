# Icomoon Icons - Quick Reference

## 🚀 Quick Start

### Basic Syntax
```html
<app-icon 
  iconType="icomoon"
  icomoonClass="icon-name"
  [size]="24"
  color="#667eea"
></app-icon>
```

## 📋 Component Inputs

| Input | Type | Default | Example |
|-------|------|---------|---------|
| `iconType` | `'material' \| 'icomoon'` | `'material'` | `iconType="icomoon"` |
| `icomoonClass` | `string` | `''` | `icomoonClass="icon-home"` |
| `fontIcon` | `string` | `''` | `fontIcon="home"` (Material) |
| `size` | `number` | `24` | `[size]="32"` |
| `color` | `string` | `'#888'` | `color="#667eea"` |
| `isCovered` | `boolean` | `false` | `[isCovered]="true"` |
| `isBlink` | `boolean` | `false` | `[isBlink]="true"` |
| `fontBold` | `boolean` | `false` | `[fontBold]="true"` |
| `counter` | `number \| string \| null` | `null` | `[counter]="5"` |
| `class` | `string` | `''` | `class="my-class"` |

## 📤 Component Outputs

| Output | Type | Usage |
|--------|------|-------|
| `iconClick` | `EventEmitter<Event>` | `(iconClick)="handleClick($event)"` |

## 🎯 Common Use Cases

### Navigation
```html
<app-icon iconType="icomoon" icomoonClass="icon-menu" [size]="24"></app-icon>
```

### Actions
```html
<app-icon iconType="icomoon" icomoonClass="icon-edit" [size]="18" color="#3498db"></app-icon>
<app-icon iconType="icomoon" icomoonClass="icon-delete" [size]="18" color="#e74c3c"></app-icon>
```

### Notifications
```html
<app-icon 
  iconType="icomoon" 
  icomoonClass="icon-notification" 
  [counter]="5"
  [isBlink]="true"
></app-icon>
```

### Buttons
```html
<button>
  <app-icon iconType="icomoon" icomoonClass="icon-plus" [size]="20"></app-icon>
  Add New
</button>
```

### With Cover Style
```html
<app-icon 
  iconType="icomoon" 
  icomoonClass="icon-calendar" 
  [isCovered]="true"
  [size]="24"
></app-icon>
```

## 🎨 Pre-configured Icons

| Icon Class | Usage | Description |
|------------|-------|-------------|
| `icon-home` | Navigation | Home icon |
| `icon-user` | Profile | User icon |
| `icon-calendar` | Scheduling | Calendar icon |
| `icon-settings` | Configuration | Settings icon |
| `icon-search` | Search | Search icon |
| `icon-heart` | Favorites | Heart icon |
| `icon-menu` | Navigation | Menu icon |
| `icon-close` | Actions | Close icon |
| `icon-check` | Status | Check/Success icon |
| `icon-arrow-left` | Navigation | Left arrow |
| `icon-arrow-right` | Navigation | Right arrow |
| `icon-arrow-up` | Navigation | Up arrow |
| `icon-arrow-down` | Navigation | Down arrow |
| `icon-plus` | Actions | Plus/Add icon |
| `icon-minus` | Actions | Minus/Remove icon |
| `icon-edit` | Actions | Edit icon |
| `icon-delete` | Actions | Delete icon |
| `icon-phone` | Contact | Phone icon |
| `icon-email` | Contact | Email icon |
| `icon-notification` | Alerts | Notification icon |

## 🔧 Setup Checklist

- [ ] Font files placed in `/src/assets/fonts/`
- [ ] `icomoon.css` updated with icon classes
- [ ] `styles.css` imports `icomoon.css`
- [ ] Icon component imported in your component
- [ ] Icons tested in browser

## 📦 Adding Custom Icons

1. **Visit** [icomoon.io/app](https://icomoon.io/app/)
2. **Select** icons or upload SVGs
3. **Generate** font
4. **Download** package
5. **Copy** font files to `/src/assets/fonts/`
6. **Update** `/src/assets/fonts/icomoon.css` with icon classes

## 💡 Tips

### Color
```html
<!-- Static color -->
color="#667eea"

<!-- Dynamic color -->
[color]="isDanger ? '#e74c3c' : '#667eea'"
```

### Size
```html
<!-- Small -->
[size]="16"

<!-- Medium (default) -->
[size]="24"

<!-- Large -->
[size]="32"

<!-- Extra Large -->
[size]="48"
```

### Click Events
```typescript
// Component
handleClick(event: Event) {
  console.log('Icon clicked', event);
}
```

```html
<!-- Template -->
<app-icon 
  iconType="icomoon" 
  icomoonClass="icon-home"
  (iconClick)="handleClick($event)"
></app-icon>
```

## 🆚 Material vs Icomoon

### Material Icon
```html
<app-icon 
  fontIcon="home"
  [size]="24"
></app-icon>
```

### Icomoon Icon
```html
<app-icon 
  iconType="icomoon"
  icomoonClass="icon-home"
  [size]="24"
></app-icon>
```

## 🐛 Troubleshooting

### Icons not showing?
- Check font files exist in `/src/assets/fonts/`
- Verify CSS import in `styles.css`
- Clear browser cache (Ctrl+Shift+R)

### Wrong icon?
- Check `icomoonClass` matches CSS class name
- Verify unicode values in `icomoon.css`

### Showing squares?
- Font files not loading (check console for 404)
- Check font paths in `icomoon.css`

## 📚 Resources

- **Setup Guide**: `ICOMOON_SETUP.md`
- **Examples**: `ICOMOON_EXAMPLES.html`
- **IcoMoon App**: [icomoon.io/app](https://icomoon.io/app/)

---

**Need Help?** Check `ICOMOON_SETUP.md` for detailed instructions.

