import { ToastService } from './../../utilities-components/toast-message/toast-message.service';
import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register-screen',
  templateUrl: './register-screen.component.html',
  styleUrls: ['./register-screen.component.scss'],
})
export class RegisterScreenComponent implements OnInit {
  public username: string;
  public password: string;
  public repeatPassword: string;

  constructor(private auth: AuthService, private router: Router, private toastService: ToastService) {}

  ngOnInit() {}

  public register() {
    if (this.password === this.repeatPassword) {
      this.auth.register({ username: this.username, password: this.password }).then((response) => {
        if (response) {
          this.router.navigate(['/login']);
        }
      });
    } else {
      this.toastService.show({ text: 'The inputted passwords differ from each other', type: 'warning' });
    }
  }
}
