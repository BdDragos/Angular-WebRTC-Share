import { Injectable } from '@angular/core';
import { MatDialog, MatDialogConfig } from '@angular/material/dialog';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { map } from 'rxjs/operators';
import { ToastService } from 'src/app/utilities-components/toast-message/toast-message.service';
import { RoomPasswordDialogComponent } from './../../room-screen/room-password-dialog/room-password-dialog.component';

@Injectable()
export class RoomPasswordGuard implements CanActivate {
  constructor(private router: Router, public dialog: MatDialog, private tooltipService: ToastService) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (route.params.roomname) {
      return this.openRoomPasswordDialog(route.params.roomname);
    } else {
      this.tooltipService.show({ text: 'No name provided', type: 'error' });
      this.router.navigate(['/main']);
      return false;
    }
  }

  openRoomPasswordDialog(roomname: string) {
    const dialogConfig = new MatDialogConfig();
    dialogConfig.disableClose = true;
    dialogConfig.autoFocus = true;
    dialogConfig.panelClass = 'user-dialog-style';
    dialogConfig.data = { roomname };
    const dialogRef = this.dialog.open(RoomPasswordDialogComponent, dialogConfig);
    return dialogRef.afterClosed().pipe(
      map((result) => {
        return result;
      })
    );
  }
}
