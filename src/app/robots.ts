import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://sumaq.pe';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/finalizar-compra'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
