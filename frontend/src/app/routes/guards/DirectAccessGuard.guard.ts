import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';

@Injectable()
export class DirectAccessGuard implements CanActivate {
  constructor(private router: Router) {}

  canActivate(): boolean {
    // If the previous URL was blank, then the user is directly accessing this page
    if (this.router.url === '/') {
      this.router.navigate(['/qualityDashboard'], { queryParamsHandling: 'merge' }); // Navigate away to some other page
      return false;
    }
    return true;
  }
}
