import { MMKV } from 'react-native-mmkv';
import { MMKV_INSTANCE_ID } from './storageKeys';

/**
 * The ONLY file that imports react-native-mmkv.
 * (If you move to MMKV v4, replace this with `createMMKV({ id })` — nothing else changes.)
 */
export const storage = new MMKV({ id: MMKV_INSTANCE_ID });
