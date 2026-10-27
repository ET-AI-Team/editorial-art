# ET house style library

**Service:** editorial-art  
**Version:** 3.0, 27 October 2026  
**Status:** a fresh library. Every style starts with no references; it goes live when a hand-picked import gives it 15 approved artist references.

## Purpose

This file defines the 33 ET house styles, in 9 families, that the editorial-art service uses to illustrate articles. The library was chosen from what leading publications commission today. Each style is specified tightly enough that two images made in the same style look like they belong to one publication.

Earlier libraries are not deleted. Their styles are retired in the database, with their references kept, and the gallery leaves out any family that has no style that is not retired.

## How the styles are used

- **promptCore** is inserted, word for word, into every image prompt for that style (previews and finals). When the image has style references, which is always the case for a live style, the prompt leads with the references and promptCore follows the scene as a description of technique; without references it opens the prompt. promptCore describes technique, mark-making, texture and composition habits only: it never names colours or gives hex values, because image models weigh words over pictures and a named colour would override the references.
- **Palette** describes the palette's character (how many colours, how they are used), never fixed colours. The colours themselves come from the references.
- **negative** is appended as a list of things the image must avoid.
- **Do** and **Don't** guide the screening of references and are summarised into the judge's rubric.
- **Safety flags** (allowsPeople, allowsRealPeople, allowsSensitive, photoreal) are enforced in code by the pipeline, not only in prompts. A style that does not allow sensitive stories is never offered for one; a style that does not allow real people never receives likeness photos; a photoreal style never shows people, whatever its family. For now no style allows real people.
- **Satire-prone styles** (editorial cartoon, bold comic, clay set and Kalighat brush) are never used once a story carries any sensitivity.
- **References come from working artists, picked by hand.** For each style the library scripts collect published images by several artists; a person then chooses which to keep and which three are the covers. Each style learns from about 20 images by at least four artists, stored with the artist's name and the page each image came from so editors can see whose work it is. Every option in a batch learns from a different artist.
- **Artist names never appear in a rule sheet or a prompt.** They are listed under each style below only as curation notes for collecting references. Styles describe a medium and a look, never a person, and a prompt never asks for an imitation of anyone.
- A style becomes **LIVE** (usable by editors) only when it has **at least 15 approved artist references**. Until then the gallery shows it as coming soon.
- Every style has the same three base don'ts: no text, letters, numbers or logos; no brand marks, watermarks or signatures; no imitation of any named artist. Every promptCore ends with "No text, letters, numbers or logos."

## Families

### 1. Conceptual flat (`conceptual-flat`, 4 styles)

Ideas drawn as flat shapes. One clever visual metaphor, a handful of colours, grain or empty space, and nothing that could be mistaken for a photograph. These are the house workhorses for markets, policy, the RBI and opinion: they read instantly at thumbnail size and turn an abstract story into one image an editor can explain in a sentence.

### 2. Collage (`collage`, 4 styles)

Images assembled from fragments: cut-out photographs on colour blocks, textured mixed media, hand-torn paper and old engravings set against flat modern colour. Collage handles stories with many angles at once and is the newsroom default for tech and policy. The cut-out photo montage is photographic and follows the photoreal rules: objects, machines, buildings and places only, never people.

### 3. Objects and sets (`objects-sets`, 5 styles)

Things you could almost touch: real props photographed as a metaphor, cinematic renders of glass and chrome, playful matte 3D, polymer-clay miniatures and layered cut paper. Still life and cinematic 3D are photoreal and show objects only, never people. Clay is satire-prone and is never used once a story carries any sensitivity.

### 4. Painting (`painting`, 3 styles)

Hand-painted looks with visible medium: opaque gouache, a contemporary digital painterly finish and transparent watercolour. They carry warmth and weight, so they suit features, profiles, long reads and big-picture essays where the image should feel considered rather than quick.

### 5. Drawing (`drawing`, 3 styles)

The human hand on paper: smudged charcoal, loose ink and wash, and the wobbly crayon line. Charcoal suits serious and sombre stories, ink and wash suits analysis and opinion, and the naive crayon line brings warmth to money, careers and everyday life.

### 6. Printmaking (`printmaking`, 3 styles)

Printmaking traditions: carved linocut, misregistered riso and screen print, and banknote-style intaglio engraving. They bring craft and texture, from labour and the rural economy to startups and culture, and the engraving is the natural look for the rupee, the RBI and gold.

### 7. Comic and cartoon (`comic-cartoon`, 4 styles)

Drawn humour and comic looks: clean ligne claire, thick gig-poster lines, the loose observational cartoon and the single-panel editorial cartoon. They make a point quickly and lightly. The editorial cartoon and the bold comic are satire-prone and are never used once a story carries any sensitivity; none of these styles caricature a real person.

### 8. Surreal and data (`surreal-data`, 3 styles)

Images of ideas rather than things: dreamlike visual metaphors, data turned into art and interface pieces mixed with illustration. They suit macro, markets, technology and AI, where the story is a concept, and they carry no risk of looking like a real event. No chart, window or bubble ever holds a readable word or number.

### 9. Modern Indian (`modern-indian`, 4 styles)

Indian visual traditions applied to the modern economy: miniature painting showing trading floors and ports, the bold Kalighat brush, Gond pattern fills and the maximal palette of truck art and street signage. They bring recognition and warmth to markets, consumer, rural and climate stories. Traditions are drawn as looks only: no deities or sacred symbols as subjects, and no script of any kind. Kalighat is satire-prone and is never used once a story carries any sensitivity.

## Styles at a glance

| # | Family | Style | Slug | People | Real people | Sensitive | Photoreal |
|---|---|---|---|---|---|---|---|
| 1 | Conceptual flat | Grain metaphor | `grain-metaphor` | yes | no | yes | no |
| 2 | Conceptual flat | Minimal wit | `minimal-wit` | yes | no | no | no |
| 3 | Conceptual flat | Colour field | `colour-field` | yes | no | yes | no |
| 4 | Conceptual flat | Mid-century retro | `mid-century` | yes | no | no | no |
| 5 | Collage | Cut-out photo montage | `photo-montage` | no | no | no | yes |
| 6 | Collage | Mixed-media collage | `mixed-media` | yes | no | yes | no |
| 7 | Collage | Torn paper | `torn-paper` | yes | no | yes | no |
| 8 | Collage | Archival engraving collage | `archival-collage` | yes | no | yes | no |
| 9 | Objects and sets | Still life photo | `still-life` | no | no | yes | yes |
| 10 | Objects and sets | Cinematic 3D object | `cinematic-3d` | no | no | no | yes |
| 11 | Objects and sets | Stylised 3D | `stylised-3d` | yes | no | no | no |
| 12 | Objects and sets | Clay set | `clay-set` | yes | no | no | no |
| 13 | Objects and sets | Paper cut | `paper-cut` | yes | no | no | no |
| 14 | Painting | Gouache editorial | `gouache` | yes | no | no | no |
| 15 | Painting | Digital painterly | `digital-painterly` | yes | no | no | no |
| 16 | Painting | Watercolour | `watercolour` | yes | no | yes | no |
| 17 | Drawing | Charcoal | `charcoal` | yes | no | yes | no |
| 18 | Drawing | Ink and wash | `ink-wash` | yes | no | yes | no |
| 19 | Drawing | Naive crayon | `naive-crayon` | yes | no | no | no |
| 20 | Printmaking | Linocut | `linocut` | yes | no | yes | no |
| 21 | Printmaking | Riso and screen print | `riso-screen` | yes | no | no | no |
| 22 | Printmaking | Etching and engraving | `etching` | yes | no | yes | no |
| 23 | Comic and cartoon | Clean-line comic | `clean-line-comic` | yes | no | yes | no |
| 24 | Comic and cartoon | Bold comic | `bold-comic` | yes | no | no | no |
| 25 | Comic and cartoon | Loose cartoon line | `loose-cartoon` | yes | no | no | no |
| 26 | Comic and cartoon | Editorial cartoon | `editorial-cartoon` | yes | no | no | no |
| 27 | Surreal and data | Surreal concept | `surreal-concept` | yes | no | yes | no |
| 28 | Surreal and data | Data art | `data-art` | no | no | yes | no |
| 29 | Surreal and data | Interface hybrid | `interface-hybrid` | yes | no | no | no |
| 30 | Modern Indian | Contemporary miniature | `contemporary-miniature` | yes | no | yes | no |
| 31 | Modern Indian | Kalighat brush | `kalighat` | yes | no | no | no |
| 32 | Modern Indian | Gond pattern | `gond` | yes | no | yes | no |
| 33 | Modern Indian | Indian street maximalism | `indian-street` | yes | no | no | no |

---

## 1. Grain metaphor

- **Slug:** `grain-metaphor`
- **Family:** Conceptual flat
- **Summary:** One clever visual metaphor in flat vector shapes, two to four colours and visible grain
- **Good for:** markets, economy, RBI and monetary policy, banking, policy, startups, explainers, opinion
- **Seen at:** The Economist, Barron's, WSJ, Noema
- **Reference artists (curation only):** Sébastien Thibault, Álvaro Bernis, Ibrahim Rayintakath, Daniel Zender

| Field | Rule |
|---|---|
| Medium | flat vector illustration built from simple geometric and organic shapes, finished with a printed grain or noise texture |
| Palette | a limited palette of two to four flat colours on one solid background colour, taken from the references; shadows are a darker grain of the same colour; never more than four |
| Line | no outlines; edges are clean shape boundaries; small details are cut out of shapes as negative space |
| Texture | visible grain, stipple or noise across fills and shadows, like a grainy print; the background stays a clean solid colour with light grain |
| Composition | one central visual metaphor that fuses two ideas into a single object or scene, large readable shapes, generous negative space, centred or slightly off-centre |
| Lighting | flat; form and shadow are suggested by grain in a darker tone of the same colour, never by soft airbrush |
| Figures | simplified faceless figures built from a few shapes, small enough to serve the metaphor; never identifiable |

**Do**

- fuse two ideas into one object or scene, such as a coin that is also a lock
- keep to two to four colours on one solid background
- shade only with grain in a darker tone of the same colour
- make the idea readable at thumbnail size
- leave the top quarter calm for a headline

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no outlines or ink line work
- no smooth gradients, gloss or 3D lighting
- no second competing metaphor or busy background
- no identifiable faces

**promptCore**

> A conceptual editorial illustration built on one clever visual metaphor, made of flat vector shapes with no outlines in a small set of flat colours on one solid background. Visible grain and noise texture shades the forms in place of gradients. Large simple shapes, generous empty space, readable at a glance. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, outlines, smooth gradient, gloss, more than four colours, clutter, realistic faces

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a rupee coin that is also a padlock
- an interest-rate dial shaped like a pressure gauge on a kettle
- a startup rocket built from a stack of paper invoices

---

## 2. Minimal wit

- **Slug:** `minimal-wit`
- **Family:** Conceptual flat
- **Summary:** A single object with one witty twist, lots of empty space and a visual pun
- **Good for:** opinion, markets, personal finance, tech, policy, corporate, columns, explainers
- **Seen at:** The Economist, WSJ, El País
- **Reference artists (curation only):** Andrea Ucini, Ricardo Tomás, Nick Lowndes

| Field | Rule |
|---|---|
| Medium | minimal conceptual illustration: one object in clean flat shapes or a crisp fine line with flat colour, placed on a plain ground |
| Palette | one plain ground colour plus one or two accent colours, taken from the references; restrained and sparing |
| Line | either no outlines or one thin even line; precise and economical, every mark necessary |
| Texture | flat, clean fills; at most a faint paper grain |
| Composition | a single object, or two at most, small to medium in the frame and surrounded by large empty space; the twist sits at the focal point |
| Lighting | flat, with at most one small flat cast shadow to ground the object |
| Figures | rarely any; when needed, one tiny faceless generic figure for scale |

**Do**

- show one everyday object with one surprising change, such as a tie that ends in a fuse
- leave at least half the frame empty
- keep to one ground colour and one or two accents
- make the joke land without words
- place the object slightly off-centre with room above it

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no second object competing for attention
- no background scenery or pattern
- no heavy texture, gradients or 3D
- no mockery of real people, groups or religions

**promptCore**

> A minimal conceptual editorial illustration of a single everyday object with one witty twist that turns it into a visual pun, drawn in clean flat shapes on a plain ground with one or two accent colours. Vast empty space around the object, precise economical forms, a small flat shadow at most. Calm, clever and instantly readable. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, clutter, busy background, pattern, gradients, heavy texture, many objects, faces

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a fountain pen whose nib is a rising arrow
- a shopping trolley with one square wheel
- an umbrella with a coin-shaped hole letting the rain through

---

## 3. Colour field

- **Slug:** `colour-field`
- **Family:** Conceptual flat
- **Summary:** Flat complementary colour fields with no outlines, and small figures in big quiet spaces
- **Good for:** economy, cities, real estate, infrastructure, jobs and careers, travel, climate, long reads
- **Seen at:** Le Monde, NZZ, New Yorker covers
- **Reference artists (curation only):** Sébastien Plassard, Tom Haugomat, Malika Favre

| Field | Rule |
|---|---|
| Medium | flat colour-field illustration: large planes of solid colour meeting without lines, with light and shadow drawn as shapes |
| Palette | a bold contrasting pair of large flat colour fields plus at most one neutral, taken from the references |
| Line | no lines at all; every edge is where one colour field meets another; shadows and windows are flat shapes |
| Texture | perfectly flat or with a very faint even grain; no brush marks |
| Composition | tiny figures or one small object in a vast architectural or natural space, strong geometry, high or low vantage points, long cast shadows used as design |
| Lighting | strong single-direction light expressed as flat hard-edged shadow shapes in a complementary colour |
| Figures | small simplified silhouettes without features, used for scale and solitude; never identifiable |

**Do**

- use two complementary colours as the main fields
- make figures small against large space
- draw light and shadow as hard flat shapes
- use strong architectural or landscape geometry
- keep the mood quiet and cinematic

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no outlines or ink lines anywhere
- no gradients, airbrush or texture brushes
- no close-up faces or large figures
- no busy detail; every shape must be large and clear

**promptCore**

> A flat colour-field editorial illustration with no outlines, where large planes of solid colour meet edge to edge, built on one bold contrasting colour pair. Tiny featureless figures in a vast architectural or natural space, strong geometry, and light and long shadows drawn as hard flat shapes. Quiet, cinematic and spacious. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, outlines, ink lines, gradients, brush texture, photograph, 3D render, close-up faces, clutter

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a lone commuter crossing a huge empty metro concourse
- a container port at dawn with long crane shadows
- a small figure at the foot of a towering glass office block

---

## 4. Mid-century retro

- **Slug:** `mid-century`
- **Family:** Conceptual flat
- **Summary:** 1950s and 60s palette, simple shapes and an Isotype feel, with grain
- **Good for:** business, economy, trade, consumer, personal finance, explainers, Prime long reads
- **Seen at:** The Economist, Monocle
- **Reference artists (curation only):** Tim McDonagh, Satoshi Hashimoto

| Field | Rule |
|---|---|
| Medium | mid-century editorial illustration with simple cut shapes, Isotype-like pictograms, stippled texture and limited overprinted colour |
| Palette | four to six muted mid-century print colours on a light ground, taken from the references |
| Line | angular stylised shapes with occasional thin confident outlines |
| Texture | dry-brush stipple, halftone grain and slight colour overprint offsets |
| Composition | asymmetric balance, strong diagonals and layered planes; rows of repeated pictogram units can stand for quantities without any numbers |
| Lighting | flat with texture-based shading and simple cast shadows |
| Figures | simple stylised pictogram figures with round heads and no features; never identifiable |

**Do**

- use angular stylised forms
- add grain and stipple texture
- stack overlapping colour planes
- repeat simple pictogram units to suggest quantity
- keep the palette warm and muted

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no modern gadgets drawn photorealistically
- no neon or saturated digital colour
- no chart axes, labels or numbers

**promptCore**

> A mid-century modern editorial illustration with a 1950s and 60s feel: simple angular shapes, Isotype-like pictograms repeated in rows, stipple and halftone grain, and a small set of muted print colours of the period. Layered flat planes, strong diagonals and simple featureless figures. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, neon, glossy, modern flat vector, photorealism, chart axes

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- rows of tiny houses and factories standing for a growing economy
- a family's monthly budget as stacked pictogram jars
- a city skyline at dawn

---

## 5. Cut-out photo montage

- **Slug:** `photo-montage`
- **Family:** Collage
- **Summary:** Greyscale or duotone photo cut-outs of objects and buildings on flat colour blocks with halftone
- **Good for:** tech, AI, policy, regulation, markets, startups, telecom, opinion, explainers
- **Seen at:** The Verge, NYT Opinion, FT, Rest of World
- **Reference artists (curation only):** Cath Virginia, Mark Pernice, Tyler Comrie

| Field | Rule |
|---|---|
| Medium | digital photo montage: cut-out photographs of objects, machines and buildings, printed in greyscale or duotone, combined with flat colour blocks and simple graphic shapes |
| Palette | photographs in greyscale or a duotone; flat colour blocks in two or three bold colours on a plain ground, taken from the references |
| Line | clean hard cut-out edges around each photo, sometimes with a thin white keyline; graphic circles, arcs, bars and arrows with no labels |
| Texture | coarse halftone dots on the photographic cut-outs, light print grain, crisp flat colour blocks |
| Composition | a bold layered arrangement of three to six cut-out elements over large colour blocks, strong scale contrasts, one clear hero object, generous negative space |
| Lighting | inherited from the source photographs and flattened by the duotone; no added glow |
| Figures | never people, faces, hands or body parts; objects, machines, buildings and places only |

**Do**

- cut out photographed objects cleanly and place them on flat colour blocks
- print the photos in greyscale or a duotone
- add coarse halftone texture to the photographic parts
- use simple geometric shapes to connect or frame the elements
- keep one hero object clearly larger than the rest

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people, faces, hands or body parts
- no full-bleed realistic photograph or real-looking news scene
- no screenshots, documents or anything with readable writing
- no more than three flat colours besides the photographs

**promptCore**

> A cut-out photo montage editorial illustration: cleanly cut photographs of objects, machines and buildings printed in greyscale or duotone with coarse halftone dots, layered over large flat colour blocks on a plain ground, with simple graphic circles and bars. One hero object, bold scale contrasts, generous empty space. Objects and places only, no people. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, people, faces, hands, crowd, news photo, realistic full scene, screenshot, documents, 3D render, painting, gradients

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **true**

**Sample subjects that suit it**

- a cut-out server rack and a satellite dish on orange and violet blocks
- a greyscale parliament dome beside a giant duotone smartphone
- a halftone shipping container lifted by a graphic arc

---

## 6. Mixed-media collage

- **Slug:** `mixed-media`
- **Family:** Collage
- **Summary:** Textured collage of paper, screen-print and photo fragments, layered by hand
- **Good for:** economy, markets, geopolitics, trade, banking, policy, opinion, long reads
- **Seen at:** FT, The Economist
- **Reference artists (curation only):** Matt Kenyon, Brett Ryder, Klawe Rzeczy

| Field | Rule |
|---|---|
| Medium | mixed-media collage combining painted and printed paper, screen-print layers, fragments of photographed objects and hand-drawn marks |
| Palette | a few overprinted print colours with one strong accent, taken from the references |
| Line | a mix of hard cut edges, rough screen-print edges, a few loose pencil or crayon marks and ruled lines |
| Texture | heavy: screen-print grain, misregistered ink, paper fibres, photocopy noise and overprinted transparent layers |
| Composition | a layered, slightly off-kilter arrangement that builds one idea from several fragments, overlapping transparent shapes, a clear focal fragment and some breathing room |
| Lighting | flat; depth comes from overlapping layers and overprinting, not modelled light |
| Figures | anonymous silhouettes or fragments of generic figures printed in one colour; faces absent or obscured; never identifiable |

**Do**

- layer at least three kinds of material: paper, print and photo fragments
- let transparent ink layers overprint each other
- keep one fragment as the clear focal point
- add a few hand-drawn marks for energy
- use a muted palette with one strong accent

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no clean vector-only finish
- no readable newsprint, headlines or documents in the fragments
- no recognisable real people in photo fragments
- no glossy 3D or airbrush

**promptCore**

> A textured mixed-media editorial collage of painted and printed paper, screen-print layers with misregistered ink, fragments of photographed objects and a few loose hand-drawn marks, overprinted in a small set of print colours. One idea built from layered fragments, a clear focal piece, heavy print grain and paper texture. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, clean vector, glossy, 3D render, airbrush, readable newsprint, documents, real person likeness, photorealistic scene

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a cargo ship fragment overprinted with trade-route lines
- a bank pillar collaged from torn print layers
- a factory chimney rising out of a screen-printed map shape

---

## 7. Torn paper

- **Slug:** `torn-paper`
- **Family:** Collage
- **Summary:** Hand-torn paper collage with ragged white fibre edges, layered coloured papers and analogue marks
- **Good for:** opinion, economy, policy, climate, health, society, investigations, explainers
- **Seen at:** NYT, ProPublica
- **Reference artists (curation only):** Mark Harris, Najeebah Al-Ghadban

| Field | Rule |
|---|---|
| Medium | physical collage of hand-torn coloured and printed papers, glued in overlapping layers, optionally with gouache, crayon or pencil marks, photographed or scanned flat |
| Palette | a limited palette of four to six paper colours on a plain paper ground, taken from the references |
| Line | no outlines; shapes defined by ragged torn edges with a thin white fibrous core showing where the paper ripped; occasional loose crayon or pencil scribble |
| Texture | visible paper grain, deckle and fibre edges, slight paper curl and soft drop shadows between layers, printed halftone or newsprint scraps, uneven glue wrinkles |
| Composition | one bold central idea built from 3-7 large torn shapes, generous negative space, layered overlaps that create depth, simple editorial metaphor readable at thumbnail size |
| Lighting | flat even scan or soft top light; only tiny contact shadows where paper layers lift |
| Figures | simplified silhouettes or anonymous figures torn from paper, no facial detail beyond a few torn shapes; never a recognisable real person |

**Do**

- show raw torn edges with white fibre on most shapes
- layer papers so overlaps are visible
- use a restrained palette of 4-6 paper colours
- mix plain coloured paper with a few printed or newsprint scraps
- keep the concept to one clear visual metaphor
- leave breathing room around the main shape

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no clean vector edges or perfectly cut geometric shapes everywhere
- no glossy 3D render or photoreal lighting
- no recognisable real people or celebrity likenesses
- no busy wallpaper-like pattern filling the whole frame
- no readable newsprint or headlines on the scraps

**promptCore**

> A hand-made collage of torn coloured paper layered on a plain paper sheet: bold shapes ripped by hand with ragged edges and a thin white fibrous core, a few scraps of printed paper and halftone, strips of tape, subtle paper grain and soft contact shadows where layers overlap, in a limited paper palette. One simple central editorial metaphor, generous negative space, a flat scanned look. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, vector art, clean digital edges, 3D render, glossy, photorealistic, gradient mesh, real person likeness, cluttered pattern, readable newsprint

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a monsoon street with umbrellas
- a mountain of paper documents
- a road splitting in two directions

---

## 8. Archival engraving collage

- **Slug:** `archival-collage`
- **Family:** Collage
- **Summary:** Old etchings and museum-style engravings combined with bold flat modern colour
- **Good for:** geopolitics, macro, AI and tech, policy, business history, climate, essays, opinion
- **Seen at:** Noema, Aeon, MIT Technology Review
- **Reference artists (curation only):** Nicolás Ortega, Andrea Daquino

| Field | Rule |
|---|---|
| Medium | collage of antique engravings and etchings (machines, plants, architecture, instruments, anonymous classical statues) combined with flat modern colour shapes |
| Palette | engraved line on aged paper, with at most two flat modern accent colours, taken from the references |
| Line | fine engraved cross-hatching and contour lines from the old plates, against clean hard-edged flat shapes |
| Texture | aged paper tone, fine engraving line, slight foxing and print grain; the modern shapes stay flat |
| Composition | a surreal juxtaposition of two or three engraved elements at unexpected scales, framed or cut through by bold flat geometric shapes; museum-like calm and lots of space |
| Lighting | the engraved hatching carries the light; the modern shapes are flat |
| Figures | only anonymous classical statues or generic engraved figures from old plates; never portraits of real or historical people |

**Do**

- pair engraved antique elements with bold flat modern shapes
- keep the engraving line fine and black
- use unexpected scale between elements
- limit modern colour to one or two accents
- leave calm aged-paper space

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no portraits of real or historical people
- no readable captions, plate numbers or map labels
- no colour wash over the whole engraving
- no religious icons or sacred symbols as subjects

**promptCore**

> An archival engraving collage: fine cross-hatched engravings of antique machines, plants, architecture and anonymous classical statues, cut from old plates and combined at surprising scales with bold flat modern shapes in one or two accent colours, on aged paper. Surreal, calm and museum-like, with generous empty space. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, cartoon, watercolour wash, portraits, real people, plate numbers, map labels, clutter

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- an engraved steam engine pulling a flat blue cloud
- an antique balance scale weighing a circuit board
- an engraved banyan tree whose roots wrap a red sphere

---

## 9. Still life photo

- **Slug:** `still-life`
- **Family:** Objects and sets
- **Summary:** A studio photograph of real props arranged as a visual metaphor; objects only
- **Good for:** personal finance, commodities, earnings, banking, gold and savings, tax, insurance, consumer
- **Seen at:** HBR, NYT Magazine

| Field | Rule |
|---|---|
| Medium | studio still-life photograph of real props arranged to form a visual metaphor |
| Palette | one seamless backdrop colour with the natural colours of the objects, taken from the references |
| Line | photographic, crisp edges |
| Texture | real material textures: metal, paper, wood, fabric |
| Composition | a small arrangement of real objects whose placement makes the point (a stack, a balance, a collision, a break), one clear hero object, minimal and considered |
| Lighting | soft studio key light with a gentle shadow, controlled reflections |
| Figures | never people, hands or body parts; objects only |

**Do**

- arrange real props so the arrangement itself is the metaphor
- make one object the hero
- use soft studio light and a seamless backdrop
- choose objects that symbolise the story
- keep surfaces free of printed labels

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people, hands or body parts
- no depiction of a real news event
- no products with visible branding or labels
- no digital effects that break the photographic look

**promptCore**

> A minimal studio still-life photograph of real props arranged so that the arrangement itself forms a visual metaphor, on a seamless plain backdrop, with one clear hero object, real material textures and soft studio light with a gentle shadow. Objects only, no people. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, people, hands, faces, news event, crowd, illustration, cartoon, brand labels, packaging with writing

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **true**

**Sample subjects that suit it**

- a gold bar and a magnifying glass
- a rupee coin balanced on a scale
- a wallet with cards

---

## 10. Cinematic 3D object

- **Slug:** `cinematic-3d`
- **Family:** Objects and sets
- **Summary:** Photoreal render of glass, chrome or metal objects with film lighting; objects only
- **Good for:** AI, tech, semiconductors, markets, banking, fintech, energy, earnings, luxury
- **Seen at:** TIME, WIRED, MIT Technology Review
- **Reference artists (curation only):** Andy Potts, Simoul Alva

| Field | Rule |
|---|---|
| Medium | photoreal 3D render of sculpted objects in glass, chrome, brushed metal, stone or liquid, with physically accurate materials |
| Palette | a deep plain ground with one key colour and one contrasting rim-light colour, taken from the references |
| Line | photographic edges; crisp reflections and refractions define the form |
| Texture | real material response: caustics in glass, anisotropic highlights on metal, clean surfaces, shallow depth of field |
| Composition | one hero object or a small group, centred or on a strong diagonal, dramatic scale, low camera angle, clean empty space around it |
| Lighting | film lighting: a strong key light, a coloured rim light, volumetric haze or light beams and deep controlled shadows |
| Figures | never people, hands or body parts; objects only |

**Do**

- render one hero object in glass, chrome or metal
- light it like a film still with a key light and a coloured rim light
- use shallow depth of field and haze for depth
- make the object itself the metaphor, such as a glass bull or a chrome chip
- keep the background dark and simple

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people, hands, faces or robots with human faces
- no screens, dashboards or interfaces with writing
- no cartoon or toy-like proportions
- no depiction of a real news event

**promptCore**

> A cinematic photoreal 3D render of one sculpted hero object in glass, chrome or brushed metal, with physically accurate reflections, refraction and caustics, lit like a film still with a strong key light, a contrasting rim light and soft volumetric haze against a deep plain background. Shallow depth of field, dramatic low angle. Objects only, no people. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, people, hands, faces, humanoid robot faces, cartoon, toy, flat illustration, screens with writing, dashboards, clutter, news event

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **true**

**Sample subjects that suit it**

- a glass bull standing on a chrome bar chart with no labels
- a semiconductor chip floating above dark water
- a chrome padlock wrapped in beams of light

---

## 11. Stylised 3D

- **Slug:** `stylised-3d`
- **Family:** Objects and sets
- **Summary:** Matte stylised 3D with soft gradients and print grain, playful and bright
- **Good for:** startups, consumer, fintech, personal finance, apps, ecommerce, careers, explainers
- **Seen at:** Businessweek, FT
- **Reference artists (curation only):** Timo Lenzen, César Pelizer

| Field | Rule |
|---|---|
| Medium | stylised 3D illustration of simple rounded and geometric forms with matte materials and a printed grain finish |
| Palette | a few bright but soft matte colours on a plain ground, taken from the references |
| Line | no lines; form comes from soft gradient shading on matte surfaces |
| Texture | matte clay-like or soft plastic surfaces with visible print grain or noise over the gradients; no gloss |
| Composition | a playful arrangement of a few chunky objects or simple characters with exaggerated proportions, floating or stacked, with a clear silhouette on a plain ground |
| Lighting | soft studio light with gentle gradient shading and soft contact shadows |
| Figures | simplified rounded characters with minimal or no facial features and toy-like proportions; never identifiable |

**Do**

- use chunky simplified forms with exaggerated proportions
- keep materials matte with grain over the gradients
- use a bright soft palette on a plain ground
- stack or float objects to make the idea playful
- keep the silhouette clear at thumbnail size

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no photoreal materials, chrome or glass
- no glossy plastic highlights
- no detailed realistic faces
- no busy scenes with many small parts

**promptCore**

> A playful stylised 3D illustration of a few chunky rounded objects with exaggerated proportions, in matte materials shaded by soft gradients with visible print grain over them, in a few bright, soft colours on a plain ground. Soft studio light, gentle contact shadows and a clear simple silhouette. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photoreal, chrome, glass, glossy plastic, detailed faces, flat 2D vector, ink line, clutter

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a chunky piggy bank riding a rocket
- a stack of rounded app tiles balanced on a coin
- a shopping bag with tiny legs climbing a staircase

---

## 12. Clay set

- **Slug:** `clay-set`
- **Family:** Objects and sets
- **Summary:** A photographed polymer-clay miniature scene, handmade and gently witty
- **Good for:** personal finance, consumer, cities, workplace, food and retail, explainers, features
- **Seen at:** NYT Sunday Review
- **Reference artists (curation only):** Hudson Christie

| Field | Rule |
|---|---|
| Medium | photographed miniature set of polymer-clay figures and props on a small handmade tabletop set |
| Palette | saturated but soft clay colours against one plain painted backdrop, taken from the references |
| Line | no lines; sculpted forms with visible handmade edges |
| Texture | real clay surfaces with fingerprints, tool marks and slight imperfections; tiny handmade props |
| Composition | a small staged scene seen from a slightly high angle, one clear action, few props, a plain backdrop |
| Lighting | soft photographic studio light with a gentle shadow and the shallow depth of field of a tabletop shot |
| Figures | chunky clay figures with simple bead eyes and generic features; never caricatures of real people |

**Do**

- show real clay with fingerprints and tool marks
- stage one clear action in a tiny set
- use a plain painted backdrop
- light it like a tabletop photograph with shallow depth of field
- keep the humour gentle

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no caricatures or likenesses of real people
- no digital smoothness or CGI gloss
- no flags, party symbols or religious figures
- no tragic or violent subjects

**promptCore**

> A photographed polymer-clay miniature scene on a small handmade tabletop set: chunky clay figures with simple bead eyes and tiny clay props, real clay surfaces with fingerprints and tool marks, saturated soft clay colours, a plain painted backdrop, soft studio light and the shallow depth of field of a tabletop photograph. Gentle and witty. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, CGI, glossy render, flat illustration, real people, caricature, flags, cluttered set

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- clay commuters squeezed into a tiny metro carriage
- a clay family unrolling a very long blank grocery bill
- a clay chef stirring a pot of coins

---

## 13. Paper cut

- **Slug:** `paper-cut`
- **Family:** Objects and sets
- **Summary:** Layered cut paper with soft shadows
- **Good for:** explainers, personal finance, festivals, consumer, cities, education, festive economy
- **Seen at:** The Guardian

| Field | Rule |
|---|---|
| Medium | layered cut-paper craft photographed in soft studio light |
| Palette | four or five solid paper colours stacked in layers, taken from the references |
| Line | clean cut edges, no drawn lines |
| Texture | visible paper fibres, slight curl at edges, layered thickness |
| Composition | stacked depth layers from background to foreground, centred or rule-of-thirds focal piece |
| Lighting | soft top light casting gentle drop shadows between layers |
| Figures | cut-paper figures with simple shapes, no facial detail beyond a few cut holes |

**Do**

- build depth with five or more layers
- show soft shadows between layers
- keep edges crisp
- use festive, warm colour combinations

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no drawn ink lines
- no glossy plastic look

**promptCore**

> A layered cut-paper craft illustration photographed in soft studio light, with crisp cut edges, visible paper fibres and gentle shadows between stacked layers, in a few solid paper colours. Clear depth from background to foreground. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, drawing, ink line, flat vector, plastic, glossy 3D, photograph of people

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a seedling growing out of coins
- a wallet with cards
- a city skyline at dawn

---

## 14. Gouache editorial

- **Slug:** `gouache`
- **Family:** Painting
- **Summary:** Opaque matte gouache, soft edges, rich colour
- **Good for:** Prime features, profiles, culture, consumer, travel, agriculture, lifestyle

| Field | Rule |
|---|---|
| Medium | opaque matte gouache painting on cold-press paper |
| Palette | a rich, limited set of opaque mixed colours, taken from the references |
| Line | soft painted edges, no outlines, visible brush direction |
| Texture | chalky matte paint with slight streaks and paper tooth at the edges |
| Composition | storybook framing, layered foreground and background, one warm focal area |
| Lighting | soft directional light with warm highlights and cool shadows |
| Figures | painted figures with simple features and natural proportions, respectful and calm |

**Do**

- let brush direction follow form
- use warm light against cool shadow
- keep surfaces matte
- frame the subject with layered foreground shapes

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no hard vector edges
- no glossy or wet-look highlights

**promptCore**

> An editorial gouache painting with opaque, matte, chalky paint and soft brushed edges, in a rich but limited set of mixed colours. Directional light, layered foreground and background, visible paper tooth. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, vector, glossy, 3D render, hard outlines, neon

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a market street with stalls
- a monsoon street with umbrellas
- a classroom with empty desks

---

## 15. Digital painterly

- **Slug:** `digital-painterly`
- **Family:** Painting
- **Summary:** Contemporary concept-art finish, cinematic
- **Good for:** AI, tech futures, space, energy, EVs, infrastructure, defence

| Field | Rule |
|---|---|
| Medium | digital painting with a contemporary concept-art finish and visible brush textures |
| Palette | one dominant colour mood with a contrasting light colour and atmospheric neutrals, taken from the references |
| Line | painterly edges, lost-and-found contours, no ink outlines |
| Texture | digital brush texture, atmospheric haze, subtle grain |
| Composition | cinematic framing within a square frame, strong depth, a clear focal subject against atmosphere |
| Lighting | volumetric light, rim light on the focal subject, glowing accents |
| Figures | figures as small silhouettes or painterly forms against vast scenes, never detailed portraits |

**Do**

- use atmospheric depth and haze
- rim-light the focal subject
- frame it like a film still
- keep brushwork visible

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no photorealistic rendering
- no game-UI elements or screens with writing

**promptCore**

> A cinematic digital painting with a contemporary concept-art finish, visible brush texture, atmospheric haze and volumetric light, with one dominant colour mood and a contrasting light colour. Wide framing with strong depth and a rim-lit focal subject. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, photorealistic, flat vector, cartoon, user interface, screens with writing

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a robot hand and a human hand
- a satellite over the earth
- a rocket launch over the sea

---

## 16. Watercolour

- **Slug:** `watercolour`
- **Family:** Painting
- **Summary:** Transparent washes, paper texture, airy
- **Good for:** travel, places, health, agriculture, monsoon, wellbeing, cities, gentle stories

| Field | Rule |
|---|---|
| Medium | transparent watercolour on rough cotton paper with light pencil underdrawing |
| Palette | a few soft transparent washes with plenty of untouched paper, taken from the references |
| Line | faint pencil underdrawing, edges defined by wet-on-wet and wet-on-dry washes |
| Texture | rough cotton paper grain, granulation, blooms and hard drying edges |
| Composition | airy, open composition with large untouched paper areas and a gentle focal point |
| Lighting | light from the white of the paper, soft transparent shadows |
| Figures | lightly painted figures with minimal features, gentle and respectful |

**Do**

- leave plenty of white paper
- let washes bloom and granulate
- keep it light and transparent
- suggest detail rather than render it

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no opaque heavy paint
- no harsh black outlines

**promptCore**

> A delicate transparent watercolour illustration on rough cotton paper with a faint pencil underdrawing, soft transparent washes, blooms and granulation, and large areas of untouched paper. Airy, gentle and calm. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, vector, opaque paint, neon, heavy black lines, 3D render

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a hospital corridor
- a farmer's field with a tractor
- a city skyline at dawn

---

## 17. Charcoal

- **Slug:** `charcoal`
- **Family:** Drawing
- **Summary:** Smudged charcoal, deep blacks, gravity
- **Good for:** serious stories, sombre stories, disasters, courts and law, labour, investigations

| Field | Rule |
|---|---|
| Medium | compressed and willow charcoal on heavy grey-toned paper |
| Palette | the tonal range of charcoal and chalk on toned paper, from deep darks to lifted highlights, taken from the references |
| Line | broad expressive strokes, smudged edges, few hard lines |
| Texture | heavy paper tooth, dust, finger smudges, lifted highlights |
| Composition | quiet, weighty composition with large dark areas and one point of light |
| Lighting | low-key lighting, deep blacks, a single soft light source |
| Figures | figures only as silhouettes or turned away, never identifiable faces |

**Do**

- use large areas of deep black
- lift a single point of light
- keep the mood quiet and respectful
- prefer symbolic objects over people

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no colour
- no identifiable faces or graphic detail

**promptCore**

> A sombre charcoal drawing on toned paper with deep smudged darks, smoky mid-tones and a single soft point of light lifted in chalk. Quiet, weighty composition with expressive broad strokes; any figures appear only as silhouettes. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, colour, vector, cartoon, bright, cheerful, gore, faces

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- an empty railway platform at night
- a single candle on a table
- a mountain of paper documents

---

## 18. Ink and wash

- **Slug:** `ink-wash`
- **Family:** Drawing
- **Summary:** Loose ink line with grey and one accent wash
- **Good for:** markets, analysis, opinion, policy, banking, columns, economy
- **Reference artists (curation only):** Ellie Foreman-Peck, Yann Kebbi

| Field | Rule |
|---|---|
| Medium | black ink brush line with grey wash on off-white paper |
| Palette | ink and tonal wash on paper, with at most one small accent colour, taken from the references |
| Line | confident, varied weight, loose, some dry-brush strokes |
| Texture | visible paper grain, wash blooms and soft pooled edges |
| Composition | one strong focal element, generous negative space, off-centre placement |
| Lighting | implied by wash density, no gradients or airbrush |
| Figures | simplified generic figures drawn with a few strokes, no caricature, natural proportions; never identifiable |

**Do**

- use a single visual metaphor
- leave the top-left third calm for headlines
- let wash bleed past the line in places
- keep the accent colour to one small area

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no more than one accent colour
- no photoreal faces

**promptCore**

> An editorial illustration in loose ink brush line with soft tonal wash on textured paper, with at most one small accent colour. Confident varied strokes, visible paper grain and pooled wash edges, one strong focal element and generous empty space. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, flat vector, neon, heavy colour, digital gradient

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a stock chart turning into a mountain path
- two chess pieces facing each other
- a bank vault door

---

## 19. Naive crayon

- **Slug:** `naive-crayon`
- **Family:** Drawing
- **Summary:** A wobbly crayon or pencil line, childlike and warm, with scribbled colour
- **Good for:** personal finance, education, careers, wellbeing, family money, consumer, opinion, explainers

| Field | Rule |
|---|---|
| Medium | naive drawing in wax crayon, oil pastel and coloured pencil on plain paper |
| Palette | a few bright crayon colours used loosely on plain paper, taken from the references |
| Line | a wobbly, uneven, hand-held line with breaks and overlaps, varying pressure and intentionally naive proportions |
| Texture | waxy crayon strokes with paper tooth showing through, uneven scribbled colouring that goes over the lines |
| Composition | simple and frank: one scene or object, flattened perspective, objects floating or lined up, lots of white paper |
| Lighting | none; no shading beyond scribbled darker patches |
| Figures | simple naive figures with round heads, stick or tube limbs and dot eyes; generic and warm; never identifiable |

**Do**

- keep the line wobbly and imperfect
- let colour scribble over the lines
- flatten perspective like a child's drawing
- leave plenty of white paper
- keep the idea simple and human

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no clean vector lines or perfect shapes
- no realistic shading or perspective
- no handwriting or scribbled words
- no mockery of children or of real people

**promptCore**

> A naive drawing in wax crayon and coloured pencil on plain paper, with a wobbly, uneven hand-held line, scribbled colour that goes over the lines and paper tooth showing through the waxy strokes, in a few bright crayon colours. Flattened childlike perspective, simple warm figures with dot eyes, lots of bare paper. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, clean vector, perfect shapes, realistic shading, photograph, 3D render, handwriting, scribbled words

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a family beside their house with a giant piggy bank
- a classroom with a very tall stack of books
- a person climbing a ladder made of coins

---

## 20. Linocut

- **Slug:** `linocut`
- **Family:** Printmaking
- **Summary:** Carved relief print, bold black with one colour
- **Good for:** agriculture, labour, rural economy, manufacturing, MSMEs, cooperatives, monsoon

| Field | Rule |
|---|---|
| Medium | linocut relief print with carved gouge marks, printed in black plus one colour |
| Palette | one dark key ink plus at most one more colour on natural paper, taken from the references |
| Line | bold carved shapes, gouge-mark hatching, chunky confident contours |
| Texture | uneven ink coverage, paper showing through, slight print registration shift |
| Composition | strong, graphic, poster-like composition with clear silhouettes |
| Lighting | no modelling; light expressed by carved white lines |
| Figures | sturdy, dignified generic working figures with simplified carved features; never identifiable |

**Do**

- use carved gouge marks for tone
- limit to black plus one colour
- keep silhouettes bold
- let paper texture show through ink

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no gradients
- no fine photographic detail

**promptCore**

> A linocut relief print with bold carved shapes and gouge-mark hatching, printed in a dark key ink and at most one more colour on natural paper, with uneven ink coverage and slight registration shift. Strong graphic composition with sturdy, dignified figures. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, gradient, digital painting, 3D render, smooth shading, many colours

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a farmer's field with a tractor
- a factory with smoke turning into clouds
- a monsoon street with umbrellas

---

## 21. Riso and screen print

- **Slug:** `riso-screen`
- **Family:** Printmaking
- **Summary:** Two to four spot colours with misregistration, overprint and grain
- **Good for:** startups, culture, consumer, cities, media, careers, events, explainers
- **Reference artists (curation only):** Golden Cosmos, Mira Malhotra

| Field | Rule |
|---|---|
| Medium | risograph or screen print in two to four flat spot inks, printed in separate layers |
| Palette | two to four spot inks on uncoated paper, where overlaps make new mixed colours, taken from the references |
| Line | bold shapes and simple lines; layers drift slightly out of register so edges show thin gaps and overlaps |
| Texture | riso grain and speckle, uneven ink density, halftone gradients and visible overprint where inks cross |
| Composition | graphic and bold: flat layered shapes, overlaps used on purpose to make a third colour, one clear focal shape |
| Lighting | flat; tone comes from halftone dots and overprinting |
| Figures | simplified graphic figures with minimal features; never identifiable |

**Do**

- use two to four spot colours only
- let the layers misregister slightly
- overprint inks to create a third colour
- shade with halftone dots and grain
- keep shapes bold and flat

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no full-colour photographic rendering
- no smooth digital gradients
- no more than four inks
- no clean, perfectly registered vector finish

**promptCore**

> A risograph and screen print illustration in two to four spot inks on uncoated paper, with slight misregistration between layers, visible overprint where inks cross to make new colours, halftone gradients and riso grain. Bold flat shapes and one clear focal form. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, full colour, smooth gradient, 3D render, glossy, perfectly registered vector

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a founder's desk seen from above with a plant and a laptop
- a crowded weekend market of food stalls
- a concert stage with spotlights over a crowd seen from behind

---

## 22. Etching and engraving

- **Slug:** `etching`
- **Family:** Printmaking
- **Summary:** Banknote-style intaglio engraving with fine cross-hatching and guilloche ornament
- **Good for:** RBI and monetary policy, rupee and currency, banking, gold, markets, budget, tax, business history
- **Reference artists (curation only):** Studio Duco, Xinmei Liu

| Field | Rule |
|---|---|
| Medium | intaglio engraving and etching like banknote and stamp printing: fine engraved lines, cross-hatching and guilloche rosettes |
| Palette | one or two inks on security paper, taken from the references |
| Line | very fine, precise engraved lines that swell and taper; parallel and cross-hatched tone; ornamental guilloche curves |
| Texture | crisp intaglio line with a slightly raised-ink feel, fine line moire and paper tone |
| Composition | a central emblematic object framed by guilloche rosettes, borders or wreaths with no lettering; symmetrical and formal |
| Lighting | classical engraved modelling: light from the upper left expressed purely through line density |
| Figures | engraved allegorical figures only, generic and idealised; never portraits of real people, leaders or historical figures |

**Do**

- model every form with fine parallel and cross-hatched lines
- frame the subject with guilloche rosettes or ornamental borders
- use one or two inks only
- keep the composition formal and symmetrical
- make the object emblematic, like a vignette on a banknote

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no numerals, denominations, serial numbers or lettering of any kind
- no copy of a real banknote, coin or stamp design
- no national emblems, official seals or portraits of leaders
- no flat fills or colour gradients

**promptCore**

> A banknote-style intaglio engraving with very fine, precise lines that swell and taper, dense cross-hatching and ornamental guilloche rosettes and borders, printed in one or two inks on security paper. A formal, symmetrical emblematic vignette of one central object, modelled entirely through line density. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, flat colour, gradients, photograph, 3D render, numerals, denominations, serial numbers, real banknote, national emblem, portraits, cartoon

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a lotus rising from a stack of coins inside a guilloche wreath
- an engraved padlock framed by ornamental rosettes
- an engraved vault door with a rising sun behind it

---

## 23. Clean-line comic

- **Slug:** `clean-line-comic`
- **Family:** Comic and cartoon
- **Summary:** Ligne claire comic illustration: even black outlines, flat unshaded colour, no hatching, precise settings and simple figures
- **Good for:** cities and infrastructure, travel and tourism, workplace, explainers, real estate, transport and mobility, consumer, tech

| Field | Rule |
|---|---|
| Medium | ligne claire comic illustration: uniform-weight ink outlines with flat gouache or digital colour fills |
| Palette | a limited set of flat retro fills with dark uniform outlines, taken from the references |
| Line | one even-weight black outline around every shape, no tapering, no hatching or cross-hatching, tidy closed contours |
| Texture | none, or a very faint paper or risograph grain; colour fills are flat and uniform |
| Composition | clear, orderly staging; accurately drawn architecture, vehicles and objects combined with simplified cartoon figures; frontal, profile or isometric views; balanced uncluttered layout |
| Lighting | no modelled shading; any shadows are single flat tone shapes |
| Figures | generic, never identifiable people: simplified cartoon figures with dot eyes, neat clothes and stylised hair |

**Do**

- outline every shape with the same line weight
- fill with flat unshaded colour
- draw backgrounds with precise, realistic detail
- keep figures simple and cartoon-like against detailed settings
- use a restrained retro palette
- keep the composition legible and calm

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no hatching, cross-hatching or textured shading
- no gradients, airbrush or painterly effects
- no speech bubbles or captions
- no existing comic characters or recognisable franchise designs
- no likeness of real people

**promptCore**

> Ligne claire comic illustration with uniform-weight outlines around every shape and flat, unshaded colour fills in a limited retro palette. No hatching, no gradients. Precisely drawn architecture and objects combined with simple generic cartoon figures, orderly frontal or isometric staging, calm and highly legible. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, speech bubbles, hatching, cross-hatching, gradients, airbrush, painterly texture, sketchy line, variable line weight, photorealistic, 3D render, real person likeness, existing comic characters

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a market street with stalls
- a railway platform
- a classroom with empty desks

---

## 24. Bold comic

- **Slug:** `bold-comic`
- **Family:** Comic and cartoon
- **Summary:** Thick gig-poster lines, punchy flat colour and loud graphic energy
- **Good for:** startups, sport business, consumer brands, media and entertainment, gaming, tech, markets
- **Reference artists (curation only):** Sandro Rybak, Anna Haifisch, Fortunate Joaquin

| Field | Rule |
|---|---|
| Medium | bold comic and gig-poster illustration with thick brush or marker outlines and punchy flat colour |
| Palette | three or four loud flat colours with heavy dark outlines, taken from the references |
| Line | very thick, confident black outlines with chunky rounded ends, simple interior lines and heavy spot blacks |
| Texture | flat fills with optional coarse halftone dots or screen-print grain |
| Composition | big, close and dynamic: one oversized subject filling much of the frame, strong diagonals, exaggerated perspective, impact shapes with no lettering |
| Lighting | flat; drama comes from spot blacks and hard shadow shapes |
| Figures | exaggerated generic cartoon figures with simple features; never caricatures of real people |

**Do**

- use very thick black outlines
- fill with three or four punchy flat colours
- push scale and perspective for impact
- add spot blacks and hard shadow shapes
- keep shapes chunky and readable at thumbnail size

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no sound effects, speech bubbles or lettering
- no caricatures of real people
- no existing comic characters or franchise designs
- no thin delicate lines or soft shading

**promptCore**

> A bold comic and gig-poster illustration with very thick, confident outlines, chunky rounded shapes and heavy spot blacks, filled with three or four punchy flat colours, with coarse halftone dots. One oversized subject, dynamic diagonals and exaggerated perspective, loud and energetic. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, speech bubbles, sound effects, lettering, thin lines, soft shading, gradients, photograph, 3D render, caricature, existing characters

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a rocket bursting out of a laptop screen
- a cricket ball smashing through a blank billboard frame
- a shopping cart racing downhill

---

## 25. Loose cartoon line

- **Slug:** `loose-cartoon`
- **Family:** Comic and cartoon
- **Summary:** A loose, wry cartoon line with sparse colour, observational and human
- **Good for:** careers, workplace, personal finance, wellbeing, opinion, tech habits, consumer, lifestyle
- **Reference artists (curation only):** Liana Finck, Allie Sullberg, Laura Leido

| Field | Rule |
|---|---|
| Medium | loose cartoon drawing in pen or brush pen with sparse flat colour or a single wash |
| Palette | mostly pen line on plain paper with one to three soft flat colours, taken from the references |
| Line | a loose, quick, slightly scratchy line of fairly even weight, with unfinished contours and economical gestures |
| Texture | plain paper; colour laid in flat patches that do not fill the shapes exactly |
| Composition | an observational moment with one or two figures and a few props, lots of white space, relaxed and wry |
| Lighting | none; no shading beyond a few strokes |
| Figures | simple, slightly awkward generic figures with dot eyes and expressive posture; never identifiable |

**Do**

- keep the line loose and quick
- use expressive body language for the joke
- colour sparingly in flat patches that slip off the line
- leave lots of white paper
- find the human moment in the story

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no captions, speech bubbles or handwritten words
- no polished vector finish
- no caricatures of real people
- no heavy rendering or texture

**promptCore**

> A loose, wry cartoon drawn with a quick, slightly scratchy pen line on plain paper, with sparse flat patches of soft colour that slip off the line. One or two simple generic figures with dot eyes and expressive posture in an everyday observed moment, lots of empty space, relaxed and human. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, speech bubbles, handwriting, polished vector, heavy shading, 3D render, photograph, caricature

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- an employee juggling a laptop, a toddler and a coffee cup
- a person peering at a tiny pay slip through a magnifying glass
- two colleagues on a video call from their kitchen tables

---

## 26. Editorial cartoon

- **Slug:** `editorial-cartoon`
- **Family:** Comic and cartoon
- **Summary:** Newspaper-cartoon pen line and watercolour wash, built from symbols, objects and generic figures, never caricature
- **Good for:** economy and markets, inflation and prices, budget and tax, policy debates, corporate governance, tech disruption, jobs, opinion

| Field | Rule |
|---|---|
| Medium | dip-pen or brush ink line drawing finished with loose watercolour and grey ink wash on off-white cartoon paper |
| Palette | ink line and wash on paper, with a few colours applied sparingly as transparent washes, taken from the references |
| Line | confident variable-weight nib line with pressure swells, cross-hatching in shadows, slightly wobbly hand-drawn contours |
| Texture | watercolour blooms, granulation and dry-brush edges; wash slips loosely past the ink lines; visible paper grain |
| Composition | single-panel gag built on one clear visual metaphor; exaggerated scale contrasts (giant coin, tiny figure); minimal setting with a simple ground line; generous white space |
| Lighting | flat; form implied by wash shading and hatching only, no realistic light sources |
| Figures | generic, never identifiable people: everyman workers, investors, shoppers and officials with big noses, oversized shoes and simplified faces; anthropomorphic objects such as piggy banks, charts, coins and buildings |

**Do**

- build the image around one strong visual metaphor made of everyday objects
- exaggerate proportions and scale for comic effect
- let wash colour sit loosely inside and outside the ink lines
- keep the background minimal so the gag reads instantly
- use hatching and grey wash for shadow and depth
- give generic figures expressive body language

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no caricatures or likenesses of real politicians, celebrities or public figures
- no speech bubbles, captions or labels on objects
- no photoreal rendering, 3D shading or smooth digital gradients
- no party symbols or flags used to mock groups
- no gore or graphic violence

**promptCore**

> Single-panel editorial cartoon drawn with a dip pen in confident ink lines and cross-hatching, finished with loose transparent watercolour and ink wash on paper. One clear visual metaphor built from everyday objects and generic everyman figures with exaggerated proportions, minimal background, generous empty space, hand-drawn wobble, wash blooms and paper grain. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, speech bubbles, labels, caricature of a real person, celebrity likeness, photorealistic, 3D render, smooth gradients, flat vector, glossy, cluttered background, gore

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- two chess pieces facing each other
- a robot hand and a human hand
- a mountain of paper documents

---

## 27. Surreal concept

- **Slug:** `surreal-concept`
- **Family:** Surreal and data
- **Summary:** Dreamlike conceptual editorial scenes where impossible scale, objects and spaces turn an idea into one clear visual metaphor
- **Good for:** opinion, big-idea features, economy, technology, AI, climate, future of work, uncertainty, ambition and risk

| Field | Rule |
|---|---|
| Medium | Digitally painted illustration with a hand-made feel, soft grain and subtle brush or risograph-like texture over smooth shapes. |
| Palette | limited and harmonious, taken from the references |
| Line | Few or no outlines; forms defined by clean shape edges and soft tonal shading, occasional fine contour lines. |
| Texture | Fine grain and speckle noise across flat areas, light paper texture, no glossy rendering. |
| Composition | One strong central metaphor with plenty of negative space; impossible scale shifts (tiny figure, giant object), floating or merged objects, doors, stairs and horizons that should not exist; clear silhouette readable at thumbnail size. |
| Lighting | Soft, calm, slightly theatrical light, long gentle shadows, quiet dawn or dusk atmosphere. |
| Figures | generic, never identifiable people; small anonymous figures in simple clothing, faces minimal or turned away, used for scale and emotion. |

**Do**

- build the image around one surprising visual metaphor for the headline idea
- use impossible scale, gravity or architecture to create a dreamlike feel
- keep the palette limited and the background calm
- leave generous negative space around the central idea
- add fine grain texture so it feels printed, not glossy

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no recognisable real people, politicians or celebrities
- no photoreal rendering or 3D plastic look
- no cluttered scenes with many competing ideas
- no gore or horror imagery

**promptCore**

> Surreal conceptual editorial illustration: a single dreamlike visual metaphor with impossible scale and objects, small anonymous figures in a vast quiet space, floating or merged forms, doors and stairs leading nowhere. Smooth digitally painted shapes with fine grain texture, a limited harmonious palette, soft theatrical light with long shadows, generous negative space, calm and thought-provoking. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photorealism, 3D render, glossy plastic, real people, celebrities, clutter, busy background, gore, horror, speech bubbles

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a ladder reaching into the clouds
- a clock melting over a stack of coins
- a door standing alone in a desert

---

## 28. Data art

- **Slug:** `data-art`
- **Family:** Surreal and data
- **Summary:** Charts, flows and networks turned into art, with no numbers, labels or text
- **Good for:** markets, macro, trade, GDP and growth, inflation, banking, energy, supply chains

| Field | Rule |
|---|---|
| Medium | abstract generative data-art composition of lines, flows and particles |
| Palette | a plain ground with a few luminous line colours, taken from the references |
| Line | fine precise lines and curves, flowing bundles |
| Texture | smooth with subtle glow and particle dust |
| Composition | a single flowing structure across the frame that suggests a trend, network or exchange |
| Lighting | luminous lines on a dark ground |
| Figures | no people |

**Do**

- suggest the story's shape (rise, fall, flow, network)
- use fine luminous lines
- keep a dark ground
- make it feel like art, not a chart

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no axes, numbers, labels or legends
- no people

**promptCore**

> An abstract data-art composition of fine luminous lines, flowing bundles and particles on a plain ground, in a few glowing colours, suggesting a trend, flow or network. Elegant and artistic, with no axes, labels or numbers. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, chart axes, labels, legend, gridlines with values, people, photograph, cartoon

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a network of trade routes as flowing lines
- a stock chart turning into a mountain path
- money flowing between two shapes

---

## 29. Interface hybrid

- **Slug:** `interface-hybrid`
- **Family:** Surreal and data
- **Summary:** Cursors, windows, chat bubbles and other UI pieces mixed with illustration, with no readable text
- **Good for:** AI, tech, social media, UPI and digital payments, cybersecurity, ecommerce, telecom, startups
- **Reference artists (curation only):** Gabriel Hongsdusit

| Field | Rule |
|---|---|
| Medium | flat digital illustration that mixes generic interface pieces (cursors, browser windows, chat bubbles, toggles, sliders, loading spinners, app tiles) with drawn objects and figures |
| Palette | screen-native neutrals with one or two bold accent colours, taken from the references |
| Line | crisp vector edges and rounded-rectangle windows; the illustrated parts may use a thin even outline |
| Texture | flat with light grain or soft shadows behind windows; no glossy skeuomorphic effects |
| Composition | interface pieces used as physical objects in the scene: a cursor as a giant arrow, chat bubbles as stepping stones, windows as doors; one clear idea, layered depth |
| Lighting | flat with soft drop shadows under windows and bubbles |
| Figures | simple generic figures or hands, faceless or with minimal features; never identifiable |

**Do**

- use cursors, windows, bubbles and toggles as objects in the scene
- fill every text area with blank bars or abstract dots instead of writing
- keep one clear idea and a layered sense of depth
- use a screen-native palette with one or two bold accents
- keep every interface generic, never a real app

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no readable text, labels, code or numbers in any window or bubble
- no real app, platform or operating-system designs or icons
- no screenshots or realistic screens
- no brand colours of real companies

**promptCore**

> A flat digital editorial illustration that mixes generic interface pieces, such as cursors, browser windows, chat bubbles, toggles and loading spinners, with drawn objects and simple faceless figures, using the interface pieces as physical objects in the scene. Every window and bubble holds only blank bars or abstract dots, never writing. Crisp rounded shapes, soft drop shadows, screen neutrals with one or two bold accents. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, readable text, labels, code, numbers in windows, real app icons, operating-system designs, screenshots, realistic screens, photograph, 3D render

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a giant cursor herding a flock of chat bubbles
- a person stepping through a browser window like a doorway
- a payment toggle switch balanced on a coin

---

## 30. Contemporary miniature

- **Slug:** `contemporary-miniature`
- **Family:** Modern Indian
- **Summary:** Mughal and Rajput miniature conventions applied to modern scenes such as trading floors and ports
- **Good for:** markets, banking, infrastructure, trade and ports, data centres, business history, culture, festive economy
- **Reference artists (curation only):** Somnath Bhatt

| Field | Rule |
|---|---|
| Medium | contemporary miniature painting in opaque watercolour and gouache with gold, following Mughal and Rajput conventions |
| Palette | rich jewel tones in opaque flat colour, with metallic detail for borders, taken from the references |
| Line | fine, precise brush outlines with delicate patterning on textiles, architecture and machines |
| Texture | smooth burnished paper, opaque flat colour, fine gold detail and a decorative painted border |
| Composition | flat tilted perspective that shows ground and walls at once, several small scenes within one frame, architecture as framing, an ornamental border around the whole image |
| Lighting | no cast shadows; even, timeless light |
| Figures | small generic figures in profile or three-quarter view, in modern dress, with simplified miniature faces; never identifiable, never deities |

**Do**

- show a modern scene, such as a trading floor, port, data centre or metro, with miniature conventions
- tilt the perspective so floor and walls show at once
- frame the image with a painted decorative border
- use jewel tones and fine gold detail
- keep figures small and generic, in modern dress

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no deities, religious icons or sacred symbols as subjects
- no script, inscriptions or seals of any kind
- no portraits of real people or rulers
- no Western linear perspective, cast shadows or photoreal rendering

**promptCore**

> A contemporary miniature painting in opaque watercolour and gouache with fine metallic detail, using Mughal and Rajput conventions: flat tilted perspective, rich jewel tones, precise fine brush outlines, delicate patterning and an ornamental painted border. It shows a modern scene, such as a trading floor, a port or a data centre, with small generic figures in modern dress. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, Western perspective, cast shadows, script, inscriptions, seals, deities, religious icons, portraits, cartoon

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a busy trading floor painted like a miniature court
- container cranes at a port inside an ornamental border
- rows of server racks in a data centre with gold detail

---

## 31. Kalighat brush

- **Slug:** `kalighat`
- **Family:** Modern Indian
- **Summary:** Bold sweeping Kalighat pat brush outlines and flat colour, for wry social comment
- **Good for:** consumer, urban life, personal finance, society, culture, lifestyle, opinion, festive economy
- **Reference artists (curation only):** Kalam Patua, Anwar Chitrakar

| Field | Rule |
|---|---|
| Medium | Kalighat pat painting: watercolour and natural pigment on plain paper, with bold sweeping brush outlines |
| Palette | a few flat watercolour colours with dark brush line on plain paper, taken from the references |
| Line | bold, fluid, sweeping single-stroke brush outlines of varying thickness; curves rather than corners |
| Texture | watercolour on paper with soft tonal shading along the outlines to suggest volume; a plain unpainted background |
| Composition | one or two figures or objects large in the frame on an empty background, no setting, strong silhouettes |
| Lighting | no cast light; volume comes from soft shading along the contours |
| Figures | rounded generic figures with large eyes and sweeping limbs, in contemporary dress; wry, never caricatures of real people, never deities |

**Do**

- draw with bold sweeping single-stroke outlines
- leave the background as plain paper
- shade softly along the contours for volume
- keep to a few flat colours
- use contemporary subjects for gentle social comment

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no deities, religious icons or sacred symbols as subjects
- no caricatures of real people
- no backgrounds, scenery or crowds
- no script of any kind
- no tragic or violent subjects

**promptCore**

> A Kalighat pat painting in watercolour on plain paper, with bold, fluid, sweeping brush outlines of varying thickness and soft tonal shading along the contours, in a few flat colours. One or two rounded generic figures or objects in contemporary dress, large on an empty background, with a wry, gently satirical air. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, background scenery, crowds, script, deities, religious icons, caricature of a real person, flat vector, hard geometric lines

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a well-dressed shopper balancing a tower of delivery boxes
- a man in a suit riding a scooter shaped like a giant phone
- a woman fanning herself with a credit card

---

## 32. Gond pattern

- **Slug:** `gond`
- **Family:** Modern Indian
- **Summary:** Gond dot-and-dash pattern fills in bright colour, for climate, agriculture and nature
- **Good for:** climate, agriculture, rural economy, monsoon, water, ESG, renewable energy, forests
- **Reference artists (curation only):** Venkat Raman Singh Shyam, Bhajju Shyam

| Field | Rule |
|---|---|
| Medium | Gond painting in acrylic or ink on paper, with every shape filled by dots, dashes and fine line patterns |
| Palette | bright flat colours with fine pattern line on one plain ground, taken from the references |
| Line | clean outlines filled with repeating dots, dashes, fish-scale and seed patterns that follow the shape |
| Texture | dense hand-painted pattern inside every shape; a flat solid ground |
| Composition | one large central motif such as a tree, animal, river or field, rhythmic and decorative, with plain background around it |
| Lighting | none; flat decorative colour |
| Figures | rarely; small generic figures in the same patterned manner; never deities or sacred figures |

**Do**

- fill every shape with dots, dashes or fine line patterns
- make nature, such as trees, animals, rivers or fields, the main motif
- use bright flat colours on a plain ground
- let the patterns follow the flow of each shape
- keep one large central motif

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no deities, religious icons or sacred symbols as subjects
- no empty, unpatterned shapes
- no realistic shading or perspective
- no gradients or 3D

**promptCore**

> A Gond painting on paper in bright flat colours, where every shape is outlined cleanly and filled with repeating dots, dashes, fish-scale and seed patterns that follow its form. One large central nature motif, such as a tree, a river, an animal or a field, rhythmic and decorative on a plain ground. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, realistic shading, perspective, gradients, deities, religious icons, empty shapes, flat vector

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a huge banyan tree whose roots become a river
- a field of crops under monsoon clouds
- a tiger resting beside a wind turbine

---

## 33. Indian street maximalism

- **Slug:** `indian-street`
- **Family:** Modern Indian
- **Summary:** Dense truck-art, signage and matchbox-label colour and ornament, rendered with no lettering
- **Good for:** consumer, retail, MSMEs, logistics, cities, food and brands, festive economy, culture

| Field | Rule |
|---|---|
| Medium | Indian street visual culture: hand-painted truck art, shop-sign and matchbox-label graphics, dense and maximal |
| Palette | saturated, clashing enamel colours with dark outlines and bright highlights, taken from the references |
| Line | bold sign-painter outlines, decorative borders, scalloped frames and ornamental flourishes |
| Texture | hand-painted enamel on metal or wood with slight brush streaks, and printed matchbox-label flatness in places |
| Composition | dense and maximal: one central motif surrounded by ornamental borders, flowers, eyes, tassels and repeating patterns; symmetry; every area filled |
| Lighting | flat, with sign-painted highlights and simple shading |
| Figures | stylised generic figures or animals in the sign-painter manner; never identifiable, never film stars or deities |

**Do**

- fill the frame with ornament, borders and pattern
- use saturated clashing colours with black outlines
- centre one bold motif such as a truck, scooter, animal or object
- show hand-painted enamel texture
- leave the decorative frames where lettering usually goes empty

**Don't**

- no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing
- no brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no lettering in any script, including the usual truck-art slogans
- no film stars, politicians or other real people
- no deities, religious icons or sacred symbols
- no brand logos or real product packaging

**promptCore**

> A dense, maximal Indian street-art illustration drawn from hand-painted truck art, shop signs and matchbox labels: one bold central motif framed by ornamental borders, flowers, tassels and repeating patterns in saturated, clashing colours, with sign-painter outlines and hand-painted enamel texture. The decorative frames stay empty, with no lettering anywhere. No text, letters, numbers or logos.

**Negative:** text, letters, numbers, logos, watermarks, signatures, lettering, slogans, script, film stars, real people, deities, religious icons, brand logos, packaging, photograph, minimalism, muted palette

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a decorated goods truck loaded with parcels
- an autorickshaw framed by flowers and peacocks
- a tea kettle on an ornamental matchbox-label panel

---

## Machine-readable seed

`scripts/seed-styles.ts` reads the JSON block below and upserts families and styles by slug; styles in the database that are not in it are retired. Keep it in sync with the sections above; the seed test fails if the two disagree.

```json
{
  "families": [
    {"slug": "conceptual-flat", "label": "Conceptual flat", "sortOrder": 1},
    {"slug": "collage", "label": "Collage", "sortOrder": 2},
    {"slug": "objects-sets", "label": "Objects and sets", "sortOrder": 3},
    {"slug": "painting", "label": "Painting", "sortOrder": 4},
    {"slug": "drawing", "label": "Drawing", "sortOrder": 5},
    {"slug": "printmaking", "label": "Printmaking", "sortOrder": 6},
    {"slug": "comic-cartoon", "label": "Comic and cartoon", "sortOrder": 7},
    {"slug": "surreal-data", "label": "Surreal and data", "sortOrder": 8},
    {"slug": "modern-indian", "label": "Modern Indian", "sortOrder": 9}
  ],
  "styles": [
    {"slug": "grain-metaphor", "familySlug": "conceptual-flat", "label": "Grain metaphor", "summary": "One clever visual metaphor in flat vector shapes, two to four colours and visible grain", "goodFor": ["markets", "economy", "RBI and monetary policy", "banking", "policy", "startups", "explainers", "opinion"], "ruleSheet": {"medium": "flat vector illustration built from simple geometric and organic shapes, finished with a printed grain or noise texture", "palette": "a limited palette of two to four flat colours on one solid background colour, taken from the references; shadows are a darker grain of the same colour; never more than four", "line": "no outlines; edges are clean shape boundaries; small details are cut out of shapes as negative space", "texture": "visible grain, stipple or noise across fills and shadows, like a grainy print; the background stays a clean solid colour with light grain", "composition": "one central visual metaphor that fuses two ideas into a single object or scene, large readable shapes, generous negative space, centred or slightly off-centre", "lighting": "flat; form and shadow are suggested by grain in a darker tone of the same colour, never by soft airbrush", "figures": "simplified faceless figures built from a few shapes, small enough to serve the metaphor; never identifiable", "do": ["fuse two ideas into one object or scene, such as a coin that is also a lock", "keep to two to four colours on one solid background", "shade only with grain in a darker tone of the same colour", "make the idea readable at thumbnail size", "leave the top quarter calm for a headline"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no outlines or ink line work", "no smooth gradients, gloss or 3D lighting", "no second competing metaphor or busy background", "no identifiable faces"], "promptCore": "A conceptual editorial illustration built on one clever visual metaphor, made of flat vector shapes with no outlines in a small set of flat colours on one solid background. Visible grain and noise texture shades the forms in place of gradients. Large simple shapes, generous empty space, readable at a glance. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, outlines, smooth gradient, gloss, more than four colours, clutter, realistic faces"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 1},
    {"slug": "minimal-wit", "familySlug": "conceptual-flat", "label": "Minimal wit", "summary": "A single object with one witty twist, lots of empty space and a visual pun", "goodFor": ["opinion", "markets", "personal finance", "tech", "policy", "corporate", "columns", "explainers"], "ruleSheet": {"medium": "minimal conceptual illustration: one object in clean flat shapes or a crisp fine line with flat colour, placed on a plain ground", "palette": "one plain ground colour plus one or two accent colours, taken from the references; restrained and sparing", "line": "either no outlines or one thin even line; precise and economical, every mark necessary", "texture": "flat, clean fills; at most a faint paper grain", "composition": "a single object, or two at most, small to medium in the frame and surrounded by large empty space; the twist sits at the focal point", "lighting": "flat, with at most one small flat cast shadow to ground the object", "figures": "rarely any; when needed, one tiny faceless generic figure for scale", "do": ["show one everyday object with one surprising change, such as a tie that ends in a fuse", "leave at least half the frame empty", "keep to one ground colour and one or two accents", "make the joke land without words", "place the object slightly off-centre with room above it"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no second object competing for attention", "no background scenery or pattern", "no heavy texture, gradients or 3D", "no mockery of real people, groups or religions"], "promptCore": "A minimal conceptual editorial illustration of a single everyday object with one witty twist that turns it into a visual pun, drawn in clean flat shapes on a plain ground with one or two accent colours. Vast empty space around the object, precise economical forms, a small flat shadow at most. Calm, clever and instantly readable. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, clutter, busy background, pattern, gradients, heavy texture, many objects, faces"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 2},
    {"slug": "colour-field", "familySlug": "conceptual-flat", "label": "Colour field", "summary": "Flat complementary colour fields with no outlines, and small figures in big quiet spaces", "goodFor": ["economy", "cities", "real estate", "infrastructure", "jobs and careers", "travel", "climate", "long reads"], "ruleSheet": {"medium": "flat colour-field illustration: large planes of solid colour meeting without lines, with light and shadow drawn as shapes", "palette": "a bold contrasting pair of large flat colour fields plus at most one neutral, taken from the references", "line": "no lines at all; every edge is where one colour field meets another; shadows and windows are flat shapes", "texture": "perfectly flat or with a very faint even grain; no brush marks", "composition": "tiny figures or one small object in a vast architectural or natural space, strong geometry, high or low vantage points, long cast shadows used as design", "lighting": "strong single-direction light expressed as flat hard-edged shadow shapes in a complementary colour", "figures": "small simplified silhouettes without features, used for scale and solitude; never identifiable", "do": ["use two complementary colours as the main fields", "make figures small against large space", "draw light and shadow as hard flat shapes", "use strong architectural or landscape geometry", "keep the mood quiet and cinematic"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no outlines or ink lines anywhere", "no gradients, airbrush or texture brushes", "no close-up faces or large figures", "no busy detail; every shape must be large and clear"], "promptCore": "A flat colour-field editorial illustration with no outlines, where large planes of solid colour meet edge to edge, built on one bold contrasting colour pair. Tiny featureless figures in a vast architectural or natural space, strong geometry, and light and long shadows drawn as hard flat shapes. Quiet, cinematic and spacious. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, outlines, ink lines, gradients, brush texture, photograph, 3D render, close-up faces, clutter"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 3},
    {"slug": "mid-century", "familySlug": "conceptual-flat", "label": "Mid-century retro", "summary": "1950s and 60s palette, simple shapes and an Isotype feel, with grain", "goodFor": ["business", "economy", "trade", "consumer", "personal finance", "explainers", "Prime long reads"], "ruleSheet": {"medium": "mid-century editorial illustration with simple cut shapes, Isotype-like pictograms, stippled texture and limited overprinted colour", "palette": "four to six muted mid-century print colours on a light ground, taken from the references", "line": "angular stylised shapes with occasional thin confident outlines", "texture": "dry-brush stipple, halftone grain and slight colour overprint offsets", "composition": "asymmetric balance, strong diagonals and layered planes; rows of repeated pictogram units can stand for quantities without any numbers", "lighting": "flat with texture-based shading and simple cast shadows", "figures": "simple stylised pictogram figures with round heads and no features; never identifiable", "do": ["use angular stylised forms", "add grain and stipple texture", "stack overlapping colour planes", "repeat simple pictogram units to suggest quantity", "keep the palette warm and muted"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no modern gadgets drawn photorealistically", "no neon or saturated digital colour", "no chart axes, labels or numbers"], "promptCore": "A mid-century modern editorial illustration with a 1950s and 60s feel: simple angular shapes, Isotype-like pictograms repeated in rows, stipple and halftone grain, and a small set of muted print colours of the period. Layered flat planes, strong diagonals and simple featureless figures. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, neon, glossy, modern flat vector, photorealism, chart axes"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 4},
    {"slug": "photo-montage", "familySlug": "collage", "label": "Cut-out photo montage", "summary": "Greyscale or duotone photo cut-outs of objects and buildings on flat colour blocks with halftone", "goodFor": ["tech", "AI", "policy", "regulation", "markets", "startups", "telecom", "opinion", "explainers"], "ruleSheet": {"medium": "digital photo montage: cut-out photographs of objects, machines and buildings, printed in greyscale or duotone, combined with flat colour blocks and simple graphic shapes", "palette": "photographs in greyscale or a duotone; flat colour blocks in two or three bold colours on a plain ground, taken from the references", "line": "clean hard cut-out edges around each photo, sometimes with a thin white keyline; graphic circles, arcs, bars and arrows with no labels", "texture": "coarse halftone dots on the photographic cut-outs, light print grain, crisp flat colour blocks", "composition": "a bold layered arrangement of three to six cut-out elements over large colour blocks, strong scale contrasts, one clear hero object, generous negative space", "lighting": "inherited from the source photographs and flattened by the duotone; no added glow", "figures": "never people, faces, hands or body parts; objects, machines, buildings and places only", "do": ["cut out photographed objects cleanly and place them on flat colour blocks", "print the photos in greyscale or a duotone", "add coarse halftone texture to the photographic parts", "use simple geometric shapes to connect or frame the elements", "keep one hero object clearly larger than the rest"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people, faces, hands or body parts", "no full-bleed realistic photograph or real-looking news scene", "no screenshots, documents or anything with readable writing", "no more than three flat colours besides the photographs"], "promptCore": "A cut-out photo montage editorial illustration: cleanly cut photographs of objects, machines and buildings printed in greyscale or duotone with coarse halftone dots, layered over large flat colour blocks on a plain ground, with simple graphic circles and bars. One hero object, bold scale contrasts, generous empty space. Objects and places only, no people. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, people, faces, hands, crowd, news photo, realistic full scene, screenshot, documents, 3D render, painting, gradients"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": true}, "sortOrder": 5},
    {"slug": "mixed-media", "familySlug": "collage", "label": "Mixed-media collage", "summary": "Textured collage of paper, screen-print and photo fragments, layered by hand", "goodFor": ["economy", "markets", "geopolitics", "trade", "banking", "policy", "opinion", "long reads"], "ruleSheet": {"medium": "mixed-media collage combining painted and printed paper, screen-print layers, fragments of photographed objects and hand-drawn marks", "palette": "a few overprinted print colours with one strong accent, taken from the references", "line": "a mix of hard cut edges, rough screen-print edges, a few loose pencil or crayon marks and ruled lines", "texture": "heavy: screen-print grain, misregistered ink, paper fibres, photocopy noise and overprinted transparent layers", "composition": "a layered, slightly off-kilter arrangement that builds one idea from several fragments, overlapping transparent shapes, a clear focal fragment and some breathing room", "lighting": "flat; depth comes from overlapping layers and overprinting, not modelled light", "figures": "anonymous silhouettes or fragments of generic figures printed in one colour; faces absent or obscured; never identifiable", "do": ["layer at least three kinds of material: paper, print and photo fragments", "let transparent ink layers overprint each other", "keep one fragment as the clear focal point", "add a few hand-drawn marks for energy", "use a muted palette with one strong accent"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no clean vector-only finish", "no readable newsprint, headlines or documents in the fragments", "no recognisable real people in photo fragments", "no glossy 3D or airbrush"], "promptCore": "A textured mixed-media editorial collage of painted and printed paper, screen-print layers with misregistered ink, fragments of photographed objects and a few loose hand-drawn marks, overprinted in a small set of print colours. One idea built from layered fragments, a clear focal piece, heavy print grain and paper texture. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, clean vector, glossy, 3D render, airbrush, readable newsprint, documents, real person likeness, photorealistic scene"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 6},
    {"slug": "torn-paper", "familySlug": "collage", "label": "Torn paper", "summary": "Hand-torn paper collage with ragged white fibre edges, layered coloured papers and analogue marks", "goodFor": ["opinion", "economy", "policy", "climate", "health", "society", "investigations", "explainers"], "ruleSheet": {"medium": "physical collage of hand-torn coloured and printed papers, glued in overlapping layers, optionally with gouache, crayon or pencil marks, photographed or scanned flat", "palette": "a limited palette of four to six paper colours on a plain paper ground, taken from the references", "line": "no outlines; shapes defined by ragged torn edges with a thin white fibrous core showing where the paper ripped; occasional loose crayon or pencil scribble", "texture": "visible paper grain, deckle and fibre edges, slight paper curl and soft drop shadows between layers, printed halftone or newsprint scraps, uneven glue wrinkles", "composition": "one bold central idea built from 3-7 large torn shapes, generous negative space, layered overlaps that create depth, simple editorial metaphor readable at thumbnail size", "lighting": "flat even scan or soft top light; only tiny contact shadows where paper layers lift", "figures": "simplified silhouettes or anonymous figures torn from paper, no facial detail beyond a few torn shapes; never a recognisable real person", "do": ["show raw torn edges with white fibre on most shapes", "layer papers so overlaps are visible", "use a restrained palette of 4-6 paper colours", "mix plain coloured paper with a few printed or newsprint scraps", "keep the concept to one clear visual metaphor", "leave breathing room around the main shape"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no clean vector edges or perfectly cut geometric shapes everywhere", "no glossy 3D render or photoreal lighting", "no recognisable real people or celebrity likenesses", "no busy wallpaper-like pattern filling the whole frame", "no readable newsprint or headlines on the scraps"], "promptCore": "A hand-made collage of torn coloured paper layered on a plain paper sheet: bold shapes ripped by hand with ragged edges and a thin white fibrous core, a few scraps of printed paper and halftone, strips of tape, subtle paper grain and soft contact shadows where layers overlap, in a limited paper palette. One simple central editorial metaphor, generous negative space, a flat scanned look. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, vector art, clean digital edges, 3D render, glossy, photorealistic, gradient mesh, real person likeness, cluttered pattern, readable newsprint"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 7},
    {"slug": "archival-collage", "familySlug": "collage", "label": "Archival engraving collage", "summary": "Old etchings and museum-style engravings combined with bold flat modern colour", "goodFor": ["geopolitics", "macro", "AI and tech", "policy", "business history", "climate", "essays", "opinion"], "ruleSheet": {"medium": "collage of antique engravings and etchings (machines, plants, architecture, instruments, anonymous classical statues) combined with flat modern colour shapes", "palette": "engraved line on aged paper, with at most two flat modern accent colours, taken from the references", "line": "fine engraved cross-hatching and contour lines from the old plates, against clean hard-edged flat shapes", "texture": "aged paper tone, fine engraving line, slight foxing and print grain; the modern shapes stay flat", "composition": "a surreal juxtaposition of two or three engraved elements at unexpected scales, framed or cut through by bold flat geometric shapes; museum-like calm and lots of space", "lighting": "the engraved hatching carries the light; the modern shapes are flat", "figures": "only anonymous classical statues or generic engraved figures from old plates; never portraits of real or historical people", "do": ["pair engraved antique elements with bold flat modern shapes", "keep the engraving line fine and black", "use unexpected scale between elements", "limit modern colour to one or two accents", "leave calm aged-paper space"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no portraits of real or historical people", "no readable captions, plate numbers or map labels", "no colour wash over the whole engraving", "no religious icons or sacred symbols as subjects"], "promptCore": "An archival engraving collage: fine cross-hatched engravings of antique machines, plants, architecture and anonymous classical statues, cut from old plates and combined at surprising scales with bold flat modern shapes in one or two accent colours, on aged paper. Surreal, calm and museum-like, with generous empty space. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, cartoon, watercolour wash, portraits, real people, plate numbers, map labels, clutter"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 8},
    {"slug": "still-life", "familySlug": "objects-sets", "label": "Still life photo", "summary": "A studio photograph of real props arranged as a visual metaphor; objects only", "goodFor": ["personal finance", "commodities", "earnings", "banking", "gold and savings", "tax", "insurance", "consumer"], "ruleSheet": {"medium": "studio still-life photograph of real props arranged to form a visual metaphor", "palette": "one seamless backdrop colour with the natural colours of the objects, taken from the references", "line": "photographic, crisp edges", "texture": "real material textures: metal, paper, wood, fabric", "composition": "a small arrangement of real objects whose placement makes the point (a stack, a balance, a collision, a break), one clear hero object, minimal and considered", "lighting": "soft studio key light with a gentle shadow, controlled reflections", "figures": "never people, hands or body parts; objects only", "do": ["arrange real props so the arrangement itself is the metaphor", "make one object the hero", "use soft studio light and a seamless backdrop", "choose objects that symbolise the story", "keep surfaces free of printed labels"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people, hands or body parts", "no depiction of a real news event", "no products with visible branding or labels", "no digital effects that break the photographic look"], "promptCore": "A minimal studio still-life photograph of real props arranged so that the arrangement itself forms a visual metaphor, on a seamless plain backdrop, with one clear hero object, real material textures and soft studio light with a gentle shadow. Objects only, no people. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, people, hands, faces, news event, crowd, illustration, cartoon, brand labels, packaging with writing"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 9},
    {"slug": "cinematic-3d", "familySlug": "objects-sets", "label": "Cinematic 3D object", "summary": "Photoreal render of glass, chrome or metal objects with film lighting; objects only", "goodFor": ["AI", "tech", "semiconductors", "markets", "banking", "fintech", "energy", "earnings", "luxury"], "ruleSheet": {"medium": "photoreal 3D render of sculpted objects in glass, chrome, brushed metal, stone or liquid, with physically accurate materials", "palette": "a deep plain ground with one key colour and one contrasting rim-light colour, taken from the references", "line": "photographic edges; crisp reflections and refractions define the form", "texture": "real material response: caustics in glass, anisotropic highlights on metal, clean surfaces, shallow depth of field", "composition": "one hero object or a small group, centred or on a strong diagonal, dramatic scale, low camera angle, clean empty space around it", "lighting": "film lighting: a strong key light, a coloured rim light, volumetric haze or light beams and deep controlled shadows", "figures": "never people, hands or body parts; objects only", "do": ["render one hero object in glass, chrome or metal", "light it like a film still with a key light and a coloured rim light", "use shallow depth of field and haze for depth", "make the object itself the metaphor, such as a glass bull or a chrome chip", "keep the background dark and simple"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people, hands, faces or robots with human faces", "no screens, dashboards or interfaces with writing", "no cartoon or toy-like proportions", "no depiction of a real news event"], "promptCore": "A cinematic photoreal 3D render of one sculpted hero object in glass, chrome or brushed metal, with physically accurate reflections, refraction and caustics, lit like a film still with a strong key light, a contrasting rim light and soft volumetric haze against a deep plain background. Shallow depth of field, dramatic low angle. Objects only, no people. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, people, hands, faces, humanoid robot faces, cartoon, toy, flat illustration, screens with writing, dashboards, clutter, news event"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": true}, "sortOrder": 10},
    {"slug": "stylised-3d", "familySlug": "objects-sets", "label": "Stylised 3D", "summary": "Matte stylised 3D with soft gradients and print grain, playful and bright", "goodFor": ["startups", "consumer", "fintech", "personal finance", "apps", "ecommerce", "careers", "explainers"], "ruleSheet": {"medium": "stylised 3D illustration of simple rounded and geometric forms with matte materials and a printed grain finish", "palette": "a few bright but soft matte colours on a plain ground, taken from the references", "line": "no lines; form comes from soft gradient shading on matte surfaces", "texture": "matte clay-like or soft plastic surfaces with visible print grain or noise over the gradients; no gloss", "composition": "a playful arrangement of a few chunky objects or simple characters with exaggerated proportions, floating or stacked, with a clear silhouette on a plain ground", "lighting": "soft studio light with gentle gradient shading and soft contact shadows", "figures": "simplified rounded characters with minimal or no facial features and toy-like proportions; never identifiable", "do": ["use chunky simplified forms with exaggerated proportions", "keep materials matte with grain over the gradients", "use a bright soft palette on a plain ground", "stack or float objects to make the idea playful", "keep the silhouette clear at thumbnail size"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no photoreal materials, chrome or glass", "no glossy plastic highlights", "no detailed realistic faces", "no busy scenes with many small parts"], "promptCore": "A playful stylised 3D illustration of a few chunky rounded objects with exaggerated proportions, in matte materials shaded by soft gradients with visible print grain over them, in a few bright, soft colours on a plain ground. Soft studio light, gentle contact shadows and a clear simple silhouette. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photoreal, chrome, glass, glossy plastic, detailed faces, flat 2D vector, ink line, clutter"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 11},
    {"slug": "clay-set", "familySlug": "objects-sets", "label": "Clay set", "summary": "A photographed polymer-clay miniature scene, handmade and gently witty", "goodFor": ["personal finance", "consumer", "cities", "workplace", "food and retail", "explainers", "features"], "ruleSheet": {"medium": "photographed miniature set of polymer-clay figures and props on a small handmade tabletop set", "palette": "saturated but soft clay colours against one plain painted backdrop, taken from the references", "line": "no lines; sculpted forms with visible handmade edges", "texture": "real clay surfaces with fingerprints, tool marks and slight imperfections; tiny handmade props", "composition": "a small staged scene seen from a slightly high angle, one clear action, few props, a plain backdrop", "lighting": "soft photographic studio light with a gentle shadow and the shallow depth of field of a tabletop shot", "figures": "chunky clay figures with simple bead eyes and generic features; never caricatures of real people", "do": ["show real clay with fingerprints and tool marks", "stage one clear action in a tiny set", "use a plain painted backdrop", "light it like a tabletop photograph with shallow depth of field", "keep the humour gentle"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no caricatures or likenesses of real people", "no digital smoothness or CGI gloss", "no flags, party symbols or religious figures", "no tragic or violent subjects"], "promptCore": "A photographed polymer-clay miniature scene on a small handmade tabletop set: chunky clay figures with simple bead eyes and tiny clay props, real clay surfaces with fingerprints and tool marks, saturated soft clay colours, a plain painted backdrop, soft studio light and the shallow depth of field of a tabletop photograph. Gentle and witty. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, CGI, glossy render, flat illustration, real people, caricature, flags, cluttered set"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 12},
    {"slug": "paper-cut", "familySlug": "objects-sets", "label": "Paper cut", "summary": "Layered cut paper with soft shadows", "goodFor": ["explainers", "personal finance", "festivals", "consumer", "cities", "education", "festive economy"], "ruleSheet": {"medium": "layered cut-paper craft photographed in soft studio light", "palette": "four or five solid paper colours stacked in layers, taken from the references", "line": "clean cut edges, no drawn lines", "texture": "visible paper fibres, slight curl at edges, layered thickness", "composition": "stacked depth layers from background to foreground, centred or rule-of-thirds focal piece", "lighting": "soft top light casting gentle drop shadows between layers", "figures": "cut-paper figures with simple shapes, no facial detail beyond a few cut holes", "do": ["build depth with five or more layers", "show soft shadows between layers", "keep edges crisp", "use festive, warm colour combinations"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no drawn ink lines", "no glossy plastic look"], "promptCore": "A layered cut-paper craft illustration photographed in soft studio light, with crisp cut edges, visible paper fibres and gentle shadows between stacked layers, in a few solid paper colours. Clear depth from background to foreground. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, drawing, ink line, flat vector, plastic, glossy 3D, photograph of people"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 13},
    {"slug": "gouache", "familySlug": "painting", "label": "Gouache editorial", "summary": "Opaque matte gouache, soft edges, rich colour", "goodFor": ["Prime features", "profiles", "culture", "consumer", "travel", "agriculture", "lifestyle"], "ruleSheet": {"medium": "opaque matte gouache painting on cold-press paper", "palette": "a rich, limited set of opaque mixed colours, taken from the references", "line": "soft painted edges, no outlines, visible brush direction", "texture": "chalky matte paint with slight streaks and paper tooth at the edges", "composition": "storybook framing, layered foreground and background, one warm focal area", "lighting": "soft directional light with warm highlights and cool shadows", "figures": "painted figures with simple features and natural proportions, respectful and calm", "do": ["let brush direction follow form", "use warm light against cool shadow", "keep surfaces matte", "frame the subject with layered foreground shapes"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no hard vector edges", "no glossy or wet-look highlights"], "promptCore": "An editorial gouache painting with opaque, matte, chalky paint and soft brushed edges, in a rich but limited set of mixed colours. Directional light, layered foreground and background, visible paper tooth. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, vector, glossy, 3D render, hard outlines, neon"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 14},
    {"slug": "digital-painterly", "familySlug": "painting", "label": "Digital painterly", "summary": "Contemporary concept-art finish, cinematic", "goodFor": ["AI", "tech futures", "space", "energy", "EVs", "infrastructure", "defence"], "ruleSheet": {"medium": "digital painting with a contemporary concept-art finish and visible brush textures", "palette": "one dominant colour mood with a contrasting light colour and atmospheric neutrals, taken from the references", "line": "painterly edges, lost-and-found contours, no ink outlines", "texture": "digital brush texture, atmospheric haze, subtle grain", "composition": "cinematic framing within a square frame, strong depth, a clear focal subject against atmosphere", "lighting": "volumetric light, rim light on the focal subject, glowing accents", "figures": "figures as small silhouettes or painterly forms against vast scenes, never detailed portraits", "do": ["use atmospheric depth and haze", "rim-light the focal subject", "frame it like a film still", "keep brushwork visible"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no photorealistic rendering", "no game-UI elements or screens with writing"], "promptCore": "A cinematic digital painting with a contemporary concept-art finish, visible brush texture, atmospheric haze and volumetric light, with one dominant colour mood and a contrasting light colour. Wide framing with strong depth and a rim-lit focal subject. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, photorealistic, flat vector, cartoon, user interface, screens with writing"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 15},
    {"slug": "watercolour", "familySlug": "painting", "label": "Watercolour", "summary": "Transparent washes, paper texture, airy", "goodFor": ["travel", "places", "health", "agriculture", "monsoon", "wellbeing", "cities", "gentle stories"], "ruleSheet": {"medium": "transparent watercolour on rough cotton paper with light pencil underdrawing", "palette": "a few soft transparent washes with plenty of untouched paper, taken from the references", "line": "faint pencil underdrawing, edges defined by wet-on-wet and wet-on-dry washes", "texture": "rough cotton paper grain, granulation, blooms and hard drying edges", "composition": "airy, open composition with large untouched paper areas and a gentle focal point", "lighting": "light from the white of the paper, soft transparent shadows", "figures": "lightly painted figures with minimal features, gentle and respectful", "do": ["leave plenty of white paper", "let washes bloom and granulate", "keep it light and transparent", "suggest detail rather than render it"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no opaque heavy paint", "no harsh black outlines"], "promptCore": "A delicate transparent watercolour illustration on rough cotton paper with a faint pencil underdrawing, soft transparent washes, blooms and granulation, and large areas of untouched paper. Airy, gentle and calm. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, vector, opaque paint, neon, heavy black lines, 3D render"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 16},
    {"slug": "charcoal", "familySlug": "drawing", "label": "Charcoal", "summary": "Smudged charcoal, deep blacks, gravity", "goodFor": ["serious stories", "sombre stories", "disasters", "courts and law", "labour", "investigations"], "ruleSheet": {"medium": "compressed and willow charcoal on heavy grey-toned paper", "palette": "the tonal range of charcoal and chalk on toned paper, from deep darks to lifted highlights, taken from the references", "line": "broad expressive strokes, smudged edges, few hard lines", "texture": "heavy paper tooth, dust, finger smudges, lifted highlights", "composition": "quiet, weighty composition with large dark areas and one point of light", "lighting": "low-key lighting, deep blacks, a single soft light source", "figures": "figures only as silhouettes or turned away, never identifiable faces", "do": ["use large areas of deep black", "lift a single point of light", "keep the mood quiet and respectful", "prefer symbolic objects over people"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no colour", "no identifiable faces or graphic detail"], "promptCore": "A sombre charcoal drawing on toned paper with deep smudged darks, smoky mid-tones and a single soft point of light lifted in chalk. Quiet, weighty composition with expressive broad strokes; any figures appear only as silhouettes. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, colour, vector, cartoon, bright, cheerful, gore, faces"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 17},
    {"slug": "ink-wash", "familySlug": "drawing", "label": "Ink and wash", "summary": "Loose ink line with grey and one accent wash", "goodFor": ["markets", "analysis", "opinion", "policy", "banking", "columns", "economy"], "ruleSheet": {"medium": "black ink brush line with grey wash on off-white paper", "palette": "ink and tonal wash on paper, with at most one small accent colour, taken from the references", "line": "confident, varied weight, loose, some dry-brush strokes", "texture": "visible paper grain, wash blooms and soft pooled edges", "composition": "one strong focal element, generous negative space, off-centre placement", "lighting": "implied by wash density, no gradients or airbrush", "figures": "simplified generic figures drawn with a few strokes, no caricature, natural proportions; never identifiable", "do": ["use a single visual metaphor", "leave the top-left third calm for headlines", "let wash bleed past the line in places", "keep the accent colour to one small area"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no more than one accent colour", "no photoreal faces"], "promptCore": "An editorial illustration in loose ink brush line with soft tonal wash on textured paper, with at most one small accent colour. Confident varied strokes, visible paper grain and pooled wash edges, one strong focal element and generous empty space. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, flat vector, neon, heavy colour, digital gradient"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 18},
    {"slug": "naive-crayon", "familySlug": "drawing", "label": "Naive crayon", "summary": "A wobbly crayon or pencil line, childlike and warm, with scribbled colour", "goodFor": ["personal finance", "education", "careers", "wellbeing", "family money", "consumer", "opinion", "explainers"], "ruleSheet": {"medium": "naive drawing in wax crayon, oil pastel and coloured pencil on plain paper", "palette": "a few bright crayon colours used loosely on plain paper, taken from the references", "line": "a wobbly, uneven, hand-held line with breaks and overlaps, varying pressure and intentionally naive proportions", "texture": "waxy crayon strokes with paper tooth showing through, uneven scribbled colouring that goes over the lines", "composition": "simple and frank: one scene or object, flattened perspective, objects floating or lined up, lots of white paper", "lighting": "none; no shading beyond scribbled darker patches", "figures": "simple naive figures with round heads, stick or tube limbs and dot eyes; generic and warm; never identifiable", "do": ["keep the line wobbly and imperfect", "let colour scribble over the lines", "flatten perspective like a child's drawing", "leave plenty of white paper", "keep the idea simple and human"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no clean vector lines or perfect shapes", "no realistic shading or perspective", "no handwriting or scribbled words", "no mockery of children or of real people"], "promptCore": "A naive drawing in wax crayon and coloured pencil on plain paper, with a wobbly, uneven hand-held line, scribbled colour that goes over the lines and paper tooth showing through the waxy strokes, in a few bright crayon colours. Flattened childlike perspective, simple warm figures with dot eyes, lots of bare paper. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, clean vector, perfect shapes, realistic shading, photograph, 3D render, handwriting, scribbled words"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 19},
    {"slug": "linocut", "familySlug": "printmaking", "label": "Linocut", "summary": "Carved relief print, bold black with one colour", "goodFor": ["agriculture", "labour", "rural economy", "manufacturing", "MSMEs", "cooperatives", "monsoon"], "ruleSheet": {"medium": "linocut relief print with carved gouge marks, printed in black plus one colour", "palette": "one dark key ink plus at most one more colour on natural paper, taken from the references", "line": "bold carved shapes, gouge-mark hatching, chunky confident contours", "texture": "uneven ink coverage, paper showing through, slight print registration shift", "composition": "strong, graphic, poster-like composition with clear silhouettes", "lighting": "no modelling; light expressed by carved white lines", "figures": "sturdy, dignified generic working figures with simplified carved features; never identifiable", "do": ["use carved gouge marks for tone", "limit to black plus one colour", "keep silhouettes bold", "let paper texture show through ink"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no gradients", "no fine photographic detail"], "promptCore": "A linocut relief print with bold carved shapes and gouge-mark hatching, printed in a dark key ink and at most one more colour on natural paper, with uneven ink coverage and slight registration shift. Strong graphic composition with sturdy, dignified figures. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, gradient, digital painting, 3D render, smooth shading, many colours"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 20},
    {"slug": "riso-screen", "familySlug": "printmaking", "label": "Riso and screen print", "summary": "Two to four spot colours with misregistration, overprint and grain", "goodFor": ["startups", "culture", "consumer", "cities", "media", "careers", "events", "explainers"], "ruleSheet": {"medium": "risograph or screen print in two to four flat spot inks, printed in separate layers", "palette": "two to four spot inks on uncoated paper, where overlaps make new mixed colours, taken from the references", "line": "bold shapes and simple lines; layers drift slightly out of register so edges show thin gaps and overlaps", "texture": "riso grain and speckle, uneven ink density, halftone gradients and visible overprint where inks cross", "composition": "graphic and bold: flat layered shapes, overlaps used on purpose to make a third colour, one clear focal shape", "lighting": "flat; tone comes from halftone dots and overprinting", "figures": "simplified graphic figures with minimal features; never identifiable", "do": ["use two to four spot colours only", "let the layers misregister slightly", "overprint inks to create a third colour", "shade with halftone dots and grain", "keep shapes bold and flat"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no full-colour photographic rendering", "no smooth digital gradients", "no more than four inks", "no clean, perfectly registered vector finish"], "promptCore": "A risograph and screen print illustration in two to four spot inks on uncoated paper, with slight misregistration between layers, visible overprint where inks cross to make new colours, halftone gradients and riso grain. Bold flat shapes and one clear focal form. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, full colour, smooth gradient, 3D render, glossy, perfectly registered vector"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 21},
    {"slug": "etching", "familySlug": "printmaking", "label": "Etching and engraving", "summary": "Banknote-style intaglio engraving with fine cross-hatching and guilloche ornament", "goodFor": ["RBI and monetary policy", "rupee and currency", "banking", "gold", "markets", "budget", "tax", "business history"], "ruleSheet": {"medium": "intaglio engraving and etching like banknote and stamp printing: fine engraved lines, cross-hatching and guilloche rosettes", "palette": "one or two inks on security paper, taken from the references", "line": "very fine, precise engraved lines that swell and taper; parallel and cross-hatched tone; ornamental guilloche curves", "texture": "crisp intaglio line with a slightly raised-ink feel, fine line moire and paper tone", "composition": "a central emblematic object framed by guilloche rosettes, borders or wreaths with no lettering; symmetrical and formal", "lighting": "classical engraved modelling: light from the upper left expressed purely through line density", "figures": "engraved allegorical figures only, generic and idealised; never portraits of real people, leaders or historical figures", "do": ["model every form with fine parallel and cross-hatched lines", "frame the subject with guilloche rosettes or ornamental borders", "use one or two inks only", "keep the composition formal and symmetrical", "make the object emblematic, like a vignette on a banknote"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no numerals, denominations, serial numbers or lettering of any kind", "no copy of a real banknote, coin or stamp design", "no national emblems, official seals or portraits of leaders", "no flat fills or colour gradients"], "promptCore": "A banknote-style intaglio engraving with very fine, precise lines that swell and taper, dense cross-hatching and ornamental guilloche rosettes and borders, printed in one or two inks on security paper. A formal, symmetrical emblematic vignette of one central object, modelled entirely through line density. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, flat colour, gradients, photograph, 3D render, numerals, denominations, serial numbers, real banknote, national emblem, portraits, cartoon"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 22},
    {"slug": "clean-line-comic", "familySlug": "comic-cartoon", "label": "Clean-line comic", "summary": "Ligne claire comic illustration: even black outlines, flat unshaded colour, no hatching, precise settings and simple figures", "goodFor": ["cities and infrastructure", "travel and tourism", "workplace", "explainers", "real estate", "transport and mobility", "consumer", "tech"], "ruleSheet": {"medium": "ligne claire comic illustration: uniform-weight ink outlines with flat gouache or digital colour fills", "palette": "a limited set of flat retro fills with dark uniform outlines, taken from the references", "line": "one even-weight black outline around every shape, no tapering, no hatching or cross-hatching, tidy closed contours", "texture": "none, or a very faint paper or risograph grain; colour fills are flat and uniform", "composition": "clear, orderly staging; accurately drawn architecture, vehicles and objects combined with simplified cartoon figures; frontal, profile or isometric views; balanced uncluttered layout", "lighting": "no modelled shading; any shadows are single flat tone shapes", "figures": "generic, never identifiable people: simplified cartoon figures with dot eyes, neat clothes and stylised hair", "do": ["outline every shape with the same line weight", "fill with flat unshaded colour", "draw backgrounds with precise, realistic detail", "keep figures simple and cartoon-like against detailed settings", "use a restrained retro palette", "keep the composition legible and calm"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no hatching, cross-hatching or textured shading", "no gradients, airbrush or painterly effects", "no speech bubbles or captions", "no existing comic characters or recognisable franchise designs", "no likeness of real people"], "promptCore": "Ligne claire comic illustration with uniform-weight outlines around every shape and flat, unshaded colour fills in a limited retro palette. No hatching, no gradients. Precisely drawn architecture and objects combined with simple generic cartoon figures, orderly frontal or isometric staging, calm and highly legible. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, speech bubbles, hatching, cross-hatching, gradients, airbrush, painterly texture, sketchy line, variable line weight, photorealistic, 3D render, real person likeness, existing comic characters"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 23},
    {"slug": "bold-comic", "familySlug": "comic-cartoon", "label": "Bold comic", "summary": "Thick gig-poster lines, punchy flat colour and loud graphic energy", "goodFor": ["startups", "sport business", "consumer brands", "media and entertainment", "gaming", "tech", "markets"], "ruleSheet": {"medium": "bold comic and gig-poster illustration with thick brush or marker outlines and punchy flat colour", "palette": "three or four loud flat colours with heavy dark outlines, taken from the references", "line": "very thick, confident black outlines with chunky rounded ends, simple interior lines and heavy spot blacks", "texture": "flat fills with optional coarse halftone dots or screen-print grain", "composition": "big, close and dynamic: one oversized subject filling much of the frame, strong diagonals, exaggerated perspective, impact shapes with no lettering", "lighting": "flat; drama comes from spot blacks and hard shadow shapes", "figures": "exaggerated generic cartoon figures with simple features; never caricatures of real people", "do": ["use very thick black outlines", "fill with three or four punchy flat colours", "push scale and perspective for impact", "add spot blacks and hard shadow shapes", "keep shapes chunky and readable at thumbnail size"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no sound effects, speech bubbles or lettering", "no caricatures of real people", "no existing comic characters or franchise designs", "no thin delicate lines or soft shading"], "promptCore": "A bold comic and gig-poster illustration with very thick, confident outlines, chunky rounded shapes and heavy spot blacks, filled with three or four punchy flat colours, with coarse halftone dots. One oversized subject, dynamic diagonals and exaggerated perspective, loud and energetic. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, speech bubbles, sound effects, lettering, thin lines, soft shading, gradients, photograph, 3D render, caricature, existing characters"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 24},
    {"slug": "loose-cartoon", "familySlug": "comic-cartoon", "label": "Loose cartoon line", "summary": "A loose, wry cartoon line with sparse colour, observational and human", "goodFor": ["careers", "workplace", "personal finance", "wellbeing", "opinion", "tech habits", "consumer", "lifestyle"], "ruleSheet": {"medium": "loose cartoon drawing in pen or brush pen with sparse flat colour or a single wash", "palette": "mostly pen line on plain paper with one to three soft flat colours, taken from the references", "line": "a loose, quick, slightly scratchy line of fairly even weight, with unfinished contours and economical gestures", "texture": "plain paper; colour laid in flat patches that do not fill the shapes exactly", "composition": "an observational moment with one or two figures and a few props, lots of white space, relaxed and wry", "lighting": "none; no shading beyond a few strokes", "figures": "simple, slightly awkward generic figures with dot eyes and expressive posture; never identifiable", "do": ["keep the line loose and quick", "use expressive body language for the joke", "colour sparingly in flat patches that slip off the line", "leave lots of white paper", "find the human moment in the story"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no captions, speech bubbles or handwritten words", "no polished vector finish", "no caricatures of real people", "no heavy rendering or texture"], "promptCore": "A loose, wry cartoon drawn with a quick, slightly scratchy pen line on plain paper, with sparse flat patches of soft colour that slip off the line. One or two simple generic figures with dot eyes and expressive posture in an everyday observed moment, lots of empty space, relaxed and human. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, speech bubbles, handwriting, polished vector, heavy shading, 3D render, photograph, caricature"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 25},
    {"slug": "editorial-cartoon", "familySlug": "comic-cartoon", "label": "Editorial cartoon", "summary": "Newspaper-cartoon pen line and watercolour wash, built from symbols, objects and generic figures, never caricature", "goodFor": ["economy and markets", "inflation and prices", "budget and tax", "policy debates", "corporate governance", "tech disruption", "jobs", "opinion"], "ruleSheet": {"medium": "dip-pen or brush ink line drawing finished with loose watercolour and grey ink wash on off-white cartoon paper", "palette": "ink line and wash on paper, with a few colours applied sparingly as transparent washes, taken from the references", "line": "confident variable-weight nib line with pressure swells, cross-hatching in shadows, slightly wobbly hand-drawn contours", "texture": "watercolour blooms, granulation and dry-brush edges; wash slips loosely past the ink lines; visible paper grain", "composition": "single-panel gag built on one clear visual metaphor; exaggerated scale contrasts (giant coin, tiny figure); minimal setting with a simple ground line; generous white space", "lighting": "flat; form implied by wash shading and hatching only, no realistic light sources", "figures": "generic, never identifiable people: everyman workers, investors, shoppers and officials with big noses, oversized shoes and simplified faces; anthropomorphic objects such as piggy banks, charts, coins and buildings", "do": ["build the image around one strong visual metaphor made of everyday objects", "exaggerate proportions and scale for comic effect", "let wash colour sit loosely inside and outside the ink lines", "keep the background minimal so the gag reads instantly", "use hatching and grey wash for shadow and depth", "give generic figures expressive body language"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no caricatures or likenesses of real politicians, celebrities or public figures", "no speech bubbles, captions or labels on objects", "no photoreal rendering, 3D shading or smooth digital gradients", "no party symbols or flags used to mock groups", "no gore or graphic violence"], "promptCore": "Single-panel editorial cartoon drawn with a dip pen in confident ink lines and cross-hatching, finished with loose transparent watercolour and ink wash on paper. One clear visual metaphor built from everyday objects and generic everyman figures with exaggerated proportions, minimal background, generous empty space, hand-drawn wobble, wash blooms and paper grain. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, speech bubbles, labels, caricature of a real person, celebrity likeness, photorealistic, 3D render, smooth gradients, flat vector, glossy, cluttered background, gore"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 26},
    {"slug": "surreal-concept", "familySlug": "surreal-data", "label": "Surreal concept", "summary": "Dreamlike conceptual editorial scenes where impossible scale, objects and spaces turn an idea into one clear visual metaphor", "goodFor": ["opinion", "big-idea features", "economy", "technology", "AI", "climate", "future of work", "uncertainty", "ambition and risk"], "ruleSheet": {"medium": "Digitally painted illustration with a hand-made feel, soft grain and subtle brush or risograph-like texture over smooth shapes.", "palette": "limited and harmonious, taken from the references", "line": "Few or no outlines; forms defined by clean shape edges and soft tonal shading, occasional fine contour lines.", "texture": "Fine grain and speckle noise across flat areas, light paper texture, no glossy rendering.", "composition": "One strong central metaphor with plenty of negative space; impossible scale shifts (tiny figure, giant object), floating or merged objects, doors, stairs and horizons that should not exist; clear silhouette readable at thumbnail size.", "lighting": "Soft, calm, slightly theatrical light, long gentle shadows, quiet dawn or dusk atmosphere.", "figures": "generic, never identifiable people; small anonymous figures in simple clothing, faces minimal or turned away, used for scale and emotion.", "do": ["build the image around one surprising visual metaphor for the headline idea", "use impossible scale, gravity or architecture to create a dreamlike feel", "keep the palette limited and the background calm", "leave generous negative space around the central idea", "add fine grain texture so it feels printed, not glossy"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no recognisable real people, politicians or celebrities", "no photoreal rendering or 3D plastic look", "no cluttered scenes with many competing ideas", "no gore or horror imagery"], "promptCore": "Surreal conceptual editorial illustration: a single dreamlike visual metaphor with impossible scale and objects, small anonymous figures in a vast quiet space, floating or merged forms, doors and stairs leading nowhere. Smooth digitally painted shapes with fine grain texture, a limited harmonious palette, soft theatrical light with long shadows, generous negative space, calm and thought-provoking. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photorealism, 3D render, glossy plastic, real people, celebrities, clutter, busy background, gore, horror, speech bubbles"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 27},
    {"slug": "data-art", "familySlug": "surreal-data", "label": "Data art", "summary": "Charts, flows and networks turned into art, with no numbers, labels or text", "goodFor": ["markets", "macro", "trade", "GDP and growth", "inflation", "banking", "energy", "supply chains"], "ruleSheet": {"medium": "abstract generative data-art composition of lines, flows and particles", "palette": "a plain ground with a few luminous line colours, taken from the references", "line": "fine precise lines and curves, flowing bundles", "texture": "smooth with subtle glow and particle dust", "composition": "a single flowing structure across the frame that suggests a trend, network or exchange", "lighting": "luminous lines on a dark ground", "figures": "no people", "do": ["suggest the story's shape (rise, fall, flow, network)", "use fine luminous lines", "keep a dark ground", "make it feel like art, not a chart"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no axes, numbers, labels or legends", "no people"], "promptCore": "An abstract data-art composition of fine luminous lines, flowing bundles and particles on a plain ground, in a few glowing colours, suggesting a trend, flow or network. Elegant and artistic, with no axes, labels or numbers. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, chart axes, labels, legend, gridlines with values, people, photograph, cartoon"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 28},
    {"slug": "interface-hybrid", "familySlug": "surreal-data", "label": "Interface hybrid", "summary": "Cursors, windows, chat bubbles and other UI pieces mixed with illustration, with no readable text", "goodFor": ["AI", "tech", "social media", "UPI and digital payments", "cybersecurity", "ecommerce", "telecom", "startups"], "ruleSheet": {"medium": "flat digital illustration that mixes generic interface pieces (cursors, browser windows, chat bubbles, toggles, sliders, loading spinners, app tiles) with drawn objects and figures", "palette": "screen-native neutrals with one or two bold accent colours, taken from the references", "line": "crisp vector edges and rounded-rectangle windows; the illustrated parts may use a thin even outline", "texture": "flat with light grain or soft shadows behind windows; no glossy skeuomorphic effects", "composition": "interface pieces used as physical objects in the scene: a cursor as a giant arrow, chat bubbles as stepping stones, windows as doors; one clear idea, layered depth", "lighting": "flat with soft drop shadows under windows and bubbles", "figures": "simple generic figures or hands, faceless or with minimal features; never identifiable", "do": ["use cursors, windows, bubbles and toggles as objects in the scene", "fill every text area with blank bars or abstract dots instead of writing", "keep one clear idea and a layered sense of depth", "use a screen-native palette with one or two bold accents", "keep every interface generic, never a real app"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no readable text, labels, code or numbers in any window or bubble", "no real app, platform or operating-system designs or icons", "no screenshots or realistic screens", "no brand colours of real companies"], "promptCore": "A flat digital editorial illustration that mixes generic interface pieces, such as cursors, browser windows, chat bubbles, toggles and loading spinners, with drawn objects and simple faceless figures, using the interface pieces as physical objects in the scene. Every window and bubble holds only blank bars or abstract dots, never writing. Crisp rounded shapes, soft drop shadows, screen neutrals with one or two bold accents. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, readable text, labels, code, numbers in windows, real app icons, operating-system designs, screenshots, realistic screens, photograph, 3D render"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 29},
    {"slug": "contemporary-miniature", "familySlug": "modern-indian", "label": "Contemporary miniature", "summary": "Mughal and Rajput miniature conventions applied to modern scenes such as trading floors and ports", "goodFor": ["markets", "banking", "infrastructure", "trade and ports", "data centres", "business history", "culture", "festive economy"], "ruleSheet": {"medium": "contemporary miniature painting in opaque watercolour and gouache with gold, following Mughal and Rajput conventions", "palette": "rich jewel tones in opaque flat colour, with metallic detail for borders, taken from the references", "line": "fine, precise brush outlines with delicate patterning on textiles, architecture and machines", "texture": "smooth burnished paper, opaque flat colour, fine gold detail and a decorative painted border", "composition": "flat tilted perspective that shows ground and walls at once, several small scenes within one frame, architecture as framing, an ornamental border around the whole image", "lighting": "no cast shadows; even, timeless light", "figures": "small generic figures in profile or three-quarter view, in modern dress, with simplified miniature faces; never identifiable, never deities", "do": ["show a modern scene, such as a trading floor, port, data centre or metro, with miniature conventions", "tilt the perspective so floor and walls show at once", "frame the image with a painted decorative border", "use jewel tones and fine gold detail", "keep figures small and generic, in modern dress"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no deities, religious icons or sacred symbols as subjects", "no script, inscriptions or seals of any kind", "no portraits of real people or rulers", "no Western linear perspective, cast shadows or photoreal rendering"], "promptCore": "A contemporary miniature painting in opaque watercolour and gouache with fine metallic detail, using Mughal and Rajput conventions: flat tilted perspective, rich jewel tones, precise fine brush outlines, delicate patterning and an ornamental painted border. It shows a modern scene, such as a trading floor, a port or a data centre, with small generic figures in modern dress. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, Western perspective, cast shadows, script, inscriptions, seals, deities, religious icons, portraits, cartoon"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 30},
    {"slug": "kalighat", "familySlug": "modern-indian", "label": "Kalighat brush", "summary": "Bold sweeping Kalighat pat brush outlines and flat colour, for wry social comment", "goodFor": ["consumer", "urban life", "personal finance", "society", "culture", "lifestyle", "opinion", "festive economy"], "ruleSheet": {"medium": "Kalighat pat painting: watercolour and natural pigment on plain paper, with bold sweeping brush outlines", "palette": "a few flat watercolour colours with dark brush line on plain paper, taken from the references", "line": "bold, fluid, sweeping single-stroke brush outlines of varying thickness; curves rather than corners", "texture": "watercolour on paper with soft tonal shading along the outlines to suggest volume; a plain unpainted background", "composition": "one or two figures or objects large in the frame on an empty background, no setting, strong silhouettes", "lighting": "no cast light; volume comes from soft shading along the contours", "figures": "rounded generic figures with large eyes and sweeping limbs, in contemporary dress; wry, never caricatures of real people, never deities", "do": ["draw with bold sweeping single-stroke outlines", "leave the background as plain paper", "shade softly along the contours for volume", "keep to a few flat colours", "use contemporary subjects for gentle social comment"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no deities, religious icons or sacred symbols as subjects", "no caricatures of real people", "no backgrounds, scenery or crowds", "no script of any kind", "no tragic or violent subjects"], "promptCore": "A Kalighat pat painting in watercolour on plain paper, with bold, fluid, sweeping brush outlines of varying thickness and soft tonal shading along the contours, in a few flat colours. One or two rounded generic figures or objects in contemporary dress, large on an empty background, with a wry, gently satirical air. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, background scenery, crowds, script, deities, religious icons, caricature of a real person, flat vector, hard geometric lines"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 31},
    {"slug": "gond", "familySlug": "modern-indian", "label": "Gond pattern", "summary": "Gond dot-and-dash pattern fills in bright colour, for climate, agriculture and nature", "goodFor": ["climate", "agriculture", "rural economy", "monsoon", "water", "ESG", "renewable energy", "forests"], "ruleSheet": {"medium": "Gond painting in acrylic or ink on paper, with every shape filled by dots, dashes and fine line patterns", "palette": "bright flat colours with fine pattern line on one plain ground, taken from the references", "line": "clean outlines filled with repeating dots, dashes, fish-scale and seed patterns that follow the shape", "texture": "dense hand-painted pattern inside every shape; a flat solid ground", "composition": "one large central motif such as a tree, animal, river or field, rhythmic and decorative, with plain background around it", "lighting": "none; flat decorative colour", "figures": "rarely; small generic figures in the same patterned manner; never deities or sacred figures", "do": ["fill every shape with dots, dashes or fine line patterns", "make nature, such as trees, animals, rivers or fields, the main motif", "use bright flat colours on a plain ground", "let the patterns follow the flow of each shape", "keep one large central motif"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no deities, religious icons or sacred symbols as subjects", "no empty, unpatterned shapes", "no realistic shading or perspective", "no gradients or 3D"], "promptCore": "A Gond painting on paper in bright flat colours, where every shape is outlined cleanly and filled with repeating dots, dashes, fish-scale and seed patterns that follow its form. One large central nature motif, such as a tree, a river, an animal or a field, rhythmic and decorative on a plain ground. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, photograph, 3D render, realistic shading, perspective, gradients, deities, religious icons, empty shapes, flat vector"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 32},
    {"slug": "indian-street", "familySlug": "modern-indian", "label": "Indian street maximalism", "summary": "Dense truck-art, signage and matchbox-label colour and ornament, rendered with no lettering", "goodFor": ["consumer", "retail", "MSMEs", "logistics", "cities", "food and brands", "festive economy", "culture"], "ruleSheet": {"medium": "Indian street visual culture: hand-painted truck art, shop-sign and matchbox-label graphics, dense and maximal", "palette": "saturated, clashing enamel colours with dark outlines and bright highlights, taken from the references", "line": "bold sign-painter outlines, decorative borders, scalloped frames and ornamental flourishes", "texture": "hand-painted enamel on metal or wood with slight brush streaks, and printed matchbox-label flatness in places", "composition": "dense and maximal: one central motif surrounded by ornamental borders, flowers, eyes, tassels and repeating patterns; symmetry; every area filled", "lighting": "flat, with sign-painted highlights and simple shading", "figures": "stylised generic figures or animals in the sign-painter manner; never identifiable, never film stars or deities", "do": ["fill the frame with ornament, borders and pattern", "use saturated clashing colours with black outlines", "centre one bold motif such as a truck, scooter, animal or object", "show hand-painted enamel texture", "leave the decorative frames where lettering usually goes empty"], "dont": ["no text, letters, numbers or logos anywhere in the image, and nothing that reads as writing", "no brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no lettering in any script, including the usual truck-art slogans", "no film stars, politicians or other real people", "no deities, religious icons or sacred symbols", "no brand logos or real product packaging"], "promptCore": "A dense, maximal Indian street-art illustration drawn from hand-painted truck art, shop signs and matchbox labels: one bold central motif framed by ornamental borders, flowers, tassels and repeating patterns in saturated, clashing colours, with sign-painter outlines and hand-painted enamel texture. The decorative frames stay empty, with no lettering anywhere. No text, letters, numbers or logos.", "negative": "text, letters, numbers, logos, watermarks, signatures, lettering, slogans, script, film stars, real people, deities, religious icons, brand logos, packaging, photograph, minimalism, muted palette"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 33}
  ]
}
```
