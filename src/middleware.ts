import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const locales = ['en', 'pt']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 1. Verifica se o pathname já tem um locale válido
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (pathnameHasLocale) return

  // 2. Se não tiver, redireciona para o padrão (pt)
  const locale = 'pt'
  request.nextUrl.pathname = `/${locale}${pathname}`
  
  // É importante preservar os parâmetros de busca (query strings) como ?search=maça
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  // Este matcher ignora pastas internas do Next.js, arquivos estáticos e favicon
  matcher: [
    '/((?!api|_next/static|_next/image|assets|favicon.ico|sw.js|.*\\..*).*)',
  ],
}