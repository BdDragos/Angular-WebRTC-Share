import { OverlayModule } from '@angular/cdk/overlay';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AppComponent } from '../global-component/app.component';
import { LoginScreenComponent } from '../main-screen/login-screen/login-screen.component';
import { RegisterScreenComponent } from '../main-screen/register-screen/register-screen.component';
import { AppRouting } from '../routes/app-routing.routing';
import { AuthGuard } from '../routes/guards/Auth.guard';
import { DirectAccessGuard } from '../routes/guards/DirectAccessGuard.guard';
import { HttpErrorInterceptor } from '../routes/interceptors/HttpError.interceptor';
import { AuthService } from '../services/auth.service';
import { TranslationMainService } from '../services/translationMain.service';
import { ProgressSpinnerService } from '../utilities-components/progress-spinner/progress-spinner.service';
import { ProgressSpinnerComponent } from './../utilities-components/progress-spinner/progress-spinner.component';
import { ToastComponent } from './../utilities-components/toast-message/toast-message.component';
import { ToastService } from './../utilities-components/toast-message/toast-message.service';

@NgModule({
  declarations: [AppComponent, LoginScreenComponent, RegisterScreenComponent, ProgressSpinnerComponent, ToastComponent],
  imports: [
    AppRouting,
    BrowserModule,
    OverlayModule,
    HttpClientModule,
    CommonModule,
    FormsModule,
    TranslateModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [
    DirectAccessGuard,
    AuthGuard,
    AuthService,
    ProgressSpinnerService,
    ToastService,
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ],
  exports: [TranslateModule],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslationMainService(http);
}
