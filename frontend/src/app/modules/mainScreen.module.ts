import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { LoginScreenComponent } from '../main-screen/login-screen/login-screen.component';
import { MainTabComponent } from '../main-screen/main-tab/main-tab.component';
import { HttpErrorInterceptor } from '../routes/interceptors/HttpError.interceptor';
import { MainScreenRouting } from '../routes/mainScreen.routing';
import { AuthService } from '../services/auth.service';
import { ConfigureRoomComponent } from './../main-screen/configure-room/configure-room.component';
import { MainRoomScreenComponent } from './../main-screen/main-room-screen/main-room-screen.component';
import { UserConfigComponent } from './../main-screen/user-config/user-config.component';

@NgModule({
  imports: [MainScreenRouting, CommonModule, FormsModule, TranslateModule],
  declarations: [MainTabComponent, LoginScreenComponent, UserConfigComponent, MainRoomScreenComponent, ConfigureRoomComponent],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }, AuthService],
  exports: [],
})
export class MainScreenModule {}
