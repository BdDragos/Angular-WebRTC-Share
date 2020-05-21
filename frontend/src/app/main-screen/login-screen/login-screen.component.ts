import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss'],
})
export class LoginScreenComponent implements OnInit {
  public username: string;
  public password: string;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {
    this.auth.logout();
  }

  public login() {
    this.auth.login(this.username, this.password).then((response) => {
      if (response) {
        this.router.navigate(['/main']);
      } else {
        console.log('Login failed');
      }
    });
  }

  public register() {
    this.router.navigate(['/register']);
  }
}
