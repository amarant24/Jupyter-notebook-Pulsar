const React = require('react');

class DisplayArea extends React.Component {
  constructor(props) {
    super(props);

    this.renderOutput = this.renderOutput.bind(this);
  }

  render() {
    const { data } = this.props;

    if (!data) {
      return null;
    }

    const outputType = data.get('output_type');
    const outputClasses = `output-area output-${outputType}`;

    return (
      <div className={outputClasses}>
        {this.renderOutput(data)}
      </div>
    );
  }

  renderOutput(data) {
    const outputType = data.get('output_type');

    switch (outputType) {
      case 'execute_result':
      case 'display_data':
        return this.renderDisplayData(data);
      case 'stream':
        return this.renderStream(data);
      case 'error':
        return this.renderError(data);
      default:
        return this.renderUnknown(data);
    }
  }

  renderDisplayData(data) {
    const dataContent = data.get('data');
    if (!dataContent) {
      return null;
    }

    // Priority order for display formats
    const formats = [
      'text/html',
      'image/png',
      'image/jpeg',
      'image/svg+xml',
      'application/json',
      'text/markdown',
      'text/latex',
      'text/plain'
    ];

    for (const format of formats) {
      if (dataContent.has(format)) {
        return this.renderFormat(format, dataContent.get(format), data);
      }
    }

    return this.renderPlainText(dataContent.get('text/plain') || 'No displayable output');
  }

  renderFormat(mimeType, content, data) {
    switch (mimeType) {
      case 'text/html':
        return this.renderHTML(content);
      case 'text/markdown':
        return this.renderMarkdown(content);
      case 'text/latex':
        return this.renderLatex(content);
      case 'application/json':
        return this.renderJSON(content);
      case 'image/png':
      case 'image/jpeg':
        return this.renderImage(content, mimeType);
      case 'image/svg+xml':
        return this.renderSVG(content);
      case 'text/plain':
      default:
        return this.renderPlainText(content);
    }
  }

  renderHTML(content) {
    return (
      <div
        className="output-html"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  renderMarkdown(content) {
    // Simple markdown rendering (could use a proper markdown library)
    const html = content
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/`([^`]*)`/gim, '<code>$1</code>')
      .replace(/\n\n/gim, '</p><p>')
      .replace(/\n/gim, '<br>');

    return (
      <div
        className="output-markdown"
        dangerouslySetInnerHTML={{ __html: `<p>${html}</p>` }}
      />
    );
  }

  renderLatex(content) {
    // Basic LaTeX rendering - in a real implementation you'd use MathJax or KaTeX
    return (
      <div className="output-latex">
        <code>{content}</code>
        <em> (LaTeX rendering not implemented)</em>
      </div>
    );
  }

  renderJSON(content) {
    const formatted = JSON.stringify(content, null, 2);
    return (
      <div className="output-json">
        <pre><code>{formatted}</code></pre>
      </div>
    );
  }

  renderImage(content, mimeType) {
    // Content is typically base64 encoded
    const src = `data:${mimeType};base64,${content}`;
    return (
      <div className="output-image">
        <img
          src={src}
          alt="Output"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
      </div>
    );
  }

  renderSVG(content) {
    return (
      <div
        className="output-svg"
        dangerouslySetInnerHTML={{ __html: content }}
      />
    );
  }

  renderPlainText(content) {
    // Handle arrays (like from print statements)
    const text = Array.isArray(content) ? content.join('') : String(content);

    return (
      <div className="output-text">
        <pre>{text}</pre>
      </div>
    );
  }

  renderStream(data) {
    const name = data.get('name') || 'stdout';
    const text = data.get('text') || '';

    const streamClass = `output-stream stream-${name}`;

    return (
      <div className={streamClass}>
        <pre>{Array.isArray(text) ? text.join('') : text}</pre>
      </div>
    );
  }

  renderError(data) {
    const ename = data.get('ename') || 'Error';
    const evalue = data.get('evalue') || '';
    const traceback = data.get('traceback') || [];

    const tracebackText = Array.isArray(traceback) ?
      traceback.map(line => this.stripAnsiCodes(line)).join('\n') :
      String(traceback);

    return (
      <div className="output-error">
        <div className="error-name">{ename}: {evalue}</div>
        <pre className="error-traceback">{tracebackText}</pre>
      </div>
    );
  }

  renderUnknown(data) {
    const outputType = data.get('output_type');
    return (
      <div className="output-unknown">
        <em>Unknown output type: {outputType}</em>
        <pre>{JSON.stringify(data.toJS(), null, 2)}</pre>
      </div>
    );
  }

  stripAnsiCodes(text) {
    // Remove ANSI color codes and escape sequences
    return text.replace(/\x1b\[[0-9;]*m/g, '').replace(/\x1b\[[K]/g, '');
  }
}

module.exports = DisplayArea;
