# Angular Libraries: @lk/core and @lk/template

This document explains how to build, pack, and use the Angular libraries for the Shree Clinic Management System.

## Overview

The application has been split into two Angular libraries:

- **@lk/core**: Provides authentication, shared services, utilities, guards, interceptors, and the CoreEventService for signal-based communication
- **@lk/template**: Provides UI components, templates, and layout components that depend on @lk/core

## Project Structure

```
doctech-angular/
├── projects/
│   └── common-libs/
│       ├── core/              # @lk/core library
│       │   ├── src/
│       │   │   ├── lib/
│       │   │   │   ├── services/
│       │   │   │   ├── guards/
│       │   │   │   ├── interceptors/
│       │   │   │   ├── utils/
│       │   │   │   ├── interfaces/
│       │   │   │   └── core-event.service.ts
│       │   │   └── public-api.ts
│       │   ├── ng-package.json
│       │   └── package.json
│       └── template/           # @lk/template library
│           ├── src/
│           │   ├── lib/
│           │   │   ├── tools/
│           │   │   ├── layout/
│           │   │   └── template.module.ts
│           │   └── public-api.ts
│           ├── ng-package.json
│           └── package.json
├── common-libs-archives/      # Packed .tgz files
│   ├── core.tgz
│   └── template.tgz
└── apps/
    └── main-app/              # Example consuming app
```

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install ng-packagr (if not already installed):
```bash
npm install --save-dev ng-packagr
```

## Building Libraries

### Build Individual Libraries

```bash
# Build core library
npm run build:core

# Build template library
npm run build:template
```

### Build All Libraries

```bash
npm run build:libs
```

This builds both libraries in production mode.

## Packaging Libraries

After building, package the libraries as `.tgz` files:

```bash
# Package core
npm run pack:core

# Package template
npm run pack:template
```

### Build and Pack in One Step

```bash
npm run prepare:libs
```

This will:
1. Build both libraries
2. Package them as `.tgz` files
3. Move them to `common-libs-archives/`

## Using Libraries in Your Application

### Installation

In your application's `package.json`, add:

```json
{
  "dependencies": {
    "@lk/core": "file:common-libs-archives/core.tgz",
    "@lk/template": "file:common-libs-archives/template.tgz"
  }
}
```

Then run:
```bash
npm install
```

### Configuration

#### 1. Provide API Base URL

The libraries need the API base URL. Provide it in your app configuration:

```typescript
import { API_BASE_URL } from '@lk/core';
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: API_BASE_URL,
      useValue: environment.apiUrl  // e.g., 'https://www.doctech.solutions'
    },
    // ... other providers
  ]
};
```

#### 2. Register HTTP Interceptor

```typescript
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { HttpInterceptorService } from '@lk/core';

export const appConfig: ApplicationConfig = {
  providers: [
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true
    },
    // ... other providers
  ]
};
```

### Using CoreEventService

The CoreEventService provides signal-based communication:

```typescript
import { Component, inject, computed } from '@angular/core';
import { CoreEventService } from '@lk/core';

@Component({
  selector: 'app-example',
  template: `
    <div>Current Menu: {{ menu() }}</div>
    <button (click)="setMenu('dashboard')">Open Dashboard</button>
  `
})
export class ExampleComponent {
  private eventService = inject(CoreEventService);
  
  menu = computed(() => this.eventService.menu());
  
  setMenu(menu: string) {
    this.eventService.setMenu(menu);
  }
}
```

### Using AuthService

```typescript
import { Component, inject } from '@angular/core';
import { AuthService } from '@lk/core';

@Component({
  selector: 'app-login',
  template: `...`
})
export class LoginComponent {
  private authService = inject(AuthService);
  
  login(email: string, password: string) {
    this.authService.login({ email, password })
      .subscribe({
        next: (success) => {
          if (success) {
            // Handle successful login
          }
        },
        error: (err) => {
          console.error('Login failed:', err);
        }
      });
  }
}
```

### Using Template Components

```typescript
import { TemplateModule } from '@lk/template';

@NgModule({
  imports: [TemplateModule],
  // ...
})
export class AppModule { }
```

Then use components in templates:
```html
<lk-sidebar></lk-sidebar>
<lk-header></lk-header>
```

## Available Exports

### @lk/core

- **Services**: `AuthService`, `HttpService`, `HttpUtilService`, `DataService`, `MenuService`, `ApiConfigService`
- **Guards**: `AuthGuard`, `LoginGuard`
- **Interceptors**: `HttpInterceptorService`
- **Event Service**: `CoreEventService`
- **Utils**: `CommonUtils`
- **Interfaces**: All interfaces from `src/app/interfaces/`
- **Enums**: `HttpEnum`
- **Constants**: `ChipConstant`
- **Tokens**: `API_BASE_URL`

### @lk/template

- **Module**: `TemplateModule`
- **Tools**: All components from `src/app/tools/`
- **Layout**: All components from `src/app/layout/`

## Development Workflow

1. **Make changes** to library code in `projects/common-libs/{core|template}/src/lib/`

2. **Build the library**:
   ```bash
   npm run build:core  # or build:template
   ```

3. **Package the library**:
   ```bash
   npm run pack:core  # or pack:template
   ```

4. **Update consuming app**:
   ```bash
   cd apps/main-app
   npm install
   ```

5. **Test** the consuming app to ensure everything works

## Troubleshooting

### Build Errors

- Ensure `ng-packagr` is installed: `npm install --save-dev ng-packagr`
- Check that `angular.json` has the library configurations
- Verify `tsconfig.lib.json` files are correct

### Import Errors

- Ensure libraries are built and packed before importing
- Check that `public-api.ts` exports the items you're trying to import
- Verify peer dependencies are installed in the consuming app

### Runtime Errors

- Ensure `API_BASE_URL` is provided in app configuration
- Check that all peer dependencies match versions
- Verify HTTP interceptor is registered if using `AuthService`

## Migration Notes

When migrating existing code to use the libraries:

1. Replace direct imports with library imports:
   ```typescript
   // Before
   import { AuthService } from '../services/auth.service';
   
   // After
   import { AuthService } from '@lk/core';
   ```

2. Update environment references:
   - Libraries use `ApiConfigService` instead of direct `environment` imports
   - Provide `API_BASE_URL` token in app configuration

3. Update component imports:
   ```typescript
   // Before
   import { GridComponent } from '../tools/grid/grid.component';
   
   // After
   import { GridComponent } from '@lk/template';
   ```

## Next Steps

1. Complete the migration of remaining components to use library imports
2. Update all imports across the codebase
3. Test the libraries in the main application
4. Set up CI/CD to automatically build and pack libraries

