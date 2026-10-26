'use strict';
/* Blade Rush: Shadow Arena - HTML5 Canvas, không phụ thuộc bên ngoài */
const W=960,H=540,$=id=>document.getElementById(id);
const cv=$('c'),ctx=cv.getContext('2d');
const S={state:'menu',sound:true,lowfx:false,best:0,clear:[]};
try{Object.assign(S,JSON.parse(localStorage.getItem('brsa')||'{}'));S.state='menu'}catch(e){}
S.clear=Array.isArray(S.cl5)?S.cl5:[];
const save=()=>{try{localStorage.setItem('brsa',JSON.stringify({sound:S.sound,lowfx:S.lowfx,best:S.best,cl5:S.clear}))}catch(e){}};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const angDiff=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));

/* ===== Hiển thị / resize ===== */
function resize(){const d=Math.min(window.devicePixelRatio||1,2),s=Math.min(innerWidth/W,innerHeight/H);
 cv.style.width=W*s+'px';cv.style.height=H*s+'px';cv.width=Math.round(W*s*d);cv.height=Math.round(H*s*d)}
addEventListener('resize',resize);addEventListener('orientationchange',()=>setTimeout(resize,200));resize();
function toast(t){const e=$('toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),2200)}

/* ===== Âm thanh (Web Audio, tự tạo) ===== */
const A={c:null,init(){if(!this.c){try{this.c=new(window.AudioContext||window.webkitAudioContext)()}catch(e){}}
 if(this.c&&this.c.state==='suspended')this.c.resume()},
 tone(f,d,t,v,sl){if(!S.sound||!this.c)return;const c=this.c,n=c.currentTime,o=c.createOscillator(),g=c.createGain();
  o.type=t;o.frequency.setValueAtTime(f,n);if(sl)o.frequency.exponentialRampToValueAtTime(Math.max(30,f+sl),n+d);
  g.gain.setValueAtTime(v,n);g.gain.exponentialRampToValueAtTime(.001,n+d);o.connect(g);g.connect(c.destination);o.start();o.stop(n+d)},
 sfx(k){({swing:()=>this.tone(500,.12,'sawtooth',.05,-300),hit:()=>this.tone(160,.1,'square',.08,-80),
  kill:()=>this.tone(320,.2,'triangle',.1,-220),ui:()=>this.tone(660,.06,'square',.04),
  skill:()=>this.tone(200,.35,'sawtooth',.08,500),dodge:()=>this.tone(800,.1,'sine',.06,-500),
  hurt:()=>this.tone(110,.2,'sawtooth',.1,-60)})[k]()}};
const buzz=ms=>{try{navigator.vibrate&&navigator.vibrate(ms)}catch(e){}};

/* ===== Input: bàn phím + tay cầm + cảm ứng ===== */
const IN={keys:{},touch:{atk:0,dodge:0,skill:0,fire:0,shd:0},tv:{x:0,y:0},pad:{},prevStart:false,prevPause:false,
 get(){let x=0,y=0,atk=0,dodge=0,skill=0,fire=0,shd=0,K=this.keys;
  x=(K.d||K.arrowright?1:0)-(K.a||K.arrowleft?1:0);y=(K.s||K.arrowdown?1:0)-(K.w||K.arrowup?1:0);
  atk=K.j||K[' '];dodge=K.k||K.shift;skill=K.l||K.e;fire=K.u;shd=K.o;
  x+=this.tv.x;y+=this.tv.y;atk=atk||this.touch.atk;dodge=dodge||this.touch.dodge;skill=skill||this.touch.skill;fire=fire||this.touch.fire;shd=shd||this.touch.shd;
  const g=this.gp();if(g){const dz=.25;let ax=g.axes[0]||0,ay=g.axes[1]||0;
   if(Math.hypot(ax,ay)<dz){ax=0;ay=0}
   const b=i=>g.buttons[i]&&g.buttons[i].pressed;
   if(!ax&&!ay){ax=(b(15)?1:0)-(b(14)?1:0);ay=(b(13)?1:0)-(b(12)?1:0)}
   x+=ax;y+=ay;atk=atk||b(0);dodge=dodge||b(1);skill=skill||b(2);fire=fire||b(3);shd=shd||b(5)||b(4);
   const st=!!b(9);if(st&&!this.prevStart)togglePause();this.prevStart=st}
  const m=Math.hypot(x,y);if(m>1){x/=m;y/=m}
  return{x,y,atk:!!atk,dodge:!!dodge,skill:!!skill,fire:!!fire,shd:!!shd}},
 gp(){try{const l=navigator.getGamepads?navigator.getGamepads():[];for(const g of l)if(g&&g.connected)return g}catch(e){}return null}};
addEventListener('keydown',e=>{A.init();const k=e.key.toLowerCase();IN.keys[k]=1;
 if((k==='p'||k==='escape')&&!e.repeat)togglePause();if([' ','arrowup','arrowdown'].includes(k))e.preventDefault()});
addEventListener('keyup',e=>{IN.keys[e.key.toLowerCase()]=0});
let padOn=false,forceTouch=false,padT=0;
function padCheck(){const g=IN.gp(),on=!!g;
 if(on!==padOn){padOn=on;forceTouch=false;toast(on?'🎮 Đã nhận tay cầm: '+g.id.slice(0,24)+' · ẩn nút cảm ứng':'🎮 Tay cầm đã ngắt · hiện lại nút cảm ứng')}
 const hide=padOn&&!forceTouch;if(document.body.classList.contains('pad')!==hide)document.body.classList.toggle('pad',hide)}
addEventListener('gamepadconnected',padCheck);addEventListener('gamepaddisconnected',()=>setTimeout(padCheck,50));
cv.addEventListener('pointerdown',e=>{if(e.pointerType==='touch'&&padOn&&!forceTouch){forceTouch=true;padCheck();toast('Đã bật lại nút cảm ứng')}});
(function touchInit(){
 const stick=$('stick'),knob=$('knob');let sid=null,ox=0,oy=0;
 const setT=()=>document.body.classList.add('touch');
 if(matchMedia('(pointer:coarse)').matches)setT();
 stick.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse')return;setT();A.init();sid=e.pointerId;stick.setPointerCapture(sid);ox=e.clientX;oy=e.clientY;
  knob.style.display='block';knob.style.left=ox+'px';knob.style.top=oy+'px'});
 stick.addEventListener('pointermove',e=>{if(e.pointerId!==sid)return;let dx=e.clientX-ox,dy=e.clientY-oy;const m=Math.hypot(dx,dy),R=50;
  if(m>R){dx*=R/m;dy*=R/m}knob.style.left=ox+dx+'px';knob.style.top=oy+dy+'px';
  const v=Math.hypot(dx,dy)/R;IN.tv.x=v<.2?0:dx/R;IN.tv.y=v<.2?0:dy/R});
 const end=e=>{if(e.pointerId!==sid)return;sid=null;IN.tv.x=IN.tv.y=0;knob.style.display='none'};
 stick.addEventListener('pointerup',end);stick.addEventListener('pointercancel',end);
 document.querySelectorAll('.btn').forEach(b=>{const k=b.dataset.k;
  b.addEventListener('pointerdown',e=>{e.preventDefault();A.init();b.setPointerCapture(e.pointerId);IN.touch[k]=1;b.classList.add('on')});
  const up=()=>{IN.touch[k]=0;b.classList.remove('on')};b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)});
 document.addEventListener('touchmove',e=>{if(!(e.target.closest&&e.target.closest('.ov.show')))e.preventDefault()},{passive:false});
 document.addEventListener('gesturestart',e=>e.preventDefault());
})();

/* ===== Hiệu ứng ===== */
let parts=[],texts=[],shake=0;
function burst(x,y,n,col,sp){if(S.lowfx)n=Math.ceil(n/3);for(let i=0;i<n&&parts.length<220;i++){const a=rnd(0,6.28),s=rnd(.3,1)*sp;
 parts.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s,l:rnd(.25,.5),m:.5,c:col})}}
const floatText=(x,y,t,c)=>{if(texts.length<30)texts.push({x,y,t,c,l:.7})};

/* ===== Trạng thái game ===== */
const WPS=3;let CUR=0,EB=[],B=[],P,E,pick,wave,queue,spawnT,score,kills,time,waveBanner,boss;
const TYPES={skel:{hp:40,sp:70,dmg:8,r:14,c:'#e8e4d4',pts:10},shadow:{hp:26,sp:115,dmg:6,r:12,c:'#6b3a99',pts:15},
 war:{hp:75,sp:82,dmg:12,r:16,c:'#c0392b',pts:25},elite:{hp:170,sp:85,dmg:15,r:21,c:'#d4a017',pts:80},boss:{hp:700,sp:60,dmg:22,r:34,c:'#7a0f1e',pts:500}};
function newGame(){P={x:W/2,y:H/2,hp:100,max:100,face:0,atkCd:0,dodgeCd:0,skillCd:0,fireCd:0,shdCd:0,shield:0,inv:0,dash:0,dx:0,dy:0,swing:0,hurt:0,mx:0,my:0,dead:0};
 E=[];B=[];EB=[];pick=[];parts=[];texts=[];wave=0;queue=[];spawnT=0;score=0;kills=0;time=0;boss=false;nextWave()}
const STAGES=[{n:'Hầm Xương',bg:[34,30,26],tc:'#e8e4d4',boss:1,d:1},{n:'Đền Bóng Đêm',bg:[26,20,38],tc:'#b070ff',boss:2,d:3},
{n:'Lò Lửa Thần',bg:[44,22,18],tc:'#ff8a3a',boss:3,d:5},{n:'Cung Điện Băng',bg:[20,28,44],tc:'#6fd0ff',boss:4,d:7},
{n:'Ngai Ma Vương',bg:[30,14,20],tc:'#ff3b3b',boss:5,d:9}];
const BOSS={1:{nm:'XƯƠNG VƯƠNG',c:'#e8e4d4',sk:['summon','charge']},2:{nm:'BÓNG MA',c:'#8e44ad',sk:['tele','ring']},
3:{nm:'HỎA THẦN',c:'#e67e22',sk:['fan','slam']},4:{nm:'BĂNG HẬU',c:'#5dade2',sk:['spiral','ring']},
5:{nm:'MA VƯƠNG',c:'#7a0f1e',sk:['charge','ring','fan','summon','slam','spiral']}};
const ST=()=>STAGES[CUR],totalWaves=()=>WPS+(ST().boss?1:0);
function nextWave(){wave++;queue=[];const lv=ST().d+wave;
 if(ST().boss&&wave===totalWaves())queue=['boss','skel','skel'];
 else{const n=3+wave*2+ST().d;for(let i=0;i<n;i++){let t='skel';const r=Math.random();
  if(lv>=2&&r<.35)t='shadow';if(lv>=3&&r<.2)t='war';if(lv>=4&&i%6===5)t='elite';queue.push(t)}}
 spawnT=.8;waveBanner=2;if(wave>1)P.hp=Math.min(P.max,P.hp+20)}
function spawn(t,px,py){const d=TYPES[t],s=Math.floor(rnd(0,4)),m=40;let x=px,y=py;
 if(x===undefined){if(s===0){x=rnd(0,W);y=m}else if(s===1){x=rnd(0,W);y=H-m}else if(s===2){x=m;y=rnd(0,H)}else{x=W-m;y=rnd(0,H)}}
 x=clamp(x,20,W-20);y=clamp(y,20,H-20);const lv=ST().d*2+wave,k=1+lv*.06;
 const o={t,x,y,hp:d.hp*k,max:d.hp*k,sp:d.sp*(1+lv*.015),dmg:d.dmg*(1+ST().d*.05),r:d.r,c:d.c,kx:0,ky:0,cd:0,chT:rnd(2,4),sT:rnd(1.5,3),cx:0,cy:0,flash:0};
 if(t==='boss'){const b=BOSS[ST().boss];o.bk=ST().boss;o.sk=b.sk;o.c=b.c;o.nm=b.nm;o.hp=o.max=700*(1+ST().d*.12)}E.push(o)}
/* ===== Chiến đấu ===== */
function hitEnemy(e,d,kb,a){e.hp-=d;e.flash=.1;e.kx+=Math.cos(a)*kb;e.ky+=Math.sin(a)*kb;
 floatText(e.x,e.y-e.r,Math.round(d),'#ffd54a');burst(e.x,e.y,5,'#ffcf5a',160);A.sfx('hit');shake=Math.max(shake,3);
 if(e.hp<=0&&!e.dead){e.dead=1;kills++;score+=TYPES[e.t].pts;burst(e.x,e.y,14,e.c,220);A.sfx('kill');buzz(15);
  if(Math.random()<(e.t==='elite'||e.t==='boss'?1:.12))pick.push({x:e.x,y:e.y,l:10})}}
function nearest(r){let b=null,bd=r;for(const e of E){const d=Math.hypot(e.x-P.x,e.y-P.y);if(d<bd){bd=d;b=e}}return b}
function attack(){const t=nearest(150);if(t)P.face=Math.atan2(t.y-P.y,t.x-P.x);
 P.atkCd=.32;P.swing=.16;A.sfx('swing');
 for(const e of E){const dx=e.x-P.x,dy=e.y-P.y,d=Math.hypot(dx,dy);
  if(d<78+e.r&&angDiff(Math.atan2(dy,dx),P.face)<1.0)hitEnemy(e,22,230,Math.atan2(dy,dx))}}
function skill(){P.skillCd=6;P.swing=.3;P.ring=.35;A.sfx('skill');shake=8;buzz(30);burst(P.x,P.y,28,'#4aa3ff',300);
 for(const e of E){const dx=e.x-P.x,dy=e.y-P.y;if(Math.hypot(dx,dy)<135+e.r)hitEnemy(e,38,380,Math.atan2(dy,dx))}}
function fireBlades(){const t=nearest(400);if(t)P.face=Math.atan2(t.y-P.y,t.x-P.x);P.fireCd=4;A.sfx('swing');
 for(const o of[-.22,0,.22]){const a=P.face+o;B.push({x:P.x,y:P.y,vx:Math.cos(a)*560,vy:Math.sin(a)*560,l:1,a,hit:new Set()})}}
function shield(){P.shdCd=12;P.shield=3;P.hp=Math.min(P.max,P.hp+15);A.sfx('skill');burst(P.x,P.y,16,'#7df',200);floatText(P.x,P.y-28,'KHIÊN','#7df')}
function victory(){score+=300+Math.round(P.hp)*3;S.clear[CUR]=true;gameOver(true)}
function ebolt(x,y,a,sp,dmg,c){EB.push({x,y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp,l:4,dmg,c})}
function doSkill(e,k){burst(e.x,e.y,10,e.c,200);
 if(k==='summon'){for(let i=0;i<3;i++)spawn('skel',e.x+rnd(-50,50),e.y+rnd(-50,50))}
 else if(k==='ring'){const n=e.bk===5?18:14,o=rnd(0,6.28);for(let i=0;i<n;i++)ebolt(e.x,e.y,o+i*6.283/n,e.bk===4?150:180,e.dmg*.6,'#c88aff')}
 else if(k==='fan'){const a=Math.atan2(P.y-e.y,P.x-e.x);for(let i=-2;i<=2;i++)ebolt(e.x,e.y,a+i*.26,240,e.dmg*.65,'#ff8a3a')}
 else if(k==='tele'){const a=rnd(0,6.28);e.x=clamp(P.x+Math.cos(a)*130,30,W-30);e.y=clamp(P.y+Math.sin(a)*130,30,H-30);burst(e.x,e.y,16,'#9b59b6',250);doSkill(e,'ring')}
 else if(k==='slam'){shake=Math.max(shake,9);burst(e.x,e.y,30,'#ffcf5a',320);if(Math.hypot(P.x-e.x,P.y-e.y)<155)hurt(e.dmg*1.3)}}
function bossAI(e,dt,dx,dy,d){const hard=e.hp<e.max/2?1.4:1;
 if(e.charge!==undefined){e.charge-=dt;if(e.charge<=.45){e.x+=e.cx*480*dt;e.y+=e.cy*480*dt}if(e.charge<=0){e.charge=undefined;e.chT=rnd(3,4.5)/hard}return}
 if(e.act){const a=e.act;a.t-=dt;
  if(a.k==='spiral'){a.f-=dt;if(a.f<=0){a.f=.11;a.a+=.55;ebolt(e.x,e.y,a.a,190,e.dmg*.6,'#8fe0ff')}if(a.t<=0){e.act=null;e.sT=rnd(1.6,2.6)/hard}return}
  if(a.t<=0){doSkill(e,a.k);e.act=null;e.sT=rnd(1.6,2.6)/hard}return}
 e.x+=dx/d*e.sp*dt;e.y+=dy/d*e.sp*dt;e.chT-=dt;e.sT-=dt;
 if(e.sk.includes('charge')&&e.chT<=0){e.charge=.9;e.cx=dx/d;e.cy=dy/d;return}
 if(e.sT<=0){const l=e.sk.filter(k=>k!=='charge'),k=l[Math.floor(Math.random()*l.length)];e.act={k,t:k==='slam'?.9:k==='spiral'?2.4:.6,f:0,a:rnd(0,6.28)};e.sT=9}}
function dodge(m){P.dodgeCd=1.1;P.dash=.18;P.inv=.3;let x=m.x,y=m.y;if(!x&&!y){x=Math.cos(P.face);y=Math.sin(P.face)}
 const l=Math.hypot(x,y);P.dx=x/l;P.dy=y/l;A.sfx('dodge');burst(P.x,P.y,6,'#9ad',100)}
function hurt(d,from){if(P.inv>0||P.shield>0)return;P.hp-=d;P.inv=.6;P.hurt=.25;A.sfx('hurt');buzz(40);shake=7;
 floatText(P.x,P.y-24,'-'+Math.round(d),'#ff5555');burst(P.x,P.y,8,'#ff4444',180);
 if(P.hp<=0){P.hp=0;P.dead=1;gameOver()}}

/* ===== Update ===== */
function update(dt){
 const m=IN.get();time+=dt;
 for(const k of['fireCd','shdCd','shield','atkCd','dodgeCd','skillCd','inv','swing','hurt','ring'])if(P[k]>0)P[k]-=dt;
 if(m.x||m.y){if(!nearest(150))P.face=Math.atan2(m.y,m.x)}
 if(P.dash>0){P.dash-=dt;P.x+=P.dx*620*dt;P.y+=P.dy*620*dt;if(!S.lowfx&&Math.random()<.5)burst(P.x,P.y,1,'#8ab',30)}
 else{P.x+=m.x*210*dt;P.y+=m.y*210*dt}
 P.x=clamp(P.x,30,W-30);P.y=clamp(P.y,30,H-30);
 if(m.dodge&&P.dodgeCd<=0&&P.dash<=0)dodge(m);
 if(m.skill&&P.skillCd<=0)skill();
 if(m.fire&&P.fireCd<=0)fireBlades();if(m.shd&&P.shdCd<=0)shield();
 if(m.atk&&P.atkCd<=0)attack();
 if(queue.length&&(spawnT-=dt)<=0){spawn(queue.shift());spawnT=Math.max(.35,1.1-wave*.05)}
 for(const e of E){const dx=P.x-e.x,dy=P.y-e.y,d=Math.hypot(dx,dy)||1;e.cd-=dt;e.flash-=dt;
  if(e.t==='boss')bossAI(e,dt,dx,dy,d);
  else{e.x+=dx/d*e.sp*dt;e.y+=dy/d*e.sp*dt}
  e.x+=e.kx*dt;e.y+=e.ky*dt;e.kx*=.88;e.ky*=.88;
  e.x=clamp(e.x,15,W-15);e.y=clamp(e.y,15,H-15);
  if(d<e.r+14&&e.cd<=0){hurt(e.dmg);e.cd=.9}}
 for(let i=0;i<E.length;i++)for(let j=i+1;j<E.length;j++){const a=E[i],b=E[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),r=a.r+b.r;
  if(d>0&&d<r){const p=(r-d)/2/d;a.x-=dx*p;a.y-=dy*p;b.x+=dx*p;b.y+=dy*p}}
 for(const b of B){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;for(const e of E)if(!b.hit.has(e)&&Math.hypot(e.x-b.x,e.y-b.y)<e.r+8){b.hit.add(e);hitEnemy(e,30,200,b.a)}}
 B=B.filter(b=>b.l>0&&b.x>0&&b.x<W&&b.y>0&&b.y<H);
 for(const b of EB){b.x+=b.vx*dt;b.y+=b.vy*dt;b.l-=dt;if(Math.hypot(b.x-P.x,b.y-P.y)<15){b.l=0;hurt(b.dmg)}}
 EB=EB.filter(b=>b.l>0&&b.x>-20&&b.x<W+20&&b.y>-20&&b.y<H+20);
 E=E.filter(e=>!e.dead);
 for(const p of pick){p.l-=dt;if(Math.hypot(p.x-P.x,p.y-P.y)<26){p.l=0;P.hp=Math.min(P.max,P.hp+18);floatText(P.x,P.y-28,'+18','#5f5');score+=5}}
 pick=pick.filter(p=>p.l>0);
 if(!E.length&&!queue.length){score+=wave*20;if(wave>=totalWaves()){victory();return}nextWave()}
 if(waveBanner>0)waveBanner-=dt;if(shake>0)shake=Math.max(0,shake-30*dt);
 for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vx*=.93;p.vy*=.93;p.l-=dt}parts=parts.filter(p=>p.l>0);
 for(const t of texts){t.y-=36*dt;t.l-=dt}texts=texts.filter(t=>t.l>0)}

/* ===== Vẽ ===== */
function draw(){
 const k=cv.width/W;ctx.setTransform(k,0,0,k,0,0);ctx.fillStyle='#0d0b12';ctx.fillRect(0,0,W,H);
 const t=performance.now()/1000;
 if(S.state==='play'||S.state==='pause'||S.state==='over'){
  if(shake>0&&!S.lowfx)ctx.translate(rnd(-shake,shake),rnd(-shake,shake));
  drawArena(t);
  for(const p of pick){ctx.fillStyle='#e74c3c';ctx.beginPath();ctx.arc(p.x,p.y,7+Math.sin(t*6)*1.5,0,6.28);ctx.fill();ctx.fillStyle='#fff';ctx.fillRect(p.x-1,p.y-4,2,8);ctx.fillRect(p.x-4,p.y-1,8,2)}
  for(const b of B){ctx.save();ctx.translate(b.x,b.y);ctx.rotate(b.a);ctx.fillStyle='#ffe28a';ctx.beginPath();ctx.moveTo(14,0);ctx.lineTo(0,5);ctx.lineTo(-10,0);ctx.lineTo(0,-5);ctx.fill();ctx.restore()}
  for(const b of EB){ctx.fillStyle=b.c;ctx.beginPath();ctx.arc(b.x,b.y,6,0,6.28);ctx.fill();ctx.strokeStyle='#fff8';ctx.lineWidth=1;ctx.stroke()}
  const L=[...E.map(e=>({y:e.y,f:()=>drawEnemy(e)})),{y:P.y,f:drawPlayer}].sort((a,b)=>a.y-b.y);L.forEach(o=>o.f());
  for(const p of parts){ctx.globalAlpha=clamp(p.l/p.m,0,1);ctx.fillStyle=p.c;ctx.fillRect(p.x-2,p.y-2,4,4)}ctx.globalAlpha=1;
  ctx.font='bold 16px sans-serif';ctx.textAlign='center';for(const x of texts){ctx.globalAlpha=clamp(x.l/.4,0,1);ctx.fillStyle=x.c;ctx.fillText(x.t,x.x,x.y)}ctx.globalAlpha=1;
  ctx.setTransform(k,0,0,k,0,0);drawHUD()}
 else{drawArena(t);ctx.fillStyle='#0008';ctx.fillRect(0,0,W,H)}}
function drawArena(t){
 for(let y=0;y<H;y+=60)for(let x=0;x<W;x+=60){const v=((x*7+y*13)%5);const c=ST().bg;ctx.fillStyle='rgb('+(c[0]+v*2)+','+(c[1]+v*2)+','+(c[2]+v*2)+')';ctx.fillRect(x+1,y+1,58,58)}
 ctx.strokeStyle='#3a3248';ctx.lineWidth=6;ctx.strokeRect(3,3,W-6,H-6);
 for(const [x,y] of[[30,30],[W-30,30],[30,H-30],[W-30,H-30]]){const f=1+Math.sin(t*9+x)*.15;
  if(!S.lowfx){const g=ctx.createRadialGradient(x,y,2,x,y,130*f);g.addColorStop(0,ST().tc+'59');g.addColorStop(1,ST().tc+'00');ctx.fillStyle=g;ctx.fillRect(x-140,y-140,280,280)}
  ctx.fillStyle='#5a4630';ctx.fillRect(x-4,y,8,14);ctx.fillStyle=ST().tc;ctx.beginPath();ctx.arc(x,y-2,6*f,0,6.28);ctx.fill()}}
function drawPlayer(){
 ctx.globalAlpha=P.inv>0&&Math.floor(performance.now()/60)%2?.4:1;
 ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(P.x,P.y+13,14,6,0,0,6.28);ctx.fill();
 {const c=Math.cos(P.face),n=Math.sin(P.face),bx=P.x-c*8,by=P.y-n*8;ctx.fillStyle='#a8322a';ctx.beginPath();ctx.moveTo(bx-n*11,by+c*11);ctx.lineTo(P.x-c*28,P.y-n*28);ctx.lineTo(bx+n*11,by-c*11);ctx.fill()}
 ctx.fillStyle=P.hurt>0?'#ff7777':'#3a7bd5';ctx.beginPath();ctx.arc(P.x,P.y,14,0,6.28);ctx.fill();
 ctx.strokeStyle='#f5c542';ctx.lineWidth=2;ctx.stroke();
 ctx.fillStyle='#fde';ctx.beginPath();ctx.arc(P.x+Math.cos(P.face)*6,P.y+Math.sin(P.face)*6,5,0,6.28);ctx.fill();
 const sw=P.swing>0?(1-P.swing/.16)*2-1:0,a=P.face+sw*.9;
 ctx.strokeStyle='#dfe8f0';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(P.x+Math.cos(a)*10,P.y+Math.sin(a)*10);ctx.lineTo(P.x+Math.cos(a)*38,P.y+Math.sin(a)*38);ctx.stroke();
 if(P.swing>0){ctx.strokeStyle='rgba(255,230,140,.8)';ctx.lineWidth=8;ctx.beginPath();ctx.arc(P.x,P.y,62,P.face-1,P.face+1);ctx.stroke()}
 if(P.shield>0){ctx.strokeStyle='rgba(120,220,255,.8)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(P.x,P.y,24+Math.sin(performance.now()/100)*2,0,6.28);ctx.stroke()}
 if(P.ring>0){ctx.strokeStyle='rgba(74,163,255,'+(P.ring/.35)+')';ctx.lineWidth=8;ctx.beginPath();ctx.arc(P.x,P.y,135*(1-P.ring/.35*.5),0,6.28);ctx.stroke()}
 ctx.globalAlpha=1}
function drawEnemy(e){
 ctx.fillStyle='#0006';ctx.beginPath();ctx.ellipse(e.x,e.y+e.r*.9,e.r,e.r*.4,0,0,6.28);ctx.fill();
 ctx.fillStyle=e.flash>0?'#fff':e.c;ctx.beginPath();
 if(e.t==='shadow'){ctx.arc(e.x,e.y,e.r,Math.PI,0);ctx.lineTo(e.x+e.r,e.y+e.r);ctx.lineTo(e.x-e.r,e.y+e.r)}else ctx.arc(e.x,e.y,e.r,0,6.28);
 ctx.fill();if(e.t==='elite'||e.t==='boss'){ctx.strokeStyle='#f5c542';ctx.lineWidth=3;ctx.stroke()}
 const a=Math.atan2(P.y-e.y,P.x-e.x);ctx.fillStyle=e.t==='skel'?'#111':'#ff3b3b';
 for(const s of[-1,1]){ctx.beginPath();ctx.arc(e.x+Math.cos(a)*e.r*.4-Math.sin(a)*e.r*.35*s,e.y+Math.sin(a)*e.r*.4+Math.cos(a)*e.r*.35*s,e.r*.15+1,0,6.28);ctx.fill()}
 if(e.charge!==undefined&&e.charge>.45){ctx.strokeStyle='#ff3b3b88';ctx.lineWidth=e.r;ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+e.cx*260,e.y+e.cy*260);ctx.stroke()}
 if(e.act){ctx.save();ctx.strokeStyle='#ff3b3b';ctx.fillStyle='rgba(255,60,40,.15)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(e.x,e.y,e.act.k==='slam'?155:e.r+10+Math.sin(performance.now()/60)*4,0,6.28);if(e.act.k==='slam')ctx.fill();ctx.stroke();ctx.restore()}
 if(e.hp<e.max){ctx.fillStyle='#000a';ctx.fillRect(e.x-e.r,e.y-e.r-9,e.r*2,4);ctx.fillStyle='#e74c3c';ctx.fillRect(e.x-e.r,e.y-e.r-9,e.r*2*clamp(e.hp/e.max,0,1),4)}}
function rr(x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath()}
function bar(x,y,w,h,v,c1,c2){rr(x,y,w,h,h/3);ctx.fillStyle='#000a';ctx.fill();ctx.save();rr(x,y,w,h,h/3);ctx.clip();
 const g=ctx.createLinearGradient(0,y,0,y+h);g.addColorStop(0,c1);g.addColorStop(1,c2);ctx.fillStyle=g;ctx.fillRect(x,y,w*clamp(v,0,1),h);ctx.restore();
 ctx.strokeStyle='#f5c542';ctx.lineWidth=1.5;rr(x,y,w,h,h/3);ctx.stroke()}
function portrait(x,y,r){ctx.save();ctx.beginPath();ctx.arc(x,y,r,0,6.28);ctx.clip();
 const g=ctx.createLinearGradient(x,y-r,x,y+r);g.addColorStop(0,'#2b3f7a');g.addColorStop(1,'#10142a');ctx.fillStyle=P.hurt>0?'#7a2020':g;ctx.fillRect(x-r,y-r,2*r,2*r);
 ctx.fillStyle='#3a7bd5';ctx.beginPath();ctx.arc(x,y+r*.95,r*.8,0,6.28);ctx.fill();
 ctx.fillStyle='#f1c9a5';ctx.beginPath();ctx.arc(x,y-1,r*.42,0,6.28);ctx.fill();
 ctx.fillStyle='#c9d3de';ctx.beginPath();ctx.arc(x,y-3,r*.47,Math.PI,0);ctx.fill();ctx.fillRect(x-r*.47,y-4,r*.94,4);
 ctx.fillStyle='#f5c542';ctx.fillRect(x-1.5,y-r*.8,3,r*.38);ctx.fillStyle='#222';ctx.fillRect(x-7,y+2,3,3);ctx.fillRect(x+4,y+2,3,3);ctx.restore();
 const low=P.hp/P.max<.3;ctx.strokeStyle=low&&Math.floor(performance.now()/250)%2?'#ff3b3b':'#f5c542';ctx.lineWidth=3;ctx.beginPath();ctx.arc(x,y,r,0,6.28);ctx.stroke()}
function icon(x,y,s,cd,max,g){const r=Math.max(0,cd);ctx.save();rr(x,y,s,s,6);ctx.fillStyle='#1c1830';ctx.fill();ctx.clip();
 ctx.font=Math.round(s*.55)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff';ctx.fillText(g,x+s/2,y+s*.7);
 if(r>0){ctx.fillStyle='rgba(0,0,0,.7)';ctx.fillRect(x,y,s,s*clamp(r/max,0,1));ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.fillText(Math.ceil(r),x+s/2,y+s*.62)}
 ctx.restore();ctx.strokeStyle=r>0?'#555':'#f5c542';ctx.lineWidth=1.5;rr(x,y,s,s,6);ctx.stroke()}
function padBtn(cx,cy,l){ctx.fillStyle={A:'#3fbf5a',B:'#e0443a',X:'#3a7bd5',Y:'#f5c542'}[l]||'#667';ctx.beginPath();ctx.arc(cx,cy,8,0,6.28);ctx.fill();
 ctx.strokeStyle='#000a';ctx.lineWidth=1;ctx.stroke();ctx.fillStyle=l==='Y'?'#222':'#fff';ctx.font='bold '+(l.length>1?8:10)+'px sans-serif';ctx.textAlign='center';ctx.fillText(l,cx,cy+3.5)}
function keyCap(cx,cy,l){const w=Math.max(16,l.length*7+8);rr(cx-w/2,cy-8,w,16,3);ctx.fillStyle='#e8ecf2';ctx.fill();ctx.strokeStyle='#667';ctx.lineWidth=1;ctx.stroke();
 ctx.fillStyle='#222';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillText(l,cx,cy+3.5)}
function gpGlyph(x,y){ctx.fillStyle='#c9d3de';rr(x+3,y,6,4,2);ctx.fill();rr(x+27,y,6,4,2);ctx.fill();rr(x,y+2,36,17,8);ctx.fill();
 ctx.fillStyle='#445';ctx.beginPath();ctx.arc(x+9,y+9,3.5,0,6.28);ctx.arc(x+22,y+14,3,0,6.28);ctx.fill();ctx.fillRect(x+13,y+8,6,1.6);ctx.fillRect(x+15.2,y+6,1.6,6);
 [[28,6,'#f5c542'],[28,14,'#3fbf5a'],[24,10,'#3a7bd5'],[32,10,'#e0443a']].forEach(d=>{ctx.fillStyle=d[2];ctx.beginPath();ctx.arc(x+d[0],y+d[1],2,0,6.28);ctx.fill()})}
function kbGlyph(x,y){ctx.fillStyle='#c9d3de';rr(x,y,36,17,3);ctx.fill();ctx.fillStyle='#445';
 for(let r=0;r<3;r++)for(let c=0;c<7;c++)ctx.fillRect(x+3+c*4.6,y+3+r*3.6,3.4,2.6);ctx.fillRect(x+9,y+14,18,2)}
function drawHUD(){
 rr(8,8,334,130,14);ctx.fillStyle='rgba(10,8,20,.72)';ctx.fill();ctx.strokeStyle='#f5c542';ctx.lineWidth=2;ctx.stroke();
 portrait(52,52,32);
 ctx.textAlign='left';ctx.fillStyle='#f5c542';ctx.font='bold 14px sans-serif';ctx.fillText('KIẾM SĨ BÓNG ĐÊM',96,26);
 if(P.shield>0){ctx.fillStyle='#7df';ctx.font='bold 11px sans-serif';ctx.textAlign='right';ctx.fillText('KHIÊN '+P.shield.toFixed(1)+'s',334,26)}
 const f=P.hp/P.max;bar(96,32,238,18,f,f<.3?'#ff5a4a':'#46d36b',f<.3?'#9a1f1f':'#1f8f47');
 ctx.fillStyle='#fff';ctx.font='bold 12px sans-serif';ctx.textAlign='center';ctx.fillText(Math.ceil(P.hp)+' / '+P.max,215,46);
 const s=Math.floor(time);ctx.textAlign='left';ctx.font='11px sans-serif';ctx.fillStyle='#cfd6e6';
 ctx.fillText('⚔ Hạ: '+kills+'   ⏱ '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0')+'   ★ '+score,96,64);
 gpGlyph(54,98);kbGlyph(54,116);
 [[P.atkCd,.32,'⚔️','A','J'],[P.skillCd,6,'🌀','X','L'],[P.dodgeCd,1.1,'💨','B','K'],[P.fireCd,4,'🗡️','Y','U'],[P.shdCd,12,'🛡️','R1','O']].forEach((a,i)=>{
  const x=96+i*48;icon(x,70,26,a[0],a[1],a[2]);padBtn(x+13,107,a[3]);keyCap(x+13,125,a[4])});
 ctx.textAlign='center';ctx.font='bold 20px sans-serif';ctx.fillStyle='#f5c542';ctx.fillText('CẢNH '+(CUR+1)+' · ĐỢT '+wave+'/'+totalWaves(),W/2,28);
 const bs=E.find(e=>e.t==='boss');if(bs){bar(W/2-160,38,320,14,bs.hp/bs.max,'#e74c3c','#7a0f1e');ctx.fillStyle='#fff';ctx.font='bold 10px sans-serif';ctx.fillText(bs.nm,W/2,49)}
 if(waveBanner>0){ctx.globalAlpha=clamp(waveBanner,0,1);ctx.font='bold 48px sans-serif';const ib=ST().boss&&wave===totalWaves();ctx.fillStyle=ib?'#e74c3c':'#fff';ctx.fillText(ib?'⚠ '+BOSS[ST().boss].nm+' ⚠':'ĐỢT '+wave,W/2,H/2-60);ctx.globalAlpha=1}}

/* ===== UI / trạng thái ===== */
let helpFrom='menu';const ovs=['menu','help','pause','over','stages'];
function show(id){ovs.forEach(o=>$(o).classList.toggle('show',o===id));document.body.classList.toggle('playing',id===null&&S.state==='play')}
function startGame(){A.init();A.sfx('ui');newGame();S.state='play';show(null)}
function togglePause(){if(S.state==='play'){S.state='pause';show('pause')}else if(S.state==='pause'){S.state='play';show(null)}}
function gameOver(win){S.state='over';$('nextStage').style.display=win&&CUR<STAGES.length-1?'':'none';$('overT').textContent=win?'🏆 CHIẾN THẮNG!':'Bạn đã gục ngã';const b=score>S.best;if(b)S.best=score;save();
 const s=Math.floor(time);$('stats').innerHTML='Cảnh '+(CUR+1)+' · '+ST().n+'<br>Điểm: <b>'+score+'</b>'+(b?' 🏆 Kỷ lục mới!':'')+'<br>Quái đã hạ: '+kills+' · Đợt: '+wave+' · Sống sót: '+Math.floor(s/60)+':'+String(s%60).padStart(2,'0');
 setTimeout(()=>{if(S.state==='over')show('over')},700)}
function toMenu(){S.state='menu';$('best').textContent=S.best?'Kỷ lục: '+S.best:'';show('menu')}
function refreshBtns(){$('sndBtn').textContent='Âm thanh: '+(S.sound?'Bật':'Tắt');$('snd2').textContent='Âm thanh: '+(S.sound?'Bật':'Tắt');$('fxBtn').textContent='Hiệu ứng: '+(S.lowfx?'Giảm':'Đầy đủ')}
function tog(){S.sound=!S.sound;A.init();A.sfx('ui');save();refreshBtns()}
function buildStages(){const g=$('stageGrid');g.innerHTML='';STAGES.forEach((s,i)=>{const b=document.createElement('button');b.className='st';
 b.innerHTML='<b>'+(i+1)+'</b> '+s.n+(S.clear[i]?' ✓':'')+'<br><small>'+(s.boss?'👹 '+BOSS[s.boss].nm:WPS+' đợt')+'</small>';
 b.style.borderColor=s.tc;b.onclick=()=>{CUR=i;startGame()};g.appendChild(b)})}
function openStages(){A.init();A.sfx('ui');buildStages();show('stages')}
$('stagesBtn2').onclick=openStages;$('nextStage').onclick=()=>{CUR=Math.min(STAGES.length-1,CUR+1);startGame()};
$('play').onclick=openStages;$('restart1').onclick=startGame;$('restart2').onclick=startGame;$('resume').onclick=togglePause;
$('pauseBtn').onclick=togglePause;$('helpBtn').onclick=()=>{helpFrom='menu';A.init();A.sfx('ui');show('help')};
document.querySelectorAll('.back').forEach(b=>b.onclick=()=>show(helpFrom==='pause'?'pause':'menu'));
$('helpGame').onclick=()=>{A.init();A.sfx('ui');if(S.state==='play')S.state='pause';helpFrom='pause';show('help')};
$('helpP').onclick=()=>{A.sfx('ui');helpFrom='pause';show('help')};document.querySelectorAll('.home').forEach(b=>b.onclick=toMenu);
$('sndBtn').onclick=tog;$('snd2').onclick=tog;$('fxBtn').onclick=()=>{S.lowfx=!S.lowfx;save();refreshBtns()};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&S.state==='play')togglePause()});
addEventListener('online',()=>toast('Đã có mạng'));addEventListener('offline',()=>toast('Chế độ offline'));
addEventListener('pageshow',()=>{resize()});

/* ===== Vòng lặp ===== */
let last=0;
function loop(t){requestAnimationFrame(loop);const dt=Math.min((t-last)/1000||0,.05);last=t;padT-=dt;if(padT<=0){padT=.4;padCheck()}
 if(S.state==='play')update(dt);else if(S.state==='over'){IN.get();for(const p of parts){p.x+=p.vx*dt;p.y+=p.vy*dt;p.l-=dt}parts=parts.filter(p=>p.l>0)}
 else{const g=IN.gp();if(g){const st=g.buttons[9]&&g.buttons[9].pressed;if(st&&!IN.prevStart&&S.state==='pause')togglePause();IN.prevStart=!!st}}
 draw()}
refreshBtns();toMenu();P={x:0,y:0,hp:1,max:1,face:0,inv:0,hurt:0,swing:0,skillCd:0,dodgeCd:0};E=[];pick=[];
requestAnimationFrame(loop);
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('service-worker.js').catch(()=>{}));
