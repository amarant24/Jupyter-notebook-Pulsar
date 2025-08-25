const { Dispatcher } = require('flux');

class NotebookDispatcher extends Dispatcher {
  constructor() {
    super();
  }

  // Action creators for notebook operations
  runCell(cellIndex) {
    this.dispatch({
      type: 'run-cell',
      cellIndex
    });
  }

  runCellAndSelectNext(cellIndex) {
    this.dispatch({
      type: 'run-cell',
      cellIndex
    });
    // Auto-select next cell after a short delay
    setTimeout(() => {
      this.selectCell(cellIndex + 1);
    }, 100);
  }

  runCellAndInsertBelow(cellIndex) {
    this.dispatch({
      type: 'run-cell',
      cellIndex
    });
    setTimeout(() => {
      this.insertCellBelow(cellIndex);
    }, 100);
  }

  runAllCells() {
    this.dispatch({
      type: 'run-all-cells'
    });
  }

  insertCellAbove(cellIndex) {
    this.dispatch({
      type: 'insert-cell-above',
      cellIndex
    });
  }

  insertCellBelow(cellIndex) {
    this.dispatch({
      type: 'insert-cell-below',
      cellIndex
    });
  }

  deleteCell(cellIndex) {
    this.dispatch({
      type: 'delete-cell',
      cellIndex
    });
  }

  changeCellType(cellIndex, cellType) {
    this.dispatch({
      type: 'change-cell-type',
      cellIndex,
      cellType
    });
  }

  changeCellTypeToCode(cellIndex) {
    this.changeCellType(cellIndex, 'code');
  }

  changeCellTypeToMarkdown(cellIndex) {
    this.changeCellType(cellIndex, 'markdown');
  }

  changeCellTypeToRaw(cellIndex) {
    this.changeCellType(cellIndex, 'raw');
  }

  updateCellSource(cellIndex, source) {
    this.dispatch({
      type: 'update-cell-source',
      cellIndex,
      source
    });
  }

  selectCell(cellIndex) {
    this.dispatch({
      type: 'select-cell',
      cellIndex
    });
  }

  selectCellAbove(cellIndex) {
    if (cellIndex > 0) {
      this.selectCell(cellIndex - 1);
    }
  }

  selectCellBelow(cellIndex, totalCells) {
    if (cellIndex < totalCells - 1) {
      this.selectCell(cellIndex + 1);
    }
  }

  cutCell(cellIndex) {
    this.dispatch({
      type: 'cut-cell',
      cellIndex
    });
  }

  copyCell(cellIndex) {
    this.dispatch({
      type: 'copy-cell',
      cellIndex
    });
  }

  pasteCellAbove(cellIndex) {
    this.dispatch({
      type: 'paste-cell-above',
      cellIndex
    });
  }

  pasteCellBelow(cellIndex) {
    this.dispatch({
      type: 'paste-cell-below',
      cellIndex
    });
  }

  enterEditMode(cellIndex) {
    this.dispatch({
      type: 'enter-edit-mode',
      cellIndex
    });
  }

  enterCommandMode(cellIndex) {
    this.dispatch({
      type: 'enter-command-mode',
      cellIndex
    });
  }

  interruptKernel() {
    this.dispatch({
      type: 'interrupt-kernel'
    });
  }

  restartKernel() {
    this.dispatch({
      type: 'restart-kernel'
    });
  }

  showTooltip(cellIndex) {
    this.dispatch({
      type: 'show-tooltip',
      cellIndex
    });
  }

  toggleLineComments(cellIndex) {
    this.dispatch({
      type: 'toggle-line-comments',
      cellIndex
    });
  }

  indentOrComplete(cellIndex) {
    this.dispatch({
      type: 'indent-or-complete',
      cellIndex
    });
  }

  renderMarkdown(cellIndex) {
    this.dispatch({
      type: 'render-markdown',
      cellIndex
    });
  }

  saveNotebook() {
    this.dispatch({
      type: 'save-notebook'
    });
  }

  loadNotebook(filePath) {
    this.dispatch({
      type: 'load-notebook',
      filePath
    });
  }
}

// Export singleton instance
module.exports = new NotebookDispatcher();
