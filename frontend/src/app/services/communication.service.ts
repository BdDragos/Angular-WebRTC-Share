import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';

@Injectable()
export class CommunicationService {
  private url = 'http://localhost:5000';
  private socket: SocketIOClient.Socket;
  public connectedusers: any;

  constructor() {}

  public onInit(username, roomname) {
    this.socket = io(this.url, { transports: ['websocket'], upgrade: false });

    console.log('INITALIZED');

    this.socket.on('connect', () => {
      console.log('Connected to Server');
    });

    this.socket.on('connect_timeout', (timeout: any) => {
      console.log('Connection Timeout with : ', timeout);
    });

    this.socket.on('connect_error', (error: any) => {
      console.log('Connection Error : ', error);
    });

    this.socket.on('disconnect', (reason: any) => {
      if (reason === 'io server disconnect') {
        // the disconnection was initiated by the server, you need to reconnect manually by socket.connect()
        console.log('The disconnection was initiated by the server, server disconnected');
      } else {
        // else the socket will automatically try to reconnect
        console.log('Server Disconnected : ', reason);
      }
    });

    this.socket.emit('add-user', username, roomname);
  }

  public disconnect() {
    this.socket.emit('disconnect');
    this.socket.disconnect();
    this.socket = null;
  }

  public getSocketId = () => {
    return Observable.create((observer: any) => {
      this.socket.on('currentSocket', (message: any) => {
        observer.next(message);
        this.socket.emit('clients');
      });
    });
  };

  public getClients = () => {
    this.socket.emit('clients');
    return Observable.create((observer: any) => {
      this.socket.on('clients', (clients: any) => {
        observer.next(clients);
      });
    });
  };

  public sendOffer = (offer: any) => {
    this.socket.emit('offer', offer);
  };

  public receiveOffer = () => {
    return Observable.create((observer: any) => {
      this.socket.on('offer', (offer: any) => {
        observer.next(offer);
      });
    });
  };

  public sendAnswer = (answer: any) => {
    this.socket.emit('answer', answer);
  };

  public receiveAnswer = () => {
    return Observable.create((observer: any) => {
      this.socket.on('answer', (answer: any) => {
        observer.next(answer);
      });
    });
  };

  public sendIceCandidate = (candidate: any) => {
    this.socket.emit('icecandidate', candidate);
  };

  public receiveIceCandidate = () => {
    return Observable.create((observer: any) => {
      this.socket.on('icecandidate', (candidate: any) => {
        observer.next(candidate);
      });
    });
  };
}
