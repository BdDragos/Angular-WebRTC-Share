import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatDialogModule } from '@angular/material/dialog';
import { CommunicationService } from 'src/app/services/communication.service';
import { MainTabComponent } from '../main-screen/main-tab/main-tab.component';
import { HttpErrorInterceptor } from '../routes/interceptors/HttpError.interceptor';
import { MainScreenRouting } from '../routes/mainScreen.routing';
import { ConfigureRoomComponent } from './../main-screen/configure-room/configure-room.component';
import { MainRoomScreenComponent } from './../main-screen/main-room-screen/main-room-screen.component';
import { UserConfigComponent } from './../main-screen/user-config/user-config.component';
import { FormsModule } from '@angular/forms';

@NgModule({
  imports: [MainScreenRouting, MatDialogModule, FormsModule],
  declarations: [MainTabComponent, UserConfigComponent, MainRoomScreenComponent, ConfigureRoomComponent],
  providers: [CommunicationService, { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }],
})
export class MainScreenModule {}
