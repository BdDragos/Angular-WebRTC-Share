import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainRoomScreenComponent } from '../main-screen/main-room-screen/main-room-screen.component';
import { ConfigureRoomComponent } from '../main-screen/configure-room/configure-room.component';

const routes: Routes = [
  {
    path: '',
    component: MainRoomScreenComponent,
  },
  {
    path: 'create-room',
    component: ConfigureRoomComponent,
  },
];

export const MainScreenRouting: ModuleWithProviders = RouterModule.forChild(routes);
