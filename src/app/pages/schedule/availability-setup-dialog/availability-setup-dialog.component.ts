import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, computed, inject, Signal, signal, ViewChild } from '@angular/core';
import { AbstractControl, FormArray, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatDialogRef } from '@angular/material/dialog';
import { TimingsService } from '../../../services/timings.service';
import { toSignal } from '@angular/core/rxjs-interop';
import type {
  BaseTimingUpsertRequest,
  DayOfWeek,
  LeaveUpsertRequest,
  OverrideTimingUpsertRequest,
  SchedulingType,
  TimingBreak,
  WeeklyTimingUpsertRequest
} from '../../../interfaces/timings.interface';
import { firstValueFrom } from 'rxjs';
import { startWith } from 'rxjs/operators';
import { DIALOG_DATA_TOKEN } from '@lk/core';

type Weekday = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

type SetupType = 'base' | 'weekly' | 'override' | 'leave';

export interface AvailabilitySetupDialogData {
  doctorId: string;
}

@Component({
  selector: 'app-availability-setup-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './availability-setup-dialog.component.html',
  styleUrl: './availability-setup-dialog.component.scss'
})
export class AvailabilitySetupDialogComponent implements AfterViewInit {
  // -- DI (must be declared before any field that uses them) --
  private readonly fb = inject(FormBuilder);
  private readonly timingsService = inject(TimingsService);
  private readonly dialogRef = inject(MatDialogRef<AvailabilitySetupDialogComponent>);
  readonly data = inject<AvailabilitySetupDialogData>(DIALOG_DATA_TOKEN);

  @ViewChild('stepper') stepper: MatStepper | undefined;

  readonly saving = signal(false);
  readonly apiError = signal<string | null>(null);

  /** When true, show leave screen instead of stepper (avoids scheduling step ever showing for leave) */
  readonly showLeaveScreen = signal(false);

  readonly weekdays: Weekday[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  readonly step1 = this.fb.group({
    setupType: this.fb.control<SetupType | null>(null, { validators: [Validators.required] })
  });

  readonly step2 = this.fb.group({
    schedulingType: this.fb.control<SchedulingType | null>(null, { validators: [Validators.required] })
  });

  readonly step3 = this.fb.group({
    // For weekly
    weekdays: this.fb.control<Weekday[]>([]),
    // For override
    date: this.fb.control<Date | null>(null),
    // For leave
    leaveStart: this.fb.control<Date | null>(null),
    leaveEnd: this.fb.control<Date | null>(null),
    leaveReason: this.fb.control<string>(''),

    // Working hours (base/weekly/override)
    startTime: this.fb.control<string>(''), // "HH:mm"
    endTime: this.fb.control<string>(''), // "HH:mm"
    breaks: this.fb.array([])
  });

  readonly step4 = this.fb.group({
    bufferMinutes: this.fb.control<number>(10),
    emergencyPriority: this.fb.control<boolean>(false),
    slotDurationMinutes: this.fb.control<number>(30),
    maxAppointmentsPerSlot: this.fb.control<number>(1),
    notes: this.fb.control<string>('')
  });

  readonly step5 = this.fb.group({});

  readonly setupType = toSignal(this.step1.controls.setupType.valueChanges.pipe(
    startWith(this.step1.controls.setupType.value)
  ), { initialValue: this.step1.controls.setupType.value });
  readonly schedulingType = toSignal(this.step2.controls.schedulingType.valueChanges.pipe(
    startWith(this.step2.controls.schedulingType.value)
  ), { initialValue: this.step2.controls.schedulingType.value });
  readonly totalSteps = computed(() => (this.setupType() === 'leave' ? 1 : 5));
  readonly progressSteps = computed(() => Array.from({ length: this.totalSteps() }, (_, i) => i));

  /** Step labels for the horizontal stepper (reference "Add new dataset" style) */
  readonly stepLabels = computed(() => {
    if (this.setupType() === 'leave') {
      return ['Mark Leave'];
    }
    return [
      'Type selection',
      'Scheduling type',
      'Working hours',
      'Advanced settings',
      'Review & confirm'
    ];


  });
  showBreakForm = false;

  breakForm = this.fb.group({
    label: this.fb.control<string>('Break'),
    startTime: this.fb.control<string>('', Validators.required),
    endTime: this.fb.control<string>('', Validators.required)
  });
  openBreakForm(): void {
    this.showBreakForm = true;
    this.breakForm.reset({
      label: '',
      startTime: '',
      endTime: ''
    });
  }
  saveBreak(): void {
    if (this.breakForm.invalid) return;

    this.breaksArray.push(
      this.fb.group({
        label: this.breakForm.value.label,
        startTime: this.breakForm.value.startTime,
        endTime: this.breakForm.value.endTime
      })

    );

    this.showBreakForm = false;
    console.log(this.breaksArray.value);

  }
  cancelBreak(): void {
    this.showBreakForm = false;
  }


  /** Current step index (1-based) for "Step X of Y" and stepper state; kept in sync in updateFooterFromStep */
  readonly currentStepIndex = signal(1);

  /** Whether a step is completed (for checkmark in stepper) */
  isStepCompleted(stepOneBased: number): boolean {
    return this.currentStepIndex() > stepOneBased;
  }

  /** Whether a step is the active one */
  isStepActive(stepOneBased: number): boolean {
    return this.currentStepIndex() === stepOneBased;
  }

  /** Calendar month to show for leave; defaults to leaveStart or current month */
  leaveCalendarStart(): Date {
    const start = this.step3.value.leaveStart;
    if (start) return new Date(start.getFullYear(), start.getMonth(), 1);
    return new Date();
  }

  /** Handle date click on leave calendar: first click = start, second = end, third = new start */
  onLeaveDateSelected(d: Date | null): void {
    if (!d) return;
    const day = this.dateToDay(d);
    const start = this.step3.value.leaveStart ? this.dateToDay(this.step3.value.leaveStart) : null;
    const end = this.step3.value.leaveEnd ? this.dateToDay(this.step3.value.leaveEnd) : null;
    if (start === null) {
      this.step3.patchValue({ leaveStart: d, leaveEnd: d });
    } else if (end === null) {
      if (day < start) this.step3.patchValue({ leaveStart: d, leaveEnd: this.step3.value.leaveStart });
      else this.step3.patchValue({ leaveEnd: d });
    } else {
      this.step3.patchValue({ leaveStart: d, leaveEnd: null });
    }
    this.step3.updateValueAndValidity();
    setTimeout(() => this.updateFooterFromStep(), 0);
  }

  private dateToDay(d: Date): number {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  /** CSS class for leave calendar cells: range start, range end, or in-range.
   *  Arrow function so the reference is stable (avoids .bind(this) in template). */
  readonly leaveDateClass = (date: Date): string | string[] => {
    const day = this.dateToDay(date);
    const start = this.step3.value.leaveStart ? this.dateToDay(this.step3.value.leaveStart) : null;
    const end = this.step3.value.leaveEnd ? this.dateToDay(this.step3.value.leaveEnd) : null;
    if (start === null) return [];
    if (day === start && (end === null || day === end)) return 'leave-range leave-range-single';
    if (day === start) return 'leave-range leave-range-start';
    if (end !== null && day === end) return 'leave-range leave-range-end';
    if (end !== null && day > start && day < end) return 'leave-range leave-range-in';
    return [];
  };

  /** Summary text for leave selection e.g. "Selected: Oct 15 - Oct 17 (3 days)" */
  leaveSelectionSummary(): string {
    const a = this.step3.value.leaveStart;
    const b = this.step3.value.leaveEnd;
    if (!a) return 'Select start and end date';
    if (!b) return this.formatDateShort(a) + ' — select end date';
    const start = this.dateToDay(a);
    const end = this.dateToDay(b);
    if (start > end) return 'Select start and end date';
    const days = Math.round((end - start) / (24 * 60 * 60 * 1000)) + 1;
    if (days === 1) return 'Selected: ' + this.formatDateShort(a) + ' (1 day)';
    return `Selected: ${this.formatDateShort(a)} - ${this.formatDateShort(b)} (${days} days)`;
  }

  private formatDateShort(d: Date): string {
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  }

  readonly bufferOptions = [0, 5, 10, 15, 20, 30];

  readonly overview = computed(() => {


    const setupType = this.setupType();
    const schedulingType = this.schedulingType();


    const start = this.step3.value.startTime || '';
    const end = this.step3.value.endTime || '';

    this.step3Changes();
    this.step4Changes();

    const slotDuration = Number(this.step4.value.slotDurationMinutes ?? 0);
    const maxPerSlot = Number(this.step4.value.maxAppointmentsPerSlot ?? 1);
    const bufferMinutes = Number(this.step4.value.bufferMinutes ?? 0);
    const emergency = !!this.step4.value.emergencyPriority;

    const shiftMinutes = this.diffMinutes(start, end);

    const breaks = this.breaksArray.value ?? [];
    const breakMinutes = (breaks as any[]).reduce(
      (acc, b) => acc + this.diffMinutes(b?.startTime, b?.endTime),
      0
    );

    const netMinutes = Math.max(0, shiftMinutes - breakMinutes);

    let effectiveSlot = 0;
    let slotsPerDay: number | null = null;

    // ✅ Only for fixed slots
    if (schedulingType === 'slots' && slotDuration > 0) {

      // Slot + buffer
      effectiveSlot = slotDuration + bufferMinutes;

      if (effectiveSlot > 0) {
        slotsPerDay = Math.floor(netMinutes / effectiveSlot);
      }

      // Emergency reserve (reduce 1 slot)
      if (emergency && slotsPerDay && slotsPerDay > 0) {
        slotsPerDay = slotsPerDay - 1;
      }
    }

    const estimatedAppointments =
      schedulingType === 'slots' && slotsPerDay !== null
        ? Math.max(0, slotsPerDay) * Math.max(1, maxPerSlot)
        : null;

    return {
      showTimeline: setupType !== 'leave',
      shiftMinutes,
      breakMinutes,
      netMinutes,
      slotsPerDay,
      estimatedAppointments
    };
  });




  get breaksArray(): FormArray {
    return this.step3.get('breaks') as FormArray;
  }
  readonly step3Changes!: Signal<any>;
  readonly step4Changes!: Signal<any>

  constructor() {
    this.step3Changes = toSignal(
      this.step3.valueChanges.pipe(startWith(this.step3.value))
    );
    this.step4Changes = toSignal(
      this.step4.valueChanges.pipe(startWith(this.step4.value))
    );
    // this.step1.patchValue({
    //   setupType: 'base'
    // });
    console.log("Step1 full value:", this.step1.value);


    this.step3.patchValue({ startTime: '09:00', endTime: '17:00' });
    // this.addBreak({ label: 'Lunch Break', startTime: '12:30', endTime: '13:30' });
  }

  ngAfterViewInit(): void {
    this.registerWithDialogHost();
    if (this.stepper?.selectionChange) {
      this.stepper.selectionChange.pipe(startWith(null)).subscribe(() => {
        setTimeout(() => this.updateFooterFromStep(), 0);
      });
    }
    setTimeout(() => this.updateFooterFromStep(), 0);
  }

  /** Register this instance with the core dialog host so footer buttons call our methods */
  private registerWithDialogHost(): void {
    const host = (this.dialogRef as any)?.componentInstance;
    if (host?.data?.componentData) {
      host.data.componentData.componentInstance = this;
    }
    // Patch host to intercept 'back' action (host only natively handles 'apply'/'reset')
    if (host && typeof host.onFooterActionClick === 'function') {
      const original = host.onFooterActionClick.bind(host);
      host.onFooterActionClick = (actionId: string, event: any) => {
        if (actionId === 'back') {
          this.back();
          return;
        }
        original(actionId, event);
      };
    }
  }

  /** Called when user clicks the primary footer button (Next / Confirm & Save) */
  apply(): void {
    // Leave path: if on leave screen, finish; otherwise should not happen (leave screen opens immediately on selection)
    if (this.setupType() === 'leave' && this.showLeaveScreen()) {
      this.finishSetup();
      return;
    }
    // Stepper path: advance or finish
    if (!this.stepper) return;
    const isLast = this.stepper.selectedIndex >= this.stepper.steps.length - 1;
    if (isLast) {
      this.finishSetup();
      return;
    }
    this.stepper.next();
    setTimeout(() => this.updateFooterFromStep(), 0);
  }

  /** Called when user clicks the footer Back button */
  back(): void {
    if (this.setupType() === 'leave' && this.showLeaveScreen()) {
      this.showLeaveScreen.set(false);
      setTimeout(() => this.updateFooterFromStep(), 0);
      return;
    }
    if (this.stepper && this.stepper.selectedIndex > 0) {
      this.stepper.previous();
      setTimeout(() => this.updateFooterFromStep(), 0);
    }
  }

  /** Update core dialog footer button labels, visibility, and disabled state */
  private updateFooterFromStep(): void {
    const host = (this.dialogRef as any)?.componentInstance;
    const onLeaveScreen = this.setupType() === 'leave' && this.showLeaveScreen();
    const idx = this.stepper?.selectedIndex ?? 0;
    const stepOneBased = onLeaveScreen ? 2 : idx + 1;
    this.currentStepIndex.set(Math.min(Math.max(stepOneBased, 1), this.totalSteps()));

    if (!host?.updateFooterActions || !host?.setFooterActionDisabled) return;

    const isFirst = !onLeaveScreen && idx === 0 && !this.showLeaveScreen();
    const isLast = onLeaveScreen || (this.stepper ? idx >= this.stepper.steps.length - 1 : false);

    // Update dialog title + footer center text (Step X of Y)
    let needsDetect = false;
    if (host.data?.title !== undefined) {
      host.data.title = onLeaveScreen ? 'Mark Leave' : 'Availability Setup';
      needsDetect = true;
    }
    if (host.data) {
      host.data.footerCenterText = `Step ${this.currentStepIndex()} of ${this.totalSteps()}`;
      needsDetect = true;
    }
    if (needsDetect) {
      host.changeDetectorRef?.detectChanges();
    }

    // Determine primary button text
    let primaryText = 'Next';
    if (this.saving()) {
      primaryText = 'Saving…';
    } else if (isLast) {
      primaryText = this.setupType() === 'leave' ? 'Confirm Leave' : 'Save Availability';
    }

    // Build footer actions: filter out Back on first step, update primary text
    host.updateFooterActions((actions: any[]) => {
      // Ensure back action exists in list
      const hasBack = actions.some((a: any) => a.id === 'back');
      let list = hasBack ? actions : [
        ...actions.slice(0, 1),
        { id: 'back', text: 'Previous', color: 'secondary', appearance: 'stroked' },
        ...actions.slice(1)
      ];
      const normalized = list
        .filter((a: any) => !(a.id === 'back' && isFirst))
        .map((a: any) => (a.id === 'apply' ? { ...a, text: primaryText } : a));

      // Force footer ordering for this wizard:
      // Previous (leftmost), Cancel, ...others..., Next (rightmost)
      const apply = normalized.find((a: any) => a.id === 'apply');
      const rest = normalized.filter((a: any) => a.id !== 'apply');
      const priority: Record<string, number> = { back: 0, cancel: 1 };
      rest.sort((a: any, b: any) => (priority[a.id] ?? 100) - (priority[b.id] ?? 100));

      return apply ? [...rest, apply] : rest;
    });

    host.setFooterActionDisabled('apply', this.saving() || !this.canAdvance());
  }

  /** Whether the primary footer button (Next/Confirm) can be used on the current step */
  private canAdvance(): boolean {
    // Leave path (no stepper)
    if (this.setupType() === 'leave') {
      return this.showLeaveScreen() ? this.canFinish() : this.canGoStep2();
    }
    // Stepper path (base / weekly / override)
    const idx = this.stepper?.selectedIndex ?? 0;
    if (idx === 0) return this.canGoStep2();
    if (idx === 1) return this.canGoStep3();
    if (idx === 2) return this.step3.valid;
    if (idx === 3) return true; // step 4 (advanced) is always optional
    return this.canFinish();
  }

  // ---- UI helpers ----

  setSetupType(t: SetupType): void {
    console.log("clicked", t)
    this.step1.patchValue({ setupType: t });
    this.apiError.set(null);
    this.applyStep3Validators(t);
    if (t === 'leave') {
      // Immediately show leave screen when "Mark Leave" is selected
      this.showLeaveScreen.set(true);
    } else {
      // Reset leave screen flag for non-leave types
      this.showLeaveScreen.set(false);
      const v = this.step3.value;
      if (!v.startTime) this.step3.patchValue({ startTime: '09:00' });
      if (!v.endTime) this.step3.patchValue({ endTime: '17:00' });
    }
    setTimeout(() => this.updateFooterFromStep(), 0);
  }

  selectSchedulingType(t: SchedulingType): void {
    this.step2.patchValue({ schedulingType: t });
    this.step2.updateValueAndValidity();
    this.apiError.set(null);
    setTimeout(() => this.updateFooterFromStep(), 0);
  }

  private readonly leaveDateRangeValidator = (control: AbstractControl): ValidationErrors | null => {
    const start = control.get('leaveStart')?.value as Date | null;
    const end = control.get('leaveEnd')?.value as Date | null;
    if (!start || !end) return null;
    return start.getTime() <= end.getTime() ? null : { leaveDateRange: true };
  };

  private applyStep3Validators(t: SetupType): void {

    const startTime = this.step3.get('startTime');
    const endTime = this.step3.get('endTime');
    const weekdays = this.step3.get('weekdays');
    const date = this.step3.get('date');
    const leaveStart = this.step3.get('leaveStart');
    const leaveEnd = this.step3.get('leaveEnd');

    // ✅ START / END TIME
    if (t !== 'leave') {
      startTime?.setValidators([Validators.required]);
      endTime?.setValidators([Validators.required]);
    } else {
      startTime?.clearValidators();
      endTime?.clearValidators();
      startTime?.setErrors(null);
      endTime?.setErrors(null);
    }

    // ✅ WEEKLY
    if (t === 'weekly') {
      weekdays?.setValidators([Validators.required]);
    } else {
      weekdays?.clearValidators();
      weekdays?.setErrors(null);
      weekdays?.markAsPristine();
      weekdays?.markAsUntouched();
    }

    // ✅ OVERRIDE
    if (t === 'override') {
      date?.setValidators([Validators.required]);
    } else {
      date?.clearValidators();
      date?.setErrors(null);
    }

    // ✅ LEAVE
    if (t === 'leave') {
      leaveStart?.setValidators([Validators.required]);
      leaveEnd?.setValidators([Validators.required]);
    } else {
      leaveStart?.clearValidators();
      leaveEnd?.clearValidators();
      leaveStart?.setErrors(null);
      leaveEnd?.setErrors(null);
    }

    this.step3.updateValueAndValidity();
  }



  toggleWeekday(day: Weekday): void {
    const current = new Set(this.step3.value.weekdays || []);
    if (current.has(day)) current.delete(day);
    else current.add(day);
    this.step3.patchValue({ weekdays: Array.from(current) });
  }

  addBreak(seed?: Partial<TimingBreak>): void {
    this.breaksArray.push(
      this.fb.group({
        label: this.fb.control<string>(seed?.label ?? 'Break'),
        startTime: this.fb.control<string>(seed?.startTime ?? '', { validators: [Validators.required] }),
        endTime: this.fb.control<string>(seed?.endTime ?? '', { validators: [Validators.required] })
      })
    );
  }

  removeBreak(i: number): void {
    this.breaksArray.removeAt(i);
  }

  close(): void {
    this.dialogRef.close(false);
  }

  // ---- Validation gates ----

  canGoStep2(): boolean {
    return this.step1.valid;
  }

  canGoStep3(): boolean {
    return this.step2.valid;
  }

  canFinish(): boolean {

    const setupType = this.step1.get('setupType')?.value;
    const schedulingType = this.step2.get('schedulingType')?.value;

    const startTime = this.step3.get('startTime')?.value;
    const endTime = this.step3.get('endTime')?.value;

    if (!setupType) return false;
    if (!schedulingType) return false;

    if (setupType === 'leave') {
      const a = this.step3.get('leaveStart')?.value;
      const b = this.step3.get('leaveEnd')?.value;
      return !!a && !!b && a <= b;
    }

    // For base / weekly / override
    if (!startTime || !endTime) return false;

    if (setupType === 'weekly') {
      const days = this.step3.get('weekdays')?.value;
      return !!days && days.length > 0;
    }

    if (setupType === 'override') {
      return !!this.step3.get('date')?.value;
    }

    return true;
  }



  getSetupTypeLabel(): string {

    const type = this.step1.get('setupType')?.value;

    switch (type) {
      case 'base': return 'Daily routine (base availability)';
      case 'weekly': return 'Weekly schedule';
      case 'override': return 'One special day (date override)';
      case 'leave': return 'Leave & absences';
      default: return '';
    }

  }

  getHoursLabel(): string {
    const mins = this.overview().shiftMinutes;
    if (!mins) return '0 hours total';
    const hours = Math.floor(mins / 60);
    const remaining = mins % 60;
    if (remaining === 0) return `${hours} hours total`;
    return `${hours}h ${remaining}m total`;
  }

  getPriorityLabel(): string {
    switch (this.setupType()) {
      case 'leave':
        return 'P1';
      case 'override':
        return 'P2';
      case 'weekly':
        return 'P3';
      case 'base':
        return 'P4';
      default:
        return '—';
    }
  }

  getAppliesToLabel(): string {
    const t = this.setupType();
    if (!t) return '—';

    if (t === 'base') return 'Default (when no higher priority rule matches)';

    if (t === 'weekly') {
      const days = this.step3.value.weekdays ?? [];
      if (!days.length) return '—';
      return days.map((d) => d.slice(0, 3).toUpperCase()).join(', ');
    }

    if (t === 'override') {
      const d = this.step3.value.date;
      return d ? this.formatDateLong(d) : '—';
    }

    const a = this.step3.value.leaveStart;
    const b = this.step3.value.leaveEnd;
    if (!a || !b) return '—';
    const left = this.formatDateLong(a);
    const right = this.formatDateLong(b);
    return left === right ? left : `${left} – ${right}`;
  }

  // ---- Save ----

  async finishSetup(): Promise<void> {
    if (!this.canFinish() || this.saving()) return;
    this.saving.set(true);
    this.updateFooterFromStep();
    this.apiError.set(null);

    const doctorId = this.data.doctorId;
    const setupType = this.setupType()!;

    const notes = (this.step4.value.notes || '').trim();
    const emergency = !!this.step4.value.emergencyPriority;
    const notesFinal = emergency ? [notes, 'Emergency priority enabled'].filter(Boolean).join(' · ') : notes;

    try {
      if (setupType === 'leave') {
        const body: LeaveUpsertRequest = {
          startDate: this.toIsoDateOnly(this.step3.value.leaveStart!),
          endDate: this.toIsoDateOnly(this.step3.value.leaveEnd!),
          isFullDay: true,
          reason: (this.step3.value.leaveReason || '').trim() || undefined
        };

        await firstValueFrom(this.timingsService.createLeave(doctorId, body));
        this.dialogRef.close(true);
        return;
      }

      const schedulingType = this.schedulingType()!;
      const baseBody: BaseTimingUpsertRequest = {
        startTime: this.step3.value.startTime!,
        endTime: this.step3.value.endTime!,
        breaks: this.serializeBreaks(),
        schedulingType: schedulingType,
        slotDurationMinutes: schedulingType === 'slots'
          ? Number(this.step4.value.slotDurationMinutes ?? 0)
          : undefined,
        maxAppointmentsPerSlot: schedulingType === 'slots'
          ? Number(this.step4.value.maxAppointmentsPerSlot ?? 1)
          : undefined,
        bufferTimeSeconds: Number(this.step4.value.bufferMinutes ?? 0) * 60,
        notes: notesFinal || undefined
      };

      let req$;
      if (setupType === 'base') {
        req$ = this.timingsService.upsertBase(doctorId, baseBody);
      } else if (setupType === 'override') {
        req$ = this.timingsService.createOverride(doctorId, {
          ...(baseBody as OverrideTimingUpsertRequest),
          date: this.toIsoDateOnly(this.step3.value.date!)
        });
      } else {
        req$ = this.timingsService.createWeekly(doctorId, {
          ...(baseBody as WeeklyTimingUpsertRequest),
          weekdays: this.mapWeekdaysToEnum(this.step3.value.weekdays ?? [])
        });
      }

      await firstValueFrom(req$);
      this.dialogRef.close(true);
    } catch (e: any) {
      this.apiError.set(e?.error?.message || e?.message || 'Failed to save availability.');
    } finally {
      this.saving.set(false);
      this.updateFooterFromStep();
    }
  }

  // ---- Serialization helpers ----

  private serializeBreaks(): TimingBreak[] {
    const raw = (this.breaksArray.value ?? []) as any[];
    return raw
      .filter((b) => !!b?.startTime && !!b?.endTime)
      .map((b) => ({
        label: (b.label || 'Break').toString(),
        startTime: String(b.startTime),
        endTime: String(b.endTime)
      }));
  }

  private mapWeekdaysToEnum(days: Weekday[]): DayOfWeek[] {
    const map: Record<Weekday, DayOfWeek> = {
      Monday: 'MONDAY',
      Tuesday: 'TUESDAY',
      Wednesday: 'WEDNESDAY',
      Thursday: 'THURSDAY',
      Friday: 'FRIDAY',
      Saturday: 'SATURDAY',
      Sunday: 'SUNDAY'
    };
    return (days ?? []).map((d) => map[d]).filter(Boolean);
  }

  private toIsoDateOnly(d: Date): string {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private formatDateLong(d: Date): string {
    return d.toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  }

  private diffMinutes(a: string | null | undefined, b: string | null | undefined): number {
    if (!a || !b || !/^\d{2}:\d{2}$/.test(a) || !/^\d{2}:\d{2}$/.test(b)) return 0;
    const [ah, am] = a.split(':').map(Number);
    const [bh, bm] = b.split(':').map(Number);
    const start = ah * 60 + am;
    const end = bh * 60 + bm;
    return Math.max(0, end - start);
  }

  timelineGradient(): string {
    const inactive = 'rgba(148, 163, 184, 0.35)'; // slate-400
    const working = 'rgba(59, 130, 246, 0.90)'; // blue-500
    const brk = 'rgba(245, 158, 11, 0.92)'; // amber-500

    const start = this.toMinuteOfDay(this.step3.value.startTime);
    const end = this.toMinuteOfDay(this.step3.value.endTime);
    if (start === null || end === null || end <= start) {
      return `linear-gradient(to right, ${inactive} 0%, ${inactive} 100%)`;
    }

    const breaks = this.serializeBreaks()
      .map((b) => ({
        s: this.toMinuteOfDay(b.startTime) ?? 0,
        e: this.toMinuteOfDay(b.endTime) ?? 0
      }))
      .filter((b) => b.e > b.s)
      .sort((a, b) => a.s - b.s);

    const pct = (m: number) => (Math.min(1440, Math.max(0, m)) / 1440) * 100;

    const stops: string[] = [];
    stops.push(`${inactive} 0%`, `${inactive} ${pct(start)}%`);

    let cursor = start;
    for (const b of breaks) {
      const bs = Math.min(end, Math.max(start, b.s));
      const be = Math.min(end, Math.max(start, b.e));
      if (be <= cursor) continue;
      if (bs > cursor) {
        stops.push(`${working} ${pct(cursor)}%`, `${working} ${pct(bs)}%`);
      }
      stops.push(`${brk} ${pct(bs)}%`, `${brk} ${pct(be)}%`);
      cursor = be;
    }

    if (cursor < end) {
      stops.push(`${working} ${pct(cursor)}%`, `${working} ${pct(end)}%`);
    }
    stops.push(`${inactive} ${pct(end)}%`, `${inactive} 100%`);

    return `linear-gradient(to right, ${stops.join(', ')})`;
  }

  private toMinuteOfDay(t: string | null | undefined): number | null {
    if (!t || !/^\d{2}:\d{2}$/.test(t)) return null;
    const [h, m] = t.split(':').map(Number);
    if (Number.isNaN(h) || Number.isNaN(m)) return null;
    return h * 60 + m;
  }
}