import {MAX_SAVE_BYTES,validateSaveSize} from './save-policy.mjs';
// Recovery is explicit: never replace an unreadable campaign with a fresh one.
export function campaignStorage(storage,bridge){
 const native=typeof bridge?.readSave==='function'&&typeof bridge?.writeSave==='function';
 const write=(key,value)=>{validateSaveSize(value);if(native&&!bridge.writeSave(key,value))throw Error('The device could not save this campaign. Export it before closing.');try{storage.setItem(key,value);}catch(e){if(!native)throw e;}};
 return {
  getItem(key){let value=null;try{value=native?bridge.readSave(key):null;}catch(cause){const error=Error(cause.message??'Could not read the saved campaign');try{error.cachedRaw=storage.getItem(key);}catch{}throw error;}if(value!==null&&value!==undefined){try{storage.setItem(key,value);}catch{}return value;}return storage.getItem(key);},
  setItem:write,
  preserveItem(key,target,raw){
   if(native&&typeof bridge.archiveSave==='function'){
    const result=bridge.archiveSave(key,target);
    if(result==='archived'){if(raw!==null)try{storage.setItem(target,raw);}catch{}return;}
    if(result!=='missing')throw Error('The original device file could not be preserved. No replacement has been made.');
   }
   if(raw===null)throw Error('The original save could not be read or preserved. No replacement has been made.');
   write(target,raw);
  }
 };
}

export function readStoredCampaign(storage,key,load){
 let raw=null;
 try{raw=storage.getItem(key);return raw?{state:load(raw)}:{};}
 catch(error){return {failure:{raw,cachedRaw:error.cachedRaw??null,message:error.message}};}
}

export function mountSaveRecovery({failure,storage,key,load,serialize,create,exportFile}){
 const dialog=document.createElement('dialog');dialog.id='saveRecovery';
 dialog.setAttribute('aria-labelledby','saveRecoveryTitle');
 dialog.innerHTML='<div class="dialog-head"><h2 id="saveRecoveryTitle">Recover your campaign</h2></div><section class="save-recovery-body"><p>Your saved campaign could not be opened. It has not been replaced.</p><p class="recovery-reason"></p><p>Export the original file to keep a copy. You can restore the previous turn or import another rebuild save.</p><div class="recovery-actions"><button data-recovery="export">Export original save</button><button data-recovery="previous">Restore previous turn</button></div><label>Import a rebuild save<input type="file" accept="application/json,.json" data-recovery="import"></label><p class="recovery-error" role="alert"></p><details><summary>Start again</summary><p>The unreadable save will be kept in a separate recovery slot on this device.</p><button data-recovery="new">Start a new campaign</button></details></section>';
 dialog.querySelector('.recovery-reason').textContent=failure.message;
 const exportable=failure.raw??failure.cachedRaw;
 const exportButton=dialog.querySelector('[data-recovery=export]');exportButton.disabled=exportable===null||exportable===undefined;
 if(failure.raw===null){
  exportButton.textContent='Export cached copy';
  dialog.querySelector('.recovery-reason').textContent+=' The original device file is unreadable. '+(failure.cachedRaw?'You can export the browser cache, which may be older.':'There is no readable cached copy to export.')+' Recovery will preserve the original device file separately before replacing it.';
 }
 let previous=null;try{const raw=storage.getItem(key+'-previous');if(raw)previous=load(raw);}catch{}
 dialog.querySelector('[data-recovery=previous]').disabled=!previous;
 const error=message=>{dialog.querySelector('.recovery-error').textContent=message;};
 const commit=next=>{
  try{
   const encoded=serialize(next);
   validateSaveSize(encoded);
   let backup=key+'-recovery-'+Date.now();while(storage.getItem(backup)!==null)backup+='-copy';
   if(storage.preserveItem)storage.preserveItem(key,backup,failure.raw);
   else if(failure.raw!==null)storage.setItem(backup,failure.raw);
   else throw Error('The unreadable original could not be preserved');
   storage.setItem(key,encoded);location.reload();
  }catch(e){error('Recovery could not be saved: '+e.message+'. Export the original file before making any further changes.');}
 };
 dialog.addEventListener('cancel',e=>e.preventDefault());
 exportButton.onclick=()=>exportFile(exportable,failure.raw===null?'Campaign-cached-copy.json':'Campaign-recovery.json');
 dialog.querySelector('[data-recovery=previous]').onclick=()=>commit(previous);
 dialog.querySelector('[data-recovery=new]').onclick=()=>{if(confirm('Start a new campaign? Your unreadable save will remain in a separate recovery slot.'))commit(create());};
 dialog.querySelector('[data-recovery=import]').onchange=async e=>{
  try{const file=e.target.files[0];if(!file)return;if(file.size>MAX_SAVE_BYTES)throw Error('Save file is too large.');commit(load(await file.text()));}
  catch(e){error('That file could not be loaded: '+e.message);}
 };
 document.body.append(dialog);dialog.showModal();return dialog;
}
