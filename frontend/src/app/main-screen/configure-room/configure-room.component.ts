import { Component, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { CommunicationService } from 'src/app/services/communication.service';

@Component({
  selector: 'app-configure-room',
  templateUrl: './configure-room.component.html',
  styleUrls: ['./configure-room.component.scss'],
})
export class ConfigureRoomComponent implements OnInit {
  public form: FormGroup;

  constructor(private communicationService: CommunicationService) {}

  ngOnInit() {}

  createRoom() {
    this.communicationService.createNewRoom(null);
  }
}
