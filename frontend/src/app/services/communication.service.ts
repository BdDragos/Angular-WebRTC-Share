import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Room } from 'src/models/room';
import { ProgressSpinnerService } from './../utilities-components/progress-spinner/progress-spinner.service';

@Injectable()
export class CommunicationService {
  private roomListSubject = new Subject<Room[]>();

  constructor(private http: HttpClient, private loadingSpinnerService: ProgressSpinnerService) {}

  getRoomListSubject() {
    return this.roomListSubject.asObservable();
  }

  createNewRoom(newRoom: Room) {}

  getAllRooms() {}
}
