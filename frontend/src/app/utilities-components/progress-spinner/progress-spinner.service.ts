import { ProgressSpinnerComponent } from './progress-spinner.component';
import { Injectable, Injector } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { SpinnerData } from './spinnerData.class';

@Injectable()
export class ProgressSpinnerService {
  private noOfLoadings: OverlayRef[] = [];

  constructor(private overlay: Overlay, private parentInjector: Injector) {}

  show(interruptible?: boolean) {
    if (this.noOfLoadings.length === 0) {
      let overlayRef: OverlayRef = null;
      if (!interruptible) {
        interruptible = false;
      }

      if (interruptible) {
        overlayRef = this.overlay.create();
      } else {
        overlayRef = this.overlay.create({ width: '100%', height: '100%' });
      }

      this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically();
      const injector = this.getInjector(new SpinnerData(interruptible), this.parentInjector);
      const toastPortal = new ComponentPortal(ProgressSpinnerComponent, null, injector);
      overlayRef.attach(toastPortal);

      this.noOfLoadings.push(overlayRef);
    } else {
      this.noOfLoadings.push(null);
    }
  }

  close() {
    const popOverlay = this.noOfLoadings.pop();
    if (popOverlay && this.noOfLoadings.length === 0) {
      popOverlay.dispose();
    }
  }

  closeAll() {
    if (this.noOfLoadings.length > 0 && this.noOfLoadings[0]) {
      this.noOfLoadings[0].dispose();
      this.noOfLoadings = [];
    }
  }

  getInjector(data: SpinnerData, parentInjector: Injector) {
    const tokens = new WeakMap();

    tokens.set(SpinnerData, data);

    return new PortalInjector(parentInjector, tokens);
  }
}
