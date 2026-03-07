import { CV_HTML } from './cv-document'

export async function GET() {
  return new Response(CV_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
