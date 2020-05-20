import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserModule } from '@angular/platform-browser';
import { TranslateLoader, TranslateModule } from '@ngx-translate/core';
import { AppComponent } from '../global-component/app.component';
import { LoginScreenComponent } from '../main-screen/login-screen/login-screen.component';
import { AppRouting } from '../routes/app-routing.routing';
import { AuthGuard } from '../routes/guards/Auth.guard';
import { DirectAccessGuard } from '../routes/guards/DirectAccessGuard.guard';
import { HttpErrorInterceptor } from '../routes/interceptors/HttpError.interceptor';
import { AuthService } from '../services/auth.service';
import { TranslationMainService } from '../services/translationMain.service';
import { RegisterScreenComponent } from '../main-screen/register-screen/register-screen.component';

@NgModule({
  declarations: [AppComponent, LoginScreenComponent, RegisterScreenComponent],
  imports: [
    AppRouting,
    BrowserModule,
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
    { provide: HTTP_INTERCEPTORS, useClass: HttpErrorInterceptor, multi: true },
  ],
  exports: [TranslateModule],
  bootstrap: [AppComponent],
})
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslationMainService(http);
}
