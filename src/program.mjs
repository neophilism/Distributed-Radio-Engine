import {assertObject,ContractError} from './contracts.mjs';
import {compileEditorialRevision} from './editorial.mjs';
/**
 * DRE-06: deterministic, opaque station timeline. No media key or plaintext
 * reaches this compiler. Rights are checked by a trusted adapter for each
 * content occurrence; editorial approval must already have been verified.
 */
export function compileRadioProgram({revision,approval,durations,verifyPublishingRight}) {
  assertObject(revision,'revision');
  assertObject(approval,'editorial approval');
  assertObject(durations,'public duration metadata');
  if(typeof verifyPublishingRight!=='function')throw new ContractError('Rights verifier required');
  const checked=compileEditorialRevision(revision);
  if(checked.digest!==revision.digest || approval.digest!==revision.digest ||
    approval.stationId!==revision.stationId ||approval.version!==revision.version)
    throw new ContractError('Unapproved or modified program');
  let phase='opening',ms=0,occurrence=0,markerSeen=false;
  const timeline=[],completions=[],opportunities=[];
  for(const segment of checked.program){
    if(segment.kind==='marker'){
      if(phase!=='transition'||markerSeen)throw new ContractError('Misplaced opportunity');
      opportunities.push(Object.freeze({id:segment.ref,atMs:ms,afterOccurrence:occurrence}));
      markerSeen=true;
      continue;
    }
    const durationMs=durations[segment.ref];
    if(!Number.isSafeInteger(durationMs)||durationMs<=0||durationMs>6*60*60*1000)
      throw new ContractError('Missing or invalid duration');
    let role;
    switch(segment.kind){
      case 'identification':
        if(phase==='opening'||phase==='transition'){role='opening';phase='media';markerSeen=false;}
        else if(phase==='closing'){role='closing';phase='transition';}
        else throw new ContractError('Identification out of order');
        break;
      case 'media':
        if(phase!=='media')throw new ContractError('Media without opening ID');
        if(verifyPublishingRight(segment.ref,revision)!==true)
          throw new ContractError('No publishing right for content');
        role='content';phase='closing';occurrence++;
        break;
      case 'sponsor':
        if(phase!=='transition')throw new ContractError('Sponsor cannot interrupt recording');
        role='sponsor';break;
      default:throw new ContractError('Unknown segment type');
    }
    const startMs=ms;
    ms+=durationMs;
    if(!Number.isSafeInteger(ms))throw new ContractError('Timeline overflow');
    timeline.push(Object.freeze({ref:segment.ref,role,kind:segment.kind,fromMs:startMs,toMs:ms,
      occurrenceId:role==='sponsor'?null:occurrence+(role==='opening'?1:0)}));
    if(role==='closing')completions.push(Object.freeze({occurrenceId:occurrence,vestNotBeforeMs:ms}));
  }
  if(phase!=='transition'||completions.length===0)throw new ContractError('Missing closing identification');
  return Object.freeze({stationId:revision.stationId,digest:checked.digest,version:revision.version,
    durationMs:ms,timeline:Object.freeze(timeline),completions:Object.freeze(completions),
    opportunities:Object.freeze(opportunities)});
}
