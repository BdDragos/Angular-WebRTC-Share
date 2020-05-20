import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MainTabComponent } from '../main-screen/main-tab/main-tab.component';
import { HttpErrorInterceptor } from '../routes/interceptors/HttpError.interceptor';
import { MainScreenRouting } from '../routes/mainScreen.routing';
import { ConfigureRoomComponent } from './../main-screen/configure-room/configure-room.component';
import { MainRoomScreenComponent } from './../main-screen/main-room-screen/main-room-screen.component';
import { UserConfigComponent } from './../main-screen/user-config/user-config.component';

@NgModule({
  imports: [MainScreenRouting],
  declarations: [MainTabComponent, UserConfigComponent, MainRoomScreenComponent, ConfigureRoomComponent],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }],
})
export class MainScreenModule {}
