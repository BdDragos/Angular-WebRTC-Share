import { ToastService } from './../utilities-components/toast-message/toast-message.service';
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Room } from 'src/models/room.model';
import { ProgressSpinnerService } from '../utilities-components/progress-spinner/progress-spinner.service';

@Injectable()
export class RoomAPIService {
  private roomSubject = new BehaviorSubject<Room[]>([]);

  constructor(
    private http: HttpClient,
    private loadingSpinnerService: ProgressSpinnerService,
    private toastService: ToastService
  ) {}

  getRoomSubject() {
    return this.roomSubject.asObservable();
  }

  getRooms() {
    this.loadingSpinnerService.show();
    this.http.get(environment.baseURL + '/api/getRooms').subscribe((response: any) => {
      this.roomSubject.next(response);
      this.loadingSpinnerService.close();
    });
  }

  deleteRoom(room: Room) {
    if (localStorage.getItem('username') === room.owner) {
      this.loadingSpinnerService.show();
      this.http
        .post(environment.baseURL + '/api/deleteRoom', { username: localStorage.getItem('username'), room: room.name })
        .subscribe(() => {
          this.toastService.show({ text: 'Room was deleted', type: 'confirmation' });
          this.getRooms();
          this.loadingSpinnerService.close();
        });
    }
  }

  addRoom(room: Room) {
    this.loadingSpinnerService.show();

    this.http.post(environment.baseURL + '/api/createRoom', room).subscribe(() => {
      this.toastService.show({ text: 'Room was created', type: 'confirmation' });
      this.loadingSpinnerService.close();
    });
  }
}
