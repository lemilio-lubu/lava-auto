/**
 * logger.ts — Logger de frontend liviano.
 *
 * Envuelve `console` y silencia todo en producción para no filtrar ruido ni
 * datos en el navegador. Los errores de cara al usuario deben mostrarse con
 * el componente `Toast`; este logger es solo para diagnóstico en desarrollo.
 */

const isDev = process.env.NODE_ENV !== 'production';

export const logger = {
  debug: (...args: unknown[]): void => {
    if (isDev) console.debug(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]): void => {
    if (isDev) console.error(...args);
  },
};
