import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Room } from 'src/models/room.model';
import { VideoQuality } from 'src/models/videoQuality.model';
import { RoomAPIService } from './../../services/roomAPI.service';

@Component({
  selector: 'app-configure-room',
  templateUrl: './configure-room.component.html',
  styleUrls: ['./configure-room.component.scss'],
})
export class ConfigureRoomComponent implements OnInit {
  public roomName = '';
  public onlyOwnerCanSee = false;

  public videoOption: VideoQuality[] = [
    {
      name: 'QVGA',
      video: { minFrameRate: 30, width: { exact: 320 }, height: { exact: 240 } },
    },
    {
      name: 'VGA',
      video: { minFrameRate: 30, width: { exact: 640 }, height: { exact: 480 } },
    },
    {
      name: 'HD',
      video: { minFrameRate: 30, width: { exact: 1280 }, height: { exact: 720 } },
    },
    {
      name: 'FHD',
      video: { minFrameRate: 30, width: { exact: 1920 }, height: { exact: 1080 } },
    },
  ];

  public selectedVideoQuality = this.videoOption[1];

  constructor(private roomAPIService: RoomAPIService, private dialogRef: MatDialogRef<ConfigureRoomComponent>) {}

  ngOnInit() {}

  close() {
    this.dialogRef.close();
  }

  acceptAction() {
    const newRoom: Room = {
      owner: localStorage.getItem('username'),
      name: this.roomName,
      videoQuality: this.selectedVideoQuality,
      adminOnlyScreenSee: this.onlyOwnerCanSee,
    };

    this.roomAPIService.addRoom(newRoom);
    this.dialogRef.close();
  }
}
