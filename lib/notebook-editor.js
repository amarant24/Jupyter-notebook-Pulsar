const { Emitter, Disposable, CompositeDisposable } = require('atom');
const { EventEmitter } = require('events');
const Immutable = require('immutable');
const uuid = require('uuid');
const WebSocket = require('ws');
const path = require('path');
const fs = require('fs');

const dispatcher = require('./dispatcher');
const NotebookEditorView = require('./components/notebook-editor-view');

class NotebookEditor extends EventEmitter {
  constructor(filePath, state = {}) {
    super();

    this.filePath = filePath;
    this.subscriptions = new CompositeDisposable();
    this.emitter = new Emitter();
    this.ws = null;
    this.kernelId = null;

    // Initialize state with Immutable data
    this.state = Immutable.fromJS({
      cells: state.cells || [],
      metadata: state.metadata || {
        kernelspec: {
          display_name: 'Python 3',
          language: 'python',
          name: 'python3'
        }
      },
      nbformat: state.nbformat || 4,
      nbformat_minor: state.nbformat_minor || 4,
      selectedCellIndex: 0,
      kernelStatus: 'disconnected',
      executionCount: 1
    });

    // Register with dispatcher for actions
    this.subscriptions.add(
      dispatcher.register(this.onAction.bind(this))
    );

    this.element = document.createElement('div');
    this.element.className = 'notebook-editor';

    // Load file if path provided
    if (filePath && filePath !== 'pulsar-jupyter-notebook://new') {
      this.loadFile(filePath);
    }

    // Connect to Jupyter kernel
    this.connectToKernel();
  }

  destroy() {
    if (this.ws) {
      this.ws.close();
    }
    this.subscriptions.dispose();
    this.emitter.dispose();
  }

  getTitle() {
    if (this.filePath && this.filePath !== 'pulsar-jupyter-notebook://new') {
      return path.basename(this.filePath);
    }
    return 'Untitled.ipynb';
  }

  getURI() {
    return this.filePath || 'pulsar-jupyter-notebook://new';
  }

  getDefaultLocation() {
    return 'center';
  }

  getAllowedLocations() {
    return ['center'];
  }

  isPermanentDockItem() {
    return false;
  }

  serialize() {
    return {
      deserializer: 'NotebookEditor',
      filePath: this.filePath,
      cells: this.state.get('cells').toJS(),
      metadata: this.state.get('metadata').toJS(),
      nbformat: this.state.get('nbformat'),
      nbformat_minor: this.state.get('nbformat_minor')
    };
  }

  getState() {
    return this.state;
  }

  onAction(action) {
    switch (action.type) {
      case 'run-cell':
        this.runCell(action.cellIndex);
        break;
      case 'insert-cell-above':
        this.insertCellAbove(action.cellIndex);
        break;
      case 'insert-cell-below':
        this.insertCellBelow(action.cellIndex);
        break;
      case 'delete-cell':
        this.deleteCell(action.cellIndex);
        break;
      case 'change-cell-type':
        this.changeCellType(action.cellIndex, action.cellType);
        break;
      case 'update-cell-source':
        this.updateCellSource(action.cellIndex, action.source);
        break;
      case 'select-cell':
        this.selectCell(action.cellIndex);
        break;
    }
  }

  loadFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const notebook = JSON.parse(content);

      this.state = this.state.merge({
        cells: Immutable.fromJS(notebook.cells || []),
        metadata: Immutable.fromJS(notebook.metadata || {}),
        nbformat: notebook.nbformat || 4,
        nbformat_minor: notebook.nbformat_minor || 4
      });

      this._onChange();
    } catch (error) {
      atom.notifications.addError(`Failed to load notebook: ${error.message}`);
    }
  }

  save() {
    if (!this.filePath || this.filePath === 'pulsar-jupyter-notebook://new') {
      return this.saveAs();
    }

    const notebook = {
      cells: this.state.get('cells').toJS(),
      metadata: this.state.get('metadata').toJS(),
      nbformat: this.state.get('nbformat'),
      nbformat_minor: this.state.get('nbformat_minor')
    };

    try {
      fs.writeFileSync(this.filePath, JSON.stringify(notebook, null, 2));
      atom.notifications.addSuccess('Notebook saved successfully');
      return true;
    } catch (error) {
      atom.notifications.addError(`Failed to save notebook: ${error.message}`);
      return false;
    }
  }

  saveAs() {
    return new Promise((resolve) => {
      atom.workspace.getElement().querySelector('atom-workspace').dispatchEvent(
        new CustomEvent('core:save-as')
      );
      resolve();
    });
  }

  getText() {
    const notebook = {
      cells: this.state.get('cells').toJS(),
      metadata: this.state.get('metadata').toJS(),
      nbformat: this.state.get('nbformat'),
      nbformat_minor: this.state.get('nbformat_minor')
    };
    return JSON.stringify(notebook, null, 2);
  }

  setText(text) {
    try {
      const notebook = JSON.parse(text);
      this.state = this.state.merge({
        cells: Immutable.fromJS(notebook.cells || []),
        metadata: Immutable.fromJS(notebook.metadata || {}),
        nbformat: notebook.nbformat || 4,
        nbformat_minor: notebook.nbformat_minor || 4
      });
      this._onChange();
    } catch (error) {
      atom.notifications.addError(`Invalid notebook format: ${error.message}`);
    }
  }

  connectToKernel() {
    const gatewayUrl = atom.config.get('pulsar-jupyter-notebook.kernelGatewayUrl');
    const wsUrl = gatewayUrl.replace('http', 'ws') + '/api/kernels';

    try {
      // First create a kernel session
      fetch(gatewayUrl + '/api/kernels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'python3' })
      })
      .then(response => response.json())
      .then(kernel => {
        this.kernelId = kernel.id;
        this.connectWebSocket(wsUrl + `/${kernel.id}/channels`);
      })
      .catch(error => {
        console.warn('Failed to create kernel session:', error);
        this.setState({ kernelStatus: 'disconnected' });
      });
    } catch (error) {
      console.warn('Failed to connect to kernel gateway:', error);
      this.setState({ kernelStatus: 'disconnected' });
    }
  }

  connectWebSocket(wsUrl) {
    this.ws = new WebSocket(wsUrl);

    this.ws.on('open', () => {
      this.setState({ kernelStatus: 'connected' });
      atom.notifications.addSuccess('Connected to Jupyter kernel');
    });

    this.ws.on('message', (data) => {
      const message = JSON.parse(data);
      this.handleKernelMessage(message);
    });

    this.ws.on('close', () => {
      this.setState({ kernelStatus: 'disconnected' });
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.setState({ kernelStatus: 'disconnected' });
    });
  }

  handleKernelMessage(message) {
    if (message.msg_type === 'execute_result' || message.msg_type === 'display_data') {
      this.updateCellOutput(message.parent_header.msg_id, message.content);
    } else if (message.msg_type === 'stream') {
      this.updateCellOutput(message.parent_header.msg_id, message.content, 'stream');
    } else if (message.msg_type === 'error') {
      this.updateCellOutput(message.parent_header.msg_id, message.content, 'error');
    }
  }

  runCell(cellIndex) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      atom.notifications.addWarning('Kernel not connected');
      return;
    }

    const cell = this.state.getIn(['cells', cellIndex]);
    if (!cell || cell.get('cell_type') !== 'code') {
      return;
    }

    const msgId = uuid.v4();
    const message = {
      header: {
        msg_id: msgId,
        username: 'pulsar',
        session: uuid.v4(),
        msg_type: 'execute_request',
        version: '5.0'
      },
      parent_header: {},
      metadata: {},
      content: {
        code: cell.get('source'),
        silent: false,
        store_history: true,
        user_expressions: {},
        allow_stdin: false
      }
    };

    // Clear previous outputs
    this.state = this.state.setIn(['cells', cellIndex, 'outputs'], Immutable.List());
    this.state = this.state.setIn(['cells', cellIndex, 'execution_count'], this.state.get('executionCount'));
    this.state = this.state.update('executionCount', count => count + 1);

    this.ws.send(JSON.stringify(message));
    this._onChange();
  }

  updateCellOutput(msgId, content, outputType = 'execute_result') {
    // Find cell by message ID - for simplicity, update the selected cell
    const selectedIndex = this.state.get('selectedCellIndex');
    const outputs = this.state.getIn(['cells', selectedIndex, 'outputs']) || Immutable.List();

    const newOutput = Immutable.fromJS({
      output_type: outputType,
      data: content.data || { 'text/plain': content.text || content.traceback?.join('\n') || '' },
      metadata: content.metadata || {},
      execution_count: outputType === 'execute_result' ? content.execution_count : null
    });

    this.state = this.state.setIn(['cells', selectedIndex, 'outputs'], outputs.push(newOutput));
    this._onChange();
  }

  insertCellAbove(index) {
    const newCell = Immutable.fromJS({
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: ''
    });

    this.state = this.state.update('cells', cells => cells.insert(index, newCell));
    this.state = this.state.set('selectedCellIndex', index);
    this._onChange();
  }

  insertCellBelow(index) {
    const newCell = Immutable.fromJS({
      cell_type: 'code',
      execution_count: null,
      metadata: {},
      outputs: [],
      source: ''
    });

    this.state = this.state.update('cells', cells => cells.insert(index + 1, newCell));
    this.state = this.state.set('selectedCellIndex', index + 1);
    this._onChange();
  }

  deleteCell(index) {
    if (this.state.get('cells').size <= 1) {
      // Don't delete the last cell
      return;
    }

    this.state = this.state.update('cells', cells => cells.delete(index));
    const newSelected = Math.min(index, this.state.get('cells').size - 1);
    this.state = this.state.set('selectedCellIndex', newSelected);
    this._onChange();
  }

  changeCellType(index, cellType) {
    this.state = this.state.setIn(['cells', index, 'cell_type'], cellType);

    // Clear outputs for non-code cells
    if (cellType !== 'code') {
      this.state = this.state.setIn(['cells', index, 'outputs'], Immutable.List());
      this.state = this.state.setIn(['cells', index, 'execution_count'], null);
    }

    this._onChange();
  }

  updateCellSource(index, source) {
    this.state = this.state.setIn(['cells', index, 'source'], source);
    this._onChange();
  }

  selectCell(index) {
    this.state = this.state.set('selectedCellIndex', index);
    this._onChange();
  }

  setState(updates) {
    this.state = this.state.merge(updates);
    this._onChange();
  }

  restartKernel() {
    if (this.kernelId) {
      const gatewayUrl = atom.config.get('pulsar-jupyter-notebook.kernelGatewayUrl');
      fetch(gatewayUrl + `/api/kernels/${this.kernelId}/restart`, { method: 'POST' })
        .then(() => {
          atom.notifications.addSuccess('Kernel restarted');
          this.setState({ executionCount: 1 });
        })
        .catch(error => {
          atom.notifications.addError(`Failed to restart kernel: ${error.message}`);
        });
    }
  }

  _onChange() {
    this.emit('did-change-state');
  }

  // Required methods for Atom/Pulsar text editor interface
  onDidChangeTitle(callback) {
    return this.emitter.on('did-change-title', callback);
  }

  onDidChangeModified(callback) {
    return this.emitter.on('did-change-modified', callback);
  }

  onDidChangePath(callback) {
    return this.emitter.on('did-change-path', callback);
  }

  isModified() {
    return true; // Always show as modified for now
  }
}

module.exports = NotebookEditor;
