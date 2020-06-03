import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
import { CommunicationService } from 'src/app/services/communication.service';
import { MainTabComponent } from '../main-screen/main-tab/main-tab.component';
import { RoomListComponent } from '../main-screen/room-list/room-list.component';
import { RoomComponent } from '../room-screen/room/room.component';
import { HttpErrorInterceptor } from '../routes/interceptors/HttpError.interceptor';
import { MainScreenRouting } from '../routes/mainScreen.routing';
import { RoomAPIService } from '../services/roomAPI.service';
import { ConfigureRoomComponent } from './../main-screen/configure-room/configure-room.component';
import { MainRoomScreenComponent } from './../main-screen/main-room-screen/main-room-screen.component';
import { UserConfigComponent } from './../main-screen/user-config/user-config.component';

@NgModule({
  imports: [MainScreenRouting, MatDialogModule, FormsModule, CommonModule],
  declarations: [
    MainTabComponent,
    UserConfigComponent,
    MainRoomScreenComponent,
    ConfigureRoomComponent,
    RoomComponent,
    RoomListComponent,
  ],
  providers: [CommunicationService, RoomAPIService, { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }],
})
export class MainScreenModule {}
