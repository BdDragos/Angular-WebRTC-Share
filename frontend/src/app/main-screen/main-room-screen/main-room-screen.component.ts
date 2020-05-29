import { Component, OnInit } from '@angular/core';
import { MatDialogConfig, MatDialog } from '@angular/material/dialog';
import { ConfigureRoomComponent } from '../configure-room/configure-room.component';

@Component({
  selector: 'app-main-room-screen',
  templateUrl: './main-room-screen.component.html',
  styleUrls: ['./main-room-screen.component.scss'],
})
export class MainRoomScreenComponent implements OnInit {
  constructor(public dialog: MatDialog) {}

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

  openEnterRoomDialog() {}
}
