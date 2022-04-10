export class ApiStore {
  channel: BroadcastChannel;

  constructor() {
    this.channel = new BroadcastChannel('api-store');
  }

  async initialize(): Promise<void> {
    this.channel.addEventListener('message', this._messageHandler.bind(this));
  }

  protected _messageHandler(e: MessageEvent): void {
    const { data } = e;
    console.log('ApiStore', data); 
  }
}
