import { describe, expect, it } from 'vitest';
import { brulerDuTemps, hacherMotDePasse, verifierMotDePasse } from '@/lib/auth/password';

describe('mots de passe', () => {
  it("produit une empreinte argon2id — l'algorithme est prouvé, pas déclaré", async () => {
    const empreinte = await hacherMotDePasse('une phrase de passe correcte');
    // Si une mise à jour de la bibliothèque changeait l'algorithme par défaut,
    // ce test tomberait — c'est exactement son rôle.
    expect(empreinte.startsWith('$argon2id$')).toBe(true);
  });

  it('applique les paramètres OWASP (19 Mio, 2 passes, 1 fil)', async () => {
    const empreinte = await hacherMotDePasse('une phrase de passe correcte');
    expect(empreinte).toContain('m=19456');
    expect(empreinte).toContain('t=2');
    expect(empreinte).toContain('p=1');
  });

  it('ne contient jamais le mot de passe en clair', async () => {
    const empreinte = await hacherMotDePasse('mon-secret-tres-reconnaissable');
    expect(empreinte).not.toContain('mon-secret-tres-reconnaissable');
  });

  it('produit deux empreintes différentes pour le même mot de passe (sel aléatoire)', async () => {
    const [a, b] = await Promise.all([
      hacherMotDePasse('identique'),
      hacherMotDePasse('identique'),
    ]);
    // Sans sel, deux comptes avec le même mot de passe auraient la même
    // empreinte, et une seule table pré-calculée les ouvrirait tous les deux.
    expect(a).not.toBe(b);
  });

  it('accepte le bon mot de passe et refuse les autres', async () => {
    const empreinte = await hacherMotDePasse('le bon mot de passe');
    expect(await verifierMotDePasse(empreinte, 'le bon mot de passe')).toBe(true);
    expect(await verifierMotDePasse(empreinte, 'le mauvais mot de passe')).toBe(false);
    expect(await verifierMotDePasse(empreinte, '')).toBe(false);
  });

  it('refuse sans lever quand l\'empreinte stockée est corrompue', async () => {
    // Une erreur non rattrapée ici produirait une 500 — ce qui révélerait que
    // le compte existe, alors qu'un refus ne révèle rien.
    expect(await verifierMotDePasse('ceci-n-est-pas-une-empreinte', 'peu importe')).toBe(false);
  });

  it('brûle réellement du temps quand le compte n\'existe pas', async () => {
    // Le premier appel calcule l'empreinte de référence : on le sort de la mesure.
    await brulerDuTemps();

    const debut = performance.now();
    await brulerDuTemps();
    const duree = performance.now() - debut;

    // Une vérification argon2id à 19 Mio prend plusieurs millisecondes. Si la
    // fonction rendait la main instantanément, l'écart de temps avec une vraie
    // vérification trahirait l'existence des comptes.
    expect(duree).toBeGreaterThan(3);
  });
});
