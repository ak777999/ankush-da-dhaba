(() => {
  "use strict";
  const IMG = n => `assets/food/${n}.webp`;
  const MENU = [
    { key:"roti", ring:"ROTI", title:"ROTI YA CHAWAL?", gur:"ਰੋਟੀ ਜਾਂ ਚੌਲ?", slot:"ROTI /<br>CHAWAL", flat:true,
      items:[["naan","Butter Naan",60,"2 pc, makhan wala"],["tandoori-roti","Tandoori Roti",50,"2 pc, ghee laga ke"],["jeera-rice","Jeera Rice",120,"basmati, desi ghee"],["lachha-paratha","Lachha Paratha",70,"crispy layers"]]},
    { key:"dal", ring:"DAL", title:"DAL KAUN SI?", gur:"ਦਾਲ ਕਿਹੜੀ?", slot:"DAL",
      items:[["dal-makhani","Dal Makhani",220,"raat bhar dhimi aanch"],["yellow-tadka","Yellow Tadka",180,"lehsun-mirch tadka"],["rajma","Rajma",190,"Jammu wale"],["chole","Chole",190,"Pindi style"]]},
    { key:"sabzi", ring:"SABZI", title:"SABZI / MAIN", gur:"ਸਬਜ਼ੀ", slot:"SABZI",
      items:[["paneer-butter-masala","Paneer Butter Masala",280,"malai paneer"],["butter-chicken","Butter Chicken",340,"tandoori, makhani"],["sarson-saag","Sarson Da Saag",240,"chitta makhan"],["kadhai-paneer","Kadhai Paneer",290,"shimla mirch"]]},
    { key:"crunch", ring:"CRUNCH", title:"KUCH CRUNCHY", gur:"ਕੁਝ ਕੁਰਕੁਰਾ", slot:"CRUNCHY",
      items:[["papad","Masala Papad",40,"roasted"],["onion-pakora","Onion Pakora",90,"hari mirch ke saath"],["samosa","Samosa",50,"2 pc + chutney"],["amritsari-kulcha","Amritsari Kulcha",110,"stuffed, makhan"]]},
    { key:"meetha", ring:"MEETHA", title:"MEETHA YA LASSI?", gur:"ਮਿੱਠਾ ਜਾਂ ਲੱਸੀ?", slot:"MEETHA",
      items:[["gulab-jamun","Gulab Jamun",80,"3 pc, garam"],["kheer","Kheer",90,"kesar-badam"],["sweet-lassi","Sweet Lassi",100,"kulhad, malai maar ke"],["jalebi","Jalebi",70,"desi ghee"]]},
  ];
  // slot positions on thali (% of thali, center x/y, diameter)
  const SLOTS = [[35,62,37],[30.5,27.5,27],[62.5,24.5,27],[77,52.5,25],[62.5,78.5,25]];
  const ITEM_POS = [[30,47],[70,47],[30,76],[70,76]];

  const $ = s => document.querySelector(s);
  const dial=$("#dial"), ring=$("#dialRing"), itemsEl=$("#dialItems"), head=$("#dialHead");
  const slotsEl=$("#slots"), thali=$("#thali"), lid=$("#lid"), badge=$("#thaliBadge");
  const rLines=$("#rLines"), rSub=$("#rSub"), rGst=$("#rGst"), rTotal=$("#rTotal"), rReady=$("#rReady");
  const stepsEl=$("#steps"), fx=$("#fx"), hint=$("#hint");
  const checkout=$("#checkout"), veil=$("#veil");

  const picks = [null,null,null,null,null];
  let step = 0, ringAngle = 0, busy = false, packed = false, orderNo = 0;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- preload ----------
  MENU.forEach(c => c.items.forEach(i => { const im = new Image(); im.src = IMG(i[0]); }));

  // ---------- background toran (marigold garland) ----------
  function buildToran(){
    const svg = $("#toran"); const W = innerWidth; const n = Math.max(8, Math.round(W/150));
    let s = ""; const seg = W/n;
    for(let k=0;k<n;k++){
      const x0=k*seg, x1=(k+1)*seg, sag=26;
      s += `<path d="M${x0},4 Q${(x0+x1)/2},${4+sag*2} ${x1},4" fill="none" stroke="#7a4a12" stroke-width="2"/>`;
      for(let j=1;j<8;j++){
        const t=j/8, x=x0+(x1-x0)*t, y=4+2*sag*2*t*(1-t);
        const c = j%2 ? "#FF8A00" : "#FFC21A";
        s += `<circle cx="${x}" cy="${y}" r="7.5" fill="${c}" stroke="#B35A00" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="2.6" fill="#B35A00" opacity=".55"/>`;
      }
      const mx=(x0+x1)/2, my=4+sag;
      s += `<path d="M${mx},${my+6} q-9,14 0,30 q9,-16 0,-30z" fill="#13824A" stroke="#0b4f2c" stroke-width="1.4"/>`;
    }
    svg.setAttribute("viewBox",`0 0 ${W} 70`); svg.innerHTML = s;
  }

  // ---------- marquee ----------
  (function(){
    const bits = [["HORN OK PLEASE",""],["ਢਾਬਾ","g"],["GARMA GARAM ROTIYAN",""],["ढाबा","d"],["USE DIPPER AT NIGHT",""],["ਜੀ ਆਇਆਂ ਨੂੰ","g"],["BURI NAZAR WALE TERA MUH KALA",""],["शुद्ध देसी घी","d"],["LASSI PEEKE JAANA",""]];
    const one = bits.map(([t,c]) => `<span class="${c}">${t}<em>✸</em></span>`).join("");
    $("#marquee").innerHTML = one + one;
  })();

  // ---------- dial ring ----------
  MENU.forEach((c,i) => {
    const el = document.createElement("div");
    el.className = "ring-label"; el.dataset.i = i;
    el.style.transform = `rotate(${i*72}deg)`;
    el.innerHTML = `<span><b></b>${i+1} ${c.ring}</span>`;
    ring.appendChild(el);
  });
  for(let t=0;t<60;t++){
    if(t%12===0) continue;
    const tk=document.createElement("i"); tk.className="ring-tick";
    tk.style.transform=`rotate(${t*6}deg) translate(-1px, calc(var(--dial) * -0.5 + 3px))`;
    tk.style.height = t%6===0 ? "12px" : "7px"; tk.style.opacity = t%6===0 ? ".9" : ".45";
    ring.appendChild(tk);
  }
  // step pills
  MENU.forEach((c,i) => {
    const li=document.createElement("li"); li.textContent=i+1; li.title=c.title; li.tabIndex=0;
    li.addEventListener("click",()=>{ if(!busy && !packed) goStep(i); });
    li.addEventListener("keydown",e=>{ if(e.key==="Enter"&&!busy&&!packed) goStep(i); });
    stepsEl.appendChild(li);
  });

  // ---------- slots ----------
  SLOTS.forEach(([x,y,d],i) => {
    const b=document.createElement("button"); b.type="button";
    b.className="slot"+(MENU[i].flat?" flat":""); b.dataset.i=i;
    b.style.left=x+"%"; b.style.top=y+"%"; b.style.width=d+"%"; b.style.height=d+"%";
    b.setAttribute("aria-label", `${MENU[i].ring} khaana — khaali`);
    b.innerHTML=`<span class="ph">${i+1}<br>${MENU[i].slot}</span><span class="food"><img alt=""></span><span class="x" title="Hatao">✕</span>`;
    b.addEventListener("click",()=>removeSlot(i));
    slotsEl.appendChild(b);
  });
  const slotEl = i => slotsEl.children[i];

  // ---------- render dial items ----------
  function renderItems(animate){
    const c = MENU[step];
    const build = () => {
      itemsEl.innerHTML="";
      c.items.forEach(([id,name,price,note],k)=>{
        const b=document.createElement("button"); b.type="button"; b.className="d-item"+(animate?" in":"");
        if(picks[step] && picks[step].id===id) b.classList.add("picked");
        b.style.left=ITEM_POS[k][0]+"%"; b.style.top=ITEM_POS[k][1]+"%";
        if(animate) b.style.animationDelay=(k*70)+"ms";
        b.innerHTML=`<span class="pic"><img src="${IMG(id)}" alt="" draggable="false"></span><span class="nm">${name}<span class="pr">₹${price}</span></span>`;
        b.setAttribute("aria-label",`${name}, ${price} rupaye`);
        b.addEventListener("click",()=>pick(k,b));
        itemsEl.appendChild(b);
      });
    };
    if(animate && itemsEl.children.length){
      [...itemsEl.children].forEach((el,k)=>{ el.classList.remove("in"); el.style.animationDelay=(k*40)+"ms"; el.classList.add("out"); });
      setTimeout(build, reduce?0:300);
    } else build();
    $("#dialStep").textContent=`STEP ${step+1} / 5`;
    $("#dialTitle").textContent=c.title;
    $("#dialGur").textContent=c.gur;
  }

  function syncUI(){
    const filled = picks.filter(Boolean).length;
    [...ring.querySelectorAll(".ring-label")].forEach((el,i)=>{ el.classList.toggle("done",!!picks[i]); el.classList.toggle("active",i===step&&!isFull()); });
    [...stepsEl.children].forEach((li,i)=>{ li.className=(picks[i]?"done":"")+(i===step&&!isFull()?" on":""); });
    [...slotsEl.children].forEach((s,i)=>s.classList.toggle("next", i===step && !picks[i] && !packed));
    badge.textContent = `${filled} / 5`; badge.classList.toggle("full", filled===5);
    badge.classList.remove("bump"); void badge.offsetWidth; badge.classList.add("bump");
    const full = isFull();
    rReady.classList.toggle("show", full && !packed);
    hint.textContent = packed ? "Thali pack ho gayi! Bas address daalo 🛵" :
      full ? "Thali full! Ab PACK KARO dabao 👉" :
      filled ? `Shabaash! Ab ${MENU[step].ring.toLowerCase()} chuno · thali mein kisi katori pe click karke badal sakte ho` :
      "Kuch bhi chuno — seedha thali mein udd ke jayega ✨";
    dial.classList.toggle("locked", packed);
  }
  const isFull = () => picks.every(Boolean);

  function rotateTo(i){
    const target = -i*72;
    let delta = ((target - ringAngle) % 360 + 540) % 360 - 180;
    ringAngle += delta;
    ring.style.transform = `rotate(${ringAngle}deg)`;
  }

  function goStep(i, animate=true){
    if(i===step && itemsEl.children.length){ syncUI(); return; }
    step=i; rotateTo(i);
    head.classList.remove("swap"); void head.offsetWidth; head.classList.add("swap");
    setTimeout(()=>{},0);
    renderItems(animate); syncUI();
  }

  // ---------- pick & fly ----------
  function pick(k, btn){
    if(busy || packed) return;
    const s = step, c = MENU[s], [id,name,price,note] = c.items[k];
    busy = true;
    const from = btn.querySelector(".pic").getBoundingClientRect();
    const slot = slotEl(s);
    const replacing = !!picks[s];
    if(replacing){ slot.classList.add("out"); removeLine(s); }
    const foodBox = slot.querySelector(".food");
    // target = food area of slot
    slot.classList.add("filled"); const to = foodBox.getBoundingClientRect(); if(!replacing) slot.classList.remove("filled");
    btn.classList.add("picked");
    fly(IMG(id), from, to, () => {
      slot.classList.remove("out");
      foodBox.querySelector("img").src = IMG(id);
      picks[s] = {id,name,price,note};
      slot.classList.add("filled"); slot.setAttribute("aria-label",`${name} — hatane ke liye click karo`);
      slot.classList.remove("plop"); void slot.offsetWidth; slot.classList.add("plop");
      if(!MENU[s].flat || id==="jeera-rice") addSteam(slot);
      thali.classList.remove("shake"); void thali.offsetWidth; thali.classList.add("shake");
      sparks(to);
      addLine(s);
      busy = false;
      const next = nextEmpty(s);
      if(next === -1){ syncUI(); }
      else setTimeout(()=>goStep(next), reduce?0:260);
      syncUI();
    });
  }
  function nextEmpty(from){
    for(let d=1; d<=5; d++){ const j=(from+d)%5; if(!picks[j]) return j; }
    return -1;
  }
  function addSteam(slot){
    if(slot.querySelector(".steam")) return;
    const st=document.createElement("span"); st.className="steam"; st.innerHTML="<i></i><i></i><i></i>";
    st.style.transform="translateX(-50%)"; slot.appendChild(st);
  }

  function fly(src, a, b, done){
    if(reduce){ done(); return; }
    const el=document.createElement("div"); el.className="flyer"; el.innerHTML=`<img src="${src}" alt="">`;
    const sh=document.createElement("div"); sh.className="flyer-shadow";
    fx.appendChild(sh); fx.appendChild(el);
    const ax=a.left+a.width/2, ay=a.top+a.height/2, bx=b.left+b.width/2, by=b.top+b.height/2;
    const dist=Math.hypot(bx-ax,by-ay);
    const arc=Math.min(340, Math.max(140, dist*0.5));
    const dur=Math.min(1100, 650+dist*0.5);
    const spin=(bx>ax?1:-1)*(300+Math.random()*120);
    const t0=performance.now();
    const easeX = t => t<.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
    function frame(now){
      let t=Math.min(1,(now-t0)/dur);
      const tx=easeX(t);
      const x=ax+(bx-ax)*tx;
      const y=ay+(by-ay)*t - arc*4*t*(1-t);
      const lift = 4*t*(1-t);
      const size=a.width+(b.width-a.width)*tx;
      const sc = 1 + lift*0.35;
      el.style.width=el.style.height=size+"px";
      el.style.transform=`translate(${x-size/2}px,${y-size/2}px) scale(${sc}) rotate(${spin*tx}deg)`;
      const sy=ay+(by-ay)*t; // ground shadow follows straight line
      sh.style.width=sh.style.height=size+"px";
      sh.style.transform=`translate(${x-size/2+10}px,${sy-size/2+14}px) scale(${1-lift*0.45})`;
      sh.style.opacity=String(.9-lift*.6);
      if(t<1) requestAnimationFrame(frame); else { el.remove(); sh.remove(); done(); }
    }
    requestAnimationFrame(frame);
  }

  function sparks(r){
    if(reduce) return;
    const cx=r.left+r.width/2, cy=r.top+r.height/2, cols=["#FF8A00","#FFC21A","#E63027","#13824A","#fff"];
    for(let i=0;i<14;i++){
      const p=document.createElement("i"); p.className="spark"; p.style.background=cols[i%cols.length];
      p.style.left=cx+"px"; p.style.top=cy+"px"; fx.appendChild(p);
      const ang=Math.PI*2*i/14 + Math.random()*.3, d=r.width*0.55+Math.random()*40;
      p.animate([{transform:"translate(-50%,-50%) scale(1)",opacity:1},{transform:`translate(calc(-50% + ${Math.cos(ang)*d}px), calc(-50% + ${Math.sin(ang)*d}px)) scale(.2)`,opacity:0}],
        {duration:550+Math.random()*250,easing:"cubic-bezier(.2,.8,.3,1)"}).onfinish=()=>p.remove();
    }
  }

  // ---------- remove ----------
  function removeSlot(i){
    if(busy || packed || !picks[i]) return;
    const slot=slotEl(i); busy=true;
    slot.classList.add("out");
    removeLine(i);
    setTimeout(()=>{
      slot.classList.remove("filled","out","plop"); slot.querySelector(".steam")?.remove();
      slot.setAttribute("aria-label",`${MENU[i].ring} khaana — khaali`);
      picks[i]=null; busy=false;
      if(step===i) { renderItems(false); syncUI(); } else goStep(i);
    }, reduce?0:330);
  }

  // ---------- receipt ----------
  function total(){ const sub=picks.reduce((s,p)=>s+(p?p.price:0),0); const gst=Math.round(sub*0.05); return {sub,gst,tot:sub+gst}; }
  function updateTotals(){
    const {sub,gst,tot}=total();
    rSub.textContent=`₹${sub}`; rGst.textContent=`₹${gst}`; rTotal.textContent=`₹${tot}`;
    rTotal.classList.remove("tick"); void rTotal.offsetWidth; rTotal.classList.add("tick");
    $("#coTotal").textContent=`₹${tot}`;
  }
  function addLine(i){
    rLines.querySelector(".r-empty")?.remove();
    const p=picks[i];
    const li=document.createElement("li"); li.className="r-line"; li.dataset.i=i;
    li.innerHTML=`<span class="q">1×</span><span class="n caret"></span><span class="dots"></span><span class="p">₹${p.price}</span>`;
    // keep receipt order by category
    const after=[...rLines.children].find(el=>+el.dataset.i>i && !el.classList.contains("gone"));
    rLines.insertBefore(li, after||null);
    const n=li.querySelector(".n"); const text=p.name.toUpperCase(); let k=0;
    const tick=()=>{ n.textContent=text.slice(0,++k); if(k<text.length) setTimeout(tick, reduce?0:22); else { n.classList.remove("caret"); n.insertAdjacentHTML("beforeend",`<span class="c">${p.note}</span>`);} };
    tick();
    updateTotals();
  }
  function removeLine(i){
    const li=rLines.querySelector(`.r-line[data-i="${i}"]:not(.gone)`); if(!li) return;
    li.classList.add("gone"); setTimeout(()=>{ li.remove(); if(!rLines.children.length) rLines.innerHTML='<li class="r-empty">— thali khaali hai —</li>'; }, 300);
    const keep=picks[i]; picks[i]=null; updateTotals(); picks[i]=keep;
  }
  function barcode(seed){
    let h=seed*2654435761>>>0; const bc=$("#barcode"); let s="";
    const rnd=()=>{ h^=h<<13; h>>>=0; h^=h>>17; h^=h<<5; h>>>=0; return h/4294967296; };
    let w=0; while(w<230){ const bar=1+Math.floor(rnd()*3.2), gap=1+Math.floor(rnd()*2.6); s+=`<i style="width:${bar}px"></i><b style="width:${gap}px"></b>`; w+=bar+gap; }
    bc.innerHTML=s;
    const code=String(seed).padStart(4,"0"); $("#rCode").textContent=`8901 ${code} ${String(seed*7%10000).padStart(4,"0")} 2`;
  }
  function newOrder(){
    orderNo = 1000+Math.floor(Math.random()*9000);
    $("#rOrder").textContent=`ORDER #${orderNo}`;
    const d=new Date(); const pad=n=>String(n).padStart(2,"0");
    $("#rDate").textContent=`${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
    barcode(orderNo);
  }

  // ---------- pack & checkout ----------
  $("#packBtn").addEventListener("click",()=>{
    if(!isFull() || packed) return;
    packed=true; syncUI();
    lid.classList.remove("lift"); lid.classList.add("drop");
    setTimeout(()=>{ thali.classList.remove("shake"); void thali.offsetWidth; thali.classList.add("shake"); }, reduce?0:520);
    setTimeout(openCheckout, reduce?0:950);
  });
  function openCheckout(){
    checkout.classList.remove("done"); checkout.classList.add("on"); veil.classList.add("on"); checkout.setAttribute("aria-hidden","false");
    setTimeout(()=>$("#fName").focus({preventScroll:true}), 500);
  }
  function closeCheckout(){
    checkout.classList.remove("on"); veil.classList.remove("on"); checkout.setAttribute("aria-hidden","true");
  }
  $("#coClose").addEventListener("click",()=>{
    const wasDone = checkout.classList.contains("done");
    closeCheckout();
    if(!wasDone){ // un-pack so they can still edit
      packed=false; lid.classList.remove("drop"); lid.classList.add("lift"); syncUI();
    }
  });
  veil.addEventListener("click",()=>$("#coClose").click());
  document.addEventListener("keydown",e=>{ if(e.key==="Escape" && checkout.classList.contains("on")) $("#coClose").click(); });
  $("#coForm").addEventListener("submit",e=>{
    e.preventDefault();
    const nm=$("#fName"), ad=$("#fAddr"); let ok=true;
    [nm,ad].forEach(f=>{ f.classList.remove("err"); if(!f.value.trim()){ void f.offsetWidth; f.classList.add("err"); ok=false; } });
    if(!ok){ (nm.value.trim()?ad:nm).focus(); return; }
    const first=nm.value.trim().split(/\s+/)[0];
    $("#coMsg").textContent=`${first} ji, order #${orderNo} (₹${total().tot}, cash on delivery) — bas 30–35 minute. Tandoor garam hai!`;
    checkout.classList.add("done");
    $("#rStamp").classList.add("on");
    confetti();
  });
  $("#againBtn").addEventListener("click",()=>{ closeCheckout(); reset(); });
  function confetti(){
    if(reduce) return;
    const cols=["#FF8A00","#FFC21A","#E63027","#FF4F8B","#13824A"];
    for(let i=0;i<90;i++){
      const p=document.createElement("i"); p.className="petal"; p.style.left=(Math.random()*100)+"vw"; p.style.background=cols[i%cols.length];
      fx.appendChild(p);
      const dx=(Math.random()-.5)*200, rot=Math.random()*720-360, dur=2200+Math.random()*2200;
      p.animate([{transform:"translate(0,0) rotate(0)",opacity:1},{transform:`translate(${dx}px, ${innerHeight+60}px) rotate(${rot}deg)`,opacity:.9}],
        {duration:dur,delay:Math.random()*700,easing:"cubic-bezier(.3,.1,.6,1)",fill:"backwards"}).onfinish=()=>p.remove();
    }
  }

  // ---------- reset ----------
  function reset(){
    if(busy) return;
    closeCheckout();
    for(let i=0;i<5;i++){ picks[i]=null; const s=slotEl(i); s.classList.remove("filled","plop","out"); s.querySelector(".steam")?.remove(); }
    rLines.innerHTML='<li class="r-empty">— thali khaali hai —</li>'; updateTotals();
    if(packed||lid.classList.contains("drop")){ lid.classList.remove("drop"); lid.classList.add("lift"); }
    packed=false; $("#rStamp").classList.remove("on"); $("#coForm").reset();
    newOrder();
    if(step!==0) goStep(0); else { renderItems(true); syncUI(); }
  }
  $("#resetBtn").addEventListener("click",reset);

  // ---------- test hooks (for screenshots / QA) ----------
  window.__dhaba = { pick:(k)=>{ const b=itemsEl.children[k]; if(b) pick(k,b); }, state:()=>({step,picks:picks.map(p=>p&&p.id),packed,busy}), reset };

  // ---------- init ----------
  buildToran(); addEventListener("resize", buildToran);
  newOrder(); renderItems(true); syncUI(); updateTotals();
  rTotal.classList.remove("tick");
})();
