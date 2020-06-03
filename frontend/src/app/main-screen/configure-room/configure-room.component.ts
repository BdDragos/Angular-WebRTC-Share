import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { RoomAPIService } from './../../services/roomAPI.service';

@Component({
  selector: 'app-configure-room',
  templateUrl: './configure-room.component.html',
  styleUrls: ['./configure-room.component.scss'],
})
export class ConfigureRoomComponent implements OnInit {
  public roomName = '';

  constructor(private roomAPIService: RoomAPIService, private dialogRef: MatDialogRef<ConfigureRoomComponent>) {}

  ngOnInit() {}

  close() {
    this.dialogRef.close();
  }

  acceptAction() {
    this.roomAPIService.addRoom(this.roomName);
    this.dialogRef.close();
  }
}
