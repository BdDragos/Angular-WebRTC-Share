import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginScreenComponent } from '../main-screen/login-screen/login-screen.component';
import { RegisterScreenComponent } from './../main-screen/register-screen/register-screen.component';
import { MainScreenModule } from './../modules/mainScreen.module';
import { AuthGuard } from './guards/Auth.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/main',
    pathMatch: 'full',
  },
  {
    path: 'main',
    loadChildren: () => MainScreenModule,
    canLoad: [AuthGuard],
  },
  {
    path: 'login',
    component: LoginScreenComponent,
  },
  {
    path: 'register',
    component: RegisterScreenComponent,
  },
  { path: '**', redirectTo: 'main' },
];

export const AppRouting: ModuleWithProviders = RouterModule.forRoot(routes);
