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

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {}

  public register() {
    if (this.password === this.repeatPassword) {
      console.log('REGISTER DONE');
    } else {
      console.log('WRONG PASSWORD INPUT');
    }
  }
}
