/** Sample grid config for Code view - replace with API response when loading by id */
export const sampleGridConfig = {
  type: 'grid',
  entity: 'Report',
  context: 'PM',
  restName: 'Report',
  apiOptions: {
    apiConfig: {
      dataConfig: {
        url: 'reports/search',
        params: {} as Record<string, unknown>,
        context: 'PM',
        lLimitKey: 'llimit',
        uLimitKey: 'ulimit',
        requestType: 'POST',
        queryParamsUrl: '$llimit&$ulimit',
        quickFilterKey: 'reportName',
        suppressNullValues: true
      },
      countConfig: {
        url: 'reports/count',
        params: {} as Record<string, unknown>,
        context: 'PM',
        countKey: 'count',
        requestType: 'POST',
        quickFilterKey: 'reportName',
        suppressNullValues: true
      }
    }
  },
  deviceType: 'WEB',
  rowActions: [] as unknown[],
  gridOptions: {
    rowStyle: { cursor: 'pointer' },
    columnDefs: [] as unknown[],
    rowModelType: 'infinite',
    rowSelection: 'multiple',
    suppressCellSelection: true,
    suppressHorizontalScroll: false,
    suppressRowClickSelection: true
  },
  listActions: [] as unknown[],
  footerOption: {} as Record<string, unknown>,
  filterOptions: {
    filterConfig: [] as unknown[],
    bookmarkConfig: { bookmarkType: '', enableBookmark: false },
    suppressFilterTypeSwitch: true
  },
  footerOptions: {} as Record<string, unknown>,
  headerOptions: {
    showTitle: false,
    quickFilter: { placeholder: 'REPORT_NAME' },
    headerBgColor: 'var(--agGridHeaderToolBg)',
    headerColumnColor: 'var(--grayColor700)',
    suppressQuickFilter: true,
    filterButtonPosition: 'right',
    quickSearchAnimationConfig: {} as Record<string, unknown>
  },
  serviceApiKey: '',
  gridDataSource: 'default',
  rowClickAction: [] as unknown[],
  sortingOptions: { sortConfig: [] as unknown[] },
  applicationName: 'PERFORMANCE_MANAGEMENT_APP_NAME',
  componentOptions: {
    exportOptions: { fileName: 'Export', columnConfig: [] as unknown[] },
    treeStructure: false,
    noRowsOverlayConfig: {
      type: 'default',
      title: '',
      message: '',
      iconName: '',
      suppressMessage: true
    }
  },
  multipleListJson: [] as unknown[],
  showWorkflowPreview: true,
  enableRecordsSelection: false
};
