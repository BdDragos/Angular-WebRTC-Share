import { Component, ViewChild, ElementRef } from '@angular/core';
import { SpinnerData } from './spinnerData.class';

@Component({
  selector: 'app-progress-spinner',
  templateUrl: './progress-spinner.component.html',
  styleUrls: ['./progress-spinner.component.scss'],
})
export class ProgressSpinnerComponent {
  @ViewChild('loadingComponentMain') private loadingComponentMain: ElementRef;

  constructor(public readonly data: SpinnerData) {}

  close() {
    this.loadingComponentMain.nativeElement.parentElement.removeChild(this.loadingComponentMain.nativeElement);
  }
}
