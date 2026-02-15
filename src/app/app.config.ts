import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptorsFromDi, HTTP_INTERCEPTORS } from '@angular/common/http';

import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MatNativeDateModule } from '@angular/material/core';
import { HttpInterceptorService, API_BASE_URL, MenuService } from '@lk/core';
import { environment } from '../environments/environment';
import { MenuService as AppMenuService } from './services/menu.service';
import { provideLottieOptions } from 'ngx-lottie';
import lottiePlayer from 'lottie-web';

export const appConfig: ApplicationConfig = {
  providers: [
    provideLottieOptions({
      player: () => lottiePlayer,
    }),
    { provide: MenuService, useClass: AppMenuService },
    provideRouter(routes),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(MatNativeDateModule),
    // Provide API_BASE_URL for @lk/core services
    {
      provide: API_BASE_URL,
      useValue: environment.apiUrl
    },
    // Register HTTP interceptor from @lk/core
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true
    }
  ]
};
