import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainScreenModule } from './../modules/mainScreen.module';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/moduleDashboard',
    pathMatch: 'full',
  },
  {
    path: 'moduleDashboard',
    loadChildren: () => MainScreenModule,
  },
  { path: '**', redirectTo: '/moduleDashboard' },
];

export const AppRouting: ModuleWithProviders = RouterModule.forRoot(routes);
