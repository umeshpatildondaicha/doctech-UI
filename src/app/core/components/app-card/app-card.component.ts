
import { Component, ContentChildren, HostBinding, Input, QueryList } from '@angular/core';
import { AppCardActionsDirective } from './app-card-actions.directive';

@Component({
    selector: 'app-card',
    imports: [],
    templateUrl: './app-card.component.html',
    styleUrl: './app-card.component.scss'
})
export class AppCardComponent {
  /** Optional header title */
  @Input() title?: string;

  /** Optional header subtitle (shown inline next to title) */
  @Input() subtitle?: string;

  /** When true, renders a bottom divider line under the header */
  @Input() divider = false;

  /** When true, uses a tighter spacing + smaller typography */
  @Input() dense = false;

  @ContentChildren(AppCardActionsDirective) private actions?: QueryList<AppCardActionsDirective>;

  @HostBinding('class.app-card--divider')
  get dividerClass(): boolean {
    return this.divider;
  }

  @HostBinding('class.app-card--dense')
  get denseClass(): boolean {
    return this.dense;
  }

  get hasActions(): boolean {
    return (this.actions?.length ?? 0) > 0;
  }

  get showHeader(): boolean {
    return Boolean(this.title || this.subtitle || this.hasActions);
  }
}
