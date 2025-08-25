const { CompositeDisposable } = require('atom');
const NotebookEditor = require('./notebook-editor');
const url = require('url');
const { spawn } = require('child_process');

module.exports = {
  subscriptions: null,
  statusBarTile: null,
  kernelGatewayProcess: null,

  activate() {
    this.subscriptions = new CompositeDisposable();

    // Register opener for .ipynb files
    this.subscriptions.add(
      atom.workspace.addOpener((uriToOpen) => {
        const { protocol, pathname } = url.parse(uriToOpen);
        if (protocol === 'pulsar-jupyter-notebook:' || pathname?.endsWith('.ipynb')) {
          return new NotebookEditor(uriToOpen);
        }
      })
    );

    // Register commands
    this.subscriptions.add(
      atom.commands.add('atom-workspace', {
        'jupyter-notebook:open': () => this.open(),
        'jupyter-notebook:new': () => this.new(),
        'jupyter-notebook:restart-kernel': () => this.restartKernel(),
        'jupyter-notebook:start-kernel-gateway': () => this.startKernelGateway(),
        'jupyter-notebook:stop-kernel-gateway': () => this.stopKernelGateway()
      })
    );

    // Register deserializer for restoring notebooks on restart
    atom.deserializers.add({
      name: 'NotebookEditor',
      deserialize: (state) => new NotebookEditor(state.filePath, state)
    });

    // Auto-start kernel gateway if configured
    if (atom.config.get('pulsar-jupyter-notebook.startKernelGateway')) {
      this.startKernelGateway();
    }
  },

  deactivate() {
    this.subscriptions?.dispose();
    this.statusBarTile?.destroy();
    this.stopKernelGateway();
  },

  consumeStatusBar(statusBar) {
    this.statusBarTile = statusBar.addRightTile({
      item: this.createStatusBarElement(),
      priority: 100
    });
  },

  createStatusBarElement() {
    const element = document.createElement('div');
    element.className = 'jupyter-status inline-block';
    element.innerHTML = '<span class="icon icon-book">Jupyter</span>';
    element.onclick = () => this.open();
    return element;
  },

  open() {
    atom.workspace.open('pulsar-jupyter-notebook://new');
  },

  new() {
    const newNotebook = {
      cells: [],
      metadata: {
        kernelspec: {
          display_name: 'Python 3',
          language: 'python',
          name: 'python3'
        }
      },
      nbformat: 4,
      nbformat_minor: 4
    };

    const editor = new NotebookEditor();
    editor.setText(JSON.stringify(newNotebook, null, 2));
    atom.workspace.getActivePane().addItem(editor);
  },

  restartKernel() {
    const activeItem = atom.workspace.getActivePaneItem();
    if (activeItem instanceof NotebookEditor) {
      activeItem.restartKernel();
    }
  },

  startKernelGateway() {
    if (this.kernelGatewayProcess) {
      console.log('Jupyter Kernel Gateway is already running');
      return;
    }

    const pythonPath = atom.config.get('pulsar-jupyter-notebook.pythonPath');
    const gatewayUrl = atom.config.get('pulsar-jupyter-notebook.kernelGatewayUrl');
    const port = new URL(gatewayUrl).port || '8888';

    console.log('Starting Jupyter Kernel Gateway...');

    this.kernelGatewayProcess = spawn(pythonPath, [
      '-m', 'jupyter_kernel_gateway',
      '--port', port,
      '--allow-origin', '*',
      '--allow-credentials', 'true'
    ]);

    this.kernelGatewayProcess.stdout.on('data', (data) => {
      console.log(`Kernel Gateway: ${data}`);
    });

    this.kernelGatewayProcess.stderr.on('data', (data) => {
      console.warn(`Kernel Gateway Error: ${data}`);
    });

    this.kernelGatewayProcess.on('close', (code) => {
      console.log(`Kernel Gateway exited with code ${code}`);
      this.kernelGatewayProcess = null;
    });

    // Update status bar
    if (this.statusBarTile) {
      const element = this.statusBarTile.getItem();
      element.innerHTML = '<span class="icon icon-book text-success">Jupyter ●</span>';
      element.title = 'Jupyter Kernel Gateway is running';
    }
  },

  stopKernelGateway() {
    if (this.kernelGatewayProcess) {
      console.log('Stopping Jupyter Kernel Gateway...');
      this.kernelGatewayProcess.kill();
      this.kernelGatewayProcess = null;

      // Update status bar
      if (this.statusBarTile) {
        const element = this.statusBarTile.getItem();
        element.innerHTML = '<span class="icon icon-book">Jupyter</span>';
        element.title = 'Click to open Jupyter notebook';
      }
    }
  },

  // Serialization support for Pulsar
  serialize() {
    return {
      deserializer: 'NotebookEditor'
    };
  }
};
