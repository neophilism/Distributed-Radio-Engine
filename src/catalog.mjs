import {createMediaItem,assertObject,id,ContractError} from './contracts.mjs';
/**
 * Catalog stores public attribution and opaque encrypted asset references.
 * No plaintext audio, waveform, keys or private manifest is accepted.
 */
export class RadioCatalog {
 #items = new Map();
 register(input) {
  const media=createMediaItem(input);
  if (typeof input.assetRef!=='string'||!input.assetRef.startsWith('ciphertext:'))
   throw new ContractError('Only opaque ciphertext asset refs are allowed');
  const k=media.tenantId+'/'+media.id;
  if(this.#items.has(k)) throw new ContractError('Duplicate catalog id');
  this.#items.set(k,media);
  return media;
 }
 get({tenantId,id:mediaId}) {
  const k=id(tenantId,'tenant id')+'/'+id(mediaId,'media id');
  return this.#items.get(k) ?? null;
 }
 list({tenantId,kind}) {
  id(tenantId,'tenant id');
  return Object.freeze([...this.#items.values()].filter(v=>v.tenantId===tenantId&&(kind===undefined||v.kind===kind)));
 }
}
export function validateContentForStation(station,media){
 assertObject(station,'station');assertObject(media,'media');
 if(station.tenantId!==media.tenantId)throw new ContractError('Cross-tenant media denied');
 return true;
}
