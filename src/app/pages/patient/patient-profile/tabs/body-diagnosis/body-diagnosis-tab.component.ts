import { Component, Input } from '@angular/core';
import { FullBodyDiagnosisComponent } from '../../../../full-body-diagnosis/full-body-diagnosis.component';

@Component({
  selector: 'app-body-diagnosis-tab',
  standalone: true,
  imports: [FullBodyDiagnosisComponent],
  templateUrl: './body-diagnosis-tab.component.html',
  styleUrl: './body-diagnosis-tab.component.scss'
})
export class BodyDiagnosisTabComponent {
  @Input() patientId: string = '';
  @Input() patientName: string = '';
}
