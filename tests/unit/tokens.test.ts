import { describe, expect, it } from 'vitest';
import { comparerEmpreintes, creerJeton, empreinte } from '@/lib/auth/tokens';

describe('jetons', () => {
  it('produit des jetons de 256 bits, utilisables dans une URL', () => {
    const jeton = creerJeton();
    // 32 octets en base64url → 43 caractères, sans « + », « / » ni « = ».
    expect(jeton).toHaveLength(43);
    expect(jeton).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it('ne répète jamais un jeton', () => {
    const jetons = new Set(Array.from({ length: 2000 }, () => creerJeton()));
    expect(jetons.size).toBe(2000);
  });

  it("stocke une empreinte, jamais le jeton — une fuite de la base ne donne aucun lien valide", () => {
    const jeton = creerJeton();
    const h = empreinte(jeton);
    expect(h).toHaveLength(64);
    expect(h).not.toContain(jeton);
    expect(h).toBe(empreinte(jeton)); // déterministe
  });

  it('deux jetons différents ont deux empreintes différentes', () => {
    expect(empreinte(creerJeton())).not.toBe(empreinte(creerJeton()));
  });

  it('compare des empreintes de longueurs différentes sans lever', () => {
    expect(comparerEmpreintes('abc', 'abcdef')).toBe(false);
    expect(comparerEmpreintes('', '')).toBe(true);
  });

  it('reconnaît deux empreintes identiques', () => {
    const h = empreinte('valeur');
    expect(comparerEmpreintes(h, h)).toBe(true);
    expect(comparerEmpreintes(h, empreinte('autre valeur'))).toBe(false);
  });
});
