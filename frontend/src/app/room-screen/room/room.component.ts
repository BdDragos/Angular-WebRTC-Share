import { ProgressSpinnerService } from './../../utilities-components/progress-spinner/progress-spinner.service';
import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommunicationService } from 'src/app/services/communication.service';
import { Client } from 'src/models/client.model';
import { Message } from 'src/models/message.model';
import { Room } from 'src/models/room.model';
import 'webrtc-adapter';
import { ToastService } from './../../utilities-components/toast-message/toast-message.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy, AfterViewInit {
  public browser = navigator as any;
  public subscriptionArray: Subscription[] = [];
  public serverStatus: boolean;
  public clientId: any = '';
  public socketId: any = '';
  public clients: Client[] = [];
  public fromClientId: any;

  public peerConnection: RTCPeerConnection[] = [];
  public message: any;
  public messagesList: Message[] = [];

  public videoTrack: VideoTrack;
  public video: HTMLVideoElement;

  public localVideoIsPlaying = false;
  public localScreenIsShared = false;
  public localAudioIsPlaying = false;

  public videoSender: RTCRtpSender[] = [];
  public audioSender: RTCRtpSender[] = [];

  public audioStream: any;
  public videoStream: any;

  public audioIsActive: any = [];

  public currentRoom = new Room();
  private loggedUserName = '';

  @ViewChild('videoElement', { static: false }) videoElement: ElementRef;
  @ViewChild('cameraDivList', { static: false }) cameraDivList: ElementRef;
  @ViewChild('messageBox', { static: false }) messageBox: ElementRef;

  constructor(
    private communicationService: CommunicationService,
    private loadingSpinnerService: ProgressSpinnerService,
    private router: Router,
    private route: ActivatedRoute,
    private cdk: ChangeDetectorRef,
    private tooltipService: ToastService
  ) {
    this.loggedUserName = localStorage.getItem('username');
    if (!this.loggedUserName) {
      this.router.navigate(['/main']);
    }
  }

  ngOnDestroy() {
    this.subscriptionArray.forEach((e) => e.unsubscribe());
    this.communicationService.disconnect();
  }

  ngOnInit(): void {
    this.subscriptionArray.push(
      this.route.params.subscribe((params) => {
        window.RTCPeerConnection = this.getRTCPeerConnection();
        window.RTCSessionDescription = this.getRTCSessionDescription();
        window.RTCIceCandidate = this.getRTCIceCandidate();
        this.browser.getUserMedia = this.getAllUserMedia();

        if (this.communicationService) {
          this.communicationService.onInit(this.loggedUserName, params.roomname);

          this.subscriptionArray.push(
            this.communicationService.getRoomData().subscribe((response) => {
              if (response) {
                this.currentRoom = response;
              } else {
                this.tooltipService.show({ text: 'The room you were in no longer exists', type: 'warning' });
                this.router.navigate(['/main']);
              }
            })
          );

          this.subscriptionArray.push(
            this.communicationService.onAlreadyConnected().subscribe((response: any) => {
              this.tooltipService.show({ text: 'You are already connected', type: 'warning' });
              this.router.navigate(['/main']);
            })
          );

          this.subscriptionArray.push(
            this.communicationService.onOwnerMuteReceived().subscribe((response: any) => {
              // if in multiple rooms verify if you are muted in a single one
              if (response === this.currentRoom.owner) {
                this.tooltipService.show({ text: 'Owner muted you', type: 'warning' });
                this.stopAudio();
              }
            })
          );

          this.subscriptionArray.push(
            this.communicationService.onOwnerKickReceived().subscribe((response: any) => {
              // if in multiple rooms verify if you are kicked in a single one
              if (response === this.currentRoom.owner) {
                this.tooltipService.show({ text: 'Owner kicked you', type: 'warning' });
                this.router.navigate(['/main']);
              }
            })
          );

          this.subscriptionArray.push(
            this.communicationService.receiveMessages().subscribe((response: any) => {
              this.messagesList.push(response.newMessage);
              this.messageBox.nativeElement.scrollTop = this.messageBox.nativeElement.scrollHeight;
              this.cdk.detectChanges();
            })
          );

          this.subscriptionArray.push(
            this.communicationService.onDisconnectedClient().subscribe((response: any) => {
              if (this.peerConnection[response.socketId]) {
                this.peerConnection[response.socketId].close();
                delete this.peerConnection[response.socketId];
                this.removeRemoteVideoStream(response.socketId);
                this.removeRemoteAudioStream(response.socketId);
                delete this.audioSender[response.socketId];
                delete this.videoSender[response.socketId];
              }
            })
          );

          this.subscriptionArray.push(
            this.communicationService.getSocketId().subscribe((message: any) => {
              this.serverStatus = true;
              this.clientId = message.clientId;
              this.fromClientId = message.clientId;
              this.socketId = message.socketId;
            })
          );

          this.subscriptionArray.push(
            this.communicationService.getClients().subscribe((response: { clients: Client[]; socketIds: string[] }) => {
              response.socketIds.forEach((e) => {
                if (!this.peerConnection[e]) {
                  this.configurePeerConnection(e);
                }
              });

              response.clients.splice(
                response.clients.findIndex((e) => e.clientId === this.clientId),
                1
              );

              this.clients = response.clients;
            })
          );

          this.subscriptionArray.push(
            this.communicationService.receiveOffer().subscribe(async (response: { offer: any }) => {
              console.log('Offer Received : ', response.offer);

              if (this.socketId !== response.offer.from) {
                this.peerConnection[response.offer.from]
                  .setRemoteDescription(new RTCSessionDescription(response.offer.sdp))
                  .then(() => {
                    this.peerConnection[response.offer.from]
                      .createAnswer()
                      .then(async (answer: RTCSessionDescription) => {
                        console.log('Answer Created : ', answer);
                        await this.peerConnection[response.offer.from].setLocalDescription(answer);
                        this.communicationService.sendAnswer({
                          from: this.socketId,
                          to: response.offer.from,
                          type: 'answer',
                          sdp: answer.sdp,
                        });
                      })
                      .catch((event) => {
                        console.log('ERROR CREATE ANSWER: ' + event);
                      });
                  })
                  .catch((event) => {
                    console.log('ERROR SET REMOTE: ' + event);
                  });
              }
            })
          );

          this.subscriptionArray.push(
            this.communicationService.receiveAnswer().subscribe(async (response: { answer: any }) => {
              console.log('Answer Received : ', response.answer);

              const newDesc = { type: response.answer.type, sdp: response.answer.sdp };

              if (this.socketId !== response.answer.from) {
                await this.peerConnection[response.answer.from].setRemoteDescription(new RTCSessionDescription(newDesc));
              }
            })
          );

          this.subscriptionArray.push(
            this.communicationService.receiveIceCandidate().subscribe((response: { candidate: any }) => {
              console.log('ICE Candidate Received : ', response.candidate);
              if (response.candidate.candidate) {
                this.peerConnection[response.candidate.from]
                  .addIceCandidate(new RTCIceCandidate(response.candidate.candidate))
                  .catch((event) => {
                    console.log('ICE SET ERROR: ' + event);
                  });
              }
            })
          );
        } else {
          this.serverStatus = false;
        }
      })
    );
  }

  ngAfterViewInit() {
    this.makeColumns('2');
    this.cdk.detectChanges();
  }

  configurePeerConnection(toId: string) {
    this.peerConnection[toId] = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.2.google.com:19302' }],
    });

    this.peerConnection[toId].ontrack = (event: any) => {
      console.log('Track Received: ' + event.track.kind);

      event.streams[0].onremovetrack = (removeEvent: any) => {
        console.log('Track remove request');
        console.log(removeEvent);

        if (event.track.kind === 'video') {
          this.removeRemoteVideoStream(toId);
        } else if (event.track.kind === 'audio') {
          this.removeRemoteAudioStream(toId);
        }
      };

      if (event.track.kind === 'video') {
        this.gotRemoteVideoStream(event.streams[0], toId);
      } else if (event.track.kind === 'audio') {
        this.gotRemoteAudioStream(event.streams[0], toId);
      }
    };

    this.peerConnection[toId].onicegatheringstatechange = async () => {
      if (this.peerConnection[toId].iceGatheringState === 'complete') {
        console.log('ICE COMPLETED');
      }
    };

    this.peerConnection[toId].onicecandidate = (candidate: RTCIceCandidate) => {
      this.communicationService.sendIceCandidate({
        from: this.socketId,
        to: toId,
        type: candidate.type,
        candidate: candidate.candidate,
      });
    };

    this.peerConnection[toId].onnegotiationneeded = (event: any) => {
      console.log('RENEGOTATION NEEDED');
      this.connect(toId);
    };

    if ((this.localVideoIsPlaying || this.localScreenIsShared) && this.videoStream) {
      // this.enableChoosenFormat(this.videoSender, this.videoStream);

      this.videoStream.getTracks().forEach((track: any) => {
        this.peerConnection[toId].addTrack(track, this.videoStream);
      });
    }
  }

  public async connect(e: string) {
    this.peerConnection[e]
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
        voiceActivityDetection: 1,
      })
      .then((offer: RTCSessionDescription) => {
        this.peerConnection[e].setLocalDescription(offer).then(() => {
          if (e !== this.socketId) {
            this.communicationService.sendOffer({
              from: this.socketId,
              to: e,
              sdp: this.peerConnection[e].localDescription,
            });
          }
        });
      });
  }

  public getRTCPeerConnection() {
    return window.RTCPeerConnection;
  }

  public getRTCSessionDescription() {
    return window.RTCSessionDescription;
  }

  public getRTCIceCandidate() {
    return window.RTCIceCandidate;
  }

  public getAllUserMedia() {
    return (
      this.browser.getUserMedia || this.browser.webkitGetUserMedia || this.browser.mozGetUserMedia || this.browser.msGetUserMedia
    );
  }

  public getAllUserMediaScreen() {
    if (this.browser.getDisplayMedia) {
      return this.browser.getDisplayMedia({ video: true });
    } else if (this.browser.mediaDevices.getDisplayMedia) {
      return this.browser.mediaDevices.getDisplayMedia({ video: true });
    } else {
      return this.browser.mediaDevices.getUserMedia({ video: { mediaSource: 'screen' } });
    }
  }

  public enableAudio() {
    this.loadingSpinnerService.show();
    if (this.localAudioIsPlaying) {
      this.stopAudio();
      this.loadingSpinnerService.close();
      return;
    }

    this.stopAudio();

    const constraints = { audio: true, video: false };
    this.browser.mediaDevices
      .getUserMedia(constraints)
      .then((stream: any) => {
        this.localAudioIsPlaying = true;

        if (!stream.stop && stream.getTracks) {
          stream.stop = function () {
            this.getTracks().forEach((track: any) => {
              track.stop();
            });
          };
        }
        this.audioStream = stream;

        this.enableChoosenFormat(this.audioSender, stream);

        this.loadingSpinnerService.close();
      })
      .catch((error) => {
        this.tooltipService.show({ text: error, type: 'error' });
        this.loadingSpinnerService.close();
      });
  }

  public enableVideo() {
    this.loadingSpinnerService.show();
    if (this.localVideoIsPlaying) {
      this.stopVideo();
      this.loadingSpinnerService.close();
      return;
    }

    this.stopVideo();

    if (this.videoElement) {
      this.video = this.videoElement.nativeElement;
      const constraints = { video: this.currentRoom.videoQuality.video };
      this.browser.mediaDevices
        .getUserMedia(constraints)
        .then((stream: any) => {
          this.localVideoIsPlaying = true;
          if (!stream.stop && stream.getTracks) {
            stream.stop = function () {
              this.getTracks().forEach((track: any) => {
                track.stop();
              });
            };
          }
          this.videoStream = stream;
          this.videoTrack = stream.getVideoTracks();

          if (this.videoTrack) {
            console.log('Using video device: ' + this.videoTrack[0].label);
          }

          try {
            this.video.srcObject = this.videoStream;
          } catch (err) {
            this.video.src = window.URL.createObjectURL(this.videoStream);
          }

          this.enableChoosenFormat(this.videoSender, stream);

          this.video.muted = true;
          this.video.play();
          this.loadingSpinnerService.close();
        })
        .catch((error) => {
          this.tooltipService.show({ text: error, type: 'error' });
          this.loadingSpinnerService.close();
        });
    }
  }

  public enableScreen() {
    this.loadingSpinnerService.show();
    if (this.localScreenIsShared) {
      this.stopVideo();
      this.loadingSpinnerService.close();
      return;
    }

    this.stopVideo();

    this.video = this.videoElement.nativeElement;
    this.getAllUserMediaScreen()
      .then((stream: any) => {
        this.localScreenIsShared = true;
        if (!stream.stop && stream.getTracks) {
          stream.stop = function () {
            this.getTracks().forEach((track: any) => {
              track.stop();
            });
          };
        }
        this.videoStream = stream;

        // listens to stop sharing button in chrome
        this.videoStream.getVideoTracks()[0].onended = () => {
          this.stopVideo();
        };

        this.videoTrack = stream.getVideoTracks();
        if (this.videoTrack) {
          console.log('Using video device: ' + this.videoTrack[0].label);
        }

        try {
          this.video.srcObject = this.videoStream;
        } catch (err) {
          this.video.src = window.URL.createObjectURL(this.videoStream);
        }

        this.enableChoosenFormat(this.videoSender, stream);

        this.video.play();
        this.loadingSpinnerService.close();
      })
      .catch((error) => {
        this.tooltipService.show({ text: error, type: 'error' });
        this.loadingSpinnerService.close();
      });
  }

  enableChoosenFormat(senderType: RTCRtpSender[], stream: any, specificConnection?: string) {
    if (this.currentRoom.adminOnlyScreenSee && this.currentRoom && this.clientId) {
      // if you are owner you stream to everyone
      if (this.clientId === this.currentRoom.owner) {
        stream.getTracks().forEach((track: any) => {
          if (specificConnection) {
            senderType[specificConnection] = this.peerConnection[specificConnection].addTrack(track, stream);
          } else {
            for (const [key, value] of Object.entries(this.peerConnection)) {
              senderType[key] = value.addTrack(track, stream);
            }
          }
        });
      } else {
        // if you aren't the owner you stream only to owner
        const foundElement = this.clients.find((e) => e.clientId === this.currentRoom.owner);
        // owner is online
        if (foundElement && this.peerConnection[foundElement.socketId]) {
          stream.getTracks().forEach((track: any) => {
            senderType[foundElement.socketId] = this.peerConnection[foundElement.socketId].addTrack(track, stream);
          });
        }
      }
    } else {
      // if adminOnly flag isn't set you stream to everyone, normal behaviour
      stream.getTracks().forEach((track: any) => {
        if (specificConnection) {
          senderType[specificConnection] = this.peerConnection[specificConnection].addTrack(track, stream);
        } else {
          for (const [key, value] of Object.entries(this.peerConnection)) {
            senderType[key] = value.addTrack(track, stream);
          }
        }
      });
    }
  }

  public stopChoosenStream(streamType: any, streamSender: RTCRtpSender[]) {
    if (streamType && streamType.active) {
      for (const [key, value] of Object.entries(this.peerConnection)) {
        if (streamSender[key]) {
          value.removeTrack(streamSender[key]);
          delete streamSender[key];
        }
      }

      streamType.stop();
    }
  }

  public stopAudio() {
    this.stopChoosenStream(this.audioStream, this.audioSender);
    this.localAudioIsPlaying = false;
  }

  public stopVideo() {
    this.stopChoosenStream(this.videoStream, this.videoSender);
    this.localVideoIsPlaying = false;
    this.localScreenIsShared = false;
  }

  public sendMessage() {
    this.communicationService.sendMessageText({ clientId: this.clientId, data: this.message });
    this.message = '';
  }

  public disconnect() {
    this.stopVideo();
    this.stopAudio();
  }

  gotRemoteVideoStream(event, id) {
    this.removeRemoteVideoStream(id);

    const cameraListDiv = this.cameraDivList.nativeElement;

    const parentDiv = document.createElement('div');
    const descriptionDiv = document.createElement('div');
    const video = document.createElement('video');
    const sourceElement = document.createElement('source');

    const foundElement = this.clients.find((e) => e.socketId === id);

    if (foundElement) {
      descriptionDiv.textContent = foundElement.clientId;
      console.log('TEXT FOUND');
    }

    video.appendChild(sourceElement);
    parentDiv.appendChild(video);
    parentDiv.appendChild(descriptionDiv);

    parentDiv.setAttribute('data-socket', id);
    parentDiv.classList.add('w-100');
    parentDiv.classList.add('h-auto');
    parentDiv.classList.add('m-b-3');

    descriptionDiv.classList.add('text-center');
    descriptionDiv.classList.add('m-top-2');

    video.muted = true;
    video.autoplay = true;
    video.style.width = '100%';
    video.style.height = 'auto';

    setTimeout(() => {
      try {
        video.srcObject = event;
      } catch (err) {
        video.src = window.URL.createObjectURL(event);
      }

      const promise = video.play();

      if (promise) {
        promise
          .then(() => {
            cameraListDiv.appendChild(parentDiv);
            console.log('Video was played');
          })
          .catch(() => {
            console.log('Video could not be played');
          });
      }
    });
  }

  gotRemoteAudioStream(event, id) {
    const foundAudioStream: HTMLAudioElement = document.getElementById(id) as HTMLAudioElement;

    if (foundAudioStream) {
      this.audioIsActive[id] = true;
      this.cdk.detectChanges();
      setTimeout(() => {
        try {
          foundAudioStream.srcObject = event;
        } catch (err) {
          foundAudioStream.src = window.URL.createObjectURL(event);
        }

        foundAudioStream.play();
      });
    }
  }

  removeRemoteVideoStream(id) {
    const videoParent = document.querySelector('[data-socket="' + id + '"]');
    if (videoParent) {
      this.cameraDivList.nativeElement.removeChild(videoParent);
    }
  }

  removeRemoteAudioStream(id) {
    this.audioIsActive[id] = false;
  }

  checkIfActive(id) {
    return this.audioIsActive[id];
  }

  onOwnerMuteUser(mutedSocket: string) {
    // is room owner
    if (this.clientId && this.currentRoom && this.clientId === this.currentRoom.owner) {
      this.communicationService.muteUser(mutedSocket, this.clientId);
    }
  }

  onOwnerKickUser(kickedUser: string) {
    // is room owner
    if (this.clientId && this.currentRoom && this.clientId === this.currentRoom.owner) {
      this.communicationService.kickUser(kickedUser, this.clientId);
    }
  }

  makeColumns(event: any) {
    // const container = this.overlayImageContainer.nativeElement;
    // container.style.setProperty('--grid-rows', rows);
    // container.style.setProperty('--grid-cols', cols);

    const containerBorder = this.cameraDivList.nativeElement;
    containerBorder.style.setProperty('--grid-cols', event);
  }
}
