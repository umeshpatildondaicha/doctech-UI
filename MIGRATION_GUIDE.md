# Migration Guide: Converting to Library-Based Architecture

This guide helps you migrate the existing application to use the new `@lk/core` and `@lk/template` libraries.

## Step 1: Build and Pack Libraries

First, ensure the libraries are built and packed:

```bash
npm run prepare:libs
```

This creates:
- `common-libs-archives/core.tgz`
- `common-libs-archives/template.tgz`

## Step 2: Update package.json

Add the library dependencies to your main app's `package.json`:

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

## Step 3: Update App Configuration

Update `src/app/app.config.ts` to provide `API_BASE_URL`:

```typescript
import { API_BASE_URL } from '@lk/core';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    // ... existing providers
    {
      provide: API_BASE_URL,
      useValue: environment.apiUrl
    }
  ]
};
```

## Step 4: Update Imports

### Core Library Imports

Replace imports from local paths with `@lk/core`:

#### Services
```typescript
// Before
import { AuthService } from './services/auth.service';
import { HttpService } from './services/http.service';
import { MenuService } from './services/menu.service';

// After
import { AuthService, HttpService, MenuService } from '@lk/core';
```

#### Guards
```typescript
// Before
import { AuthGuard } from './guards/auth.guard';

// After
import { AuthGuard } from '@lk/core';
```

#### Interceptors
```typescript
// Before
import { HttpInterceptorService } from './interceptors/http.interceptor';

// After
import { HttpInterceptorService } from '@lk/core';
```

#### Utils
```typescript
// Before
import { CommonUtils } from './utils/CommonUtils';

// After
import { CommonUtils } from '@lk/core';
```

#### Interfaces
```typescript
// Before
import { UserInfo } from './interfaces/auth.interface';
import { Patient } from './interfaces/patient.interface';

// After
import { UserInfo, Patient } from '@lk/core';
```

#### CoreEventService
```typescript
// Before
import { CustomEventsService } from './services/custom-events.service';

// After
import { CoreEventService } from '@lk/core';
```

### Template Library Imports

Replace imports from local paths with `@lk/template`:

#### Tools/Components
```typescript
// Before
import { GridComponent } from './tools/grid/grid.component';
import { AppButtonComponent } from './tools/app-button/app-button.component';

// After
import { GridComponent, AppButtonComponent } from '@lk/template';
```

#### Layout Components
```typescript
// Before
import { SidebarComponent } from './layout/sidebar/sidebar.component';
import { HeaderComponent } from './layout/header/header.component';

// After
import { SidebarComponent, HeaderComponent } from '@lk/template';
```

#### Template Module
```typescript
// Before
// No module import needed if using standalone components

// After
import { TemplateModule } from '@lk/template';
```

## Step 5: Update CustomEventsService Usage

Replace `CustomEventsService` with `CoreEventService`:

### Before (EventEmitter-based)
```typescript
import { CustomEventsService } from './services/custom-events.service';

constructor(private events: CustomEventsService) {}

emitBreadcrumb(data: any) {
  this.events.breadcrumbEvent.emit(data);
}
```

### After (Signal-based)
```typescript
import { CoreEventService } from '@lk/core';
import { computed } from '@angular/core';

constructor(private eventService: CoreEventService) {}

// Read breadcrumb
breadcrumb = computed(() => this.eventService.breadcrumb());

// Set breadcrumb
setBreadcrumb(label: string, icon?: string) {
  this.eventService.setBreadcrumb({ label, icon });
}
```

## Step 6: Update Components Using Signals

Components that need to react to events should use computed signals:

```typescript
import { Component, inject, computed } from '@angular/core';
import { CoreEventService } from '@lk/core';

@Component({
  selector: 'app-example',
  template: `
    <div>Menu: {{ menu() }}</div>
    <div>Breadcrumb: {{ breadcrumb()?.label }}</div>
  `
})
export class ExampleComponent {
  private eventService = inject(CoreEventService);
  
  menu = computed(() => this.eventService.menu());
  breadcrumb = computed(() => this.eventService.breadcrumb());
}
```

## Step 7: Update Template Components

If template components use services from core, ensure they import from `@lk/core`:

```typescript
// In template library components
import { CoreEventService } from '@lk/core';
// NOT from relative paths
```

## Step 8: Test the Migration

1. Build the application:
   ```bash
   npm run build
   ```

2. Run the application:
   ```bash
   npm start
   ```

3. Test key functionality:
   - Authentication flow
   - Navigation
   - Event communication
   - API calls

## Common Issues and Solutions

### Issue: "Cannot find module '@lk/core'"

**Solution**: 
- Ensure libraries are built: `npm run build:libs`
- Ensure libraries are packed: `npm run pack:core && npm run pack:template`
- Reinstall dependencies: `npm install`

### Issue: "API_BASE_URL not provided"

**Solution**: 
- Add `API_BASE_URL` provider in `app.config.ts`:
  ```typescript
  {
    provide: API_BASE_URL,
    useValue: environment.apiUrl
  }
  ```

### Issue: "Circular dependency detected"

**Solution**: 
- Ensure template library only imports from `@lk/core`, not from local paths
- Check that core library doesn't import from template

### Issue: "Component not found"

**Solution**: 
- Ensure component is exported in `public-api.ts`
- Ensure `TemplateModule` is imported if using module-based approach
- Check component selector matches usage

## Automated Migration Script

You can use find-and-replace to automate some migrations:

```bash
# Replace service imports
find src -name "*.ts" -type f -exec sed -i '' 's|from.*services/auth\.service|from "@lk/core"|g' {} \;

# Replace guard imports
find src -name "*.ts" -type f -exec sed -i '' 's|from.*guards/auth\.guard|from "@lk/core"|g' {} \;
```

**Note**: Always review automated changes before committing.

## Verification Checklist

- [ ] Libraries built and packed successfully
- [ ] `package.json` updated with library dependencies
- [ ] `npm install` completed without errors
- [ ] `API_BASE_URL` provided in app configuration
- [ ] All service imports updated to `@lk/core`
- [ ] All component imports updated to `@lk/template`
- [ ] `CustomEventsService` replaced with `CoreEventService`
- [ ] Signal-based code updated where needed
- [ ] Application builds without errors
- [ ] Application runs and key features work
- [ ] Tests pass (if applicable)

## Next Steps

After migration:
1. Remove old service/component files (they're now in libraries)
2. Update CI/CD pipelines to build libraries first
3. Document library versioning strategy
4. Set up automated testing for libraries

