import _ from 'lodash';
import { Terminal } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { ImageAddon } from 'xterm-addon-image';
import { WebLinksAddon } from 'xterm-addon-web-links';
import { terminal as termElement } from './disconnect/elements';
import { configureTerm } from './term/confiruragtion';
import { loadOptions } from './term/load';
import type { Options } from './term/options';
import type { Socket } from 'socket.io-client';
import themes, { ThemeName } from "./term/themes";
import type { ITerminalOptions } from 'xterm';

const TERMINAL_THEME = 'Tokyo Night' as ThemeName;
const THEME = themes[TERMINAL_THEME];

console.log('Selected Theme Name:', TERMINAL_THEME);
console.log('Theme Configuration:', THEME);

export class Term extends Terminal {
  socket: Socket;
  fitAddon: FitAddon;
  loadOptions: () => Options;
  
  constructor(socket: Socket) {
     console.log('Initializing Terminal with theme:', THEME);
    
    const terminalOptions: ITerminalOptions = { 
      allowProposedApi: true,
      allowTransparency: false,
      cursorBlink: false,
      cursorStyle: 'block' as const, // Explicitly type as 'block'
      fontFamily:
        '"Fira Code VF", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      fontSize: 14,
      fontWeight: 400,
      fontWeightBold: 500,
      lineHeight: 1.06,
      theme: THEME,
    };
    
    console.log('Terminal options:', terminalOptions);
    
    super(terminalOptions);
    
    // Verify theme after initialization
    console.log('Current terminal theme:', this.options.theme);
    
    this.socket = socket;
    this.fitAddon = new FitAddon();
    this.loadAddon(this.fitAddon);
    this.loadAddon(new WebLinksAddon());
    this.loadAddon(new ImageAddon());
    this.loadOptions = loadOptions;
  }
  
  resizeTerm(): void {
    console.log('Resize event - Current theme:', this.options.theme);
    this.refresh(0, this.rows - 1);
    if (this.shouldFitTerm) this.fitAddon.fit();
    this.socket.emit('resize', { cols: this.cols, rows: this.rows });
  }
  
  get shouldFitTerm(): boolean {
    return this.loadOptions().wettyFitTerminal ?? true;
  }
}

declare global {
  interface Window {
    wetty_term?: Term;
    wetty_close_config?: () => void;
    wetty_save_config?: (newConfig: Options) => void;
    clipboardData: DataTransfer;
    loadOptions: (conf: Options) => void;
  }
}

export function terminal(socket: Socket): Term | undefined {
  console.log('Creating new terminal instance');
  const term = new Term(socket);
  
  if (_.isNull(termElement)) {
    console.error('Terminal element is null');
    return undefined;
  }
  
  console.log('Opening terminal in element');
  termElement.innerHTML = '';
  term.open(termElement);
  
  // Verify theme after opening
  console.log('Theme after opening terminal:', term.options.theme);
  
  //configureTerm(term);
  
  window.onresize = function onResize() {
    console.log('Window resize event');
    term.resizeTerm();
  };
  
  window.wetty_term = term;
  
  // Final theme verification
  console.log('Final terminal configuration:', {
    theme: term.options.theme,
    fontSize: term.options.fontSize,
    fontFamily: term.options.fontFamily,
    background: term.options.theme?.background,
    foreground: term.options.theme?.foreground
  });
  
  return term;
}
