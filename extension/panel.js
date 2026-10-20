
'use strict';
const $=id=>document.getElementById(id),KEY='venda-em-dia-v1',fields=['status','chat','notes','next','date','reason','summary','reply','audio'];
let state={clients:[],offers:''},selected=null,timer;
function toast(text){$('toast').textContent=text;$('toast').classList.remove('hidden');clearTimeout(timer);timer=setTimeout(()=>$('toast').classList.add('hidden'),4500)}
try{const raw=JSON.parse(localStorage.getItem(KEY));if(raw&&Array.isArray(raw.clients)&&raw.clients.every(c=>c&&typeof c.id==='string'&&typeof c.name==='string'&&typeof c.chat==='string')&&typeof raw.offers==='string')state=raw}catch{toast('Não foi possível carregar os dados locais.')}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch{toast('Falha ao salvar. Verifique espaço e permissão de armazenamento no navegador.');return false}}
function today(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}
function current(){return state.clients.find(c=>c.id===selected)}
function capture(){const c=current();if(!c)return false;for(const f of fields)c[f]=$(f).value;return persist()}
function renderList(){const q=$('search').value.toLocaleLowerCase('pt-BR'),filter=$('filter').value;const visible=state.clients.filter(c=>(c.name+' '+(c.service||'')).toLocaleLowerCase('pt-BR').includes(q)&&(!filter||(filter==='today'?c.date&&c.date<=today()&&!['Venda concluída','Encerrado'].includes(c.status):c.status===filter)));$('count').textContent=visible.length+' atendimento(s)';$('list').replaceChildren();for(const c of visible){const b=document.createElement('button');b.className='client'+(c.id===selected?' active':'');const strong=document.createElement('strong');strong.textContent=c.name;const small=document.createElement('small');small.textContent=c.status+(c.date?' • Retomar '+c.date.split('-').reverse().join('/'):'');b.append(strong,small);b.onclick=()=>{if(current()&&!capture())return;selected=c.id;render()};$('list').append(b)}}
function render(){renderList();const c=current();$('empty').classList.toggle('hidden',!!c);$('detail').classList.toggle('hidden',!c);for(const f of ['summary','reply','audio','copyReply','copyAudio','draft'])$(f).disabled=!c;for(const f of fields)$(f).value=c?c[f]||'':'';if(c){$('title').textContent=c.name;$('serviceLabel').textContent=[c.service,c.phone].filter(Boolean).join(' • ')}}
$('new').onclick=()=>{if(current()&&!capture())return;$('form').reset();$('newDialog').showModal()};
$('cancel').onclick=()=>$('newDialog').close();
$('form').onsubmit=e=>{e.preventDefault();const name=$('name').value.trim(),chat=$('initialChat').value.trim();if(!name||!chat)return toast('Preencha o nome e a conversa.');const c={id:crypto.randomUUID(),name,chat,phone:$('phone').value.trim(),service:$('service').value.trim(),status:'Aguardando minha resposta'};state.clients.unshift(c);selected=c.id;if(persist())toast('Atendimento criado.');$('newDialog').close();render()};
$('search').oninput=renderList;$('filter').onchange=renderList;
$('save').onclick=$('draft').onclick=()=>{if(capture()){renderList();toast('Salvo neste navegador.')}};
for(const f of fields)$(f).addEventListener('change',()=>{capture();renderList()});
$('remove').onclick=()=>{if(!confirm('Excluir este atendimento deste navegador?'))return;state.clients=state.clients.filter(c=>c.id!==selected);selected=null;persist();render()};
async function copy(id){const text=$(id).value;if(!text.trim())return toast('Escreva o texto antes de copiar.');try{await navigator.clipboard.writeText(text);toast('Texto copiado.')}catch{$(id).focus();$(id).select();toast('Texto selecionado. Use Ctrl+C ou a opção Copiar.')}}
$('copyReply').onclick=()=>copy('reply');$('copyAudio').onclick=()=>copy('audio');
$('offersButton').onclick=()=>{$('offers').value=state.offers;$('offersDialog').showModal()};
$('closeOffers').onclick=()=>$('offersDialog').close();
$('saveOffers').onclick=()=>{state.offers=$('offers').value;if(persist()){$('offersDialog').close();toast('Ofertas salvas.')}};
$('example').onclick=()=>{if(current()&&!capture())return;let c=state.clients.find(c=>c.demo);if(!c){c={id:crypto.randomUUID(),demo:true,name:'Marina • exemplo fictício',service:'Site para ótica',chat:'Cliente: Gostaria de um site para minha ótica.\nVendedor: Você quer apresentar a loja ou mostrar os produtos?\nCliente: Mostrar os produtos. Pode me enviar exemplos?',status:'Aguardando minha resposta',notes:'Exemplo fictício. Campos manuais, sem análise por IA.',next:'Enviar os exemplos solicitados.',date:today(),reason:'Cliente pediu exemplos.'};state.clients.unshift(c);persist()}selected=c.id;render()};
render();

$('importSelection').onclick=async()=>{
 try{
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 if(!tab?.id||!tab.url?.startsWith('https://web.whatsapp.com/'))return toast('Abra a aba do WhatsApp Web e tente novamente.');
 const result=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>window.getSelection()?.toString()||''});
 const text=result[0]?.result?.trim();
 if(!text)return toast('Selecione primeiro as mensagens no WhatsApp com o mouse, ou cole a conversa manualmente.');
 if(current()&&!capture())return;
 $('form').reset();$('initialChat').value=text.slice(0,100000);$('newDialog').showModal();$('name').focus();
 }catch{toast('Não foi possível importar. Clique no ícone da extensão nesta aba e tente novamente, ou cole o texto manualmente.')}
};

async function whatsappTab(){
 const [tab]=await chrome.tabs.query({active:true,currentWindow:true});
 if(!tab?.id||!tab.url?.startsWith('https://web.whatsapp.com/'))throw new Error('Abra o WhatsApp Web nesta janela e clique no ícone da extensão.');
 return tab;
}
$('connectWhatsApp').onclick=async()=>{
 const button=$('connectWhatsApp');button.disabled=true;
 try{
 const tab=await whatsappTab();
 const results=await chrome.scripting.executeScript({target:{tabId:tab.id},func:()=>{
 const root=document.querySelector('#main');
 if(!root)return {error:'Abra uma conversa no WhatsApp Web antes de conectar.'};
 const messages=Array.from(root.querySelectorAll('[data-pre-plain-text]')).map(node=>{
 const body=node.querySelector('.selectable-text');
 return body?.innerText?.trim() ? (node.getAttribute('data-pre-plain-text')||'')+body.innerText.trim():'';
 }).filter(Boolean);
 const name=root.querySelector('header [title]')?.getAttribute('title')||'';
 return {name,text:messages.join('\n'),count:messages.length};
 }});
 const data=results[0]?.result;
 if(data?.error)throw new Error(data.error);
 if(!data?.text)throw new Error('Não encontrei mensagens de texto nesta conversa. Use Importar seleção ou cole o texto. O layout do WhatsApp pode ter mudado.');
 if(current()&&!capture())return;
 $('form').reset();$('name').value=data.name.slice(0,100);$('initialChat').value=data.text.slice(0,100000);
 $('newDialog').showModal();
 $('connectionStatus').textContent='Conversa carregada: '+data.count+' mensagens de texto. Confira o nome e o trecho antes de salvar. Importação pontual, sem sincronização.';
 }catch(error){$('connectionStatus').textContent=error.message||'Falha na conexão.';toast(error.message||'Falha na conexão.')}
 finally{button.disabled=false}
};
