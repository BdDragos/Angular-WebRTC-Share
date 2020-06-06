import VideoQuality from './videoQuality.model';

class Room {
  owner: string;
  name: string;
  videoQuality: VideoQuality;
  adminOnlyScreenSee: boolean;

  constructor() {
    this.owner = '';
    this.name = '';
    this.adminOnlyScreenSee = false;
    this.videoQuality = {
      name: 'VGA',
      video: { minFrameRate: 30,  width: { exact: 640 }, height: { exact: 480 } }
    };
  }
}

export = Room;
