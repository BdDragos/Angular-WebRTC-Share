import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainTabComponent } from './../main-screen/main-tab/main-tab.component';

const routes: Routes = [
  {
    path: '',
    component: MainTabComponent,
  },
];

export const MainScreenRouting: ModuleWithProviders = RouterModule.forChild(routes);
