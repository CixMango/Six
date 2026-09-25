import { networkInterfaces } from 'node:os';

export interface Addresses {
  hamachi: string | null;
  lan: string[];
}

export function localAddresses(): Addresses {
  let hamachi: string | null = null;
  const lan: string[] = [];
  for (const [name, infos] of Object.entries(networkInterfaces())) {
    for (const info of infos ?? []) {
      if (info.family !== 'IPv4' || info.internal) continue;
      // Hamachi hands out 25.x.x.x addresses on an adapter named "Hamachi".
      if (/hamachi/i.test(name) || info.address.startsWith('25.')) hamachi ??= info.address;
      else lan.push(info.address);
    }
  }
  return { hamachi, lan };
}
