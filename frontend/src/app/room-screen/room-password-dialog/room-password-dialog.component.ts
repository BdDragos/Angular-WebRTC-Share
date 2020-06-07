import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ToastService } from 'src/app/utilities-components/toast-message/toast-message.service';
import { RoomAPIService } from './../../services/roomAPI.service';
import { ProgressSpinnerService } from './../../utilities-components/progress-spinner/progress-spinner.service';

@Component({
  selector: 'app-room-password-dialog',
  templateUrl: './room-password-dialog.component.html',
  styleUrls: ['./room-password-dialog.component.scss'],
})
export class RoomPasswordDialogComponent implements OnInit {
  public password = '';

  constructor(
    private dialogRef: MatDialogRef<RoomPasswordDialogComponent>,
    private tooltipService: ToastService,
    private loadingSpinnerService: ProgressSpinnerService,
    private roomAPIService: RoomAPIService,
    private router: Router,
    @Inject(MAT_DIALOG_DATA) private data: any
  ) {
    if (this.data && this.data.roomname) {
      this.loadingSpinnerService.show();
      this.roomAPIService.getRoom(this.data.roomname).then((response: boolean) => {
        this.loadingSpinnerService.close();
        if (response === false) {
          this.dialogRef.close(true);
        }
      });
    } else {
      this.dialogRef.close(false);
    }
  }

  ngOnInit(): void {}

  acceptAction() {
    this.roomAPIService.checkRoomPassword(this.password, this.data.roomname).then((response) => {
      if (response === true) {
        this.dialogRef.close(true);
      } else if (response === false) {
        this.tooltipService.show({ text: 'Wrong room password', type: 'error' });
      } else if (response === '') {
        this.tooltipService.show({ text: 'Room does not exist anymore', type: 'error' });
      }
    });
  }

  close() {
    this.router.navigate(['/main']);
    this.dialogRef.close(false);
  }
}
