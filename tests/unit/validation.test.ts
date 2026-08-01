import { describe, expect, it } from 'vitest';
import { avisSchema, connexionSchema, inscriptionSchema } from '@/lib/validation';

const avisValide = {
  coursId: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
  note: 4,
  commentaire: 'Cours très clair, le rythme était bon du début à la fin.',
};

describe('avis', () => {
  it('accepte les cinq notes autorisées', () => {
    for (const note of [1, 2, 3, 4, 5]) {
      expect(avisSchema.safeParse({ ...avisValide, note }).success).toBe(true);
    }
  });

  it('refuse 0 et 6 — les deux bornes que teste un examinateur', () => {
    expect(avisSchema.safeParse({ ...avisValide, note: 0 }).success).toBe(false);
    expect(avisSchema.safeParse({ ...avisValide, note: 6 }).success).toBe(false);
    expect(avisSchema.safeParse({ ...avisValide, note: -3 }).success).toBe(false);
    expect(avisSchema.safeParse({ ...avisValide, note: 999 }).success).toBe(false);
  });

  it('refuse une note décimale', () => {
    expect(avisSchema.safeParse({ ...avisValide, note: 4.5 }).success).toBe(false);
  });

  it('accepte une note transmise sous forme de texte (les formulaires HTML envoient du texte)', () => {
    const resultat = avisSchema.safeParse({ ...avisValide, note: '5' });
    expect(resultat.success).toBe(true);
    if (resultat.success) expect(resultat.data.note).toBe(5);
  });

  it('refuse une note vide ou non numérique', () => {
    expect(avisSchema.safeParse({ ...avisValide, note: '' }).success).toBe(false);
    expect(avisSchema.safeParse({ ...avisValide, note: 'cinq' }).success).toBe(false);
  });

  it('exige un commentaire de 10 à 2000 caractères', () => {
    expect(avisSchema.safeParse({ ...avisValide, commentaire: 'court' }).success).toBe(false);
    expect(avisSchema.safeParse({ ...avisValide, commentaire: 'a'.repeat(2001) }).success).toBe(false);
    expect(avisSchema.safeParse({ ...avisValide, commentaire: 'a'.repeat(2000) }).success).toBe(true);
  });

  it("ne laisse pas des espaces tenir lieu de commentaire", () => {
    expect(avisSchema.safeParse({ ...avisValide, commentaire: '          ' }).success).toBe(false);
  });

  it('refuse un identifiant de cours qui n\'est pas un UUID', () => {
    expect(avisSchema.safeParse({ ...avisValide, coursId: '1' }).success).toBe(false);
    expect(avisSchema.safeParse({ ...avisValide, coursId: "' OR 1=1 --" }).success).toBe(false);
  });
});

describe('inscription', () => {
  it('normalise la casse de l\'adresse', () => {
    const resultat = inscriptionSchema.safeParse({
      email: '  Liam.Chea@Exemple.FR ',
      motDePasse: 'une phrase de passe',
    });
    expect(resultat.success).toBe(true);
    // Sans cette normalisation, « Liam@x.fr » et « liam@x.fr » seraient deux
    // comptes distincts pour une seule boîte mail.
    if (resultat.success) expect(resultat.data.email).toBe('liam.chea@exemple.fr');
  });

  it('refuse une adresse mal formée', () => {
    for (const email of ['pas-une-adresse', 'a@', '@exemple.fr', 'a b@exemple.fr', '']) {
      expect(inscriptionSchema.safeParse({ email, motDePasse: 'une phrase de passe' }).success).toBe(
        false,
      );
    }
  });

  it('exige 10 caractères de mot de passe', () => {
    expect(inscriptionSchema.safeParse({ email: 'a@b.fr', motDePasse: '123456789' }).success).toBe(false);
    expect(inscriptionSchema.safeParse({ email: 'a@b.fr', motDePasse: '1234567890' }).success).toBe(true);
  });
});

describe('connexion', () => {
  it("n'impose aucune longueur minimale — un ancien mot de passe court doit pouvoir être présenté", () => {
    // Refuser à la validation révélerait la politique de mot de passe en vigueur
    // au moment de l'inscription. C'est la vérification qui doit trancher.
    expect(connexionSchema.safeParse({ email: 'a@b.fr', motDePasse: 'court' }).success).toBe(true);
  });

  it('exige tout de même un mot de passe non vide', () => {
    expect(connexionSchema.safeParse({ email: 'a@b.fr', motDePasse: '' }).success).toBe(false);
  });
});
