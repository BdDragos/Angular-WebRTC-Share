import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';

@Injectable()
export class AuthService {
  constructor(private http: HttpClient) {}

  login(username: string, password: string) {
    return new Promise((resolve) => {
      this.http.post(environment.baseURL + '/api/auth', { username, password }).subscribe(
        (response: any) => {
          localStorage.setItem('access_token', response.token);
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
  }

  public get loggedIn(): boolean {
    return localStorage.getItem('access_token') !== null;
  }
}
