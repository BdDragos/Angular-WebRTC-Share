import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { ToastData } from './toastData.class';

@Component({
  selector: 'app-toast-message',
  templateUrl: './toast-message.component.html',
  styleUrls: ['./toast-message.component.scss'],
})
export class ToastComponent implements OnInit, OnDestroy {
  @ViewChild('toastBox') boxElement: ElementRef;

  @Output() closeEvent = new EventEmitter();

  constructor(public readonly data: ToastData) {}
  color = '';
  type = '';

  ngOnInit() {
    if (this.data.type) {
      if (this.data.type === 'confirmation') {
        this.color = '#A5B200';
        this.type = this.data.type;
      } else if (this.data.type === 'warning') {
        this.color = '#F27019';
        this.type = this.data.type;
      } else if (this.data.type === 'error') {
        this.color = '#B53030';
        this.type = this.data.type;
      } else {
        this.color = '#196FA3';
        this.type = 'info';
      }
    } else {
      this.color = '#196FA3';
      this.type = 'info';
    }
  }

  closeToast() {
    this.closeEvent.emit();
    // this.toastService.closeToast();
  }

  ngOnDestroy() {}
}
