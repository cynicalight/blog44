import { CV_PM_HTML } from './cv-pm-document'

export async function GET() {
  return new Response(CV_PM_HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  })
}
