import { describe, expect, test } from 'bun:test';
import { cuesToStrengthen, heroBrandColour, isColourCue, mainSubject, sameCue, storedIdentity } from './identity';

const jio = { name: 'Jio Platforms', kind: 'company' as const, cues: ['Jio deep royal blue', 'Jio World Centre, Mumbai BKC', 'JioFiber router', 'Mukesh Ambani'] };

describe('subject identity', () => {
  test('the main subject is the first entry; a broad-topic story or an older brief has none', () => {
    expect(mainSubject([jio, { name: 'NSE', kind: 'institution', cues: [] }])).toBe(jio);
    expect(mainSubject([])).toBeNull();
    expect(mainSubject(null)).toBeNull();
    expect(storedIdentity([jio])).toEqual([jio]);
    expect(storedIdentity(null)).toBeNull();
    expect(storedIdentity([{ name: 'x', kind: 'brand', cues: [] }])).toBeNull();
  });

  test('a colour cue names a colour, not a thing that has one', () => {
    for (const cue of ['Jio deep royal blue', 'Airtel red', 'SBI blue #280071', 'brand colour: saffron', '#0F3CC9']) expect(isColourCue(cue)).toBe(true);
    for (const cue of ['Jio World Centre, Mumbai BKC', 'the blue glass facade of Jio World Centre', 'red double-decker bus', 'Mukesh Ambani', 'NSE listing bell', 'Tata Nano silhouette']) {
      expect(isColourCue(cue)).toBe(false);
    }
  });

  test('cues match when copied loosely, never on a fragment', () => {
    expect(sameCue('Jio deep royal blue', 'jio deep royal blue')).toBe(true);
    expect(sameCue('deep royal blue', 'Jio deep royal blue')).toBe(true);
    expect(sameCue('a', 'Jio deep royal blue')).toBe(false);
    expect(sameCue('JioFiber router', 'Jio deep royal blue')).toBe(false);
  });

  test('the hero carries the brand colour only when the direction chose that colour cue of a brand-like subject', () => {
    expect(heroBrandColour([jio], ['Jio deep royal blue', 'JioFiber router'])).toBe('Jio deep royal blue');
    expect(heroBrandColour([jio], ['JioFiber router'])).toBeNull();
    expect(heroBrandColour([jio], [])).toBeNull();
    expect(heroBrandColour([{ ...jio, kind: 'person' }], ['Jio deep royal blue'])).toBeNull();
    expect(heroBrandColour([], ['Jio deep royal blue'])).toBeNull();
    expect(heroBrandColour([{ ...jio, cues: ['JioFiber router'] }], ['Jio deep royal blue'])).toBeNull();
  });

  test('a redraw strengthens the cues the direction chose first, then the others, at most three', () => {
    expect(cuesToStrengthen([jio], ['JioFiber router'])).toEqual(['JioFiber router', 'Jio deep royal blue', 'Jio World Centre, Mumbai BKC']);
    expect(cuesToStrengthen([jio], [])).toEqual(['Jio deep royal blue', 'Jio World Centre, Mumbai BKC', 'JioFiber router']);
    expect(cuesToStrengthen([], ['x'])).toEqual([]);
  });
});
