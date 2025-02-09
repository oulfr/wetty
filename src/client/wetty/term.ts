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

const THEME_OPTIONS: ITerminalOptions = {
  allowProposedApi: true,
  allowTransparency: false,
  cursorBlink: false,
  cursorStyle: 'block' as const,
  fontFamily: '"Fira Code VF", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  fontSize: 18,
  fontWeight: 400,
  fontWeightBold: 500,
  lineHeight: 1.06,
  theme: themes[TERMINAL_THEME]
};
export class Term extends Terminal {
  socket: Socket;
  fitAddon: FitAddon;
  loadOptions: () => Options;
  
  constructor(socket: Socket) {
    
    const terminalOptions: ITerminalOptions = { 
     ...THEME_OPTIONS
    };
    
    super(terminalOptions);
    
    this.socket = socket;
    this.fitAddon = new FitAddon();
    this.loadAddon(this.fitAddon);
    this.loadAddon(new WebLinksAddon());
    this.loadAddon(new ImageAddon());
    this.loadOptions = loadOptions;
  }
  
  resizeTerm(): void {
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
  const term = new Term(socket);
  
  if (_.isNull(termElement)) {
    return undefined;
  }

  termElement.innerHTML = '';
  term.open(termElement);

  configureTerm(term);
  
  window.onresize = function onResize() {
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
