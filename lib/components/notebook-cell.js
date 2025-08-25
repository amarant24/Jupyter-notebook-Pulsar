const React = require('react');
const TextEditor = require('./text-editor');
const DisplayArea = require('./display-area');

class NotebookCell extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      editMode: false,
      renderedMarkdown: null
    };

    this.handleClick = this.handleClick.bind(this);
    this.handleDoubleClick = this.handleDoubleClick.bind(this);
    this.handleSourceChange = this.handleSourceChange.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.renderMarkdown = this.renderMarkdown.bind(this);
  }

  componentDidMount() {
    // Render markdown for markdown cells
    if (this.props.data.get('cell_type') === 'markdown') {
      this.renderMarkdown();
    }
  }

  componentDidUpdate(prevProps) {
    // Re-render markdown if source changed
    if (this.props.data.get('cell_type') === 'markdown' &&
        this.props.data.get('source') !== prevProps.data.get('source')) {
      this.renderMarkdown();
    }
  }

  render() {
    const { data, selected, index } = this.props;
    const cellType = data.get('cell_type');
    const source = data.get('source');
    const outputs = data.get('outputs');
    const executionCount = data.get('execution_count');

    const cellClasses = [
      'notebook-cell',
      `${cellType}-cell`,
      selected ? 'selected' : '',
      this.state.editMode ? 'edit-mode' : 'command-mode'
    ].filter(Boolean).join(' ');

    return (
      <div
        className={cellClasses}
        onClick={this.handleClick}
        onDoubleClick={this.handleDoubleClick}
      >
        <div className="cell-container">
          {this.renderPrompt(cellType, executionCount)}
          <div className="cell-content">
            {this.renderInput(cellType, source)}
            {this.renderOutput(cellType, outputs)}
          </div>
        </div>
      </div>
    );
  }

  renderPrompt(cellType, executionCount) {
    let promptText = '';
    let promptClass = 'cell-prompt';

    switch (cellType) {
      case 'code':
        promptText = executionCount ? `[${executionCount}]` : '[ ]';
        promptClass += ' code-prompt';
        break;
      case 'markdown':
        promptText = 'Md';
        promptClass += ' markdown-prompt';
        break;
      case 'raw':
        promptText = 'Raw';
        promptClass += ' raw-prompt';
        break;
      default:
        promptText = '';
    }

    return (
      <div className={promptClass}>
        {promptText}
      </div>
    );
  }

  renderInput(cellType, source) {
    if (cellType === 'markdown' && !this.state.editMode && this.state.renderedMarkdown) {
      return (
        <div className="cell-input">
          <div
            className="markdown-preview"
            dangerouslySetInnerHTML={{ __html: this.state.renderedMarkdown }}
          />
        </div>
      );
    }

    return (
      <div className="cell-input">
        <TextEditor
          ref="textEditor"
          source={source || ''}
          cellType={cellType}
          selected={this.props.selected}
          onSourceChange={this.handleSourceChange}
          onKeyDown={this.handleKeyDown}
          onRun={this.props.onRun}
        />
      </div>
    );
  }

  renderOutput(cellType, outputs) {
    if (cellType !== 'code' || !outputs || outputs.size === 0) {
      return null;
    }

    return (
      <div className="cell-output">
        {outputs.map((output, index) => (
          <DisplayArea
            key={index}
            data={output}
          />
        )).toArray()}
      </div>
    );
  }

  handleClick(event) {
    event.stopPropagation();
    if (this.props.onClick) {
      this.props.onClick();
    }
  }

  handleDoubleClick(event) {
    event.stopPropagation();

    // Double-click to enter edit mode for markdown cells
    if (this.props.data.get('cell_type') === 'markdown') {
      this.setState({ editMode: true });

      // Focus the text editor
      setTimeout(() => {
        if (this.refs.textEditor) {
          this.refs.textEditor.focus();
        }
      }, 10);
    }
  }

  handleSourceChange(source) {
    if (this.props.onSourceChange) {
      this.props.onSourceChange(source);
    }
  }

  handleKeyDown(event) {
    // Handle cell-specific keyboard shortcuts
    if (event.shiftKey && event.key === 'Enter') {
      event.preventDefault();
      event.stopPropagation();

      if (this.props.data.get('cell_type') === 'code') {
        // Run code cell
        if (this.props.onRun) {
          this.props.onRun();
        }
      } else if (this.props.data.get('cell_type') === 'markdown') {
        // Render markdown and exit edit mode
        this.renderMarkdown();
        this.setState({ editMode: false });
      }
    }

    if (event.key === 'Escape') {
      // Exit edit mode for markdown cells
      if (this.props.data.get('cell_type') === 'markdown') {
        this.renderMarkdown();
        this.setState({ editMode: false });
      }
    }
  }

  renderMarkdown() {
    const source = this.props.data.get('source') || '';

    if (!source.trim()) {
      this.setState({ renderedMarkdown: '<p><em>Empty markdown cell</em></p>' });
      return;
    }

    // Simple markdown rendering (you might want to use a proper markdown library)
    let html = source
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold and italic
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      // Code blocks
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      // Line breaks
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');

    // Wrap in paragraphs if not already wrapped
    if (!html.startsWith('<h') && !html.startsWith('<p') && !html.startsWith('<pre')) {
      html = '<p>' + html + '</p>';
    }

    this.setState({ renderedMarkdown: html });
  }

  focus() {
    if (this.refs.textEditor) {
      this.refs.textEditor.focus();
    }
  }

  blur() {
    if (this.refs.textEditor) {
      this.refs.textEditor.blur();
    }
  }
}

module.exports = NotebookCell;
