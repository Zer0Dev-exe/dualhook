import { useMessageFiles } from '@/store/ui';

const objectUrls = new WeakMap<File, string>();

/** Convierte `attachment://nombre` en una URL local del archivo adjunto; el resto se devuelve igual. */
export function resolveMedia(files: readonly File[], url: string) {
  if (!url) return '';
  const att = url.match(/^attachment:\/\/(.+)$/);
  if (!att) return url;
  const f = files.find((x) => x.name === att[1]);
  if (!f) return '';
  if (!objectUrls.has(f)) objectUrls.set(f, URL.createObjectURL(f));
  return objectUrls.get(f)!;
}

export function useResolveMedia(messageId: string, url: string) {
  const files = useMessageFiles(messageId);
  return resolveMedia(files, url);
}

export const isImageName = (n: string) => /\.(png|jpe?g|gif|webp|avif|bmp)$/i.test(n);
export const isVideoName = (n: string) => /\.(mp4|webm|mov)$/i.test(n);
