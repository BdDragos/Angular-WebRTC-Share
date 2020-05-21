import { ToastComponent } from './toast-message.component';
import { Injectable, Injector, ComponentRef } from '@angular/core';
import { Overlay, OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal, PortalInjector } from '@angular/cdk/portal';
import { ToastData } from './toastData.class';

@Injectable()
export class ToastService {
  private previousTimeout = null;
  private previousPromise = null;
  private overlayRef: OverlayRef;

  constructor(private overlay: Overlay, private parentInjector: Injector) {}

  show(data: ToastData) {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      clearTimeout(this.previousTimeout);
      Promise.resolve(this.previousPromise);
    }

    this.overlayRef = this.overlay.create();
    const injector = this.getInjector(data, this.parentInjector);
    const toastPortal = new ComponentPortal(ToastComponent, null, injector);

    const compRef: ComponentRef<ToastComponent> = this.overlayRef.attach(toastPortal);

    this.previousPromise = new Promise(resolve => {
      this.previousTimeout = setTimeout(() => {
        this.overlayRef.dispose();
        this.overlayRef = null;
        resolve(false);
      }, 10000);
    });

    const eventSub = compRef.instance.closeEvent.subscribe(() => {
      this.closeToast();
      eventSub.unsubscribe();
    });

    return this.previousPromise;
  }

  closeToast() {
    clearTimeout(this.previousTimeout);
    this.overlayRef.dispose();
    this.overlayRef = null;
  }

  getInjector(data: ToastData, parentInjector: Injector) {
    const tokens = new WeakMap();

    tokens.set(ToastData, data);

    return new PortalInjector(parentInjector, tokens);
  }
}
