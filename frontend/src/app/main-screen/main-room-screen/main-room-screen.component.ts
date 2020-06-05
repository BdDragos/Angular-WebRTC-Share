import { RoomListComponent } from './../room-list/room-list.component';
import { Component, OnInit } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ConfigureRoomComponent } from '../configure-room/configure-room.component';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-main-room-screen',
  templateUrl: './main-room-screen.component.html',
  styleUrls: ['./main-room-screen.component.scss'],
})
export class MainRoomScreenComponent implements OnInit {
  constructor(public authenticationService: AuthService, public dialog: MatDialog, private router: Router) {}

  ngOnInit(): void {}

  openStartPrivateConvoDialog() {}

  openCreateRoomDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.panelClass = 'user-dialog-style';
    const dialogRef = this.dialog.open(ConfigureRoomComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }

  openEnterRoomDialog() {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.panelClass = 'user-dialog-style';
    const dialogRef = this.dialog.open(RoomListComponent, dialogConfig);
    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
      }
    });
  }

  logout() {
    this.authenticationService.logout();
  }
}
