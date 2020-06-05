import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommunicationService } from 'src/app/services/communication.service';
import { Client } from 'src/models/client.model';
import { Message } from 'src/models/message.model';
import 'webrtc-adapter';
import { ToastService } from './../../utilities-components/toast-message/toast-message.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
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

  public videoStream: any;
  public videoWidth = 400;
  public videoHeight = 300;

  private loggedUserName = '';

  @ViewChild('videoElement', { static: false }) videoElement: ElementRef;
  @ViewChild('cameraDivList', { static: false }) cameraDivList: ElementRef;
  @ViewChild('messageBox', { static: false }) messageBox: ElementRef;

  constructor(
    public communicationService: CommunicationService,
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

          this.communicationService.onAlreadyConnected().subscribe((response: any) => {
            this.tooltipService.show({ text: 'You are already connected', type: 'warning' });
            this.router.navigate(['/main']);
          });

          this.communicationService.receiveMessages().subscribe((response: any) => {
            this.messagesList.push(response.newMessage);
            this.messageBox.nativeElement.scrollTop = this.messageBox.nativeElement.scrollHeight;
            this.cdk.detectChanges();
          });

          this.communicationService.onDisconnectedClient().subscribe((response: any) => {
            if (this.peerConnection[response.socketId]) {
              this.peerConnection[response.socketId].close();
              delete this.peerConnection[response.socketId];
              this.removeRemoteStream(response.socketId);
            }
          });

          this.subscriptionArray.push(
            this.communicationService.getSocketId().subscribe((message: any) => {
              this.serverStatus = true;
              this.clientId = message.clientId;
              this.fromClientId = message.clientId;
              this.socketId = message.socketId;
            })
          );

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
          });

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
          });

          this.communicationService.receiveAnswer().subscribe(async (response: { answer: any }) => {
            console.log('Answer Received : ', response.answer);

            const newDesc = { type: response.answer.type, sdp: response.answer.sdp };

            if (this.socketId !== response.answer.from) {
              await this.peerConnection[response.answer.from].setRemoteDescription(new RTCSessionDescription(newDesc));
            }
          });

          this.communicationService.receiveIceCandidate().subscribe((response: { candidate: any }) => {
            console.log('ICE Candidate Received : ', response.candidate);
            if (response.candidate.candidate) {
              this.peerConnection[response.candidate.from]
                .addIceCandidate(new RTCIceCandidate(response.candidate.candidate))
                .catch((event) => {
                  console.log('ICE SET ERROR: ' + event);
                });
            }
          });
        } else {
          this.serverStatus = false;
        }
      })
    );
  }

  configurePeerConnection(toId: string) {
    this.peerConnection[toId] = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.2.google.com:19302' }],
    });

    this.peerConnection[toId].ontrack = (event: any) => {
      console.log('Video Track Received');

      event.streams[0].onremovetrack = (removeEvent: any) => {
        console.log('Track remove request');
        this.removeRemoteStream(toId);
      };

      this.gotRemoteStream(event.streams[0], toId);
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

    if (this.localVideoIsPlaying || this.localScreenIsShared) {
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

  public enableVideo() {
    if (this.localVideoIsPlaying) {
      this.stopVideo();
      return;
    }

    this.stopVideo();
    this.localVideoIsPlaying = true;

    setTimeout(() => {
      if (this.videoElement) {
        this.video = this.videoElement.nativeElement;
        const constraints = { audio: true, video: { minFrameRate: 60, width: 400, height: 300 } };
        this.browser.mediaDevices.getUserMedia(constraints).then((stream: any) => {
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
          stream.getTracks().forEach((track: any) => {
            for (const [key, value] of Object.entries(this.peerConnection)) {
              value.addTrack(track, stream);
            }
          });
          setTimeout(() => {
            this.video.muted = true;
            this.video.play();
          }, 500);
        });
      }
    }, 1000);
  }

  public enableScreen() {
    if (this.localScreenIsShared) {
      this.stopVideo();
      return;
    }

    this.stopVideo();

    this.localScreenIsShared = true;

    setTimeout(() => {
      this.video = this.videoElement.nativeElement;
      this.getAllUserMediaScreen().then((stream: any) => {
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

        stream.getTracks().forEach((track: any) => {
          for (const [key, value] of Object.entries(this.peerConnection)) {
            value.addTrack(track, stream);
          }
        });
        setTimeout(() => {
          this.video.play();
        }, 500);
      });
    }, 1000);
  }

  public stopVideo() {
    if (this.videoStream && this.videoStream.active) {
      for (const [key, value] of Object.entries(this.peerConnection)) {
        value.getSenders().forEach((e) => {
          value.removeTrack(e);
          console.log(e);
        });
      }

      this.videoStream.stop();
      this.localVideoIsPlaying = false;
      this.localScreenIsShared = false;
    }
  }

  public sendMessage() {
    this.communicationService.sendMessageText({ clientId: this.clientId, data: this.message });
    this.message = '';
  }

  public disconnect() {
    this.stopVideo();
  }

  gotRemoteStream(event, id) {
    this.removeRemoteStream(id);

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
    video.controls = true;
    video.style.width = '100%';
    video.style.height = 'auto';
    video.width = this.videoWidth;
    video.height = this.videoHeight;

    cameraListDiv.appendChild(parentDiv);

    setTimeout(() => {
      try {
        video.srcObject = event;
      } catch (err) {
        video.src = window.URL.createObjectURL(event);
      }

      video.play();
    });
  }

  removeRemoteStream(id) {
    const videoParent = document.querySelector('[data-socket="' + id + '"]');
    if (videoParent) {
      this.cameraDivList.nativeElement.removeChild(videoParent);
    }
  }
}
