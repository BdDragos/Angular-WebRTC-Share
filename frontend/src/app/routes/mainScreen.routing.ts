import { ModuleWithProviders } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainRoomScreenComponent } from '../main-screen/main-room-screen/main-room-screen.component';
import { RoomComponent } from './../room-screen/room/room.component';
import { RoomPasswordGuard } from './guards/RoomPassword.guard';

const routes: Routes = [
  {
    path: '',
    component: MainRoomScreenComponent,
  },
  {
    path: 'privateRoom/:roomname',
    component: RoomComponent,
    canActivate: [RoomPasswordGuard],
  },
];

export const MainScreenRouting: ModuleWithProviders = RouterModule.forChild(routes);
