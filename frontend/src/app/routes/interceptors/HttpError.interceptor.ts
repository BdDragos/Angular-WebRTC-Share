import { ToastService } from './../../utilities-components/toast-message/toast-message.service';
import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { ProgressSpinnerService } from 'src/app/utilities-components/progress-spinner/progress-spinner.service';

@Injectable()
export class HttpErrorInterceptor implements HttpInterceptor {
  constructor(private loadingSpinnerService: ProgressSpinnerService, private toastService: ToastService) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = '';
        let displayedMessage = '';
        if (error.error instanceof ErrorEvent) {
          // client-side error
          errorMessage = `Error: ${error.error.message}`;
          displayedMessage = 'Request to server failed - Client-side';
        } else {
          // server-side error
          errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
          displayedMessage = 'Request to server failed - Code ' + error.status;
        }
        this.loadingSpinnerService.closeAll();
        this.toastService.show({ text: displayedMessage, type: 'error' });
        return throwError(errorMessage);
      })
    );
  }
}
