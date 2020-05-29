import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { CommunicationService } from 'src/app/services/communication.service';

@Component({
  selector: 'app-configure-room',
  templateUrl: './configure-room.component.html',
  styleUrls: ['./configure-room.component.scss'],
})
export class ConfigureRoomComponent implements OnInit {
  public roomName = '';

  constructor(private communicationService: CommunicationService, private dialogRef: MatDialogRef<ConfigureRoomComponent>) {}

  ngOnInit() {}

  close() {
    this.dialogRef.close();
  }

  acceptAction() {
    this.dialogRef.close(this.roomName);
  }

  createRoom() {
    this.communicationService.createNewRoom(null);
  }
}
