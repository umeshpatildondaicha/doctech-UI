import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';

// AG Grid v34+ requires module registration for features like pagination, filtering, row API, etc.
// Register modules BEFORE bootstrapping so grids initialize without runtime errors.
ModuleRegistry.registerModules([AllCommunityModule]);

bootstrapApplication(AppComponent, appConfig).catch((err) => console.error(err));
