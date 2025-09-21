declare module 'simple-peer' {
  interface Instance {
    on(event: 'signal', listener: (data: any) => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'close', listener: () => void): this;
    signal(data: any): void;
    destroy(): void;
    signalData?: any;
  }

  interface Options {
    initiator?: boolean;
    trickle?: boolean;
    stream?: MediaStream;
  }

  namespace Peer {
    interface Instance {
      on(event: 'signal', listener: (data: any) => void): this;
      on(event: 'stream', listener: (stream: MediaStream) => void): this;
      on(event: 'connect', listener: () => void): this;
      on(event: 'error', listener: (error: Error) => void): this;
      on(event: 'close', listener: () => void): this;
      signal(data: any): void;
      destroy(): void;
      signalData?: any;
    }
  }

  class Peer {
    constructor(options?: Options);
    on(event: 'signal', listener: (data: any) => void): this;
    on(event: 'stream', listener: (stream: MediaStream) => void): this;
    on(event: 'connect', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'close', listener: () => void): this;
    signal(data: any): void;
    destroy(): void;
    signalData?: any;
  }

  export = Peer;
}
