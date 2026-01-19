# Icomoon Icons Integration Guide

This guide explains how to use icomoon icons in the ShreeClinic Angular application.

## Overview

The application now supports both Material Icons and Icomoon custom icon fonts through the `app-icon` component.

## How to Use Icomoon Icons

### Basic Usage

```html
<!-- Using Icomoon icon -->
<app-icon 
  iconType="icomoon"
  icomoonClass="icon-home"
  [size]="24"
  color="#667eea"
></app-icon>

<!-- Using Material icon (default) -->
<app-icon 
  fontIcon="home"
  [size]="24"
  color="#667eea"
></app-icon>
```

### With Event Handling

```html
<app-icon 
  iconType="icomoon"
  icomoonClass="icon-settings"
  [size]="20"
  color="#888"
  (iconClick)="handleClick($event)"
></app-icon>
```

### With Cover Style

```html
<app-icon 
  iconType="icomoon"
  icomoonClass="icon-user"
  [size]="24"
  [isCovered]="true"
  color="#667eea"
></app-icon>
```

### With Blink Animation

```html
<app-icon 
  iconType="icomoon"
  icomoonClass="icon-notification"
  [size]="20"
  [isBlink]="true"
  color="#e74c3c"
></app-icon>
```

## Adding Your Custom Icomoon Font

### Step 1: Generate Your Icon Font from Icomoon

1. Visit [IcoMoon App](https://icomoon.io/app/)
2. Select the icons you want to use or upload your own SVG icons
3. Click "Generate Font" at the bottom
4. Click "Download" to get your font package

### Step 2: Extract and Copy Font Files

1. Extract the downloaded ZIP file
2. You'll find a `fonts` folder containing:
   - `icomoon.eot`
   - `icomoon.ttf`
   - `icomoon.woff`
   - `icomoon.svg`

3. Copy these font files to:
   ```
   /shree-clinic/src/assets/fonts/
   ```

### Step 3: Update Icon Classes

1. Open the `style.css` file from your icomoon download
2. Copy the icon class definitions (e.g., `.icon-home:before`, `.icon-user:before`, etc.)
3. Paste them into:
   ```
   /shree-clinic/src/assets/fonts/icomoon.css
   ```

   Replace the example icon classes with your actual icons.

### Example icomoon.css structure:

```css
.icon-home:before {
  content: "\e900";
}
.icon-user:before {
  content: "\e901";
}
.icon-calendar:before {
  content: "\e902";
}
/* Add more icons as needed */
```

## Available Component Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `iconType` | `'material' \| 'icomoon'` | `'material'` | Type of icon to render |
| `icomoonClass` | `string` | `''` | Icomoon icon class (e.g., 'icon-home') |
| `fontIcon` | `string` | `''` | Material icon name |
| `size` | `number` | `24` | Icon size in pixels |
| `color` | `string` | `'#888'` | Icon color |
| `isCovered` | `boolean` | `false` | Apply covered container style |
| `isBlink` | `boolean` | `false` | Enable blink animation |
| `fontBold` | `boolean` | `false` | Make icon bold |
| `counter` | `number \| string \| null` | `null` | Display counter badge |
| `class` | `string` | `''` | Additional CSS classes |

## Available Component Outputs

| Output | Type | Description |
|--------|------|-------------|
| `iconClick` | `EventEmitter<Event>` | Emits when icon is clicked |

## Example Icons Included

The following example icons are pre-configured (replace with your actual icons):

- `icon-home`
- `icon-user`
- `icon-calendar`
- `icon-settings`
- `icon-search`
- `icon-heart`
- `icon-menu`
- `icon-close`
- `icon-check`
- `icon-arrow-left`
- `icon-arrow-right`
- `icon-arrow-up`
- `icon-arrow-down`
- `icon-plus`
- `icon-minus`
- `icon-edit`
- `icon-delete`
- `icon-phone`
- `icon-email`
- `icon-notification`

## TypeScript Usage Example

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `
    <app-icon 
      iconType="icomoon"
      [icomoonClass]="currentIcon"
      [size]="iconSize"
      [color]="iconColor"
      (iconClick)="onIconClick()"
    ></app-icon>
  `
})
export class ExampleComponent {
  currentIcon = 'icon-home';
  iconSize = 24;
  iconColor = '#667eea';

  onIconClick() {
    console.log('Icon clicked!');
    // Your logic here
  }
}
```

## Troubleshooting

### Icons not showing?

1. **Check font files**: Ensure all font files (.eot, .ttf, .woff, .svg) are in `/src/assets/fonts/`
2. **Check CSS import**: Verify that `icomoon.css` is imported in `styles.css`
3. **Check icon class**: Make sure the `icomoonClass` matches the class name in your CSS file
4. **Clear cache**: Try clearing your browser cache or doing a hard refresh (Ctrl+Shift+R)

### Icons showing as squares?

- The font files are not loading correctly. Check the browser console for 404 errors
- Verify the font paths in `icomoon.css` are correct relative to the CSS file location

### Wrong icon displaying?

- The unicode value in your CSS doesn't match your font file
- Re-download the font from icomoon with the correct configuration

## Benefits of Icomoon

1. **Custom Icons**: Use your own SVG icons
2. **Smaller File Size**: Only include the icons you need
3. **Better Performance**: Font-based icons are lightweight
4. **Easy Customization**: Change size and color with CSS
5. **Cross-browser Support**: Works on all modern browsers

## Resources

- [IcoMoon App](https://icomoon.io/app/)
- [IcoMoon Documentation](https://icomoon.io/#docs)
- [Material Icons](https://fonts.google.com/icons) (for comparison)

## Support

If you encounter any issues or need help integrating icomoon icons, please refer to:
- This documentation
- The icomoon official documentation
- The Angular Material documentation for the base component

