import { Component, OnInit } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Room } from 'src/models/room.model';
import { VideoQuality } from 'src/models/videoQuality.model';
import { RoomAPIService } from './../../services/roomAPI.service';
import { ToastService } from './../../utilities-components/toast-message/toast-message.service';

@Component({
  selector: 'app-configure-room',
  templateUrl: './configure-room.component.html',
  styleUrls: ['./configure-room.component.scss'],
})
export class ConfigureRoomComponent implements OnInit {
  public roomName = '';
  public onlyOwnerCanSee = false;
  public hasPassword = false;
  public passwordInput = '';

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

  public selectedVideoQuality = this.videoOption[2];

  constructor(
    private roomAPIService: RoomAPIService,
    private dialogRef: MatDialogRef<ConfigureRoomComponent>,
    private tooltipService: ToastService
  ) {}

  ngOnInit() {}

  close() {
    this.dialogRef.close();
  }

  acceptAction() {
    if (this.roomName.length < 2) {
      this.tooltipService.show({ text: 'Room name must have at least 2 characters', type: 'warning' });
    } else if (this.hasPassword && this.passwordInput.length < 4) {
      this.tooltipService.show({ text: 'Password must have at least 4 characters', type: 'warning' });
    } else {
      const newRoom: Room = {
        owner: localStorage.getItem('username'),
        name: this.roomName,
        videoQuality: this.selectedVideoQuality,
        adminOnlyScreenSee: this.onlyOwnerCanSee,
        hasPassword: this.hasPassword,
        password: this.hasPassword ? this.passwordInput : '',
      };

      this.roomAPIService.addRoom(newRoom);
      this.dialogRef.close();
    }
  }
}
