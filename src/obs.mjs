import { createHash, randomUUID } from 'node:crypto';
const hash = s => createHash('sha256').update(s).digest('base64');
export class OBS {
  constructor(url, password) { this.url = url; this.password = password; this.pending = new Map(); this.ready = false; }
  async connect() {
    if (this.ready) return;
    const u = new URL(this.url);
    if (!['127.0.0.1', 'localhost', '[::1]'].includes(u.hostname)) throw Error('OBS must be local');
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { this.close(); reject(Error('OBS connection timeout')); }, 8000);
      const ws = this.ws = new WebSocket(this.url);
      ws.onerror = () => { clearTimeout(timer); reject(Error('OBS connection failed')); };
      ws.onclose = () => { this.ready = false; for(const p of this.pending.values()) p.reject(Error('OBS disconnected')); this.pending.clear(); };
      ws.onmessage = ({data}) => {
        try {
          const {op,d} = JSON.parse(data);
          if (op === 0) {
            const auth = d.authentication;
            ws.send(JSON.stringify({op:1,d:{rpcVersion:1,eventSubscriptions:0,...(auth ? {authentication:hash(hash(this.password + auth.salt) + auth.challenge)} : {})}}));
          } else if(op === 2) { clearTimeout(timer); this.ready = true; resolve(); }
          else if(op === 7) {
            const p = this.pending.get(d.requestId); if(!p) return;
            this.pending.delete(d.requestId); clearTimeout(p.timer);
            d.requestStatus.result ? p.resolve(d.responseData) : p.reject(Error(`OBS request failed: ${d.requestStatus.code}`));
          }
        } catch { clearTimeout(timer); reject(Error('Invalid OBS protocol response')); }
      };
    });
  }
  request(requestType, requestData = {}) {
    if(!this.ready) return Promise.reject(Error('OBS is not connected'));
    return new Promise((resolve,reject) => {
      const requestId=randomUUID();
      const timer=setTimeout(()=> {this.pending.delete(requestId); reject(Error('OBS request timeout'));},8000);
      this.pending.set(requestId,{resolve,reject,timer});
      this.ws.send(JSON.stringify({op:6,d:{requestType,requestId,requestData}}));
    });
  }
  async sources() { await this.connect(); return (await this.request('GetInputList')).inputs.map(x=>x.inputName); }
  async capture(source, sec) {
    await this.connect();
    const {imageData}=await this.request('GetSourceScreenshot',{sourceName:source,imageFormat:'jpg',imageWidth:960,imageHeight:540,imageCompressionQuality:80});
    if(!/^data:image\/jpeg;base64,/.test(imageData) || imageData.length > 2000000) throw Error('Invalid OBS image');
    return {id:randomUUID(),sec,image:imageData};
  }
  close() { this.ready=false; this.ws?.close(); }
}
