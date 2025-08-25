const React = require('react');
const { TextEditor: AtomTextEditor } = require('atom');

class TextEditor extends React.Component {
  constructor(props) {
    super(props);

    this.handleDidChange = this.handleDidChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
  }

  componentDidMount() {
    this.createTextEditor();
  }

  componentDidUpdate(prevProps) {
    if (this.textEditor) {
      // Update text if it changed externally
      if (prevProps.source !== this.props.source &&
          this.textEditor.getText() !== this.props.source) {
        this.textEditor.setText(this.props.source || '');
      }

      // Update grammar based on cell type
      if (prevProps.cellType !== this.props.cellType) {
        this.updateGrammar();
      }
    }
  }

  componentWillUnmount() {
    if (this.textEditor) {
      this.textEditor.destroy();
    }
  }

  createTextEditor() {
    // Create a new Atom text editor
    this.textEditor = new AtomTextEditor({
      mini: false,
      lineNumberGutterVisible: false,
      showInvisibles: false,
      showIndentGuide: true,
      softWrapped: true,
      softWrapAtPreferredLineLength: true,
      preferredLineLength: 80,
      scrollPastEnd: false,
      autoHeight: true,
      autoIndent: true,
      autoIndentNewline: true,
      undoGroupingInterval: 300
    });

    // Set initial text
    this.textEditor.setText(this.props.source || '');

    // Set up event listeners
    this.textEditor.onDidChange(this.handleDidChange);

    // Add keyboard event listener
    this.textEditor.getElement().addEventListener('keydown', this.handleKeyDown);

    // Set grammar based on cell type
    this.updateGrammar();

    // Mount the text editor element
    if (this.refs.editorContainer) {
      this.refs.editorContainer.appendChild(this.textEditor.getElement());
    }

    // Configure editor appearance
    this.configureEditor();
  }

  updateGrammar() {
    if (!this.textEditor) return;

    let grammarScope = 'text.plain';

    switch (this.props.cellType) {
      case 'code':
        grammarScope = 'source.python';
        break;
      case 'markdown':
        grammarScope = 'source.gfm';
        break;
      case 'raw':
        grammarScope = 'text.plain';
        break;
    }

    const grammar = atom.grammars.grammarForScopeName(grammarScope);
    if (grammar) {
      this.textEditor.setGrammar(grammar);
    }
  }

  configureEditor() {
    const element = this.textEditor.getElement();

    // Add CSS classes for styling
    element.classList.add('notebook-text-editor');
    element.classList.add(`${this.props.cellType}-editor`);

    // Configure tab behavior
    this.textEditor.setSoftTabs(true);
    this.textEditor.setTabLength(4);

    // Enable bracket matching
    element.setAttribute('data-grammar', this.textEditor.getGrammar().scopeName);

    // Auto-resize based on content
    this.autoResize();
  }

  autoResize() {
    if (!this.textEditor) return;

    const element = this.textEditor.getElement();
    const lineHeight = this.textEditor.getLineHeightInPixels();
    const lineCount = this.textEditor.getLineCount();
    const minHeight = lineHeight * 1; // Minimum 1 line
    const maxHeight = lineHeight * 20; // Maximum 20 lines
    const desiredHeight = lineHeight * lineCount;

    const height = Math.max(minHeight, Math.min(maxHeight, desiredHeight));
    element.style.height = `${height}px`;
  }

  handleDidChange() {
    if (this.textEditor && this.props.onSourceChange) {
      const newSource = this.textEditor.getText();
      this.props.onSourceChange(newSource);
    }

    // Auto-resize after content change
    setTimeout(() => this.autoResize(), 0);
  }

  handleKeyDown(event) {
    // Pass through to parent for cell-level shortcuts
    if (this.props.onKeyDown) {
      this.props.onKeyDown(event);
    }

    // Handle tab completion for code cells
    if (event.key === 'Tab' && this.props.cellType === 'code' && !event.shiftKey) {
      event.preventDefault();
      event.stopPropagation();

      // Simple indentation for now (could be enhanced with autocomplete)
      const selection = this.textEditor.getSelectedBufferRange();
      if (selection.isEmpty()) {
        this.textEditor.insertText('    '); // 4 spaces
      } else {
        this.textEditor.indentSelectedRows();
      }
    }

    // Handle Shift+Tab for dedent
    if (event.key === 'Tab' && event.shiftKey && this.props.cellType === 'code') {
      event.preventDefault();
      event.stopPropagation();
      this.textEditor.outdentSelectedRows();
    }

    // Handle Ctrl+/ for comments
    if (event.key === '/' && (event.ctrlKey || event.metaKey) && this.props.cellType === 'code') {
      event.preventDefault();
      event.stopPropagation();
      this.toggleLineComments();
    }
  }

  toggleLineComments() {
    if (!this.textEditor) return;

    const selection = this.textEditor.getSelectedBufferRange();
    const startRow = selection.start.row;
    const endRow = selection.end.row;

    // Check if all selected lines are commented
    let allCommented = true;
    for (let row = startRow; row <= endRow; row++) {
      const line = this.textEditor.lineTextForBufferRow(row);
      if (line.trim() && !line.trim().startsWith('#')) {
        allCommented = false;
        break;
      }
    }

    // Toggle comments
    for (let row = startRow; row <= endRow; row++) {
      const line = this.textEditor.lineTextForBufferRow(row);
      if (line.trim()) { // Only modify non-empty lines
        if (allCommented) {
          // Remove comment
          const uncommented = line.replace(/^(\s*)#\s?/, '$1');
          this.textEditor.setTextInBufferRange([[row, 0], [row, line.length]], uncommented);
        } else {
          // Add comment
          const commented = line.replace(/^(\s*)/, '$1# ');
          this.textEditor.setTextInBufferRange([[row, 0], [row, line.length]], commented);
        }
      }
    }
  }

  render() {
    return (
      <div
        ref="editorContainer"
        className="text-editor-container"
        style={{ minHeight: '24px' }}
      />
    );
  }

  // Public methods
  focus() {
    if (this.textEditor) {
      this.textEditor.getElement().focus();
    }
  }

  blur() {
    if (this.textEditor) {
      this.textEditor.getElement().blur();
    }
  }

  getText() {
    return this.textEditor ? this.textEditor.getText() : '';
  }

  setText(text) {
    if (this.textEditor) {
      this.textEditor.setText(text || '');
    }
  }

  getSelectedText() {
    return this.textEditor ? this.textEditor.getSelectedText() : '';
  }

  selectAll() {
    if (this.textEditor) {
      this.textEditor.selectAll();
    }
  }

  undo() {
    if (this.textEditor) {
      this.textEditor.undo();
    }
  }

  redo() {
    if (this.textEditor) {
      this.textEditor.redo();
    }
  }
}

module.exports = TextEditor;
