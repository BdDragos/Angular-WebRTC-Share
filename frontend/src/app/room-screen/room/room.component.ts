import { ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommunicationService } from 'src/app/services/communication.service';
import { Client } from 'src/models/client.model';
import { Message } from 'src/models/message.model';
import 'webrtc-adapter';

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
  public toClientId: string[] = [];
  public peerConnection: any[] = [];
  public message: any;
  public messagesList: Message[] = [];

  public negotationArray: any = {};

  public audio: any;
  public remoteAudio: any;
  public videoTrack: VideoTrack;
  public video: any;
  public remoteVideo: any;
  public videoStream: any;
  public videoWidth = 400;
  public videoHeight = 300;
  public screen: any;
  public remoteScreen: any;
  public screenStream: any;
  public screenWidth = 400;
  public screenHeight = 300;

  private toConnect: string[] = [];
  private loggedUserName = '';

  @ViewChild('audioElement', { static: false }) audioElement: ElementRef;
  @ViewChild('remoteAudioElement', { static: false }) remoteAudioElement: ElementRef;
  @ViewChild('videoElement', { static: false }) videoElement: ElementRef;
  @ViewChild('remoteVideoElement', { static: false }) remoteVideoElement: ElementRef;

  constructor(
    public communicationService: CommunicationService,
    private router: Router,
    private route: ActivatedRoute,
    private cdk: ChangeDetectorRef
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

          this.communicationService.receiveMessages().subscribe((response: any) => {
            this.messagesList.push(response.newMessage);
            console.log(response.newMessage);
            this.cdk.detectChanges();
          });

          this.communicationService.onDisconnectedClient().subscribe((response: any) => {
            if (this.peerConnection[response.socketId]) {
              delete this.peerConnection[response.socketId];
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
            this.toConnect = [];

            response.socketIds.forEach((e) => {
              if (this.toClientId.findIndex((f) => f === e) < 0) {
                this.toClientId.push(e);

                this.toConnect.push(e);
              }
            });

            response.clients.splice(
              response.clients.findIndex((e) => e.clientId === this.clientId),
              1
            );

            this.clients = response.clients;

            this.toConnect.forEach((e) => {
              this.configurePeerConnection(e);
            });

            if (this.toClientId.findIndex((e) => e === this.socketId) === this.toClientId.length - 1) {
              if (this.toConnect.length > 0) {
                this.toConnect.forEach((e) => {
                  this.connect(e);
                });
              }
            }
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
      this.remoteVideo = this.remoteVideoElement.nativeElement;
      console.log('Video Track Received');
      try {
        this.remoteVideo.srcObject = event.streams[0];
      } catch (err) {
        this.remoteVideo.src = window.URL.createObjectURL(event.streams[0]);
      }
      setTimeout(() => {
        this.remoteVideo.play();
      }, 500);
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

    this.negotationArray[toId] = false;

    this.peerConnection[toId].onnegotiationneeded = (event: any) => {
      // if (this.negotationArray[toId] === false) {
      //   return;
      // }

      console.log('RENEGOTATION NEEDED');
      console.log(event);

      this.connect(toId);
    };
  }

  public async connect(e: string) {
    if (e !== this.socketId) {
      this.negotationArray[e] = true;

      this.peerConnection[e]
        .createOffer({
          offerToReceiveAudio: 1,
          offerToReceiveVideo: 1,
          voiceActivityDetection: 1,
        })
        .then(async (offer: RTCSessionDescription) => {
          await this.peerConnection[e].setLocalDescription(offer).then(() => {
            this.negotationArray[e] = false;

            this.communicationService.sendOffer({
              from: this.socketId,
              to: e,
              sdp: this.peerConnection[e].localDescription,
            });
          });
        });
    }
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
    try {
      this.stopScreen();
    } catch (e) {}
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
            this.video.play();
          }, 500);
        });
      }
    }, 1000);
  }

  public enableScreen() {
    try {
      this.stopVideo();
    } catch (e) {}
    setTimeout(() => {
      this.screen = this.videoElement.nativeElement;
      this.getAllUserMediaScreen().then((stream: any) => {
        if (!stream.stop && stream.getTracks) {
          stream.stop = function () {
            this.getTracks().forEach((track: any) => {
              track.stop();
            });
          };
        }
        this.screenStream = stream;
        this.videoTrack = stream.getVideoTracks();
        if (this.videoTrack) {
          console.log('Using video device: ' + this.videoTrack[0].label);
        }
        try {
          this.screen.srcObject = this.screenStream;
        } catch (err) {
          this.screen.src = window.URL.createObjectURL(this.screenStream);
        }
        stream.getTracks().forEach((track: any) => {
          for (const [key, value] of Object.entries(this.peerConnection)) {
            value.addTrack(track, stream);
          }
        });
        setTimeout(() => {
          this.screen.play();
        }, 500);
      });
    }, 1000);
  }

  public stopVideo() {
    this.videoStream.stop();
  }

  public stopScreen() {
    this.screenStream.stop();
  }

  public sendMessage() {
    this.communicationService.sendMessageText({ clientId: this.socketId, data: this.message });
    this.message = '';
  }

  public disconnect() {
    try {
      this.stopVideo();
    } catch (e) {}
    try {
      this.stopScreen();
    } catch (e) {}
  }
}
