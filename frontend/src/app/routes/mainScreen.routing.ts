import { RoomComponent } from './../room-screen/room/room.component';
import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainRoomScreenComponent } from '../main-screen/main-room-screen/main-room-screen.component';

const routes: Routes = [
  {
    path: '',
    component: MainRoomScreenComponent,
  },
  {
    path: 'privateRoom',
    component: RoomComponent,
  },
];

export const MainScreenRouting: ModuleWithProviders = RouterModule.forChild(routes);
