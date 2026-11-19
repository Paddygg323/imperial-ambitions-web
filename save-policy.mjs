// Android's SavePolicy.java is generated from these constants by build.py.
export const SAVE_SLOT='imp2-rebuild-v3';
export const MAX_SAVE_BYTES=8000000;
export function validateSaveSize(value){
 if(typeof value!=='string'||new TextEncoder().encode(value).byteLength>MAX_SAVE_BYTES)throw Error('This campaign exceeds the supported 8 MB save size. The previous save is unchanged.');
}
