import { ConnectedClients } from 'src/models/connectedClients.mode';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { CommunicationService } from 'src/app/services/communication.service';
import { Client } from 'src/models/client.model';

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
  public textEnable = true;
  public videoEnable = false;
  public screenEnable = false;
  public fromClientId: any;
  public toClientId: string[] = [];
  public peerConnection: any[] = [];
  public dataChannel: any[] = [];
  public message: any;
  public messages: string[] = [];
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
  @ViewChild('screenElement', { static: false }) screenElement: ElementRef;
  @ViewChild('remoteScreenElement', { static: false }) remoteScreenElement: ElementRef;

  constructor(public communicationService: CommunicationService, private router: Router, private route: ActivatedRoute) {
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
        if (this.communicationService) {
          this.communicationService.onInit(this.loggedUserName, params.roomname);

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

            const indexCurrent = response.clients.findIndex((e) => e.clientId === this.clientId);

            response.clients.splice(indexCurrent, 1);
            this.clients = response.clients;

            this.toConnect.forEach((e) => {
              this.peerConnection[e] = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.services.mozilla.com' }, { urls: 'stun:stun.l.google.com:19302' }],
              });

              this.configurePeerConnection(this.peerConnection[e], e);
            });

            if (this.toClientId.findIndex((e) => e === this.socketId) === this.toClientId.length - 1) {
              this.connect(this.toConnect);
            }
          });

          window.RTCPeerConnection = this.getRTCPeerConnection();
          window.RTCSessionDescription = this.getRTCSessionDescription();
          window.RTCIceCandidate = this.getRTCIceCandidate();

          this.browser.getUserMedia = this.getAllUserMedia();

          this.communicationService.receiveOffer().subscribe(async (response: { offer: any }) => {
            console.log('Offer Received : ', response.offer);

            if (this.socketId !== response.offer.to) {
              this.peerConnection[response.offer.to]
                .setRemoteDescription(new RTCSessionDescription(response.offer.sdp))
                .then(() => {
                  this.peerConnection[response.offer.to].createAnswer().then(async (answer: RTCSessionDescription) => {
                    console.log('Answer Created : ', answer);
                    await this.peerConnection[response.offer.to].setLocalDescription(answer);
                    this.communicationService.sendAnswer({
                      from: this.socketId,
                      to: response.offer.to,
                      type: 'answer',
                      sdp: answer.sdp,
                    });
                  });
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
              this.peerConnection[response.candidate.from].addIceCandidate(response.candidate.candidate);
            }
          });
        } else {
          this.serverStatus = false;
        }
      })
    );
  }

  public async connect(toConnect: string[]) {
    if (toConnect.length > 0) {
      toConnect.forEach((e) => {
        this.createDataChannel(e);
      });

      toConnect.forEach((e) => {
        this.peerConnection[e]
          .createOffer({
            offerToReceiveAudio: 1,
            offerToReceiveVideo: 1,
            voiceActivityDetection: 1,
          })
          .then(async (offer: RTCSessionDescription) => {
            await this.peerConnection[e].setLocalDescription(offer).then(() => {
              this.communicationService.sendOffer({
                from: this.socketId,
                to: e,
                sdp: this.peerConnection[e].localDescription,
              });
            });
          });
      });
    }
  }

  configurePeerConnection(peerConnection: any, toId: string) {
    peerConnection.onicecandidate = (candidate: RTCIceCandidate) => {
      this.communicationService.sendIceCandidate({
        from: this.socketId,
        to: toId,
        type: candidate.type,
        candidate: candidate.candidate,
      });
    };

    peerConnection.ondatachannel = (event: any) => {
      console.log('Data Channel Attached');
      const onChannelReady = () => {
        this.dataChannel[toId] = event.channel;
      };
      if (event.channel.readyState !== 'open') {
        event.channel.onopen = onChannelReady;
      } else {
        onChannelReady();
      }
    };

    peerConnection.ontrack = (event: any) => {
      if (this.videoEnable) {
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
      } else if (this.screenEnable) {
        this.remoteScreen = this.remoteScreenElement.nativeElement;
        console.log('Screen Track Received');
        try {
          this.remoteScreen.srcObject = event.streams[0];
        } catch (err) {
          this.remoteScreen.src = window.URL.createObjectURL(event.streams[0]);
        }
        setTimeout(() => {
          this.remoteScreen.play();
        }, 500);
      }
    };
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

  public enableText() {
    try {
      this.stopVideo();
    } catch (e) {}
    try {
      this.stopScreen();
    } catch (e) {}
    this.textEnable = true;
    this.videoEnable = false;
    this.screenEnable = false;
  }

  public enableVideo() {
    try {
      this.stopScreen();
    } catch (e) {}
    this.textEnable = false;
    this.videoEnable = true;
    this.screenEnable = false;
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
            this.peerConnection.forEach((element) => {
              if (element) {
                element.addTrack(track, stream);
              }
            });
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
    this.textEnable = false;
    this.videoEnable = false;
    this.screenEnable = true;
    setTimeout(() => {
      this.screen = this.screenElement.nativeElement;
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
          // this.peerConnection.addTrack(track, stream);
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

  async createDataChannel(idConnection: string) {
    this.dataChannel[idConnection] = await this.peerConnection[idConnection].createDataChannel('datachannel');

    this.dataChannel[idConnection].onerror = (error: any) => {
      console.log('Data Channel Error:', error);
    };
    this.dataChannel[idConnection].onmessage = (event: any) => {
      if (this.textEnable) {
        console.log('Got Data Channel Message:', JSON.parse(event.data));
        this.messages.push(JSON.parse(event.data));
      }
    };
    this.dataChannel[idConnection].onopen = () => {
      console.log('Data Channel Opened');
    };

    this.dataChannel[idConnection].onclose = () => {
      console.log('The Data Channel is Closed');
    };
  }

  public sendMessage() {
    console.log(this.dataChannel);
    this.dataChannel.forEach((e) => {
      e.send(JSON.stringify({ clientId: this.socketId, data: this.message }));
    });
    this.messages.push(JSON.parse(JSON.stringify({ clientId: this.socketId, data: this.message })));
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
