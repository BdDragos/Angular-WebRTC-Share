import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../utilities-components/toast-message/toast-message.service';
import { environment } from './../../environments/environment';
import { ProgressSpinnerService } from './../utilities-components/progress-spinner/progress-spinner.service';

@Injectable()
export class AuthService {
  constructor(
    private http: HttpClient,
    private toastService: ToastService,
    private loadingSpinnerService: ProgressSpinnerService,
    private router: Router
  ) {}

  login(username: string, password: string) {
    return new Promise((resolve) => {
      this.loadingSpinnerService.show();
      this.http.post(environment.baseURL + '/api/auth', { username, password }).subscribe(
        (response: any) => {
          localStorage.setItem('access_token', response.token);
          this.loadingSpinnerService.close();
          resolve(true);
        },
        (error) => {
          this.loadingSpinnerService.close();
          resolve(false);
        }
      );
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  register(newUser: any) {
    return new Promise((resolve) => {
      this.loadingSpinnerService.show();
      this.http.post(environment.baseURL + '/api/register', newUser).subscribe(
        (response: any) => {
          this.loadingSpinnerService.close();
          if (response) {
            this.toastService.show({ text: 'Registration done', type: 'confirmation' });
            resolve(true);
          } else {
            this.toastService.show({ text: 'Username is already taken', type: 'error' });
            resolve(false);
          }
        },
        (error) => {
          this.loadingSpinnerService.close();
          resolve(false);
        }
      );
    });
  }

  public get loggedIn(): boolean {
    return localStorage.getItem('access_token') !== null;
  }
}
