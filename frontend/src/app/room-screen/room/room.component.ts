import { ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { CommunicationService } from 'src/app/services/communication.service';

@Component({
  selector: 'app-room',
  templateUrl: './room.component.html',
  styleUrls: ['./room.component.scss'],
})
export class RoomComponent implements OnInit, OnDestroy {
  public loggedUserName;
  public isChat = false;
  public isVideoCall = false;
  public isAudioCall = false;
  public liveUserList = [];
  public callee: any;
  public callingInfo = { name: '', content: '', type: '' };
  public isVideoCallAccepted = false;
  public userType: string;
  public caller: any;

  constructor(private router: Router, private changeDetector: ChangeDetectorRef, private socketIOService: CommunicationService) {
    this.loggedUserName = localStorage.getItem('username');
    if (!this.loggedUserName) {
      this.router.navigate(['/main']);
    } else {
      this.addUser();
    }
  }

  ngOnDestroy() {
    this.socketIOService.RemoveUser();
  }

  ngOnInit() {
    this.getLiveUsers();
    this.onVideoCallRequest();
    this.onVideoCallAccepted();
    this.getBusyUsers();
    this.onVideoCallRejected();
  }

  addUser() {
    this.socketIOService.SetUserName(this.loggedUserName).subscribe((data) => {
      if (data.username) {
        // user added
      }
    });
  }

  getLiveUsers() {
    this.socketIOService.GetConnectedUsers().subscribe((data) => {
      const users = data.filter((a) => a.username != this.loggedUserName);
      let count = 0;
      for (const i in users) {
        if (this.liveUserList.indexOf(data[i]) === -1) {
          count++;
        }
      }
      if (count !== this.liveUserList.length) {
        this.liveUserList = users;
        this.socketIOService.connectedusers = users;
        this.getBusyUsers();
      }
    });
  }

  onVideoCallRequest() {
    this.socketIOService.OnVideoCallRequest().subscribe((data) => {
      this.callingInfo.name = data.fromname;
      this.callingInfo.content = 'Calling....';
      this.callingInfo.type = 'receiver';
      this.isVideoCall = true;
    });
  }

  onVideoCallAccepted() {
    this.socketIOService.OnVideoCallAccepted().subscribe((data) => {
      const calee = this.liveUserList.find((a) => a.username == this.callingInfo.name);
      this.userType = 'dialer';
      this.caller = calee.id;
      this.isVideoCallAccepted = true;
      this.socketIOService.BusyNow();
      this.close();
    });
  }

  getBusyUsers() {
    this.socketIOService.GetBusyUsers().subscribe((data) => {
      this.liveUserList.forEach((a) => {
        a.busy = false;
      });
      data.forEach((a) => {
        const usr = this.liveUserList.find((b) => b.username == a.username);
        if (usr) {
          usr.busy = true;
        }
      });
    });
  }

  onVideoCallRejected() {
    this.socketIOService.OnVideoCallRejected().subscribe((data) => {
      this.callingInfo.content = 'Call Rejected ..';
      setTimeout(() => {
        this.close();
      }, 1000);
    });
  }

  chat() {
    this.isChat = true;
  }

  videoCall(callee) {
    const calee = this.liveUserList.find((a) => a.username == callee.username);
    if (calee) {
      this.socketIOService.VideoCallRequest(this.loggedUserName, calee.id);
    }
    this.callee = callee;
    this.callingInfo.name = callee.username;
    this.callingInfo.content = 'Dialing....';
    this.callingInfo.type = 'dialer';
    this.isVideoCall = true;
  }

  acceptVideoCall() {
    const calee = this.liveUserList.find((a) => a.username == this.callingInfo.name);
    if (calee) {
      this.socketIOService.VideoCallAccepted(this.loggedUserName, calee.id);
      this.userType = 'receiver';
      this.caller = calee.id;
      this.isVideoCallAccepted = true;
      this.socketIOService.BusyNow();
    }
    this.close();
  }

  rejectVideoCall() {
    const calee = this.liveUserList.find((a) => a.username === this.callingInfo.name);
    if (calee) {
      this.socketIOService.VideoCallRejected(this.loggedUserName, calee.id);
      this.isVideoCallAccepted = false;
    }
    this.close();
  }

  audioCall() {
    this.isAudioCall = true;
  }

  callBack(event) {
    this.isChat = false;
    this.isVideoCall = false;
    this.isAudioCall = false;
    this.isVideoCallAccepted = false;
    this.changeDetector.detectChanges();
    location.reload();
  }

  close() {
    this.isVideoCall = false;
    this.changeDetector.detectChanges();
  }

  makeid(length) {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
  }
}
