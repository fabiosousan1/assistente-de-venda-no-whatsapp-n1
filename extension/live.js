
'use strict';
let live=null,liveTimer=null,liveGeneration=0,liveController=null,voiceUrl=null,voiceController=null,voiceGeneration=0;
function clearVoice(){voiceGeneration++;voiceController?.abort();$('voicePlayer').pause();$('voicePlayer').removeAttribute('src');$('voicePlayer').classList.add('hidden');$('downloadVoice').classList.add('hidden');if(voiceUrl)URL.revokeObjectURL(voiceUrl);voiceUrl=null}
function pauseLive(message='Acompanhamento pausado.'){
 liveGeneration++;live=null;clearTimeout(liveTimer);liveController?.abort();clearVoice();$('liveStatus').textContent=message;$('analyze').disabled=false;
}
async function snapshot(tabId){
 const result=await chrome.scripting.executeScript({target:{tabId},func:()=>{
 const root=document.querySelector('#main'),header=root?.querySelector('header');
 if(!root||!header)return null;
 const name=header.querySelector('[title]')?.getAttribute('title')||'';
 if(!name)return null;
 // Identity is deliberately conservative: header replacement pauses tracking.
 const key='__vendaEmDiaChatIdentity';
 let memo=globalThis[key];
 if(!memo||memo.header!==header||memo.name!==name){memo={header,name,id:crypto.randomUUID()};globalThis[key]=memo}
 const rows=Array.from(root.querySelectorAll('[data-pre-plain-text]')).map(n=>{
 const body=n.querySelector('.selectable-text')?.innerText?.trim();
 return body?(n.getAttribute('data-pre-plain-text')||'')+body:'';
 }).filter(Boolean);
 return {identity:memo.id,name,text:rows.join('\n').slice(-100000)};
 }});
 return result[0]?.result;
}
async function requestAI(path,payload,signal){
 const response=await fetch('http://127.0.0.1:8787/'+path,{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+$('apiToken').value.trim()},body:JSON.stringify(payload),signal});
 if(!response.ok){let data={};try{data=await response.json()}catch{}throw Error(data.error||'Falha no servidor local.')}
 return response;
}
async function generateVoice(){
 const text=$('audio').value.trim(),id=selected;
 if(!text)return toast('Gere ou escreva o roteiro primeiro.');
 if(!$('apiToken').value.trim())return toast('Preencha o código do servidor local.');
 clearVoice();const version=voiceGeneration;voiceController=new AbortController();$('generateVoice').disabled=true;
 try{
 const response=await requestAI('speech',{text},AbortSignal.any([voiceController.signal,AbortSignal.timeout(70000)]));
 const blob=await response.blob();
 if(version!==voiceGeneration||id!==selected||$('audio').value.trim()!==text)return;
 voiceClient=id;voiceUrl=URL.createObjectURL(blob);$('voicePlayer').src=voiceUrl;$('downloadVoice').href=voiceUrl;$('voicePlayer').classList.remove('hidden');$('downloadVoice').classList.remove('hidden');
 }catch(error){if(error.name!=='AbortError')toast('Não foi possível gerar o áudio. Confira o servidor, a chave e o saldo.')}
 finally{$('generateVoice').disabled=false}
}
$('generateVoice').onclick=generateVoice;
$('pause').onclick=()=>pauseLive();
$('audio').addEventListener('input',clearVoice);
async function tick(){
 const session=live,generation=liveGeneration;if(!session)return;
 try{
 const [active]=await chrome.tabs.query({active:true,currentWindow:true});
 if(active?.id!==session.tabId||selected!==session.clientId)return pauseLive('Pausado: você mudou de aba ou atendimento.');
 const snap=await snapshot(session.tabId);
 if(!snap||snap.identity!==session.identity)return pauseLive('Pausado: a conversa mudou. Ative o acompanhamento novamente.');
 if(snap.text&&snap.text!==session.last){
 session.last=snap.text;clearVoice();
 const client=current();client.chat=snap.text;$('chat').value=snap.text;capture();
 $('liveStatus').textContent='Novas mensagens detectadas. Analisando...';
 liveController=new AbortController();
 const response=await requestAI('analyze',{chat:snap.text,offers:state.offers},AbortSignal.any([liveController.signal,AbortSignal.timeout(70000)]));
 const data=await response.json();
 if(liveGeneration!==generation)return;
 const [activeNow]=await chrome.tabs.query({active:true,currentWindow:true});
 const check=await snapshot(session.tabId);
 if(activeNow?.id!==session.tabId||selected!==session.clientId||check?.identity!==session.identity)return pauseLive('Pausado: a conversa mudou durante a análise.');
 if(check.text!==snap.text){$('liveStatus').textContent='A conversa mudou. Aguardando nova análise.';return}
 if(!['summary','next','reply','audio'].every(k=>typeof data[k]==='string'))throw Error('Resposta inválida.');
 Object.assign(client,data);if(!persist())throw Error('Falha ao salvar.');render();
 $('liveStatus').textContent='Acompanhando '+snap.name+'. Sugestões atualizadas. Revise antes de enviar.';
 if($('autoVoice').checked)await generateVoice();
 }
 }catch(error){if(liveGeneration===generation)pauseLive('Pausado por falha. Confira o servidor local e reative para tentar novamente.')}
 finally{if(liveGeneration===generation&&live)liveTimer=setTimeout(tick,4000)}
}
$('follow').onclick=async()=>{
 if(!$('apiToken').value.trim())return toast('Configure o servidor local e informe o código de conexão.');
 pauseLive();const generation=liveGeneration;
 try{
 const tab=await whatsappTab(),snap=await snapshot(tab.id);
 if(generation!==liveGeneration)return;
 if(!snap?.text)throw Error('Abra uma conversa com mensagens de texto carregadas.');
 if(current()&&!capture())return;
 const client={id:crypto.randomUUID(),name:snap.name,chat:snap.text,status:'Aguardando minha resposta',notes:'Acompanhamento da conversa aberta. Histórico parcial carregado na página.'};
 state.clients.unshift(client);selected=client.id;if(!persist())throw Error('Falha ao salvar.');render();
 live={tabId:tab.id,identity:snap.identity,clientId:client.id,last:''};
 $('analyze').disabled=true;$('liveStatus').textContent='Acompanhamento ativado. Enviando a conversa à OpenAI.';
 tick();
 }catch(error){pauseLive(error.message||'Não foi possível iniciar.')}
};
chrome.tabs.onActivated.addListener(()=>{if(live)pauseLive('Pausado: aba alterada.')});
let voiceClient=null;
$('generateVoice').addEventListener('click',()=>{voiceClient=selected});
document.addEventListener('click',()=>{if(live&&selected!==live.clientId)pauseLive('Pausado: atendimento alterado.');if(voiceUrl&&voiceClient!==selected)clearVoice()});
window.addEventListener('pagehide',()=>pauseLive());
