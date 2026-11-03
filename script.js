'use strict';
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const slug=s=>s.trim().toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g,'');
const NQ=10,P=new URLSearchParams(location.search);
// ===== Banco de dados: Firebase Realtime Database (REST). Sem URL = modo teste local =====
const okDb=u=>/^https:\/\/[a-z0-9.-]+\.(firebaseio\.com|firebasedatabase\.app)$/.test(u);
const clean=u=>(u||'').trim().replace(/\/+$/,'');
let DB=[clean(P.get('db')),clean(localStorage.getItem('mpDb'))].find(okDb)||'';
if(DB)localStorage.setItem('mpDb',DB);
const ID=localStorage.mpId||(localStorage.mpId=Math.random().toString(36).slice(2,10));
let SND=localStorage.mpSnd!=='0',TM=null,PR=null,Q=null;
function loc(path,m,body){const all=JSON.parse(localStorage.getItem('mpL')||'{}'),ps=path.split('/');let o=all;
 if(m==='GET'){for(const p of ps)o=o&&o[p];return o===undefined?null:o}
 for(const p of ps.slice(0,-1))o=o[p]=o[p]||{};o[ps[ps.length-1]]=body;localStorage.setItem('mpL',JSON.stringify(all));return body}
async function api(path,m,body){if(!DB)return loc(path,m,body);
 const r=await fetch(`${DB}/${path}.json`,{method:m,body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw new Error(r.status);return r.json()}
// ===== Utilidades =====
let AC;function beep(ok){if(!SND)return;try{AC=AC||new AudioContext();const o=AC.createOscillator(),g=AC.createGain();o.frequency.value=typeof ok==='number'?ok:ok?660:180;g.gain.value=.08;o.connect(g);g.connect(AC.destination);o.start();o.stop(AC.currentTime+.15)}catch(e){}}
function show(id){clearInterval(TM);TM=null;$$('main>section').forEach(s=>s.hidden=s.id!=='s-'+id);scrollTo(0,0);const h=$('#s-'+id+' h1,#s-'+id+' h2');if(h){h.tabIndex=-1;h.focus()}}
const sorted=o=>Object.entries(o||{}).sort((a,b)=>(b[1].p-a[1].p)||(a[1].t-b[1].t));
const row=(i,x,bar)=>`<li><span>${i+1}º</span><b>${esc(x.n)}</b>${bar?`<i class="pbar"><u style="width:${100*(+x.q||0)/NQ}%"></u></i>`:''}<span>${+x.p||0} pts</span></li>`;
function ask(box,q,cb,shuf,post){if(q.k==='pt')return askPt(box,q,cb,post);if(q.k==='sl')return askSl(box,q,cb,post);const idx=q.o.map((_,i)=>i);if(shuf)idx.sort(()=>Math.random()-.5);
 box.innerHTML=`<p class="q">${q.q}</p>${q.g?'<svg class="gsv" viewBox="0 0 400 400" role="img" aria-label="Gráfico da pergunta"></svg>':''}<div class="opts">${idx.map(i=>`<button class="opt" data-i="${i}">${q.o[i]}</button>`).join('')}</div><div class="fb" role="status" aria-live="polite"></div>`;let lock=false;if(q.g)plot($('svg',box),q.g);
 $$('.opt',box).forEach(b=>b.onclick=()=>{if(lock)return;lock=true;const i=+b.dataset.i,ok=i===q.a;
  $$('.opt',box).forEach(x=>{x.disabled=true;if(+x.dataset.i===q.a)x.classList.add('ok')});b.classList.add(ok?'pop':'bad');
  const pts=cb(ok);$('.fb',box).innerHTML=`<b class="${ok?'g':'r'}">${ok?'Correto!'+(pts?' +'+pts+' pontos':''):'Incorreta. Correta: '+q.o[q.a]}</b><br>${q.e}`;if(post)post(ok)})}

// ===== Gráfico interativo: (x−h)² = 4p(y−k) → y = k + (x−h)²/(4p) =====
const R=8,W=400,U=W/(2*R),X=x=>(x+R)*U,Y=y=>(R-y)*U;
const sg=(v,n)=>v==0?n:`(${n} ${v<0?'+':'−'} ${Math.abs(v)})`;
const eq=(h,k,p)=>p?`${sg(h,'x')}² = ${4*p==1?'':4*p==-1?'−':String(4*p).replace('-','−')}${k==0?'y':sg(k,'y')}`:'p não pode ser 0';
const cv=(h,k,q,c)=>{if(!q)return'';let d='',u=0;for(let x=-R;x<=R+1e-9;x+=.1){const y=k+(x-h)**2/(4*q);if(Math.abs(y)<=20){d+=(u?'L':'M')+X(x).toFixed(1)+' '+Y(y).toFixed(1);u=1}else u=0}return `<path class="${c}" d="${d}"/>`};
function plot(sv,o){const{h,k,p}=o;let t='';
 for(let i=-R;i<=R;i++){t+=`<line class="gr" x1="${X(i)}" y1="0" x2="${X(i)}" y2="${W}"/><line class="gr" x1="0" y1="${Y(i)}" x2="${W}" y2="${Y(i)}"/>`;if(i&&i%2==0)t+=`<text class="tk" x="${X(i)-4}" y="${Y(0)+12}">${i}</text><text class="tk" x="${X(0)+4}" y="${Y(i)+4}">${i}</text>`}
 t+=`<line class="ax" x1="0" y1="${Y(0)}" x2="${W}" y2="${Y(0)}"/><line class="ax" x1="${X(0)}" y1="0" x2="${X(0)}" y2="${W}"/>`;
 if(o.ref)t+=cv(h,k,o.ref,'cv2');if(o.sol)t+=cv(o.sol.h,o.sol.k,o.sol.p,'cvs');t+=cv(h,k,p,'cv');
 if(o.show&&p)t+=`<line class="dr" x1="0" y1="${Y(k-p)}" x2="${W}" y2="${Y(k-p)}"/><line class="ex" x1="${X(h)}" y1="0" x2="${X(h)}" y2="${W}"/><circle class="fo" cx="${X(h)}" cy="${Y(k+p)}" r="5"/><circle class="vx" cx="${X(h)}" cy="${Y(k)}" r="5"/><text class="lb" x="${X(h)+8}" y="${Y(k+p)-6}">F</text><text class="lb" x="${X(h)+8}" y="${Y(k)+16}">V</text><text class="lb" x="6" y="${Y(k-p)-5}">diretriz</text>`;
 (o.lines||[]).forEach((l,i)=>{const c=['#C8452B','#2563A8','#B7791F'][i];t+=l.y!==undefined?`<line stroke="${c}" stroke-width="3" x1="0" y1="${Y(l.y)}" x2="${W}" y2="${Y(l.y)}"/><text class="lb" style="fill:${c}" x="8" y="${Y(l.y)-6}">${l.l}</text>`:`<line stroke="${c}" stroke-width="3" x1="${X(l.x)}" y1="0" x2="${X(l.x)}" y2="${W}"/><text class="lb" style="fill:${c}" x="${X(l.x)+6}" y="16">${l.l}</text>`});
 sv.innerHTML=t+(o.extra||'')}
const fbk=(box,ok,pts,q)=>$('.fb',box).innerHTML=`<b class="${ok?'g':'r'}">${ok?'Correto!'+(pts?' +'+pts+' pontos':''):'Não foi dessa vez. A resposta certa aparece em verde.'}</b><br>${q.e}`;
// Tipo "pt": arraste (ou toque / use as setas) para posicionar o ponto
function askPt(box,q,cb,post){
 box.innerHTML=`<p class="q">${q.q}</p><svg class="gsv drag" tabindex="0" viewBox="0 0 400 400" role="img" aria-label="Plano cartesiano. Toque ou arraste para mover o ponto; as setas do teclado também movem."></svg><p class="mu" id="pos" style="text-align:center"></p><div class="row"><button class="btn big2b" id="ok">Confirmar posição</button></div><div class="fb" role="status" aria-live="polite"></div>`;
 const sv=$('svg',box),t=q.t,cl=v=>Math.max(-R,Math.min(R,v));let pt=[-6,6],on=0,done=0;
 const draw=(ex,s)=>{plot(sv,{...q.g,show:s,extra:(ex||'')+`<circle class="pp" cx="${X(pt[0])}" cy="${Y(pt[1])}" r="11"/>`});$('#pos',box).textContent=`Ponto: (${pt[0]}, ${pt[1]})`};
 const mv=e=>{const r=sv.getBoundingClientRect();pt=[cl(Math.round((e.clientX-r.left)/r.width*W/U-R)),cl(Math.round(R-(e.clientY-r.top)/r.height*W/U))];draw()};
 sv.onpointerdown=e=>{if(done)return;on=1;sv.setPointerCapture(e.pointerId);mv(e)};sv.onpointermove=e=>{if(on&&!done)mv(e)};sv.onpointerup=()=>on=0;
 sv.onkeydown=e=>{const d={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[e.key];if(d&&!done){e.preventDefault();pt=[cl(pt[0]+d[0]),cl(pt[1]+d[1])];draw()}};
 draw();
 $('#ok',box).onclick=()=>{if(done)return;done=1;$('#ok',box).disabled=true;const ok=(t[0]==null||pt[0]===t[0])&&(t[1]==null||pt[1]===t[1]);let ex='';
  if(q.rays){const{h,k,p}=q.g;[-6,-4,-2,2,4,6].forEach(x=>{const y=k+(x-h)**2/(4*p);ex+=`<line class="ray" x1="${X(x)}" y1="0" x2="${X(x)}" y2="${Y(y)}"/><line class="ray" x1="${X(x)}" y1="${Y(y)}" x2="${X(h)}" y2="${Y(k+p)}"/>`})}
  ex+=t[0]!=null&&t[1]!=null?`<circle class="hit" cx="${X(t[0])}" cy="${Y(t[1])}" r="15"/>`:t[1]!=null?`<line class="hit" x1="0" y1="${Y(t[1])}" x2="${W}" y2="${Y(t[1])}"/>`:`<line class="hit" x1="${X(t[0])}" y1="0" x2="${X(t[0])}" y2="${W}"/>`;
  draw(ex,true);const pts=cb(ok);fbk(box,ok,pts,q);if(post)post(ok)}}
// Tipo "sl": ajuste h, k e p com controles deslizantes
function askSl(box,q,cb,post){const v={...q.i};let done=0;
 box.innerHTML=`<p class="q">${q.q}</p><svg class="gsv" viewBox="0 0 400 400" role="img" aria-label="Gráfico da parábola; use os controles abaixo"></svg><div>${['h','k','p'].map(n=>`<label>${n} = <b id="v${n}">${v[n]}</b><input type="range" id="s${n}" min="-6" max="6" step="1" value="${v[n]}" ${(q.fx||'').includes(n)?'disabled':''}></label>`).join('')}</div><p class="big2" id="eqn"></p><div class="row"><button class="btn big2b" id="ok">Confirmar</button></div><div class="fb" role="status" aria-live="polite"></div>`;
 const draw=sol=>{plot($('svg',box),{...v,ref:q.ref&&1,show:true,sol});$('#eqn',box).textContent='Equação: '+eq(v.h,v.k,v.p)};
 ['h','k','p'].forEach(n=>$('#s'+n,box).oninput=e=>{if(done)return;v[n]=+e.target.value;$('#v'+n,box).textContent=v[n];draw()});draw();
 $('#ok',box).onclick=()=>{if(done)return;done=1;$('#ok',box).disabled=true;$$('input',box).forEach(i=>i.disabled=true);const ok=q.chk(v);draw(ok?undefined:q.sol);const pts=cb(ok);fbk(box,ok,pts,q);if(post)post(ok)}}

// ===== Apresentador =====
async function profNew(){const A='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';let c='';for(let i=0;i<5;i++)c+=A[Math.floor(Math.random()*A.length)];
 try{await api(`turmas/${c}/meta`,'PUT',{estado:'espera',oculto:true,rev:0})}catch(e){$('#dbMsg').textContent='Não consegui acessar o banco. Confira a URL e as regras.';$('#dbUrl').value=DB;show('setup');return}
 PR={c,meta:{estado:'espera',oculto:true,rev:0}};const u=location.href.split(/[?#]/)[0]+'?sala='+c+(DB?'&db='+encodeURIComponent(DB):'');
 $('#pCode').textContent=c;$('#pLink').textContent=u;$('#pLink').href=u;$('#pqr').innerHTML='';
 const w=[];if(!DB)w.push('MODO TESTE: celulares NÃO conseguem entrar. Clique em “Banco de dados” e configure o Firebase.');if(location.protocol==='file:')w.push('Publique o jogo (ex.: GitHub Pages) para os alunos abrirem o link.');$('#pWarn').innerHTML=w.join('<br>');
 if(DB&&window.QRCode)new QRCode($('#pqr'),{text:u,width:200,height:200});
 show('prof');profTick();TM=setInterval(profTick,2000)}
const pod=(L,rev)=>{const N=L.length;return `<div class="pod">${[1,0,2].filter(i=>i<N).map(i=>{const r=i>=N-rev;return `<div class="pc p${i}${r?' rv':''}"><span class="md">${i+1}º</span><b>${r?esc(L[i].n):'???'}</b><small>${r?(+L[i].p||0)+' pts':'—'}</small></div>`}).join('')}</div>`};
async function profTick(){if(!PR)return;try{const d=await api('turmas/'+PR.c,'GET')||{},E=sorted(d.alunos),m=PR.meta=d.meta||PR.meta,est=m.estado||'espera';PR.top=E.slice(0,3);
 const hide=!!m.oculto,pd=m.pod||[],N=pd.length,rev=m.rev||0,nn=N||Math.min(3,E.length),done=hide&&N>0&&rev>=N;
 $('#pEst').textContent={espera:'Aguardando início',andamento:'Quiz em andamento',fim:'Quiz encerrado'}[est];
 $('#pCount').textContent=`${E.length} aluno(s) · ${E.filter(e=>e[1].fim).length} terminaram`;$('#pStart').hidden=est!=='espera';$('#pEnd').hidden=est!=='andamento';
 $('#pHide').textContent=hide?'Mostrar ranking agora':'Esconder pódio';
 const can=hide&&est==='fim'&&nn>0&&rev<nn,pos=nn-rev;$('#pRev').hidden=!can;if(can)$('#pRev').textContent=`Revelar ${pos}º lugar`;
 $('#pHint').textContent=hide&&!done?(est==='fim'?'Pódio escondido: clique em “Revelar” para o suspense!':'Pódio escondido. Encerre o quiz para liberar a revelação.'):'';
 $('#pPod').innerHTML=hide?pod(N?pd:Array(Math.max(1,nn)).fill({}),rev):'';
 $('#pRank').innerHTML=!E.length?'<li class="mu">Nenhum aluno entrou ainda. Mostre o QR Code!</li>':hide&&!done?[...E].sort((a,b)=>String(a[1].n).localeCompare(String(b[1].n))).map(e=>`<li><span>·</span><b>${esc(e[1].n)}</b><i class="pbar"><u style="width:${100*(+e[1].q||0)/NQ}%"></u></i><span>${e[1].fim?'Concluiu':'Respondendo'}</span></li>`).join(''):E.map((e,i)=>row(i,e[1],1)).join('')
}catch(e){$('#pEst').textContent='Sem conexão'}}
const setMeta=async p=>{PR.meta={...PR.meta,...p};await api(`turmas/${PR.c}/meta`,'PUT',PR.meta);profTick()};
const setEst=e=>setMeta({estado:e});
$('#pHide').onclick=()=>setMeta({oculto:!PR.meta.oculto,rev:0,pod:null});
$('#pRev').onclick=()=>{const rev=PR.meta.rev||0;beep(440+120*rev);if(!rev)setMeta({rev:1,pod:PR.top.map(e=>({n:e[1].n,p:e[1].p}))});else setMeta({rev:rev+1})};
$('#pStart').onclick=()=>setEst('andamento');$('#pEnd').onclick=()=>setEst('fim');$('#pNew').onclick=profNew;
$('#pCfg').onclick=()=>{$('#dbUrl').value=DB;show('setup')};
$('#dbSave').onclick=()=>{const u=clean($('#dbUrl').value);if(!okDb(u)){$('#dbMsg').textContent='URL inválida: deve terminar em firebaseio.com ou firebasedatabase.app.';return}DB=u;localStorage.setItem('mpDb',u);profNew()};
$('#dbTest').onclick=()=>{DB='';localStorage.removeItem('mpDb');localStorage.mpTest='1';profNew()};
$('#bProf').onclick=()=>DB?profNew():show('setup');

// ===== Aluno =====
function order(s){let a=[...s].reduce((x,c)=>(x*31+c.charCodeAt(0))>>>0,7);const r=()=>(a=(a*1664525+1013904223)>>>0)/4294967296,
 sh=l=>{for(let i=l.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[l[i],l[j]]=[l[j],l[i]]}return l};
 return sh([...sh(QM.map((_,i)=>i)).slice(0,6),...sh(QI.map((_,i)=>QM.length+i)).slice(0,4)])}   // 6 de texto + 4 interativas, mesma ordem para toda a turma   // mesma ordem para toda a turma
async function join(){const n=$('#jName').value.trim(),s=$('#jCode').value.trim().toUpperCase(),m=$('#jMsg'),k=slug(n);m.textContent='';
 if(n.length<2||!k||!s){m.textContent='Digite seu nome e o código da turma.';return}
 try{const meta=await api(`turmas/${s}/meta`,'GET');if(!meta){m.textContent=DB?'Turma não encontrada. Confira o código com o apresentador.':'Este link não tem o banco de dados da turma. O apresentador precisa configurar o Firebase (não pode usar o modo teste) e gerar um novo QR Code.';return}
  let rec=await api(`turmas/${s}/alunos/${k}`,'GET');
  if(rec&&rec.id!==ID){m.textContent='Já existe alguém com este nome na turma. Use nome e sobrenome.';return}
  if(!rec){if(meta.estado==='fim'){m.textContent='Este quiz já foi encerrado pelo apresentador.';return}rec={id:ID,n,p:0,h:0,q:0,t:0,fim:0};await api(`turmas/${s}/alunos/${k}`,'PUT',rec)}
  localStorage.setItem('mpNome',n);Q={s,k,n,idx:order(s),i:rec.q,sc:rec.p,h:rec.h,el:rec.t,t0:Date.now()-rec.t*1000,st:0};
  if(rec.fim||Q.i>=NQ)return fim();lobby(meta.estado)}catch(e){m.textContent='Sem conexão com o banco. Tente novamente.'}}
function lobby(est){if(est==='andamento')return qNext(true);show('lobby');$('#lName').textContent=Q.n;
 TM=setInterval(async()=>{try{const m=await api(`turmas/${Q.s}/meta`,'GET');if(m&&m.estado==='andamento')qNext(true);else if(m&&m.estado==='fim')fim()}catch(e){}},2000)}
const sync=f=>api(`turmas/${Q.s}/alunos/${Q.k}`,'PUT',{id:ID,n:Q.n,p:Q.sc,h:Q.h,q:Q.i,t:Math.round((Date.now()-Q.t0)/1000),fim:f?1:0}).catch(()=>{});
function qNext(first){if(first){show('quiz');Q.t0=Date.now()-Q.el*1000}
 $('#qProg').textContent=`Pergunta ${Q.i+1} de ${NQ}`;$('#qBar').style.width=100*Q.i/NQ+'%';$('#qSc').textContent=Q.sc;
 ask($('#qBox'),QB[Q.idx[Q.i]],ok=>{beep(ok);let p=0;if(ok){Q.st++;p=100+Math.min(50,(Q.st-1)*10);Q.sc+=p;Q.h++}else Q.st=0;Q.i++;$('#qSc').textContent=Q.sc;sync(Q.i>=NQ);return p},true,()=>{
  const b=document.createElement('button'),last=Q.i>=NQ;b.className='btn big2b';b.textContent=last?'Ver meu resultado':'Próxima pergunta ';b.onclick=()=>last?fim():qNext();$('#qBox').append(b);b.focus()})}
function fim(){show('fim');$('#fRes').innerHTML=`<b>${esc(Q.n)}</b>, você fez <b>${Q.sc} pontos</b> (${Q.h} de ${NQ} acertos).`;fimTick();TM=setInterval(fimTick,3000)}
async function fimTick(){try{const E=sorted(await api(`turmas/${Q.s}/alunos`,'GET')),m=await api(`turmas/${Q.s}/meta`,'GET')||{},pd=m.pod||[],hid=m.oculto&&!(pd.length&&(m.rev||0)>=pd.length),pos=E.findIndex(e=>e[0]===Q.k)+1;
 $('#fPos').textContent=hid?'O apresentador vai revelar o pódio… aguarde o suspense!':pos?`Você está em ${pos}º lugar de ${E.length}!`:'';$('#fRank').innerHTML=hid?'':E.slice(0,5).map((e,i)=>row(i,e[1])).join('')}catch(e){}}
$('#jGo').onclick=join;$$('#s-join input').forEach(i=>i.onkeydown=e=>{if(e.key==='Enter')join()});
$('#bAluno').onclick=()=>{$('#jName').value=localStorage.getItem('mpNome')||'';show('join')};

// ===== Perguntas (as mesmas para toda a turma) =====
const QM=[
['A parábola é o conjunto dos pontos equidistantes de:',['Um foco e uma diretriz','Dois focos','Um centro','Dois eixos'],0,'Definição: PF = d(P, diretriz).'],
['Em (x − h)² = 4p(y − k), o vértice é:',['(h, k)','(k, h)','(−h, −k)','(p, p)'],0,'h e k são as coordenadas do vértice.'],
['Foco de (x − 2)² = 8(y − 1):',['(2, 3)','(2, −1)','(4, 1)','(2, 9)'],0,'4p = 8 ⇒ p = 2; F = (2, 1 + 2).'],
['Diretriz de x² = 12y:',['y = −3','y = 3','x = −3','y = −12'],0,'4p = 12 ⇒ p = 3; diretriz y = −p = −3.'],
['Eixo de simetria de (x + 1)² = 4(y − 2):',['x = −1','x = 1','y = 2','y = −2'],0,'O eixo é x = h = −1.'],
['Concavidade de x² = −4y:',['Para baixo','Para cima','Para a direita','Para a esquerda'],0,'4p = −4 ⇒ p = −1 < 0: abre para baixo.'],
['Em y = −2x² + 3x, a parábola abre:',['Para baixo','Para cima','Para a direita','Não é parábola'],0,'a = −2 < 0.'],
['Em y = ax² + bx + c com a > 0, a parábola abre:',['Para cima','Para baixo','Para a esquerda','Depende de c'],0,'O sinal de a define a concavidade.'],
['Vértice de (x − 3)² = 4(y + 5):',['(3, −5)','(3, 5)','(−3, −5)','(−3, 5)'],0,'y + 5 = y − (−5) ⇒ k = −5.'],
['Com p > 0 na forma vertical, o foco está:',['Acima do vértice','Abaixo do vértice','À esquerda','Sobre a diretriz'],0,'F = (h, k + p).'],
['Para P na parábola, PF e a distância de P à diretriz são:',['Iguais','Somadas dão 1','PF é o dobro','Sempre diferentes'],0,'É a definição da parábola.'],
['Em uma antena parabólica, o receptor fica:',['No foco','No vértice','Na diretriz','Fora do eixo'],0,'Raios paralelos ao eixo convergem para o foco.'],
['Em um farol com espelho parabólico, a lâmpada fica:',['No foco','Na diretriz','No vértice','Atrás do espelho'],0,'Fonte no foco gera feixe paralelo ao eixo.'],
['Sem resistência do ar, a trajetória de um projétil é aproximadamente:',['Uma parábola','Uma reta','Uma circunferência','Uma hipérbole'],0,'Gravidade constante ⇒ trajetória parabólica.'],
['Foco de y² = 8x:',['(2, 0)','(0, 2)','(8, 0)','(−2, 0)'],0,'Eixo horizontal: 4p = 8 ⇒ p = 2; F = (h + p, k).'],
['Diretriz de y² = 4x:',['x = −1','x = 1','y = −1','y = 1'],0,'p = 1; diretriz x = h − p = −1.'],
['Distância do vértice ao foco em x² = 16y:',['4','16','8','2'],0,'4p = 16 ⇒ p = 4.'],
['Vértice de y = x² − 4x + 3:',['(2, −1)','(−2, 1)','(2, 1)','(4, 3)'],0,'y = (x − 2)² − 1 ⇒ V(2, −1).'],
['Ao aumentar |p|, mantendo o vértice, a parábola fica:',['Mais aberta','Mais fechada','Igual','Uma reta'],0,'y = x²/(4p): menor curvatura.'],
['O eixo de simetria e a diretriz são:',['Perpendiculares','Paralelos','Coincidentes','Concorrentes oblíquos'],0,'A diretriz é perpendicular ao eixo.'],
['Foco de x² = −8y:',['(0, −2)','(0, 2)','(−2, 0)','(0, −8)'],0,'4p = −8 ⇒ p = −2; F = (0, p).']].map(([q,o,a,e])=>({q,o,a,e}));
// Perguntas interativas: arrastar ponto (pt), controles deslizantes (sl) e leitura de gráfico
const QI=[
{k:'pt',q:'Arraste o ponto até o <b>vértice</b> da parábola.',g:{h:-3,k:2,p:1},t:[-3,2],e:'O vértice é o ponto de retorno da curva: V(−3, 2).'},
{k:'pt',q:'Arraste o ponto até o <b>foco</b>. (Vértice em (1, −2) e p = 2.)',g:{h:1,k:-2,p:2},t:[1,0],e:'F = (h, k + p) = (1, −2 + 2) = (1, 0).'},
{k:'pt',q:'Arraste o ponto até o <b>foco</b>. Dica: esta parábola abre para baixo.',g:{h:-2,k:3,p:-2},t:[-2,1],e:'p = −2 ⇒ F = (−2, 3 − 2) = (−2, 1). Com p negativo, o foco fica abaixo do vértice.'},
{k:'pt',q:'Arraste o ponto até a <b>diretriz</b> (qualquer posição sobre ela).',g:{h:0,k:1,p:2},t:[null,-1],e:'Diretriz: y = k − p = 1 − 2 = −1, uma reta horizontal.'},
{k:'pt',q:'Arraste o ponto até o <b>eixo de simetria</b> (qualquer posição sobre ele).',g:{h:3,k:-1,p:1},t:[3,null],e:'O eixo é a reta vertical x = h = 3, que passa pelo vértice e pelo foco.'},
{k:'pt',q:'Os raios chegam paralelos ao eixo desta antena. Arraste o receptor até onde eles se encontram: o <b>foco</b>.',g:{h:0,k:-3,p:2},t:[0,-1],rays:1,e:'Refletores parabólicos concentram raios paralelos ao eixo no foco: F = (0, −3 + 2) = (0, −1).'},
{k:'sl',q:'Ajuste h, k e p: vértice em (2, 1) e foco em (2, 4).',i:{h:0,k:0,p:1},chk:v=>v.h==2&&v.k==1&&v.p==3,sol:{h:2,k:1,p:3},e:'Vértice = (h, k) = (2, 1). Foco = (h, k + p) = (2, 4) ⇒ p = 3.'},
{k:'sl',q:'Faça a parábola abrir para <b>baixo</b>, com vértice em (0, 3) e foco em (0, 1).',i:{h:1,k:0,p:1},chk:v=>v.h==0&&v.k==3&&v.p==-2,sol:{h:0,k:3,p:-2},e:'O foco está abaixo do vértice ⇒ p < 0: p = 1 − 3 = −2.'},
{k:'sl',q:'Com vértice em (0, 0), deixe a parábola <b>mais aberta</b> que a curva cinza (p = 1).',i:{h:0,k:0,p:1},fx:'hk',ref:1,chk:v=>v.p>1,sol:{h:0,k:0,p:4},e:'Em y = x²/(4p), quanto maior p positivo, mais aberta a curva. Qualquer p > 1 serve.'},
{q:'Qual reta é a <b>diretriz</b>? (A vermelha, B azul, C ocre)',g:{h:1,k:2,p:1,lines:[{y:1,l:'A'},{x:1,l:'B'},{y:2,l:'C'}]},o:['Reta A','Reta B','Reta C'],a:0,e:'Diretriz: y = k − p = 1. B é o eixo de simetria (x = 1) e C é a horizontal pelo vértice.'},
{q:'Qual reta é o <b>eixo de simetria</b>? (A vermelha, B azul, C ocre)',g:{h:-2,k:-1,p:1,lines:[{y:-2,l:'A'},{x:-2,l:'B'},{y:0,l:'C'}]},o:['Reta A','Reta B','Reta C'],a:1,e:'O eixo passa pelo vértice e pelo foco: x = −2 (B). A é a diretriz (y = −2) e C é horizontal pelo foco.'}];
const QB=[...QM,...QI];

// ===== Início =====
$('#home').onclick=()=>{PR=null;Q=null;show('home')};
$('#snd').textContent=SND?'Som: ligado':'Som: desligado';$('#snd').setAttribute('aria-label','Ligar ou desligar o som');
$('#snd').onclick=()=>{SND=!SND;localStorage.mpSnd=SND?'1':'0';$('#snd').textContent=SND?'Som: ligado':'Som: desligado'};
if(P.get('sala')){$('#jCode').value=P.get('sala').toUpperCase().slice(0,8);$('#jName').value=localStorage.getItem('mpNome')||'';show('join')}else show('home');
