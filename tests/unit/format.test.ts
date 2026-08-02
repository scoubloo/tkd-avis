import { describe, expect, it } from 'vitest';
import {
  accord,
  dureeLisible,
  auteurPublic,
  heureLisible,
  moyenne,
  nomDuJour,
  noteLisible,
} from '@/lib/format';

describe('moyenne', () => {
  it("rend null quand il n'y a aucune note", () => {
    // Afficher « 0 » ferait passer un cours neuf pour un cours détesté.
    expect(moyenne([])).toBeNull();
  });

  it('calcule le cas de recette du cahier des charges : 5, 4 et 2 → 3,7', () => {
    expect(moyenne([5, 4, 2])).toBe(3.7);
  });

  it('arrondit à une décimale', () => {
    expect(moyenne([5, 4])).toBe(4.5);
    expect(moyenne([1, 2])).toBe(1.5);
    expect(moyenne([3, 3, 4])).toBe(3.3);
    expect(moyenne([1, 1, 1, 5])).toBe(2);
  });

  it('gère une note unique', () => {
    expect(moyenne([5])).toBe(5);
    expect(moyenne([1])).toBe(1);
  });
});

describe('affichage', () => {
  it('écrit les décimales à la française', () => {
    expect(noteLisible(3.7)).toBe('3,7');
    expect(noteLisible(4)).toBe('4,0');
    expect(noteLisible(null)).toBe('—');
  });

  it('numérote les jours en ISO : 1 = lundi, 7 = dimanche', () => {
    expect(nomDuJour(1)).toBe('lundi');
    expect(nomDuJour(6)).toBe('samedi');
    expect(nomDuJour(7)).toBe('dimanche');
    expect(nomDuJour(0)).toBe('—');
    expect(nomDuJour(8)).toBe('—');
  });

  it('écrit les heures en français', () => {
    expect(heureLisible('19:30:00')).toBe('19 h 30');
    expect(heureLisible('14:00:00')).toBe('14 h');
    expect(heureLisible('09:15:00')).toBe('9 h 15');
  });

  it('écrit les durées', () => {
    expect(dureeLisible(45)).toBe('45 min');
    expect(dureeLisible(60)).toBe('1 h');
    expect(dureeLisible(90)).toBe('1 h 30');
    expect(dureeLisible(120)).toBe('2 h');
  });

  it('accorde les pluriels', () => {
    expect(accord(0, 'note')).toBe('note');
    expect(accord(1, 'note')).toBe('note');
    expect(accord(2, 'note')).toBe('notes');
  });
});

describe('auteur public', () => {
  it("n'expose aucune adresse e-mail", () => {
    // Le test tient en une ligne parce que la fonction ne prend plus l'adresse
    // en paramètre : il n'y a plus rien à masquer, donc plus rien à rater.
    expect(auteurPublic()).toBe('Membre');
    expect(auteurPublic()).not.toContain('@');
  });
});
