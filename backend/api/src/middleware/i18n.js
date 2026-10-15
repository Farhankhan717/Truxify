import i18next from 'i18next';
import middleware from 'i18next-http-middleware';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from './logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const enDict = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/en.json')));
  } catch (err) {
    logger.warn({ event: 'I18N_LOCALE_LOAD_ERROR', locale: 'en', error: err && err.message }, '[i18n] Failed to load en.json locale, falling back to empty object');
    return {};
  }
})();
// backend/api/src/middleware/i18n.js

/**
 * i18n Configuration & Localization Utilities
 * Cleaned up per #14582 (unused i18nMiddleware removed)
 */

export const supportedLocales = ['en', 'es', 'fr', 'de', 'ta'];
export const defaultLocale = 'en';

/**
 * Resolves the preferred locale from request headers or query parameters.
 * @param {Object} req - Express request object.
 * @returns {string} Resolved locale code.
 */
export function resolveLocale(req) {
  const queryLocale = req.query?.lang || req.query?.locale;
  if (queryLocale && supportedLocales.includes(queryLocale)) {
    return queryLocale;
  }

  const acceptHeader = req.headers?.['accept-language'];
  if (acceptHeader) {
    const primaryLang = acceptHeader.split(',')[0].substring(0, 2).toLowerCase();
    if (supportedLocales.includes(primaryLang)) {
      return primaryLang;
    }
  }

  return defaultLocale;
}
const esDict = (() => {
  try {
    return JSON.parse(fs.readFileSync(path.join(__dirname, '../locales/es.json')));
  } catch (err) {
    logger.warn({ event: 'I18N_LOCALE_LOAD_ERROR', locale: 'es', error: err && err.message }, '[i18n] Failed to load es.json locale, falling back to empty object');
    return {};
  }
})();

i18next
  .use(middleware.LanguageDetector)
  .init({
    preload: ['en', 'es'],
    fallbackLng: 'en',
    resources: {
      en: { translation: enDict },
      es: { translation: esDict }
    }
  });

export const errorTranslationInterceptor = (req, res, next) => {
  const originalJson = res.json;
  res.json = function(body) {
    if (body !== null && body && typeof body === 'object' && typeof body.error === 'string') {
      // Use original English error string as key
      const translated = req.t(body.error, { defaultValue: body.error });
      body.error = translated;
    }
    return originalJson.call(this, body);
  };
  next();
};

export default errorTranslationInterceptor;

