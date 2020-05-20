import { Injectable } from '@angular/core';
import { CanLoad, Route, Router } from '@angular/router';

@Injectable()
export class AuthGuard implements CanLoad {
  constructor(private router: Router) {}

  canLoad(route: Route) {
    if (localStorage.getItem('access_token')) {
      console.log('Token found');
      return true;
    } else {
      console.log('No authorization found');
      this.router.navigate(['/login']);
      return false;
    }
  }
}
