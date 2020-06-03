import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RoomAPIService } from 'src/app/services/roomAPI.service';
import { MatDialogRef } from '@angular/material/dialog';
import { Room } from 'src/models/room.model';

@Component({
  selector: 'app-room-list',
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss'],
})
export class RoomListComponent implements OnInit, OnDestroy {
  private subscriptionArray: Subscription[] = [];

  public roomList: Room[] = [];
  public currentUser = localStorage.getItem('username');

  constructor(
    private roomAPIService: RoomAPIService,
    private dialogRef: MatDialogRef<RoomListComponent>,
    private router: Router
  ) {}

  ngOnInit() {
    this.roomAPIService.getRooms();

    this.subscriptionArray.push(
      this.roomAPIService.getRoomSubject().subscribe((response) => {
        this.roomList = Array.from(response);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptionArray.forEach((e) => e.unsubscribe());
  }

  close() {
    this.dialogRef.close();
  }

  deleteRoom(room: Room) {
    this.roomAPIService.deleteRoom(room);
  }

  selectedARoom(room: Room) {
    this.router.navigate(['main/privateRoom']);
    this.dialogRef.close();
  }
}
