# Pulsar Jupyter Notebook

A modernized Jupyter Notebook package for [Pulsar Editor](https://pulsar-edit.dev) - the community-led successor to Atom. This package allows you to view, edit, and execute Jupyter notebooks (`.ipynb` files) directly within Pulsar.

## Features

- 🚀 **Native .ipynb support** - Open and edit Jupyter notebooks directly in Pulsar
- ⚡ **Code execution** - Run Python code cells with live output display
- 🔧 **Kernel management** - Automatic Jupyter Kernel Gateway integration
- 🎨 **Syntax highlighting** - Full Python syntax highlighting in code cells
- 📊 **Rich output** - Display plots, HTML, images, and markdown
- 💾 **Auto-save** - Seamless file saving and loading
- 🔄 **Live reload** - Real-time collaboration support

## Installation

### Prerequisites

1. **Python 3** with Jupyter:
   ```bash
   # macOS
   brew install python3
   pip3 install jupyter jupyter_kernel_gateway

   # Linux
   sudo apt-get install python3 python3-pip
   pip3 install jupyter jupyter_kernel_gateway

   # Windows
   # Install Python 3 from python.org, then:
   pip install jupyter jupyter_kernel_gateway
   ```

2. **Pulsar Editor** - Download from [pulsar-edit.dev](https://pulsar-edit.dev)

### Package Installation

**Option 1: Via Pulsar Package Manager (Recommended)**
```bash
ppm install pulsar-jupyter-notebook
```

**Option 2: From Source**
```bash
git clone https://github.com/amarant24/pulsar-jupyter-notebook.git
cd pulsar-jupyter-notebook
ppm install
ppm link
```

## Usage

### Opening Notebooks

- **File Association**: Simply open any `.ipynb` file - Pulsar will automatically use this package
- **Command Palette**: `Ctrl/Cmd + Shift + P` → "Jupyter Notebook: Open"
- **New Notebook**: `Ctrl/Cmd + Shift + P` → "Jupyter Notebook: New"

### Keyboard Shortcuts

| Action | Shortcut | Description |
|--------|----------|-------------|
| Run Cell | `Shift + Enter` | Execute current cell and move to next |
| Run Cell (Stay) | `Ctrl/Cmd + Enter` | Execute current cell without moving |
| Insert Cell Above | `A` | Add new cell above current |
| Insert Cell Below | `B` | Add new cell below current |
| Delete Cell | `D, D` | Delete current cell (press D twice) |
| Change to Code | `Y` | Convert cell to code cell |
| Change to Markdown | `M` | Convert cell to markdown cell |

### Settings

Configure the package via `Preferences > Packages > pulsar-jupyter-notebook`:

- **Kernel Gateway URL**: Default `http://localhost:8888`
- **Auto-start Gateway**: Automatically launch Jupyter Kernel Gateway
- **Python Path**: Path to Python executable (`python3` by default)
- **Max Output Lines**: Limit cell output display (1000 lines default)

## Architecture

This package is built using modern React and follows the Flux architecture pattern:

- **React Components**: Notebook rendering and cell management
- **Flux Store**: State management for notebook data
- **WebSocket**: Real-time communication with Jupyter kernels
- **Immutable.js**: Efficient state updates

### Key Files

```
lib/
├── main.js                 # Package entry point and activation
├── notebook-editor.js      # Core editor logic and state management
├── components/
│   ├── notebook-editor-view.js  # Main notebook component
│   ├── notebook-cell.js         # Individual cell component
│   ├── text-editor.js           # Code editor integration
│   └── display-area.js          # Output rendering
├── dispatcher.js           # Flux dispatcher for actions
└── styles/
    └── notebook.less       # Styling for notebook elements
```

## Development

### Building from Source

```bash
git clone https://github.com/amarant24/pulsar-jupyter-notebook.git
cd pulsar-jupyter-notebook
npm install
npm run build
ppm link
```

### Development Mode

```bash
npm run dev  # Watch mode for development
```

### Testing

```bash
npm test
```

## Troubleshooting

### Common Issues

**"No kernel gateway found"**
- Ensure Jupyter is installed: `pip3 install jupyter jupyter_kernel_gateway`
- Check the gateway URL in settings
- Try manually starting: `jupyter kernelgateway --port=8888`

**"Package not found"**
- Use Pulsar's package manager `ppm` instead of `apm`
- Ensure you're running Pulsar, not Atom

**"Cells won't execute"**
- Restart the kernel: `Ctrl/Cmd + Shift + P` → "Restart Kernel"
- Check Python path in settings
- Verify Jupyter installation: `jupyter --version`

### Migration from Atom

If you were using the original `jupyter-notebook` package in Atom:

1. Export your Atom settings: Copy `~/.atom` to `~/.pulsar`
2. Uninstall old package: `apm uninstall jupyter-notebook`
3. Install this package: `ppm install pulsar-jupyter-notebook`
4. Update any custom keymaps or config to reference the new package name

## Contributing

Contributions are welcome! This is a community-maintained package.

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Credits

- Original `atom-notebook` by the Jupyter team
- Modernized and maintained for Pulsar by [Josen Tiamat](https://github.com/amarant24)
- Built on the excellent [Pulsar Editor](https://pulsar-edit.dev) platform

## Related Projects

- [Hydrogen](https://github.com/nteract/hydrogen) - Interactive coding for Pulsar
- [nteract](https://nteract.io/) - Native notebook application
- [Jupyter](https://jupyter.org/) - The notebook ecosystem this package integrates with

---

Made with ❤️ for the Pulsar community
