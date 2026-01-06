import { Suspense } from 'react';
import { getDictionary } from '@/lib/get-dictionary';
import HomeClient from '../HomeClient';

interface PageProps {
  params: Promise<{ lang: string }>;
}

export default async function HomePage({ params }: PageProps) {
  const resolvedParams = await params;
  const lang = resolvedParams.lang;
  const dict = await getDictionary(lang as 'pt' | 'en');

  if (!dict) {
    throw new Error(`Dictionary not found for language: ${lang}`);
  }

  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>}>
      <HomeClient dict={dict} lang={lang} />
    </Suspense>
  );
}




