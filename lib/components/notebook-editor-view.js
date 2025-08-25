const React = require('react');
const ReactDOM = require('react-dom');
const NotebookCell = require('./notebook-cell');
const dispatcher = require('../dispatcher');

class NotebookEditorView extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      data: props.notebookEditor.getState()
    };

    this.notebookEditor = props.notebookEditor;

    // Bind event handlers
    this.handleCellClick = this.handleCellClick.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this._onChange = this._onChange.bind(this);
  }

  componentDidMount() {
    // Listen for state changes from the store
    this.notebookEditor.on('did-change-state', this._onChange);

    // Register keyboard commands
    this.subscriptions = atom.commands.add(this.refs.notebookContainer, {
      'jupyter-notebook:run-cell': () => this.runSelectedCell(),
      'jupyter-notebook:run-cell-and-select-next': () => this.runCellAndSelectNext(),
      'jupyter-notebook:run-cell-and-insert-below': () => this.runCellAndInsertBelow(),
      'jupyter-notebook:run-all-cells': () => this.runAllCells(),
      'jupyter-notebook:insert-cell-above': () => this.insertCellAbove(),
      'jupyter-notebook:insert-cell-below': () => this.insertCellBelow(),
      'jupyter-notebook:delete-cell': () => this.deleteSelectedCell(),
      'jupyter-notebook:change-cell-type-code': () => this.changeCellType('code'),
      'jupyter-notebook:change-cell-type-markdown': () => this.changeCellType('markdown'),
      'jupyter-notebook:change-cell-type-raw': () => this.changeCellType('raw'),
      'jupyter-notebook:select-cell-above': () => this.selectCellAbove(),
      'jupyter-notebook:select-cell-below': () => this.selectCellBelow(),
      'jupyter-notebook:cut-cell': () => this.cutSelectedCell(),
      'jupyter-notebook:copy-cell': () => this.copySelectedCell(),
      'jupyter-notebook:paste-cell-above': () => this.pasteCellAbove(),
      'jupyter-notebook:paste-cell-below': () => this.pasteCellBelow(),
      'jupyter-notebook:enter-edit-mode': () => this.enterEditMode(),
      'jupyter-notebook:enter-command-mode': () => this.enterCommandMode(),
      'jupyter-notebook:interrupt-kernel': () => this.interruptKernel(),
      'jupyter-notebook:restart-kernel': () => this.restartKernel()
    });

    // Focus the container for keyboard events
    if (this.refs.notebookContainer) {
      this.refs.notebookContainer.focus();
    }
  }

  componentWillUnmount() {
    this.notebookEditor.off('did-change-state', this._onChange);
    if (this.subscriptions) {
      this.subscriptions.dispose();
    }
  }

  _onChange() {
    this.setState({
      data: this.notebookEditor.getState()
    });
  }

  render() {
    const cells = this.state.data.get('cells');
    const selectedCellIndex = this.state.data.get('selectedCellIndex');
    const kernelStatus = this.state.data.get('kernelStatus');

    if (!cells || cells.size === 0) {
      // Show empty notebook with one default cell
      return (
        <div
          ref="notebookContainer"
          className="notebook-editor"
          tabIndex={0}
          onKeyDown={this.handleKeyDown}
        >
          {this.renderHeader(kernelStatus)}
          <div className="notebook-cells">
            <div className="empty-notebook">
              <p>Empty notebook. Press <kbd>B</kbd> to add a cell.</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        ref="notebookContainer"
        className="notebook-editor"
        tabIndex={0}
        onKeyDown={this.handleKeyDown}
      >
        {this.renderHeader(kernelStatus)}
        <div className="notebook-cells">
          {cells.map((cellData, index) => (
            <NotebookCell
              key={index}
              index={index}
              data={cellData}
              selected={index === selectedCellIndex}
              onClick={() => this.handleCellClick(index)}
              onSourceChange={(source) => this.handleCellSourceChange(index, source)}
              onRun={() => this.runCell(index)}
            />
          )).toArray()}
        </div>
        {this.renderToolbar()}
      </div>
    );
  }

  renderHeader(kernelStatus) {
    const title = this.notebookEditor.getTitle();

    return (
      <div className="notebook-header">
        <div className="notebook-title">{title}</div>
        <div className={`kernel-status ${kernelStatus}`}>
          <span className="status-text">
            {kernelStatus === 'connected' ? '● Python 3' : '○ Disconnected'}
          </span>
        </div>
      </div>
    );
  }

  renderToolbar() {
    return (
      <div className="jupyter-toolbar">
        <div className="btn-group">
          <button
            className="btn btn-sm"
            onClick={() => this.runSelectedCell()}
            title="Run cell (Shift+Enter)"
          >
            <span className="icon icon-playback-play"></span>
          </button>
          <button
            className="btn btn-sm"
            onClick={() => this.insertCellBelow()}
            title="Insert cell below (B)"
          >
            <span className="icon icon-plus"></span>
          </button>
          <button
            className="btn btn-sm"
            onClick={() => this.deleteSelectedCell()}
            title="Delete cell (DD)"
          >
            <span className="icon icon-trashcan"></span>
          </button>
        </div>

        <div className="btn-group">
          <button
            className="btn btn-sm"
            onClick={() => this.changeCellType('code')}
            title="Change to code cell (Y)"
          >
            Code
          </button>
          <button
            className="btn btn-sm"
            onClick={() => this.changeCellType('markdown')}
            title="Change to markdown cell (M)"
          >
            Markdown
          </button>
        </div>

        <div className="btn-group">
          <button
            className="btn btn-sm"
            onClick={() => this.restartKernel()}
            title="Restart kernel (00)"
          >
            <span className="icon icon-sync"></span>
          </button>
        </div>
      </div>
    );
  }

  handleCellClick(index) {
    dispatcher.selectCell(index);
  }

  handleCellSourceChange(index, source) {
    dispatcher.updateCellSource(index, source);
  }

  handleKeyDown(event) {
    // Only handle keyboard shortcuts in command mode (when not editing)
    if (event.target.tagName === 'ATOM-TEXT-EDITOR') {
      return; // Let the text editor handle it
    }

    const selectedIndex = this.state.data.get('selectedCellIndex');

    switch (event.key) {
      case 'a':
        event.preventDefault();
        this.insertCellAbove();
        break;
      case 'b':
        event.preventDefault();
        this.insertCellBelow();
        break;
      case 'y':
        event.preventDefault();
        this.changeCellType('code');
        break;
      case 'm':
        event.preventDefault();
        this.changeCellType('markdown');
        break;
      case 'ArrowUp':
      case 'k':
        event.preventDefault();
        this.selectCellAbove();
        break;
      case 'ArrowDown':
      case 'j':
        event.preventDefault();
        this.selectCellBelow();
        break;
      case 'Enter':
        event.preventDefault();
        this.enterEditMode();
        break;
      case 'Escape':
        event.preventDefault();
        this.enterCommandMode();
        break;
    }

    // Handle double key combinations
    if (event.key === 'd' && this.lastKeyWasD) {
      event.preventDefault();
      this.deleteSelectedCell();
      this.lastKeyWasD = false;
    } else {
      this.lastKeyWasD = (event.key === 'd');
    }

    if (event.key === 'i' && this.lastKeyWasI) {
      event.preventDefault();
      this.interruptKernel();
      this.lastKeyWasI = false;
    } else {
      this.lastKeyWasI = (event.key === 'i');
    }

    if (event.key === '0' && this.lastKeyWasZero) {
      event.preventDefault();
      this.restartKernel();
      this.lastKeyWasZero = false;
    } else {
      this.lastKeyWasZero = (event.key === '0');
    }
  }

  // Command methods
  runSelectedCell() {
    const selectedIndex = this.state.data.get('selectedCellIndex');
    dispatcher.runCell(selectedIndex);
  }

  runCellAndSelectNext() {
    const selectedIndex = this.state.data.get('selectedCellIndex');
    dispatcher.
