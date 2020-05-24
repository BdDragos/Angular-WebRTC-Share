import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-main-room-screen',
  templateUrl: './main-room-screen.component.html',
  styleUrls: ['./main-room-screen.component.scss'],
})
export class MainRoomScreenComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  openStartPrivateConvoDialog() {}

  openCreateRoomDialog() {}

  openEnterRoomDialog() {}
}
