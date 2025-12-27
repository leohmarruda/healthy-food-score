import { getDictionary } from '@/lib/get-dictionary';
import HomeClient from './HomeClient';

// Forçamos a tipagem correta para o Next.js 15
interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function Page({ params }: PageProps) {
  // 1. Resolvemos a Promise do params primeiro
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  
  // 2. Buscamos o dicionário
  const dict = await getDictionary(lang as 'pt' | 'en');

  // 3. Se o dict for null/undefined, lançamos um erro claro ou fallback
  if (!dict) {
    throw new Error(`Dictionary not found for language: ${lang}`);
  }

  // 4. Retornamos o componente com os dados garantidos
  return <HomeClient dict={dict} lang={lang} />;
}