import VideoQuality from './videoQuality.model';

class Room {
  owner: string;
  name: string;
  videoQuality: VideoQuality;
  adminOnlyScreenSee: boolean;
  hasPassword: boolean;
  password: string;

  constructor() {
    this.owner = '';
    this.name = '';
    this.adminOnlyScreenSee = false;
    this.videoQuality = {
      name: 'HD',
      video: { minFrameRate: 30, width: { exact: 1280 }, height: { exact: 720 } }
    };
    this.hasPassword = false;
    this.password = '';
  }
}

export = Room;
