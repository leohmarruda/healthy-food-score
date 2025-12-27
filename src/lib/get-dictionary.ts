const dictionaries = {
  pt: () => import('../dictionaries/pt.json').then((module) => module.default),
  en: () => import('../dictionaries/en.json').then((module) => module.default),
};

export const getDictionary = async (locale: string) => {
  const lang = locale === 'en' || locale === 'pt' ? locale : 'pt';
  return dictionaries[lang]();
};