import { ActivatedRoute, Router } from '@angular/router';
import { Component, ElementRef, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { CommunicationService } from 'src/app/services/communication.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
  public browser = navigator as any;
  public title = 'Angular WebRTC Project';
  public introline = '(Web Real-Time Communication using Socket.IO)';
  public subscriptionArray: Subscription[] = [];
  public serverStatus: boolean;
  public clientId: any = '';
  public socketId: any = '';
  public clients: any = [];
  public textEnable = true;
  public videoEnable = false;
  public screenEnable = false;
  public connected = false;
  public fromClientId: any;
  public toClientId: any;
  public peerConnection: any;
  public dataChannel: any;
  public offer: any;
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

  private loggedUserName = '';

  @ViewChild('audioElement', { static: false }) audioElement: ElementRef;
  @ViewChild('remoteAudioElement', { static: false }) remoteAudioElement: ElementRef;
  @ViewChild('videoElement', { static: false }) videoElement: ElementRef;
  @ViewChild('remoteVideoElement', { static: false }) remoteVideoElement: ElementRef;
  @ViewChild('screenElement', { static: false }) screenElement: ElementRef;
  @ViewChild('remoteScreenElement', { static: false }) remoteScreenElement: ElementRef;

  constructor(public socketservice: CommunicationService, private router: Router, private route: ActivatedRoute) {
    this.loggedUserName = localStorage.getItem('username');
    if (!this.loggedUserName) {
      this.router.navigate(['/main']);
    }
  }

  ngOnDestroy() {
    this.subscriptionArray.forEach((e) => e.unsubscribe());
    this.socketservice.disconnect();
  }

  ngOnInit(): void {
    this.subscriptionArray.push(
      this.route.params.subscribe((params) => {
        if (this.socketservice) {
          this.socketservice.onInit(this.loggedUserName, params.roomname);

          this.subscriptionArray.push(
            this.socketservice.getSocketId().subscribe((message: any) => {
              this.serverStatus = true;
              this.clientId = message.clientId;
              this.fromClientId = message.clientId;
              this.socketId = message.socketId;
            })
          );

          this.socketservice.getClients().subscribe((clients: any) => {
            this.clients = clients;
          });

          window.RTCPeerConnection = this.getRTCPeerConnection();
          window.RTCSessionDescription = this.getRTCSessionDescription();
          window.RTCIceCandidate = this.getRTCIceCandidate();
          this.browser.getUserMedia = this.getAllUserMedia();
          this.peerConnection = new RTCPeerConnection({
            iceServers: [
              {
                urls: ['stun:bturn1.xirsys1221.com'],
              },
              {
                username: '9hiaOVYRRn31s_Lv2sGS-iGgtEKg5_3SVWfeEZyO-4GWtKxUv0sCxQVNGkxlk-zBAAAAAF0sGiFhamF5cGF0aWw=',
                credential: '04f626c0-a6c8-11e9-8ad1-26d3ed601a80',
                urls: [
                  'turn:bturn1.xirsys.com:80?transport=udp',
                  'turn:bturn1.xirsys.com:3478?transport=udp',
                  'turn:bturn1.xirsys.com:80?transport=tcp',
                  'turn:bturn1.xirsys.com:3478?transport=tcp',
                  'turns:bturn1.xirsys.com:443?transport=tcp',
                  'turns:bturn1.xirsys.com:5349?transport=tcp',
                ],
              },
            ],
          });

          console.log('RTCPeerConnection : ', this.peerConnection);
          this.peerConnection.onicecandidate = (candidate: RTCIceCandidate) => {
            console.log('ICE Candidate : ', candidate);
            this.socketservice.sendIceCandidate({
              from: this.fromClientId,
              to: this.toClientId,
              type: candidate.type,
              candidate: candidate.candidate,
            });
          };

          this.peerConnection.oniceconnectionstatechange = (connection: RTCIceConnectionState) => {
            console.log('ICE Connection : ', connection);
            console.log('ICE Connection State : ', this.peerConnection.iceConnectionState);
          };

          this.peerConnection.ondatachannel = (event: any) => {
            console.log('Data Channel Attached');
            const onChannelReady = () => {
              this.dataChannel = event.channel;
            };
            if (event.channel.readyState !== 'open') {
              event.channel.onopen = onChannelReady;
            } else {
              onChannelReady();
            }
          };

          this.peerConnection.ontrack = (event: any) => {
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

          this.socketservice.receiveOffer().subscribe(async (offer: RTCSessionDescription) => {
            console.log('Offer Received : ', offer);
            await this.peerConnection.setRemoteDescription({ type: 'offer', sdp: offer.sdp });
            // tslint:disable-next-line: no-string-literal
            this.toClientId = offer['from'];
            this.peerConnection.createAnswer().then(async (answer: RTCSessionDescription) => {
              console.log('Answer Created : ', answer);
              await this.peerConnection.setLocalDescription(answer);
              this.socketservice.sendAnswer({
                from: this.fromClientId,
                to: this.toClientId,
                type: answer.type,
                sdp: answer.sdp,
              });
            });
          });

          this.socketservice.receiveAnswer().subscribe(async (answer: RTCSessionDescription) => {
            console.log('Answer Received : ', answer);
            await this.peerConnection.setRemoteDescription({ type: 'answer', sdp: answer.sdp });
          });

          this.socketservice.receiveIceCandidate().subscribe((candidate: RTCIceCandidate) => {
            if (candidate.candidate) {
              console.log('ICE Candidate Received : ', candidate);
              // this.peerConnection.addIceCandidate(candidate.candidate);
            }
          });
        } else {
          this.serverStatus = false;
        }
      })
    );
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
            this.peerConnection.addTrack(track, stream);
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
          this.peerConnection.addTrack(track, stream);
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

  public async connect() {
    this.connected = true;
    this.dataChannel = await this.peerConnection.createDataChannel('datachannel');

    this.dataChannel.onerror = (error: any) => {
      console.log('Data Channel Error:', error);
    };
    this.dataChannel.onmessage = (event: any) => {
      if (this.textEnable) {
        console.log('Got Data Channel Message:', JSON.parse(event.data));
        this.messages.push(JSON.parse(event.data));
      }
    };
    this.dataChannel.onopen = () => {
      console.log('Data Channel Opened');
    };
    this.dataChannel.onclose = () => {
      console.log('The Data Channel is Closed');
    };
    this.offer = this.peerConnection
      .createOffer({
        offerToReceiveAudio: 1,
        offerToReceiveVideo: 1,
        voiceActivityDetection: 1,
      })
      .then(async (offer: RTCSessionDescription) => {
        console.log('Offer Created : ', offer);
        await this.peerConnection.setLocalDescription(offer);
        this.socketservice.sendOffer({
          from: this.fromClientId,
          to: this.toClientId,
          type: offer.type,
          sdp: offer.sdp,
        });
      });
  }

  public sendMessage() {
    this.dataChannel.send(JSON.stringify({ clientId: this.fromClientId, data: this.message }));
    this.messages.push(JSON.parse(JSON.stringify({ clientId: this.fromClientId, data: this.message })));
    this.message = '';
  }

  public disconnect() {
    try {
      this.stopVideo();
    } catch (e) {}
    try {
      this.stopScreen();
    } catch (e) {}
    this.connected = false;
    this.toClientId = '';
  }
}
