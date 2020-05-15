import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { MainTabComponent } from '../main-screen/main-tab/main-tab.component';
import { HttpErrorInterceptor } from '../routes/interceptors/HttpError.interceptor';
import { MainScreenRouting } from '../routes/mainScreen.routing';

@NgModule({
  imports: [MainScreenRouting, CommonModule, FormsModule, TranslateModule],
  declarations: [MainTabComponent],
  providers: [{ provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true }],
  exports: [],
})
export class MainScreenModule {}
