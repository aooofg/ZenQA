// src/lib/pb.ts
import PocketBase from 'pocketbase';

export const pb = new PocketBase('/'); 

pb.autoCancellation(false);