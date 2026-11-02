export class Twitch {
  constructor(config,onCommand,onStatus,save) {Object.assign(this,{config,onCommand,onStatus,save}); this.closed=true; this.retry=null; this.sockets=new Set();}
  async validate() {
    const r=await fetch('https://id.twitch.tv/oauth2/validate',{headers:{Authorization:`OAuth ${this.config.token}`},signal:AbortSignal.timeout(10000)});
    if(r.status===401 && this.config.refreshToken) { await this.refresh(); return this.validate(); }
    if(!r.ok) throw Error(`Twitch token validation HTTP ${r.status}`);
    const v=await r.json();
    if(v.client_id!==this.config.clientId || !['user:read:chat','user:write:chat'].every(s=>v.scopes.includes(s))) throw Error('Twitch client ID or scopes do not match');
    this.userId=v.user_id; return v;
  }
  async refresh() {
    const r=await fetch('https://id.twitch.tv/oauth2/token',{method:'POST',signal:AbortSignal.timeout(10000),body:new URLSearchParams({grant_type:'refresh_token',refresh_token:this.config.refreshToken,client_id:this.config.clientId,client_secret:this.config.secret})});
    if(!r.ok) throw Error('Twitch reauthorization required');
    const v=await r.json(); Object.assign(this.config,{token:v.access_token,refreshToken:v.refresh_token}); await this.save(this.config);
  }
  async api(path,body) {
    const r=await fetch(`https://api.twitch.tv/helix/${path}`,{method:'POST',signal:AbortSignal.timeout(10000),headers:{Authorization:`Bearer ${this.config.token}`,'Client-Id':this.config.clientId,'Content-Type':'application/json'},body:JSON.stringify(body)});
    if(!r.ok) throw Error(`Twitch API HTTP ${r.status}`);
    return r.json();
  }
  async start() {
    this.stop(); await this.validate(); this.closed=false; this.open();
    this.hourly=setInterval(()=>this.validate().catch(()=>{this.onStatus('Authorization lost; reconnect required');this.stop();}),3600000); this.hourly.unref();
  }
  open(url='wss://eventsub.wss.twitch.tv/ws',old=null) {
    const u=new URL(url); if(u.protocol!=='wss:' || u.hostname!=='eventsub.wss.twitch.tv') throw Error('Invalid Twitch reconnect URL');
    const ws=new WebSocket(url); this.sockets.add(ws); let watchdog;
    const arm=seconds=>{ clearTimeout(watchdog); watchdog=setTimeout(()=>ws.close(),seconds*1000); watchdog.unref(); };
    arm(20);
    ws.onmessage=async({data})=> {
      try {
        const m=JSON.parse(data); arm((m.payload?.session?.keepalive_timeout_seconds??10)+10);
        if(m.metadata.message_type==='session_welcome') {
          if(old) old.close();
          else await this.api('eventsub/subscriptions',{type:'channel.chat.message',version:'1',condition:{broadcaster_user_id:this.userId,user_id:this.userId},transport:{method:'websocket',session_id:m.payload.session.id}});
          this.active=ws; this.onStatus('Connected');
        } else if(m.metadata.message_type==='session_reconnect') {this.open(m.payload.session.reconnect_url,ws);}
        else if(m.metadata.message_type==='revocation') {this.onStatus('Subscription revoked'); this.stop();}
        else if(m.metadata.message_type==='notification') {
          const e=m.payload.event;
          if(['!recap','!回顧'].includes(e.message?.text?.trim().toLowerCase())) {
            const message=await this.onCommand(m.metadata.message_id,e.chatter_user_id);
            if(message) {const result=await this.api('chat/messages',{broadcaster_id:this.userId,sender_id:this.userId,message}); if(!result.data?.[0]?.is_sent) throw Error(`Chat not sent: ${result.data?.[0]?.drop_reason?.code??'unknown'}`);}
          }
        }
      } catch(e) {this.onStatus(e.message);}
    };
    ws.onerror=()=>this.onStatus('Twitch connection error');
    ws.onclose=()=>{clearTimeout(watchdog);this.sockets.delete(ws);if(!this.closed && (!this.active || this.active===ws)) {this.onStatus('Disconnected; reconnecting');clearTimeout(this.retry);this.retry=setTimeout(()=>this.open(),5000);this.retry.unref();}};
  }
  stop(){this.closed=true;clearTimeout(this.retry);clearInterval(this.hourly); for(const ws of this.sockets) ws.close();this.sockets.clear();this.active=null;}
}
