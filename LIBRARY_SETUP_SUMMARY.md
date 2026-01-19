# Library Setup Summary

## ✅ Completed Tasks

### 1. Library Structure Created
- ✅ `projects/common-libs/core/` - Core library with services, guards, interceptors, utils
- ✅ `projects/common-libs/template/` - Template library with UI components and layouts
- ✅ Both libraries have proper `ng-package.json`, `package.json`, and `tsconfig.lib.json` files

### 2. CoreEventService Implemented
- ✅ Created `CoreEventService` in `@lk/core` using Angular Signals
- ✅ Provides signals for: menu, authState, breadcrumb, notification
- ✅ Includes updater methods and effect-based change listeners

### 3. Files Moved to Libraries
- ✅ **Core Library**:
  - Services (auth, http, data, menu, etc.)
  - Guards (auth, login)
  - Interceptors (http)
  - Utils (CommonUtils)
  - Interfaces (all)
  - Enums (http.enum)
  - Constants (chip.constant)

- ✅ **Template Library**:
  - Tools/components (grid, buttons, inputs, dialogs, etc.)
  - Layout components (sidebar, header, footer, etc.)

### 4. Configuration Files
- ✅ `ng-package.json` for both libraries
- ✅ `package.json` with peer dependencies
- ✅ `tsconfig.lib.json` and `tsconfig.lib.prod.json`
- ✅ `angular.json` updated with library build configurations

### 5. Build Scripts
- ✅ Added to root `package.json`:
  - `build:core` - Build core library
  - `build:template` - Build template library
  - `build:libs` - Build both libraries
  - `pack:core` - Package core as .tgz
  - `pack:template` - Package template as .tgz
  - `prepare:libs` - Build and pack both libraries

### 6. Documentation
- ✅ `README_LIBRARIES.md` - Comprehensive library documentation
- ✅ `MIGRATION_GUIDE.md` - Step-by-step migration instructions
- ✅ Library-specific READMEs in each library folder
- ✅ Example usage files in `apps/main-app/`

### 7. API Configuration
- ✅ Created `ApiConfigService` to replace direct environment imports
- ✅ Updated all services to use `ApiConfigService`
- ✅ Created `API_BASE_URL` injection token

## 📋 Remaining Tasks

### 1. Update Imports in Main App
The main application still uses old import paths. Need to update:
- Service imports → `@lk/core`
- Component imports → `@lk/template`
- Replace `CustomEventsService` with `CoreEventService`

**Location**: All files in `src/app/`

### 2. Update Template Library Components
Template library components need to import from `@lk/core` instead of relative paths:
- Update imports in `projects/common-libs/template/src/lib/layout/`
- Update imports in `projects/common-libs/template/src/lib/tools/`

**Example**:
```typescript
// Change from:
import { AuthService } from '../../services/auth.service';

// To:
import { AuthService } from '@lk/core';
```

### 3. Install ng-packagr
```bash
npm install --save-dev ng-packagr
```

### 4. Build and Test
```bash
# Build libraries
npm run prepare:libs

# Install in main app (if using main-app)
cd apps/main-app
npm install

# Test the application
npm start
```

## 📁 File Structure

```
doctech-angular/
├── projects/
│   └── common-libs/
│       ├── core/
│       │   ├── src/
│       │   │   ├── lib/
│       │   │   │   ├── core-event.service.ts ✅
│       │   │   │   ├── services/ ✅
│       │   │   │   ├── guards/ ✅
│       │   │   │   ├── interceptors/ ✅
│       │   │   │   ├── utils/ ✅
│       │   │   │   ├── interfaces/ ✅
│       │   │   │   ├── enums/ ✅
│       │   │   │   └── constants/ ✅
│       │   │   └── public-api.ts ✅
│       │   ├── ng-package.json ✅
│       │   └── package.json ✅
│       └── template/
│           ├── src/
│           │   ├── lib/
│           │   │   ├── template.module.ts ✅
│           │   │   ├── tools/ ✅
│           │   │   └── layout/ ✅
│           │   └── public-api.ts ✅
│           ├── ng-package.json ✅
│           └── package.json ✅
├── common-libs-archives/ (created after build)
│   ├── core.tgz
│   └── template.tgz
├── apps/
│   └── main-app/ ✅ (example structure)
├── angular.json ✅ (updated)
├── package.json ✅ (updated with scripts)
├── README_LIBRARIES.md ✅
└── MIGRATION_GUIDE.md ✅
```

## 🚀 Quick Start

1. **Install ng-packagr**:
   ```bash
   npm install --save-dev ng-packagr
   ```

2. **Build and pack libraries**:
   ```bash
   npm run prepare:libs
   ```

3. **Update main app package.json**:
   ```json
   {
     "dependencies": {
       "@lk/core": "file:common-libs-archives/core.tgz",
       "@lk/template": "file:common-libs-archives/template.tgz"
     }
   }
   ```

4. **Install dependencies**:
   ```bash
   npm install
   ```

5. **Update app.config.ts**:
   ```typescript
   import { API_BASE_URL } from '@lk/core';
   
   providers: [
     { provide: API_BASE_URL, useValue: environment.apiUrl }
   ]
   ```

6. **Update imports** (see MIGRATION_GUIDE.md)

7. **Test**:
   ```bash
   npm start
   ```

## 🔑 Key Features

### CoreEventService (Signal-based)
- ✅ Menu state management
- ✅ Auth state management
- ✅ Breadcrumb management
- ✅ Notification management
- ✅ Effect-based change listeners

### ApiConfigService
- ✅ Replaces direct environment imports
- ✅ Uses dependency injection
- ✅ Configurable via `API_BASE_URL` token

### Library Structure
- ✅ Proper peer dependencies
- ✅ Public API exports
- ✅ Build configurations
- ✅ TypeScript configurations

## 📝 Notes

1. **Environment Variables**: Libraries no longer directly import environment files. The consuming app must provide `API_BASE_URL`.

2. **Signal Migration**: The old `CustomEventsService` (EventEmitter-based) should be replaced with `CoreEventService` (Signal-based).

3. **Import Updates**: All imports in the main app need to be updated to use `@lk/core` and `@lk/template`.

4. **Template Library Dependencies**: Template library components that use core services need to import from `@lk/core` (not relative paths).

5. **Build Order**: Always build `core` before `template` since template depends on core.

## 🐛 Known Issues

1. **npm permissions**: If you encounter npm permission errors, run:
   ```bash
   sudo chown -R $(whoami) ~/.npm
   ```

2. **Circular Dependencies**: Ensure template library only imports from `@lk/core`, never from local paths that might create circles.

3. **Peer Dependencies**: Make sure Angular versions match between libraries and main app.

## 📚 Documentation Files

- `README_LIBRARIES.md` - Complete library documentation
- `MIGRATION_GUIDE.md` - Step-by-step migration guide
- `projects/common-libs/core/README.md` - Core library docs
- `projects/common-libs/template/README.md` - Template library docs
- `apps/main-app/src/app/example-usage.md` - Usage examples

## ✅ Next Steps

1. Install ng-packagr
2. Build libraries
3. Update main app imports
4. Update template library component imports
5. Test the application
6. Remove old files (after confirming everything works)

