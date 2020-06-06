import { VideoQuality } from './videoQuality.model';

export class Room {
  owner: string;
  name: string;
  videoQuality: VideoQuality;
  adminOnlyScreenSee: boolean;

  constructor() {}
}
