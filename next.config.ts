import type { NextConfig } from 'next';

/**
 * L'application est servie sous un sous-chemin (`/tkd-avis`) derrière Traefik.
 *
 * ⚠️ Piège déjà payé le 31/07/2026 sur un autre site : le sous-chemin ne doit être
 * traité qu'UNE seule fois. Ici c'est `basePath` qui s'en charge — le routeur Traefik
 * ne porte donc AUCUN middleware `stripprefix`. Si on ajoutait les deux, le préfixe
 * serait retiré deux fois et toutes les ressources partiraient en 404.
 *
 * Le même `basePath` s'applique en développement : on teste ce qu'on sert.
 */
const basePath = process.env.BASE_PATH ?? '/tkd-avis';

const nextConfig: NextConfig = {
  output: 'standalone',
  basePath,
  reactStrictMode: true,
  poweredByHeader: false,
  // Le HTML ne doit jamais être mis en cache par un intermédiaire : les pages
  // dépendent de la session (connecté / admin).
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()' },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              // Next.js injecte ses scripts d'hydratation en ligne : ils sont
              // couverts par 'unsafe-inline' faute de nonce sur les composants
              // serveur statiques. Aucun script tiers n'est autorisé.
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data:",
              "font-src 'self'",
              "connect-src 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "object-src 'none'",
            ].join('; '),
          },
          // L'application n'a aucune vocation à être trouvée par un moteur.
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
