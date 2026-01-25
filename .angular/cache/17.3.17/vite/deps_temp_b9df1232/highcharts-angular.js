import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgModule,
  NgZone,
  Output,
  setClassMetadata,
  ɵɵNgOnChangesFeature,
  ɵɵdefineComponent,
  ɵɵdefineInjector,
  ɵɵdefineNgModule,
  ɵɵdirectiveInject
} from "./chunk-YLXROL5I.js";
import "./chunk-UMFZCAJV.js";
import "./chunk-RTBI3O22.js";
import "./chunk-XUJVPDVA.js";
import "./chunk-3OV72XIM.js";

// node_modules/highcharts-angular/fesm2022/highcharts-angular.mjs
var HighchartsChartComponent = class _HighchartsChartComponent {
  constructor(el, _zone) {
    this.el = el;
    this._zone = _zone;
    this.updateChange = new EventEmitter(true);
    this.chartInstance = new EventEmitter();
  }
  ngOnChanges(changes) {
    const update = changes.update?.currentValue;
    if (changes.options || update) {
      this.wrappedUpdateOrCreateChart();
      if (update) {
        this.updateChange.emit(false);
      }
    }
  }
  wrappedUpdateOrCreateChart() {
    if (this.runOutsideAngular) {
      this._zone.runOutsideAngular(() => {
        this.updateOrCreateChart();
      });
    } else {
      this.updateOrCreateChart();
    }
  }
  updateOrCreateChart() {
    if (this.chart?.update) {
      this.chart.update(this.options, true, this.oneToOne || false);
    } else {
      this.chart = this.Highcharts[this.constructorType || "chart"](this.el.nativeElement, this.options, this.callbackFunction || null);
      this.chartInstance.emit(this.chart);
    }
  }
  ngOnDestroy() {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
      this.chartInstance.emit(this.chart);
    }
  }
  static {
    this.ɵfac = function HighchartsChartComponent_Factory(t) {
      return new (t || _HighchartsChartComponent)(ɵɵdirectiveInject(ElementRef), ɵɵdirectiveInject(NgZone));
    };
  }
  static {
    this.ɵcmp = ɵɵdefineComponent({
      type: _HighchartsChartComponent,
      selectors: [["highcharts-chart"]],
      inputs: {
        Highcharts: "Highcharts",
        constructorType: "constructorType",
        callbackFunction: "callbackFunction",
        oneToOne: "oneToOne",
        runOutsideAngular: "runOutsideAngular",
        options: "options",
        update: "update"
      },
      outputs: {
        updateChange: "updateChange",
        chartInstance: "chartInstance"
      },
      features: [ɵɵNgOnChangesFeature],
      decls: 0,
      vars: 0,
      template: function HighchartsChartComponent_Template(rf, ctx) {
      },
      encapsulation: 2
    });
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HighchartsChartComponent, [{
    type: Component,
    args: [{
      selector: "highcharts-chart",
      template: ""
    }]
  }], function() {
    return [{
      type: ElementRef
    }, {
      type: NgZone
    }];
  }, {
    Highcharts: [{
      type: Input
    }],
    constructorType: [{
      type: Input
    }],
    callbackFunction: [{
      type: Input
    }],
    oneToOne: [{
      type: Input
    }],
    runOutsideAngular: [{
      type: Input
    }],
    options: [{
      type: Input
    }],
    update: [{
      type: Input
    }],
    updateChange: [{
      type: Output
    }],
    chartInstance: [{
      type: Output
    }]
  });
})();
var HighchartsChartModule = class _HighchartsChartModule {
  static {
    this.ɵfac = function HighchartsChartModule_Factory(t) {
      return new (t || _HighchartsChartModule)();
    };
  }
  static {
    this.ɵmod = ɵɵdefineNgModule({
      type: _HighchartsChartModule,
      declarations: [HighchartsChartComponent],
      exports: [HighchartsChartComponent]
    });
  }
  static {
    this.ɵinj = ɵɵdefineInjector({});
  }
};
(() => {
  (typeof ngDevMode === "undefined" || ngDevMode) && setClassMetadata(HighchartsChartModule, [{
    type: NgModule,
    args: [{
      declarations: [HighchartsChartComponent],
      exports: [HighchartsChartComponent]
    }]
  }], null, null);
})();
export {
  HighchartsChartComponent,
  HighchartsChartModule
};
//# sourceMappingURL=highcharts-angular.js.map
