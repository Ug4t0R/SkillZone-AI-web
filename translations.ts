// ─── Barrel export for translations ──────────────────────────────────────────
// Každý jazyk je ve vlastním souboru — přidání nového jazyka = 1 nový soubor.
import { cs } from './translations/cs';
import { en } from './translations/en';
import { sk } from './translations/sk';
import { de } from './translations/de';
import { ru } from './translations/ru';
import { ua } from './translations/ua';
import { pl } from './translations/pl';
import { vi } from './translations/vi';
export { brainrotOverrides, corporateOverrides } from './translations/overrides';

export const translations = { cs, en, sk, de, ru, ua, pl, vi };
