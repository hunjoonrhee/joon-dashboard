import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['ko', 'de', 'en'],
  defaultLocale: 'ko',
});
