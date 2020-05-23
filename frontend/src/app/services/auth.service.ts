import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { environment } from './../../environments/environment';
import { ProgressSpinnerService } from './../utilities-components/progress-spinner/progress-spinner.service';

@Injectable()
export class AuthService {
  constructor(private http: HttpClient, private loadingSpinnerService: ProgressSpinnerService, private router: Router) {}

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
          resolve(false);
        }
      );
    });
  }

  logout() {
    localStorage.removeItem('access_token');
    this.router.navigate(['/login']);
  }

  public get loggedIn(): boolean {
    return localStorage.getItem('access_token') !== null;
  }
}
