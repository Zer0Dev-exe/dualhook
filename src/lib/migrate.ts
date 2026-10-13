/**
 * La app se llamaba «Hookforge»: copia sus datos guardados a las claves nuevas.
 * Se importa antes que los stores para que estos ya lean las claves migradas.
 */
const KEYS = ['workspace', 'backups', 'targets', 'ui'];

try {
  for (const k of KEYS) {
    const old = localStorage.getItem(`hookforge.${k}`);
    if (old != null && localStorage.getItem(`dualhook.${k}`) == null) localStorage.setItem(`dualhook.${k}`, old);
    localStorage.removeItem(`hookforge.${k}`);
  }
} catch {
  // localStorage no disponible (modo privado): no hay nada que migrar
}

export {};
