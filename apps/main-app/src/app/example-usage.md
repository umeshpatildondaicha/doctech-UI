# Example Usage of @lk/core and @lk/template

This document shows how to use the libraries in your main application.

## Setup

1. Build and pack the libraries:
```bash
npm run prepare:libs
```

2. Install libraries in main-app:
```bash
cd apps/main-app
npm install
```

## Using CoreEventService

The CoreEventService provides signal-based communication:

```typescript
import { Component, inject, computed } from '@angular/core';
import { CoreEventService } from '@lk/core';

@Component({
  selector: 'app-example',
  template: `
    <div>Menu: {{ menu() }}</div>
    <button (click)="openMenu('dashboard')">Open Dashboard</button>
  `
})
export class ExampleComponent {
  private eventService = inject(CoreEventService);
  
  menu = computed(() => this.eventService.menu());
  
  openMenu(menu: string) {
    this.eventService.setMenu(menu);
  }
}
```

## Using AuthService

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@lk/core';

@Component({
  selector: 'app-login',
  template: `...`
})
export class LoginComponent {
  private authService = inject(AuthService);
  
  login() {
    this.authService.login({ email: 'user@example.com', password: 'pass' })
      .subscribe({
        next: (success) => {
          if (success) {
            // Navigate to dashboard
          }
        },
        error: (err) => {
          console.error('Login failed:', err);
        }
      });
  }
}
```

## Providing API Configuration

In your app.config.ts or app.module.ts:

```typescript
import { API_BASE_URL } from '@lk/core';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... other providers
    {
      provide: API_BASE_URL,
      useValue: environment.apiUrl
    }
  ]
};
```

## Using Template Components

```typescript
import { TemplateModule } from '@lk/template';

@NgModule({
  imports: [TemplateModule],
  // ...
})
export class AppModule { }
```

Then use template components in your templates:
```html
<lk-sidebar></lk-sidebar>
<lk-header></lk-header>
```

