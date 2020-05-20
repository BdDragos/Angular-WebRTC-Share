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
  public error: string;

  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit() {}

  public submit() {
    this.auth
      .login(this.username, this.password)
      .pipe(first())
      .subscribe(
        (result) => this.router.navigate(['todos']),
        (err) => (this.error = 'Could not authenticate')
      );
  }
}
