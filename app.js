/* Mi Biblioteca — interfaz inicial */
const SUPABASE_URL = "https://cdcurffsiiwtxswbqbrp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_8Owwrp6WocaP2Y2m3qGolg_eud1xHF4";
const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const app = document.getElementById("app");
const modal = document.getElementById("modal");
const modalContent = document.getElementById("modal-content");
const toastEl = document.getElementById("toast");
const colors = ["#FADADD","#F8CFE0","#F7D6E8","#EADCF8","#DCCFF5","#D7DDFB","#D6E8FF","#CDEBF7","#C9F0EA","#D5F2D5","#E5F2C9","#F8F0C9","#FFE4C7","#FFD9B8","#F6D5C8","#E8DCCB","#DCE3E8","#E6D9F2"];
let currentUser = null, subjects = [], summaries = [], activeSubject = null, viewMode = "grid", searchTerm = "";
let toastTimer;

function toast(message){toastEl.textContent=message;toastEl.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toastEl.classList.remove("show"),2800)}
function esc(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dateLabel(value){return new Intl.DateTimeFormat("es-UY",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(value))}
function initials(email=""){return email.slice(0,1).toUpperCase()||"U"}
function showModal(html){modalContent.innerHTML=html;modal.showModal()}
function closeModal(){modal.close();modalContent.innerHTML=""}
modal.addEventListener("click",e=>{if(e.target===modal)closeModal()});

function medicalIllustration(){return `<svg class="medical-art" viewBox="0 0 420 270" fill="none" aria-hidden="true"><path d="M40 220C85 180 90 80 170 65C250 50 260 155 330 130C365 117 380 80 395 55" stroke="#c9b9e8" stroke-width="2" stroke-dasharray="5 8"/><rect x="125" y="28" width="168" height="210" rx="24" fill="#eee8f8"/><rect x="145" y="49" width="128" height="168" rx="16" fill="#fff" stroke="#ded4ef" stroke-width="2"/><path d="M184 49V37C184 30 190 24 197 24H221C228 24 234 30 234 37V49" stroke="#b5a3d8" stroke-width="5"/><path d="M209 88V174M166 131H252" stroke="#b6a5dc" stroke-width="13" stroke-linecap="round"/><circle cx="90" cy="90" r="27" fill="#e4eff8"/><path d="M90 77V103M77 90H103" stroke="#8aabc4" stroke-width="5" stroke-linecap="round"/><circle cx="335" cy="195" r="32" fill="#e3f1e9"/><path d="M335 178V212M318 195H352" stroke="#85b69b" stroke-width="5" stroke-linecap="round"/><path d="M60 194C72 181 87 181 99 194M318 53C330 40 345 40 357 53" stroke="#d9c9ee" stroke-width="5" stroke-linecap="round"/></svg>`}
function renderLogin(){app.innerHTML=`<main class="login-wrap"><section class="login-art"><span class="eyebrow">Un espacio para aprender</span><h1>Mi Biblioteca<span style="color:var(--accent)">.</span></h1><p>Todos tus resúmenes, materias y apuntes interactivos en un solo lugar. Un espacio tranquilo para organizar lo que estás aprendiendo.</p>${medicalIllustration()}</section><section class="login-card"><span class="eyebrow">Bienvenida</span><h2>Ingresá a tu espacio</h2><p class="muted">Usá tu correo y contraseña para continuar.</p><form id="login-form"><div class="field"><label for="email">Correo electrónico</label><input id="email" name="email" type="email" autocomplete="username" placeholder="tu@correo.com" required></div><div class="field"><label for="password">Contraseña</label><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Tu contraseña" required></div><button class="btn full" type="submit">Ingresar a mi biblioteca</button><p id="login-error" class="muted" role="alert"></p></form></section></main>`;
document.getElementById("login-form").addEventListener("submit",async e=>{e.preventDefault();const form=e.currentTarget,button=form.querySelector("button"),error=document.getElementById("login-error");button.disabled=true;button.textContent="Ingresando…";error.textContent="";try{const {data,error:err}=await db.auth.signInWithPassword({email:form.elements.email.value.trim(),password:form.elements.password.value});if(err)throw err;currentUser=data.user;if(!currentUser)throw new Error("Supabase inició sesión, pero no devolvió los datos del usuario.");enterLibrary(currentUser)}catch(err){console.error("Error al ingresar:",err);error.textContent=err.message==="Invalid login credentials"?"El correo o la contraseña no son correctos.":err.message;button.disabled=false;button.textContent="Ingresar a mi biblioteca"}})}

const homeGreetings=[
  ["¡Qué bueno verte de nuevo!","Tu espacio de estudio está listo para seguir creciendo."],
  ["¡Vamos con un poquito más!","Tus materias y resúmenes te esperan."],
  ["Un paso más en tu camino","Todo tu material de estudio, ordenado y a mano."],
  ["¡Bienvenida a tu biblioteca!","Elegí una materia o seguí con lo último que estuviste estudiando."],
  ["¡A seguir aprendiendo!","Cada resumen cuenta. Todo está acá, listo para vos."]
];
let currentHomeGreeting=homeGreetings[Math.floor(Math.random()*homeGreetings.length)];
function chooseHomeGreeting(){currentHomeGreeting=homeGreetings[Math.floor(Math.random()*homeGreetings.length)]}
function renderShell(){
  const email=currentUser.email||"";
  const homeView=!activeSubject;
  const pageContent=homeView
    ? `<section class="welcome"><div><span class="eyebrow">Tu espacio de estudio</span><h1>${currentHomeGreeting[0]}</h1><p>${currentHomeGreeting[1]}</p></div><button class="btn" id="upload-file">＋ Subir Archivo</button></section>
      <section><div class="section-head"><h2>Mis materias</h2><span><span class="muted">${subjects.length} en total</span> <button class="btn secondary" id="new-subject">＋ Nueva materia</button></span></div><div id="subject-list" class="subject-grid"></div></section>
      <section><div class="section-head"><h2>Agregados recientemente</h2><span class="muted">Lo último que subiste</span></div><div id="summary-list" class="summary-grid ${viewMode==="list"?"list-view":""}"></div></section>`
    : `<section class="folder-page"><div class="folder-back-row"><button class="btn ghost" id="back-home">← Volver al inicio</button></div><div class="folder-page-head"><div class="folder-heading"><span class="eyebrow">Materia</span><h1>${esc(activeSubject.name)}</h1><p>${esc(activeSubject.description||"Tus resúmenes de esta materia.")}</p><span class="muted">${summaries.filter(s=>s.subject_id===activeSubject.id).length} resúmenes</span></div><button class="btn" id="upload-folder-file">＋ Subir Archivo</button></div><div class="section-head"><h2>Todos los resúmenes</h2></div><div id="summary-list" class="summary-grid ${viewMode==="list"?"list-view":""}"></div></section>`;
  app.innerHTML=`<main class="app-shell"><header class="topbar"><div class="brand"><span class="brand-mark">✳</span>Mi Biblioteca</div><div class="top-actions"><span class="user-email muted">${esc(email)}</span><span class="avatar">${initials(email)}</span><button class="btn ghost" id="logout">Salir</button></div></header><div class="toolbar"><div class="search-wrap"><span class="search-icon">⌕</span><input class="search-input" id="global-search" placeholder="Buscar materias o resúmenes…" value="${esc(searchTerm)}"></div><button class="btn secondary" id="view-toggle" title="Cambiar vista">${viewMode==="grid"?"☷ Lista":"▦ Cuadrícula"}</button></div>${pageContent}</main>`;
  document.getElementById("logout").onclick=async()=>{await db.auth.signOut()};
  document.getElementById("view-toggle").onclick=()=>{viewMode=viewMode==="grid"?"list":"grid";renderShell();renderContent()};
  document.getElementById("global-search").addEventListener("input",e=>{searchTerm=e.target.value;renderContent()});
  if(homeView){
    document.getElementById("upload-file").onclick=uploadButton;
    document.getElementById("new-subject").onclick=()=>subjectDialog();
  }else{
    document.getElementById("back-home").onclick=()=>{activeSubject=null;chooseHomeGreeting();renderShell();renderContent()};
    document.getElementById("upload-folder-file").onclick=()=>uploadButton(true);
  }
  renderContent();
}
function renderContent(){
  const subjectBox=document.getElementById("subject-list");
  const summaryBox=document.getElementById("summary-list");
  if(!summaryBox)return;
  const q=searchTerm.toLocaleLowerCase("es");
  if(subjectBox){
    const filteredSubjects=subjects.filter(s=>s.name.toLocaleLowerCase("es").includes(q));
    subjectBox.innerHTML=filteredSubjects.length?filteredSubjects.map(s=>`<article class="subject-card" data-subject="${s.id}" style="--subject-color:${esc(s.color||colors[0])}"><button class="icon-btn card-menu" data-subject-menu="${s.id}" aria-label="Opciones">···</button><div class="subject-cover">${s.image_path?'<img src="'+esc(s._imageUrl||"")+'" alt="">':'<span class="subject-symbol">✳</span>'}</div><div class="subject-info"><h3>${esc(s.name)}</h3><p>${summaries.filter(x=>x.subject_id===s.id).length} resúmenes</p></div></article>`).join(""):'<div class="empty-state"><strong>Todavía no hay materias</strong>Creá tu primera materia para empezar a organizar tus resúmenes.</div>';
    subjectBox.querySelectorAll("[data-subject]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("[data-subject-menu]"))return;activeSubject=subjects.find(s=>s.id===el.dataset.subject);renderShell()}));
    subjectBox.querySelectorAll("[data-subject-menu]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();subjectMenu(el.dataset.subjectMenu)}));
  }
  let list=activeSubject?summaries.filter(s=>s.subject_id===activeSubject.id):summaries;
  if(q)list=list.filter(s=>s.title.toLocaleLowerCase("es").includes(q)||(!activeSubject&&subjects.find(x=>x.id===s.subject_id)?.name.toLocaleLowerCase("es").includes(q)));
  list=[...list].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at));
  summaryBox.className="summary-grid "+(viewMode==="list"?"list-view":"");
  summaryBox.innerHTML=list.length?list.map(s=>`<article class="summary-card" data-open-summary="${s.id}" style="--summary-color:${esc(s.color||colors[0])}"><div class="file-icon">▤</div><div class="summary-copy"><h3>${esc(s.title)}</h3><p>${esc(subjects.find(x=>x.id===s.subject_id)?.name||"Materia")} · ${dateLabel(s.created_at)}</p></div><div class="summary-actions"><button class="btn secondary" data-download="${s.id}">Descargar</button><button class="btn ghost" data-summary-menu="${s.id}">···</button></div></article>`).join(""):'<div class="empty-state"><strong>No hay resúmenes para mostrar</strong>Cuando subas archivos HTML, van a aparecer acá.</div>';
  summaryBox.querySelectorAll("[data-open-summary]").forEach(el=>el.addEventListener("click",e=>{if(e.target.closest("button"))return;openSummary(el.dataset.openSummary)}));
  summaryBox.querySelectorAll("[data-download]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();downloadSummary(el.dataset.download)}));
  summaryBox.querySelectorAll("[data-summary-menu]").forEach(el=>el.addEventListener("click",e=>{e.stopPropagation();summaryMenu(el.dataset.summaryMenu)}));
}

async function loadData(){const [sr,rr]=await Promise.all([db.from("subjects").select("*").order("created_at",{ascending:false}),db.from("summaries").select("*").order("created_at",{ascending:false})]);if(sr.error)throw sr.error;if(rr.error)throw rr.error;subjects=sr.data||[];summaries=rr.data||[];await Promise.all(subjects.map(async s=>{if(s.image_path){const {data}=await db.storage.from("materias").createSignedUrl(s.image_path,3600);s._imageUrl=data?.signedUrl||""}}))}
async function refresh(){try{await loadData();renderShell()}catch(e){console.error(e);app.innerHTML=`<main class="app-shell"><h2>No pudimos cargar tu biblioteca</h2><p class="muted">${esc(e.message)}</p><button class="btn" onclick="location.reload()">Reintentar</button></main>`}}
function subjectDialog(subject=null){const editing=!!subject;let chosen=subject?.color||colors[0];showModal(`<div class="modal-box"><span class="eyebrow">${editing?"Editar":"Organizar"}</span><h2>${editing?"Editar materia":"Nueva materia"}</h2><form id="subject-form"><div class="field"><label>Nombre</label><input name="name" maxlength="80" required value="${esc(subject?.name||"")}" placeholder="Ej. Anatomía"></div><div class="field"><label>Descripción (opcional)</label><textarea name="description" rows="2" maxlength="240" placeholder="Un pequeño detalle sobre la materia…">${esc(subject?.description||"")}</textarea></div><div class="field"><label>Color</label><div class="color-row">${colors.map(c=>`<button type="button" class="color-choice ${c===chosen?"selected":""}" data-color="${c}" style="background:${c}" aria-label="Elegir color"></button>`).join("")}</div></div><div class="field"><label>Imagen de portada (opcional)</label><input type="file" name="image" accept="image/png,image/jpeg,image/webp"></div><div class="modal-actions"><button type="button" class="btn ghost" id="cancel-modal">Cancelar</button><button class="btn" type="submit">Guardar</button></div></form></div>`);
document.querySelectorAll("[data-color]").forEach(b=>b.onclick=()=>{chosen=b.dataset.color;document.querySelectorAll("[data-color]").forEach(x=>x.classList.toggle("selected",x===b))});document.getElementById("cancel-modal").onclick=closeModal;
document.getElementById("subject-form").onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,button=f.querySelector("button[type=submit]");button.disabled=true;try{const name=f.elements.name.value.trim(),description=f.elements.description.value.trim(),file=f.elements.image.files[0];let subjectId=subject?.id;const payload={name,description,color:chosen};if(editing){const {error}=await db.from("subjects").update(payload).eq("id",subjectId);if(error)throw error}else{const {data,error}=await db.from("subjects").insert({...payload,owner_id:currentUser.id}).select("id").single();if(error)throw error;subjectId=data.id}if(file){const ext=file.name.split(".").pop().toLowerCase(),path=subjectId+"/"+crypto.randomUUID()+"."+ext;const {error:uploadError}=await db.storage.from("materias").upload(path,file,{upsert:false,contentType:file.type});if(uploadError)throw uploadError;const {error:updateError}=await db.from("subjects").update({image_path:path}).eq("id",subjectId);if(updateError)throw updateError}closeModal();toast("Materia guardada");await refresh()}catch(err){toast(err.message);button.disabled=false}}}
function subjectMenu(id){const s=subjects.find(x=>x.id===id);showModal(`<div class="modal-box"><h2>${esc(s.name)}</h2><p class="muted">¿Qué querés hacer con esta materia?</p><div class="modal-actions" style="justify-content:space-between"><button class="btn danger" id="delete-subject">Eliminar</button><span><button class="btn ghost" id="close-menu">Cerrar</button> <button class="btn" id="edit-subject">Editar</button></span></div></div>`);document.getElementById("close-menu").onclick=closeModal;document.getElementById("edit-subject").onclick=()=>subjectDialog(s);document.getElementById("delete-subject").onclick=async()=>{if(!confirm("¿Eliminar la materia y sus resúmenes? Esta acción no se puede deshacer."))return;try{const paths=summaries.filter(x=>x.subject_id===id).map(x=>x.storage_path);if(paths.length){const {error}=await db.storage.from("resumenes").remove(paths);if(error)throw error}if(s.image_path)await db.storage.from("materias").remove([s.image_path]);const {error}=await db.from("subjects").delete().eq("id",id);if(error)throw error;activeSubject=null;closeModal();toast("Materia eliminada");await refresh()}catch(e){toast(e.message)}}}
async function uploadSummaries(files,subjectId,summaryColor){
  const destination=subjects.find(s=>s.id===subjectId);
  if(!destination){toast("Elegí una materia válida para guardar el archivo.");return}
  const selected=[...files];
  let uploaded=0;
  const failures=[];
  for(const file of selected){
    if(!file.name.toLowerCase().endsWith(".html")&&!file.name.toLowerCase().endsWith(".htm")){
      failures.push(file.name+": solo se permiten archivos HTML.");
      continue;
    }
    if(file.size>20*1024*1024){
      failures.push(file.name+": supera el límite de 20 MB.");
      continue;
    }
    const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"_");
    const path=destination.id+"/"+crypto.randomUUID()+"-"+safe;
    const {error:upErr}=await db.storage.from("resumenes").upload(path,file,{upsert:false,contentType:"text/html"});
    if(upErr){
      console.error("Error subiendo archivo a Storage:",file.name,upErr);
      failures.push(file.name+": "+upErr.message);
      continue;
    }
    const {error:dbErr}=await db.from("summaries").insert({
      subject_id:destination.id,
      uploaded_by:currentUser.id,
      title:file.name.replace(/\\.html?$/i,""),
      storage_path:path,
      color:summaryColor||colors[0]
    });
    if(dbErr){
      console.error("Error registrando resumen:",file.name,dbErr);
      const {error:cleanupErr}=await db.storage.from("resumenes").remove([path]);
      if(cleanupErr)console.error("No se pudo limpiar el archivo sin registro:",cleanupErr);
      failures.push(file.name+": el archivo llegó a Storage, pero no se pudo registrar: "+dbErr.message);
      continue;
    }
    uploaded++;
  }
  if(uploaded>0){
    await refresh();
    toast(failures.length
      ? uploaded+" archivo(s) subido(s); "+failures.length+" con error. Revisá los detalles."
      : uploaded+" archivo(s) subido(s) correctamente.");
  }else{
    toast("No se pudo subir ningún archivo. Revisá los errores.");
  }
  if(failures.length){
    console.error("Errores durante la carga:",failures);
    showModal('<div class="modal-box"><h2>Problemas al subir archivos</h2><ul>'+failures.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul><div class="modal-actions"><button class="btn" id="close-upload-errors">Cerrar</button></div></div>');
    document.getElementById("close-upload-errors").onclick=closeModal;
  }
}
function uploadButton(folderDirect=false){
  if(!subjects.length){toast("Primero creá una materia para guardar tus archivos.");return}
  const input=document.createElement("input");
  input.type="file";
  input.accept=".html,.htm,text/html";
  input.multiple=true;
  input.onchange=()=>{
    const files=[...input.files];
    if(!files.length)return;
    const defaultSubject=folderDirect&&activeSubject?activeSubject.id:subjects[0].id;
    const subjectOptions=subjects.map(s=>'<option value="'+esc(s.id)+'" '+(s.id===defaultSubject?'selected':'')+'>'+esc(s.name)+'</option>').join('');
    const colorOptions=colors.map((color,i)=>'<button type="button" class="color-choice '+(i===0?'selected':'')+'" data-summary-color="'+color+'" style="background:'+color+'" aria-label="Color '+(i+1)+'" title="Color '+(i+1)+'"></button>').join('');
    showModal('<div class="modal-box"><span class="eyebrow">Guardar resumen</span><h2>Personalizá tus archivos</h2><p class="muted">'+files.length+' archivo(s) seleccionado(s)</p><form id="destination-form">'+(folderDirect?'<input type="hidden" id="destination-subject" value="'+esc(defaultSubject)+'">':'<div class="field"><label for="destination-subject">Elegí la materia</label><select id="destination-subject" required>'+subjectOptions+'</select></div>')+'<div class="field"><label>Color de los resúmenes</label><div class="color-row summary-color-row">'+colorOptions+'</div><p class="muted color-help">Podés elegir un tono distinto para cada grupo de archivos que subas.</p></div><div class="modal-actions"><button type="button" class="btn ghost" id="cancel-upload">Cancelar</button><button type="submit" class="btn">Guardar archivos</button></div></form></div>');
    let chosenColor=colors[0];
    document.querySelectorAll("[data-summary-color]").forEach(button=>button.onclick=()=>{
      chosenColor=button.dataset.summaryColor;
      document.querySelectorAll("[data-summary-color]").forEach(item=>item.classList.toggle("selected",item===button));
    });
    document.getElementById("cancel-upload").onclick=closeModal;
    document.getElementById("destination-form").onsubmit=e=>{
      e.preventDefault();
      const subjectId=document.getElementById("destination-subject").value;
      closeModal();
      void uploadSummaries(files,subjectId,chosenColor);
    };
  };
  input.click();
}
async function signedSummary(s){const {data,error}=await db.storage.from("resumenes").createSignedUrl(s.storage_path,300);if(error)throw error;return data.signedUrl}
async function openSummary(id){const s=summaries.find(x=>x.id===id);try{const url=await signedSummary(s);const response=await fetch(url);if(!response.ok)throw new Error("No se pudo abrir el resumen");const html=await response.text();const viewer=document.createElement("div");viewer.className="viewer";viewer.innerHTML='<header class="viewer-head"><strong>'+esc(s.title)+'</strong><button class="btn ghost" id="close-viewer">Cerrar ✕</button></header><iframe title="Resumen interactivo" sandbox="allow-scripts allow-forms allow-modals allow-popups" referrerpolicy="no-referrer"></iframe>';document.body.appendChild(viewer);viewer.querySelector("iframe").srcdoc=html;viewer.querySelector("#close-viewer").onclick=()=>viewer.remove()}catch(e){toast(e.message)}}
async function downloadSummary(id){const s=summaries.find(x=>x.id===id);try{const {data,error}=await db.storage.from("resumenes").download(s.storage_path);if(error)throw error;const url=URL.createObjectURL(data),a=document.createElement("a");a.href=url;a.download=s.title+".html";a.click();URL.revokeObjectURL(url)}catch(e){toast(e.message)}}
function summaryMenu(id){
  const s=summaries.find(x=>x.id===id);
  if(!s)return;
  let chosenColor=s.color||colors[0];
  showModal(`<div class="modal-box"><h2>${esc(s.title)}</h2>
    <div class="field"><label>Nombre del resumen</label><input id="rename-title" value="${esc(s.title)}"></div>
    <div class="field"><label>Mover a otra materia</label><select id="move-subject">${subjects.map(x=>`<option value="${x.id}" ${x.id===s.subject_id?"selected":""}>${esc(x.name)}</option>`).join("")}</select></div>
    <div class="field"><label>Color del resumen</label><div class="color-row summary-color-row">${colors.map((color,i)=>`<button type="button" class="color-choice ${color===chosenColor?"selected":""}" data-edit-summary-color="${color}" style="background:${color}" aria-label="Elegir color ${i+1}" title="Color ${i+1}"></button>`).join("")}</div></div>
    <div class="modal-actions" style="justify-content:space-between"><button class="btn danger" id="delete-summary">Eliminar</button><span><button class="btn ghost" id="cancel-summary">Cancelar</button> <button class="btn" id="save-summary">Guardar</button></span></div></div>`);
  document.querySelectorAll("[data-edit-summary-color]").forEach(button=>button.onclick=()=>{
    chosenColor=button.dataset.editSummaryColor;
    document.querySelectorAll("[data-edit-summary-color]").forEach(item=>item.classList.toggle("selected",item===button));
  });
  document.getElementById("cancel-summary").onclick=closeModal;
  document.getElementById("save-summary").onclick=async()=>{
    const title=document.getElementById("rename-title").value.trim();
    const subject_id=document.getElementById("move-subject").value;
    if(!title)return toast("El nombre no puede quedar vacío.");
    const button=document.getElementById("save-summary");
    button.disabled=true;
    const {error}=await db.from("summaries").update({title,subject_id,color:chosenColor}).eq("id",id);
    if(error){button.disabled=false;return toast(error.message)}
    closeModal();
    toast("Resumen actualizado");
    await refresh();
  };
  document.getElementById("delete-summary").onclick=async()=>{
    if(!confirm("¿Eliminar este resumen?"))return;
    const {error:storageError}=await db.storage.from("resumenes").remove([s.storage_path]);
    if(storageError)return toast(storageError.message);
    const {error}=await db.from("summaries").delete().eq("id",id);
    if(error)return toast(error.message);
    closeModal();
    toast("Resumen eliminado");
    await refresh();
  };
}
let activeAuthUserId=null;
function enterLibrary(user){if(!user)return;currentUser=user;if(activeAuthUserId===user.id)return;activeAuthUserId=user.id;renderShell();void refresh()}
async function start(){
  db.auth.onAuthStateChange((event,session)=>{
    if(event==="SIGNED_OUT"||!session){activeAuthUserId=null;currentUser=null;subjects=[];summaries=[];activeSubject=null;renderLogin();return}
    currentUser=session.user;
    if(event==="SIGNED_IN"||event==="INITIAL_SESSION")setTimeout(()=>enterLibrary(session.user),0);
  });
  const {data,error}=await db.auth.getSession();
  if(error)throw error;
  if(data.session)enterLibrary(data.session.user);
  else renderLogin();
}
start().catch(e=>{console.error(e);app.innerHTML='<main class="app-shell"><h2>Error al iniciar</h2><p class="muted">'+esc(e.message)+'</p></main>'});