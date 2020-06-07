import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import * as io from 'socket.io-client';
import { Message } from 'src/models/message.model';

@Injectable()
export class CommunicationService {
  private url = 'http://localhost:5000';
  private socket: SocketIOClient.Socket;
  public connectedusers: any;

  constructor(private router: Router) {}

  public onInit(username, roomname) {
    this.socket = io(this.url, { transports: ['websocket'], upgrade: false });

    this.socket.on('connect', () => {
      console.log('Connected to Server');
    });

    this.socket.on('connect_timeout', (timeout: any) => {
      console.log('Connection Timeout with : ', timeout);
      this.router.navigate(['/main']);
    });

    this.socket.on('connect_error', (error: any) => {
      console.log('Connection Error : ', error);
      this.router.navigate(['/main']);
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

  public receiveMessages = () => {
    return Observable.create((observer: any) => {
      this.socket.on('new-messages-received', (response: any) => {
        observer.next(response);
      });
    });
  };

  public sendMessageText = (message: Message) => {
    this.socket.emit('post-new-message', message);
  };

  public onDisconnectedClient = () => {
    return Observable.create((observer: any) => {
      this.socket.on('disconnected-client', (response: any) => {
        observer.next(response);
      });
    });
  };

  public onAlreadyConnected = () => {
    return Observable.create((observer: any) => {
      this.socket.on('already-connected', (response: any) => {
        observer.next(response);
      });
    });
  };

  public getRoomData = () => {
    return Observable.create((observer: any) => {
      this.socket.on('sent-room-data', (response: any) => {
        observer.next(response);
      });
    });
  };

  public muteUser = (socketId: string, clientId: string) => {
    this.socket.emit('owner-mute-user', { socketId, clientId });
  };

  public kickUser = (socketId: string, clientId: string) => {
    this.socket.emit('owner-kick-user', { socketId, clientId });
  };

  public onOwnerMuteReceived = () => {
    return Observable.create((observer: any) => {
      this.socket.on('owner-muted-you', (response: any) => {
        observer.next(response);
      });
    });
  };

  public onOwnerKickReceived = () => {
    return Observable.create((observer: any) => {
      this.socket.on('owner-kicked-you', (response: any) => {
        observer.next(response);
      });
    });
  };
}
