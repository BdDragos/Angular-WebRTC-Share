import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/services/auth.service';
import { ToastService } from './../../utilities-components/toast-message/toast-message.service';

@Component({
  selector: 'app-login-screen',
  templateUrl: './login-screen.component.html',
  styleUrls: ['./login-screen.component.scss'],
})
export class LoginScreenComponent implements OnInit {
  public username: string;
  public password: string;

  constructor(private auth: AuthService, private router: Router, private toastService: ToastService) {}

  ngOnInit() {
    this.auth.logout();
  }

  public login() {
    this.auth.login(this.username, this.password).then((response) => {
      if (response) {
        this.toastService.show({ text: 'Login success', type: 'confirmation' });
        localStorage.setItem('username', this.username);
        this.router.navigate(['/main']);
      } else {
        this.toastService.show({ text: 'Login failed. Wrong user/pass', type: 'error' });
      }
    });
  }

  public register() {
    this.router.navigate(['/register']);
  }
}
