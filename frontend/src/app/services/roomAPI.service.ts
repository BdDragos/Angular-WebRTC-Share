import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Room } from 'src/models/room.model';
import { ProgressSpinnerService } from '../utilities-components/progress-spinner/progress-spinner.service';
import { ToastService } from './../utilities-components/toast-message/toast-message.service';

@Injectable()
export class RoomAPIService {
  private roomSubject = new BehaviorSubject<Room[]>([]);

  constructor(
    private http: HttpClient,
    private loadingSpinnerService: ProgressSpinnerService,
    private toastService: ToastService,
    private tooltipService: ToastService
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

  getRoom(roomname: string) {
    return new Promise((resolve) => {
      this.loadingSpinnerService.show();
      this.http.post(environment.baseURL + '/api/getRoom', { roomname }).subscribe((response: any) => {
        this.loadingSpinnerService.close();
        if (response) {
          if (response.hasPassword) {
            resolve(true);
          } else {
            resolve(false);
          }
        } else {
          this.tooltipService.show({ text: 'No room found, creating now', type: 'info' });
          resolve(false);
        }
      });
    });
  }

  checkRoomPassword(password: string, roomname: string) {
    return new Promise((resolve) => {
      this.loadingSpinnerService.show();
      this.http.post(environment.baseURL + '/api/checkPassword', { password, roomname }).subscribe((response) => {
        this.loadingSpinnerService.close();
        if (response) {
          resolve(true);
        } else {
          resolve(false);
        }
      });
    });
  }

  deleteRoom(room: Room) {
    if (localStorage.getItem('username') === room.owner) {
      this.loadingSpinnerService.show();
      this.http
        .post(environment.baseURL + '/api/deleteRoom', { username: localStorage.getItem('username'), room: room.name })
        .subscribe(() => {
          this.loadingSpinnerService.close();
          this.toastService.show({ text: 'Room was deleted', type: 'confirmation' });
          this.getRooms();
        });
    }
  }

  addRoom(room: Room) {
    this.loadingSpinnerService.show();
    this.http.post(environment.baseURL + '/api/createRoom', room).subscribe((response) => {
      this.loadingSpinnerService.close();
      if (response) {
        this.toastService.show({ text: 'Room was created', type: 'confirmation' });
      } else {
        this.toastService.show({ text: 'A room with this name already exists', type: 'error' });
      }
    });
  }
}
