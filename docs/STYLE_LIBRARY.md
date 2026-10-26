# ET house style library

**Service:** editorial-art  
**Version:** 2.0, 27 October 2026  
**Status:** final rule sheets for the artist library. A style goes live when the library import gives it 15 approved references.

## Purpose

This file defines the 48 ET house styles, in 12 families, that the editorial-art service uses to illustrate articles. Each style is specified tightly enough that two images made in the same style look like they belong to one publication.

## How the styles are used

- **promptCore** is inserted, word for word, at the start of every image prompt for that style (previews and finals).
- **negative** is appended as a list of things the image must avoid.
- **Do** and **Don't** guide the screening of references and are summarised into the judge's rubric.
- **Safety flags** (allowsPeople, allowsRealPeople, allowsSensitive, photoreal) are enforced in code by the pipeline, not only in prompts. A style that does not allow sensitive stories is never offered for one; a style that does not allow real people never receives likeness photos; a photoreal style never shows people, whatever its family.
- **References come from working artists.** Each style learns from about 20 published images by three or four artists, stored with the artist's name and the page each image came from so editors can see whose work it is. Every option in a batch learns from a different artist.
- **No artist names ever appear** in this file or in any prompt. Styles describe a medium and a look, never a person, and a prompt never asks for an imitation of anyone.
- A style becomes **LIVE** (visible to editors) only when it has **at least 15 approved references**. Until then it is not offered.
- Every style has the same three base don'ts: no text, letters or numbers; no logos, watermarks or signatures; no imitation of any named artist.

## Families

### 1. Flat and vector (`flat-vector`, 4 styles)

Clean shapes built for ideas. Flat colour, mid-century grain, a single confident line and bold vector graphics turn an abstract story (a policy shift, a market mood, a supply chain) into one clear visual metaphor. They read instantly at thumbnail size and can never be mistaken for a photograph, which makes them the safest default for most desks.

### 2. Painting (`painting`, 4 styles)

Hand-painted looks with visible medium: transparent watercolour, opaque gouache, thick oil and a contemporary digital painterly finish. They carry warmth and weight, so they suit features, profiles, long reads and big-picture essays where the image should feel considered rather than quick.

### 3. Drawing and sketch (`drawing-sketch`, 4 styles)

Graphite, charcoal, ink and stipple: the reportage and portrait traditions of the newspaper page. These styles feel human and documentary. Pencil and charcoal suit serious and sombre stories, ink wash suits analysis and opinion, and the stippled hedcut suits business profiles without ever being a likeness.

### 4. Print and poster (`print-poster`, 4 styles)

Printmaking and poster traditions: carved linocut, grainy two-colour risograph, flat layered screen print and the bold simplified vintage travel and propaganda-era poster. They bring craft and energy, from labour and the rural economy to startups, culture and big national projects.

### 5. Collage and mixed media (`collage-mixed`, 4 styles)

Images assembled from fragments: cut and torn paper, cut-out photographic objects and the double-exposure silhouette. Collage handles stories with many angles at once. Photo collage and double exposure are photographic treatments and follow the photoreal rules: objects, places and anonymous silhouettes only.

### 6. Handmade craft (`handmade-craft`, 4 styles)

Physical, tactile worlds: layered cut paper, clay figures on a tiny set, stitched felt and folded paper. They are friendly and warm, ideal for explainers, personal finance, festivals and city stories. Clay is satire-prone and is never used once a story carries any sensitivity.

### 7. 3D render (`render-3d`, 4 styles)

Rendered objects and miniature worlds: soft matte 3D, tidy isometric scenes, faceted low-poly forms and tilt-shift dioramas. They suit products, apps, infrastructure and logistics, and explain systems without a single label.

### 8. Photo and realism (`photo-realism`, 4 styles)

Photographic treatments with strict limits. They show objects, places and abstract scenes only, never people and never a specific news event as if it were photographed. These rules are enforced in code and by the final judge, because a convincing fake news photo is the single biggest reputational risk this service carries.

### 9. Cartoon and comic (`cartoon-comic`, 4 styles)

Drawn humour and sequential-art looks: the editorial cartoon, halftone comic panels, clean-line comics and hand-drawn sketchnotes. They make a point quickly and lightly. The editorial cartoon is satire-prone and is never used once a story carries any sensitivity; none of these styles caricature a real person.

### 10. Pop and bold graphic (`pop-graphic`, 4 styles)

Loud, design-led images: pop art dots and outlines, the Swiss grid, Bauhaus primary geometry and neon synthwave glow. They turn brands, markets and technology into bold form, and the geometric styles carry numbers and policy without a single digit on screen.

### 11. Indian art (`indian-art`, 4 styles)

Indian visual traditions: the hand-painted Bollywood film poster, Madhubani line painting, Warli stick-figure murals and the court miniature. They bring warmth and recognition to consumer, culture, rural and heritage stories. Folk and court traditions are drawn as looks only: no deities or sacred symbols as subjects. The Bollywood poster is satire-prone and is never used once a story carries any sensitivity.

### 12. Abstract and surreal (`abstract-surreal`, 4 styles)

Images of ideas rather than things: surreal visual metaphors, pure abstract shapes, data turned into art and glitched digital texture. They suit macro, markets, technology and opinion, where the story is a concept, and they carry no risk of looking like a real event.

## Styles at a glance

| # | Family | Style | Slug | People | Real people | Sensitive | Photoreal |
|---|---|---|---|---|---|---|---|
| 1 | Flat and vector | Editorial flat | `editorial-flat` | yes | no | yes | no |
| 2 | Flat and vector | Mid-century modern | `mid-century` | yes | yes | no | no |
| 3 | Flat and vector | Minimal line | `minimal-line` | yes | no | yes | no |
| 4 | Flat and vector | Bold vector | `bold-vector` | yes | no | no | no |
| 5 | Painting | Watercolour | `watercolour` | yes | yes | yes | no |
| 6 | Painting | Gouache editorial | `gouache` | yes | yes | no | no |
| 7 | Painting | Oil impasto | `oil-impasto` | yes | yes | no | no |
| 8 | Painting | Digital painterly | `digital-painterly` | yes | yes | no | no |
| 9 | Drawing and sketch | Pencil sketch | `pencil-sketch` | yes | yes | yes | no |
| 10 | Drawing and sketch | Charcoal | `charcoal` | yes | no | yes | no |
| 11 | Drawing and sketch | Ink and wash | `ink-wash` | yes | yes | yes | no |
| 12 | Drawing and sketch | Stipple hedcut | `stipple-hedcut` | yes | no | yes | no |
| 13 | Print and poster | Linocut | `linocut` | yes | yes | yes | no |
| 14 | Print and poster | Risograph | `risograph` | yes | yes | no | no |
| 15 | Print and poster | Screen print | `screen-print` | yes | no | yes | no |
| 16 | Print and poster | Vintage poster | `vintage-poster` | yes | no | yes | no |
| 17 | Collage and mixed media | Paper collage | `collage` | yes | yes | no | no |
| 18 | Collage and mixed media | Photo collage | `photo-collage` | no | no | no | yes |
| 19 | Collage and mixed media | Torn paper | `torn-paper` | yes | no | yes | no |
| 20 | Collage and mixed media | Double exposure | `double-exposure` | yes | no | yes | yes |
| 21 | Handmade craft | Paper cut | `paper-cut` | yes | yes | no | no |
| 22 | Handmade craft | Clay | `clay-puppet` | yes | no | no | no |
| 23 | Handmade craft | Felt and textile | `felt-textile` | yes | no | no | no |
| 24 | Handmade craft | Origami | `origami` | yes | no | yes | no |
| 25 | 3D render | Soft 3D | `soft-3d` | yes | no | yes | no |
| 26 | 3D render | Isometric 3D | `isometric` | yes | no | yes | no |
| 27 | 3D render | Low poly | `low-poly` | yes | no | yes | no |
| 28 | 3D render | Miniature diorama | `diorama` | yes | no | yes | no |
| 29 | Photo and realism | Object still life | `still-life` | no | no | yes | yes |
| 30 | Photo and realism | Conceptual photo | `conceptual-photo` | no | no | yes | yes |
| 31 | Photo and realism | Duotone | `duotone` | no | no | yes | yes |
| 32 | Photo and realism | Cinematic scene | `cinematic-scene` | no | no | yes | yes |
| 33 | Cartoon and comic | Editorial cartoon | `editorial-cartoon` | yes | no | no | no |
| 34 | Cartoon and comic | Comic halftone | `comic-halftone` | yes | no | no | no |
| 35 | Cartoon and comic | Clean-line comic | `clean-line-comic` | yes | no | yes | no |
| 36 | Cartoon and comic | Doodle & sketchnote | `doodle-sketchnote` | yes | no | no | no |
| 37 | Pop and bold graphic | Pop art | `pop-art` | yes | no | no | no |
| 38 | Pop and bold graphic | Swiss geometric | `swiss-geometric` | no | no | yes | no |
| 39 | Pop and bold graphic | Bauhaus | `bauhaus` | no | no | yes | no |
| 40 | Pop and bold graphic | Neon retro | `neon-retro` | yes | no | no | no |
| 41 | Indian art | Hand-painted Bollywood poster | `retro-indian` | yes | yes | no | no |
| 42 | Indian art | Madhubani | `madhubani` | yes | no | yes | no |
| 43 | Indian art | Warli | `warli` | yes | no | yes | no |
| 44 | Indian art | Indian miniature | `indian-miniature` | yes | no | yes | no |
| 45 | Abstract and surreal | Surreal concept | `surreal-concept` | yes | no | yes | no |
| 46 | Abstract and surreal | Abstract shapes | `abstract-shapes` | no | no | yes | no |
| 47 | Abstract and surreal | Data art | `data-art` | no | no | yes | no |
| 48 | Abstract and surreal | Glitch digital | `glitch-digital` | yes | no | no | no |

---

## 1. Editorial flat

- **Slug:** `editorial-flat`
- **Family:** Flat and vector
- **Summary:** Clean flat shapes, limited palette, smart visual metaphor
- **Good for:** economy, policy, explainers

| Field | Rule |
|---|---|
| Medium | flat vector-style illustration with solid colour fields and no outlines |
| Palette | deep navy #1F2A44, warm sand #E9D8B4, teal #2A9D8F, soft coral #F4A261, off-white ground #FAF7F0; optional ET red #E8262D accent under 10% of the area |
| Line | no outlines; edges defined by colour change only; crisp geometric curves |
| Texture | perfectly flat fills with at most a fine paper grain overlay at 5% opacity |
| Composition | one central visual metaphor, large simple shapes, generous negative space, focal point slightly off-centre |
| Lighting | no shading or a single flat shadow shape per object at 15% darker tone |
| Figures | generic, faceless or dot-eyed figures with simplified proportions; never identifiable |

**Do**

- build the whole image around one visual metaphor
- keep to five colours or fewer
- leave the top third calm for a headline overlay
- make shapes readable at thumbnail size

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no gradients or glossy effects
- no identifiable faces

**promptCore**

> A flat editorial illustration made of solid colour shapes with no outlines and no gradients, using a restrained palette of deep navy, warm sand, teal and soft coral on an off-white ground. The scene is built around one clear visual metaphor with large simple shapes and generous empty space.

**Negative:** photograph, 3D render, gradient, glossy, outline drawing, clutter, realistic faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a rupee coin balanced on a scale
- a road splitting in two directions
- a seedling growing out of coins

---

## 2. Mid-century modern

- **Slug:** `mid-century`
- **Family:** Flat and vector
- **Summary:** 1950s to 60s editorial shapes, grain, warm muted colours
- **Good for:** business, lifestyle, Prime long reads

| Field | Rule |
|---|---|
| Medium | mid-century editorial illustration with cut shapes, stippled texture and limited overprinted colour |
| Palette | mustard #D9A441, burnt orange #C8553D, olive #6B7F3A, teal #2F6F73, cream #F2E8D5, charcoal #2B2B2B |
| Line | angular stylised shapes with occasional thin confident outlines |
| Texture | dry-brush stipple, halftone grain and slight colour overprint offsets |
| Composition | asymmetric balance, strong diagonals, stylised perspective, layered planes |
| Lighting | flat with texture-based shading and simple cast shadows |
| Figures | elongated, stylised figures with simple oval heads and minimal features |

**Do**

- use angular stylised forms
- add grain and stipple texture
- stack overlapping colour planes
- keep the palette warm and muted

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no modern gadgets drawn photorealistically
- no neon or saturated digital colour

**promptCore**

> A mid-century modern editorial illustration with angular stylised shapes, stipple and halftone grain, and warm muted colours of mustard, burnt orange, olive and teal on cream. Layered flat planes, strong diagonals and simple elongated figures.

**Negative:** photograph, 3D render, neon, glossy, modern flat vector, photorealism, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a city skyline at dawn
- a person at a desk with a laptop, seen from behind
- a wallet with cards

---

## 3. Minimal line

- **Slug:** `minimal-line`
- **Family:** Flat and vector
- **Summary:** One confident continuous line on a calm ground, with a single flat accent shape
- **Good for:** opinion, personal finance, wellbeing, careers, policy explainers, tech

| Field | Rule |
|---|---|
| Medium | single-weight continuous line drawing with one or two flat colour shapes behind it |
| Palette | ink navy #1E2A3A line on warm off-white #F7F3EC; one accent shape in terracotta #D9734E or sage #9DB59A; optional ET red #E8262D accent under 5% of the area |
| Line | one unbroken monoline of even weight, smooth and economical, drawn as if the pen never leaves the paper |
| Texture | clean and flat; at most a faint paper grain |
| Composition | a single idea drawn with as few lines as possible, centred or slightly off-centre, at least half the frame left empty |
| Lighting | none; no shading, form is implied by the line alone |
| Figures | generic figures reduced to a single contour, no facial features beyond a line; never identifiable |

**Do**

- draw the whole subject with one continuous line
- keep at least half the frame empty
- use one flat accent shape to anchor the idea
- keep line weight even throughout

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no hatching, shading or gradients
- no more than two colours besides the line
- no identifiable faces

**promptCore**

> A minimal continuous single-line drawing in an even ink-navy monoline on a warm off-white ground, with one flat terracotta or sage accent shape behind the subject. The whole idea is drawn with as few lines as possible, no shading, and at least half the frame left calm and empty.

**Negative:** shading, hatching, gradients, photograph, 3D render, clutter, multiple line weights, realistic faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a single line forming a rupee coin and a hand
- a road splitting in two directions
- a city skyline at dawn

---

## 4. Bold vector

- **Slug:** `bold-vector`
- **Family:** Flat and vector
- **Summary:** Punchy geometric vector art with thick shapes, bright contrast and crisp edges
- **Good for:** startups, tech, markets, brands, consumer, sport business, explainers

| Field | Rule |
|---|---|
| Medium | bold vector illustration built from thick geometric shapes and smooth curves with crisp edges |
| Palette | high contrast: electric blue #1F4FFF, hot orange #FF6B1A, lemon #FFD60A, deep ink #121826, white #FFFFFF; optional ET red #E8262D as the single strongest accent |
| Line | no outlines, or one consistent thick outline in deep ink; perfectly clean vector curves |
| Texture | flat fills with optional simple long shadows or a single halftone patch |
| Composition | one large, graphic focal object filling much of the frame, strong diagonals, dynamic scale, simple background |
| Lighting | flat, with at most one hard-edged highlight and one hard shadow shape per object |
| Figures | chunky stylised figures with simple geometric heads and no detailed faces; never identifiable |

**Do**

- make the focal object big and graphic
- use strong diagonals and bold contrast
- keep every edge crisp and clean
- limit the palette to five colours

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no gradients, glossy effects or realistic texture
- no thin fussy detail
- no identifiable faces

**promptCore**

> A bold vector illustration made of thick geometric shapes and clean curves, with crisp edges, flat high-contrast fills in electric blue, hot orange, lemon yellow and deep ink, and one large graphic focal object on a simple background. Energetic diagonals, no gradients, no fine detail.

**Negative:** photograph, 3D render, gradient, glossy, painterly texture, thin lines, clutter, realistic faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a rocket launch over the sea
- a smartphone with light coming out
- a stock chart turning into a mountain path

---

## 5. Watercolour

- **Slug:** `watercolour`
- **Family:** Painting
- **Summary:** Transparent washes, paper texture, airy
- **Good for:** travel, places, health, gentle stories

| Field | Rule |
|---|---|
| Medium | transparent watercolour on rough cotton paper with light pencil underdrawing |
| Palette | soft cerulean #6FA8DC, sap green #7BA05B, rose #E8A0A8, raw sienna #C98B4F, lots of white paper #FFFFFF |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no opaque heavy paint
- no harsh black outlines

**promptCore**

> A delicate transparent watercolour illustration on rough cotton paper with a faint pencil underdrawing, soft cerulean, sap green and rose washes, blooms and granulation, and large areas of untouched white paper. Airy, gentle and calm.

**Negative:** photograph, vector, opaque paint, neon, heavy black lines, 3D render, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a hospital corridor
- a farmer's field with a tractor
- a city skyline at dawn

---

## 6. Gouache editorial

- **Slug:** `gouache`
- **Family:** Painting
- **Summary:** Opaque matte gouache, soft edges, rich colour
- **Good for:** Prime features, profiles, culture

| Field | Rule |
|---|---|
| Medium | opaque matte gouache painting on cold-press paper |
| Palette | rich jewel tones: deep green #1E5B4F, ochre #C9922E, plum #6D3B5C, dusty pink #D8A7A0, midnight blue #23305A |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no hard vector edges
- no glossy or wet-look highlights

**promptCore**

> An editorial gouache painting with opaque, matte, chalky paint and soft brushed edges, in rich jewel tones of deep green, ochre, plum and midnight blue. Warm directional light, layered foreground and background, visible paper tooth.

**Negative:** photograph, vector, glossy, 3D render, hard outlines, neon, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a market street with stalls
- a monsoon street with umbrellas
- a classroom with empty desks

---

## 7. Oil impasto

- **Slug:** `oil-impasto`
- **Family:** Painting
- **Summary:** Thick textured brushwork, dramatic light
- **Good for:** big-picture essays, history, leadership

| Field | Rule |
|---|---|
| Medium | oil painting with thick impasto brushwork and palette-knife passages |
| Palette | umber #5B3A29, cadmium orange #E07A1F, Prussian blue #1F3B57, ivory #EDE6D6, deep crimson #8C1C2B |
| Line | bold visible strokes that sculpt form, no drawn lines |
| Texture | raised paint ridges, canvas weave visible in thin areas |
| Composition | classical, weighty composition with a strong focal subject and dark surroundings |
| Lighting | dramatic chiaroscuro, a single strong light source, deep shadows |
| Figures | painterly figures with dignified posture, faces suggested by planes of colour |

**Do**

- sculpt forms with stroke direction
- use one strong light source
- keep dark, rich surroundings
- let texture show in highlights

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no smooth digital blending
- no cartoon proportions

**promptCore**

> A dramatic oil painting with thick impasto brushwork and palette-knife texture, lit by a single strong light source with deep chiaroscuro shadows, in umber, cadmium orange, Prussian blue and ivory. Weighty classical composition with raised paint ridges and visible canvas.

**Negative:** photograph, vector, flat colour, cartoon, smooth digital airbrush, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- an oil derrick at sunset
- a ship at a port at dusk
- a road splitting in two directions

---

## 8. Digital painterly

- **Slug:** `digital-painterly`
- **Family:** Painting
- **Summary:** Contemporary concept-art finish, cinematic
- **Good for:** tech futures, AI, space, energy

| Field | Rule |
|---|---|
| Medium | digital painting with a contemporary concept-art finish and visible brush textures |
| Palette | deep space blue #0E1A2B, electric cyan #3FC1C9, warm amber #FFB547, violet #6A4C93, haze grey #9AA5B1 |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no photorealistic rendering
- no game-UI elements or screens with writing

**promptCore**

> A cinematic digital painting with a contemporary concept-art finish, visible brush texture, atmospheric haze and volumetric light, in deep space blue, electric cyan and warm amber. Wide framing with strong depth and a rim-lit focal subject.

**Negative:** photograph, photorealistic, vector flat, cartoon, UI, screens with text, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a robot hand and a human hand
- a satellite over the earth
- a rocket launch over the sea

---

## 9. Pencil sketch

- **Slug:** `pencil-sketch`
- **Family:** Drawing and sketch
- **Summary:** Graphite with hatching, reportage feel
- **Good for:** courts, hearings, interviews

| Field | Rule |
|---|---|
| Medium | graphite pencil drawing in a reportage sketchbook manner |
| Palette | graphite greys #3A3A3A to #BDBDBD on warm sketchbook paper #F4EFE4; optional single muted wash of slate blue #6B7F99 |
| Line | searching, observational lines with cross-hatching and some construction lines left visible |
| Texture | paper tooth, smudges, soft eraser marks |
| Composition | on-the-spot reportage framing, the subject drawn fully and the surroundings left loose and unfinished |
| Lighting | tone built by hatching density, strong side light |
| Figures | observational figures with natural proportions, faces drawn simply and without exaggeration |

**Do**

- leave construction lines visible
- finish the focal subject and let edges fade out
- build tone with hatching
- keep it observational, not stylised

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no colour beyond one muted wash
- no caricature or exaggeration

**promptCore**

> A graphite pencil reportage sketch on warm sketchbook paper, with searching observational lines, cross-hatching and visible construction lines. The focal subject is fully drawn while the surroundings fade into loose unfinished strokes.

**Negative:** photograph, colour painting, vector, ink, digital, cartoon, caricature, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a courtroom gavel and books
- a mountain of paper documents
- a person at a desk with a laptop, seen from behind

---

## 10. Charcoal

- **Slug:** `charcoal`
- **Family:** Drawing and sketch
- **Summary:** Smudged charcoal, deep blacks, gravity
- **Good for:** serious stories, sombre stories

| Field | Rule |
|---|---|
| Medium | compressed and willow charcoal on heavy grey-toned paper |
| Palette | charcoal black #111111, smoky greys #555555 to #A0A0A0, toned paper #D8D4CC, white chalk highlights #F2F2F2 |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no colour
- no identifiable faces or graphic detail

**promptCore**

> A sombre charcoal drawing on grey-toned paper with deep smudged blacks, smoky greys and a single soft point of light lifted in white chalk. Quiet, weighty composition with expressive broad strokes; any figures appear only as silhouettes.

**Negative:** photograph, colour, vector, cartoon, bright, cheerful, gore, faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- an empty railway platform at night
- a single candle on a table
- a mountain of paper documents

---

## 11. Ink and wash

- **Slug:** `ink-wash`
- **Family:** Drawing and sketch
- **Summary:** Loose ink line with grey and one accent wash
- **Good for:** markets, analysis, opinion

| Field | Rule |
|---|---|
| Medium | black ink brush line with grey wash on off-white paper |
| Palette | ink black #1D1D1B, warm greys #8A8580 and #C9C4BC, paper #F5F1E8; one accent: ET red #E8262D at most 10% of the area |
| Line | confident, varied weight, loose, some dry-brush strokes |
| Texture | visible paper grain, wash blooms and soft pooled edges |
| Composition | one strong focal element, generous negative space, off-centre placement |
| Lighting | implied by wash density, no gradients or airbrush |
| Figures | simplified faces with a few strokes, no caricature, natural proportions |

**Do**

- use a single visual metaphor
- leave the top-left third calm for headlines
- let wash bleed past the line in places
- keep the accent colour to one small area

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no more than one accent colour
- no photoreal faces

**promptCore**

> An editorial illustration in loose black ink brush line with soft grey wash on textured off-white paper, with a single small accent of red. Confident varied strokes, visible paper grain and pooled wash edges, one strong focal element and generous empty space.

**Negative:** photograph, 3D render, vector flat, neon, heavy colour, digital gradient, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a stock chart turning into a mountain path
- two chess pieces facing each other
- a bank vault door

---

## 12. Stipple hedcut

- **Slug:** `stipple-hedcut`
- **Family:** Drawing and sketch
- **Summary:** Hand-inked stipple and engraved-line drawing in the newspaper hedcut manner, applied to objects, buildings and scenes on bare white paper
- **Good for:** business news, markets and finance, company stories, banking, commodities, economy explainers, products and objects, infrastructure, policy and regulation, corporate earnings

| Field | Rule |
|---|---|
| Medium | Pen-and-ink stipple combined with fine engraved hatching on smooth white paper, like newspaper hedcuts and banknote engraving. |
| Palette | Black ink #111111 on warm newsprint white #F7F4EC; at most one muted accent, e.g. banknote green #4E6B52 or oxblood #7A2E2A, used sparingly as a flat tint. |
| Line | Tone built only from dots of varied size and spacing plus parallel and cross hatching that follows the form; very few hard outlines; no grey fills or gradients. |
| Texture | Visible individual ink dots and engraved-line rhythm; crisp paper white in highlights; no wash, no smudge, no digital noise. |
| Composition | One clear subject or small grouped still life, centred or in a tight vignette that fades to white at the edges; generous empty ground; reads at small column width. |
| Lighting | Single directional light from upper left; dense dots and crossed lines in shadow, sparse dots to bare paper in highlights; strong 3D modelling. |
| Figures | generic, never identifiable people; no portraits or likenesses of real persons; figures, if any, are small anonymous silhouettes, hands or backs rendered in the same stipple |

**Do**

- build every tone from dots and engraved hatching
- keep the background bare white or a soft vignette
- show objects with solid volume and a single light source
- use a crisp, precise, hand-inked finish
- keep to black ink with at most one muted accent

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no portraits or recognisable faces of real people
- no smooth grey gradients, airbrush or photo halftone screens
- no colour washes or full-colour rendering
- no cartoon outlines or flat vector shapes

**promptCore**

> Hand-inked stipple and engraving illustration on white paper: the subject is modelled entirely with thousands of tiny black ink dots of varying density plus fine parallel and cross-hatched engraved lines that follow its contours, like a newspaper hedcut or banknote vignette. Single light from upper left, dense dots in shadow, bare paper in highlights, soft vignette edges, crisp precise penwork, monochrome black ink with optional single muted accent tint.

**Negative:** text, letters, numbers, logo, watermark, signature, photo, photorealistic, smooth gradient, airbrush, colour wash, watercolour, flat vector, cartoon, 3d render, blur, celebrity likeness, portrait of real person

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a bank vault door
- a gold bar and a magnifying glass
- a courtroom gavel and books

---

## 13. Linocut

- **Slug:** `linocut`
- **Family:** Print and poster
- **Summary:** Carved relief print, bold black with one colour
- **Good for:** agriculture, labour, rural economy

| Field | Rule |
|---|---|
| Medium | linocut relief print with carved gouge marks, printed in black plus one colour |
| Palette | print black #161616, one colour chosen per image from brick red #B23A2E, indigo #2E3F7F or turmeric #D9A21B, on natural paper #F1EAD8 |
| Line | bold carved shapes, gouge-mark hatching, chunky confident contours |
| Texture | uneven ink coverage, paper showing through, slight print registration shift |
| Composition | strong, graphic, poster-like composition with clear silhouettes |
| Lighting | no modelling; light expressed by carved white lines |
| Figures | sturdy, dignified working figures with simplified carved features |

**Do**

- use carved gouge marks for tone
- limit to black plus one colour
- keep silhouettes bold
- let paper texture show through ink

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no gradients
- no fine photographic detail

**promptCore**

> A linocut relief print with bold carved shapes and gouge-mark hatching, printed in black and a single colour on natural paper, with uneven ink coverage and slight registration shift. Strong graphic composition with sturdy, dignified figures.

**Negative:** photograph, gradient, digital painting, 3D render, smooth shading, many colours, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a farmer's field with a tractor
- a factory with smoke turning into clouds
- a monsoon street with umbrellas

---

## 14. Risograph

- **Slug:** `risograph`
- **Family:** Print and poster
- **Summary:** Two-colour riso print, grain, slight misregistration
- **Good for:** startups, youth, culture, tech

| Field | Rule |
|---|---|
| Medium | two-colour risograph print with overprinting and grainy texture |
| Palette | fluorescent pink #FF48B0 and teal #00838A, overprint blend, on off-white #F7F3EA; alternate pair: blue #0078BF and yellow #FFE800 |
| Line | simple bold shapes, some line work, playful and graphic |
| Texture | heavy grain, halftone dots, visible misregistration between the two colours |
| Composition | bold, playful composition with overlapping forms where the two inks mix |
| Lighting | flat, tone built with halftone and grain only |
| Figures | friendly simplified figures, expressive but not caricatured |

**Do**

- use exactly two inks
- let overprint create a third colour
- show misregistration on purpose
- keep shapes bold and playful

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no more than two ink colours
- no photographic detail

**promptCore**

> A two-colour risograph print in fluorescent pink and teal on off-white paper, with heavy grain, halftone dots, overprinted areas and slight misregistration between the inks. Bold, playful shapes and friendly simplified figures.

**Negative:** photograph, full colour, gradient, 3D render, glossy, realistic, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a smartphone with light coming out
- a rocket launch over the sea
- a puzzle with one missing piece

---

## 15. Screen print

- **Slug:** `screen-print`
- **Family:** Print and poster
- **Summary:** Silkscreen poster look: a few flat opaque ink layers, bold shapes, halftone dot shading and slight registration offsets on textured paper
- **Good for:** feature openers, culture and events, travel and places, industry stories, energy and resources, cities and urban life, sports, festivals, agriculture, explainers

| Field | Rule |
|---|---|
| Medium | Hand-pulled screen print (serigraph) of 3 to 6 separately printed flat ink layers on uncoated poster paper. |
| Palette | Limited spot inks, e.g. vermilion #E4572E, mustard #F2C14E, cobalt #2E6F95, teal #2A9D8F, near-black #1B1B1E on cream stock #F3EBDD; overprints create darker mixes; never more than 6 inks. |
| Line | Bold flat shapes with clean cut edges; a single dark key layer carries the drawing; brush or cut-stencil edges, not vector-perfect strokes. |
| Texture | Coarse round halftone dots for shading and gradients, slight ink build-up and pinholes, faint squeegee streaks, 1-2 mm registration offsets showing paper slivers between colours. |
| Composition | Poster-like: strong central motif or silhouette, layered foreground/midground/background planes, large calm areas of flat colour, clear negative space. |
| Lighting | Implied by flat colour planes and halftone fades rather than modelling; dusk, night or sunlit scenes shown through 2-3 value steps. |
| Figures | generic, never identifiable people; simplified silhouettes or stylised figures built from flat shapes, no likenesses |

**Do**

- limit to a few flat opaque inks with visible overprint
- shade only with halftone dots
- show slight misregistration between layers
- keep shapes bold and readable at a distance
- let the paper colour show through as a colour

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no photographic detail or smooth digital gradients
- no more than six ink colours
- no glossy 3D rendering, glow or lens effects
- no recognisable film, band or brand characters

**promptCore**

> Screen-printed poster illustration made of four or five flat opaque spot inks on cream paper: bold simplified shapes, a dark key layer, coarse halftone dot shading for gradients, visible overprint colour mixes, slight registration offsets leaving thin paper gaps, faint ink texture and squeegee grain. Clear layered planes and strong silhouette, mid-century gig-poster craft, no gradients beyond halftone.

**Negative:** text, letters, numbers, typography, logo, watermark, signature, photo, photorealistic, smooth gradient, airbrush, 3d render, glossy, lens flare, neon glow, watercolour, pencil sketch, celebrity likeness

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a factory with smoke turning into clouds
- an oil derrick at sunset
- a ship with containers at a port

---

## 16. Vintage poster

- **Slug:** `vintage-poster`
- **Family:** Print and poster
- **Summary:** 1920s-50s travel, propaganda and constructivist poster art: bold simplified forms, heroic angles and flat lithographic colour, with no lettering
- **Good for:** travel and tourism, infrastructure and railways, aviation and shipping, manufacturing and industry, national campaigns, energy, cities, agriculture, economy and growth, anniversaries

| Field | Rule |
|---|---|
| Medium | Stone-lithograph-style poster painting with flat gouache-like colour areas, as in interwar travel, propaganda and constructivist posters. |
| Palette | Signal red #C8102E, parchment cream #F4E3B2, deep navy #1F3A5F, ochre #E9A23B, sage #5B8C5A, ink black #2A2A2A; 4-6 colours, sun-faded and slightly warm. |
| Line | Minimal outlines; forms defined by crisp flat colour shapes, geometric simplification, streamlined curves and strong diagonals. |
| Texture | Subtle lithographic grain and slight paper ageing; soft airbrushed sky gradients allowed only as in period posters; no modern digital effects. |
| Composition | Heroic and graphic: low horizon or worm's-eye view, monumental subject, radiating rays or bold diagonals, strong figure-ground, large clear sky or colour field (left empty, never filled with words). |
| Lighting | Bright, idealised sunlight or dramatic dawn/dusk, shadows as single flat darker shapes, rim light on machines and silhouettes. |
| Figures | generic, never identifiable people; idealised anonymous workers, travellers or crowds as simplified silhouettes and flat shapes, no leaders, politicians or likenesses |

**Do**

- simplify every form to bold geometric shapes
- use a limited period palette of 4-6 flat colours
- use heroic low angles, diagonals and radiating lines
- keep large calm areas of flat colour
- evoke 1920s-50s travel or constructivist poster craft

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no lettering, slogans, headlines, banners or poster typography of any kind
- no real political leaders, flags or party symbols
- no photographic detail, lens effects or 3D rendering
- no modern gadgets or anachronistic digital styling

**promptCore**

> Vintage 1930s travel and constructivist poster illustration with no lettering: monumental subject seen from a heroic low angle, bold geometric simplified forms, flat lithographic colour in a limited faded palette of signal red, cream, navy and ochre, strong diagonals and radiating rays, subtle grain and aged paper. Idealised anonymous figures as silhouettes, clean empty colour fields where a title would sit left blank.

**Negative:** text, letters, numbers, words, slogan, headline, typography, banner, logo, watermark, signature, flag, political symbol, photo, photorealistic, 3d render, glossy, lens flare, modern UI, celebrity or politician likeness

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a railway platform
- a rocket launch over the sea
- a solar farm and wind turbines

---

## 17. Paper collage

- **Slug:** `collage`
- **Family:** Collage and mixed media
- **Summary:** Cut paper, textures, halftone, torn edges
- **Good for:** politics, culture, multi-angle stories

| Field | Rule |
|---|---|
| Medium | mixed-media collage of torn paper, halftone fragments, painted marks and textures |
| Palette | newsprint grey #D6D2C8, ink black #1A1A1A, ET red #E8262D, mustard #D4A017, cobalt #2F4FA8 |
| Line | torn and cut edges, occasional scribbled marker lines |
| Texture | halftone dots, paper grain, tape and fold marks |
| Composition | layered, dynamic composition of fragments that together form one idea |
| Lighting | flat, with shadows only where paper overlaps |
| Figures | figures built from cut shapes and halftone silhouettes, no recognisable real faces |

**Do**

- layer fragments to build one idea
- mix torn edges with clean cuts
- use halftone texture
- keep a clear focal point despite the layers

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no readable newspaper text in fragments
- no recognisable faces cut from photos

**promptCore**

> A mixed-media editorial collage of torn and cut paper, halftone fragments, tape and painted marks in newsprint grey, black, red, mustard and cobalt. Layered fragments combine into one clear idea with a strong focal point.

**Negative:** single photograph, clean vector, 3D render, readable newspaper text, real faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a puzzle with one missing piece
- a road splitting in two directions
- a crowd of anonymous commuters

---

## 18. Photo collage

- **Slug:** `photo-collage`
- **Family:** Collage and mixed media
- **Summary:** Cut-out photo elements composed surreally
- **Good for:** tech, economy, culture

| Field | Rule |
|---|---|
| Medium | surreal collage of cut-out photographic objects with clean cut edges |
| Palette | clean studio backgrounds in pale blue #DCE8F2 or blush #F4DCD6, with natural object colours and one bold accent |
| Line | clean cut-out edges with subtle drop shadows |
| Texture | photographic textures of each object, consistent lighting across cut-outs |
| Composition | a surreal juxtaposition of a few objects that creates a visual metaphor |
| Lighting | consistent soft studio light across all elements |
| Figures | never people; objects, plants, buildings and abstract forms only |

**Do**

- build a clear surreal metaphor
- match lighting across elements
- keep the set clean and minimal
- use three to five objects at most

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people or body parts
- no depiction of a real news event

**promptCore**

> A surreal photographic collage of a few cut-out objects arranged into a visual metaphor on a clean pale studio background, with consistent soft lighting, subtle drop shadows and one bold accent colour. Objects only, no people.

**Negative:** people, faces, hands, crowds, news event, illustration, drawing, text

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **true**

**Sample subjects that suit it**

- a smartphone sprouting a plant
- a ladder leaning on a stack of coins
- a lightbulb filled with a city

---

## 19. Torn paper

- **Slug:** `torn-paper`
- **Family:** Collage and mixed media
- **Summary:** Hand-torn paper collage with ragged white fibre edges, layered coloured papers and mixed-media marks
- **Good for:** opinion, economy, policy, climate, health, society, explainers, culture

| Field | Rule |
|---|---|
| Medium | physical collage of hand-torn coloured and printed papers, glued in overlapping layers, optionally with gouache, crayon or pencil marks, photographed or scanned flat |
| Palette | limited 4-6 colour paper palette on a warm off-white ground: paper white #F4EFE6, newsprint grey #CFCAC0, ink black #1E1E1E, tomato red #D9472B, ochre #E0A030, deep blue #2C4A7A, sage #8FA88A |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no clean vector edges or perfectly cut geometric shapes everywhere
- no glossy 3D render or photoreal lighting
- no recognisable real people or celebrity likenesses
- no busy wallpaper-like pattern filling the whole frame

**promptCore**

> Hand-made collage of torn coloured paper layered on a warm off-white sheet: bold shapes ripped by hand with ragged edges and a thin white fibrous core, a few scraps of printed newsprint and halftone paper, subtle paper grain and soft contact shadows where layers overlap, limited palette of red, ochre, deep blue and black, one simple central editorial metaphor with generous negative space, flat scanned look.

**Negative:** text, letters, words, numbers, captions, logo, watermark, signature, vector art, clean digital edges, 3D render, glossy, photorealistic, gradient mesh, real person likeness, cluttered pattern

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a monsoon street with umbrellas
- a mountain of paper documents
- a road splitting in two directions

---

## 20. Double exposure

- **Slug:** `double-exposure`
- **Family:** Collage and mixed media
- **Summary:** Silhouette filled with a scene
- **Good for:** profiles of sectors, cities, ideas

| Field | Rule |
|---|---|
| Medium | double-exposure photograph: an anonymous silhouette or object shape filled with a second scene |
| Palette | monochrome base #1C1C1C to #F2F2F2 with the inner scene in one muted tint: teal #2E6F73 or warm amber #D99A4E |
| Line | the silhouette edge is clean; the inner scene blends softly |
| Texture | photographic, soft blend with fine grain |
| Composition | a single silhouette or shape against a pale background, the inner scene telling the story |
| Lighting | soft, even light; the inner scene carries its own light |
| Figures | only one anonymous silhouette in profile or from behind, never an identifiable face |

**Do**

- keep the silhouette anonymous
- let the inner scene tell the story
- use a pale clean background
- limit colour to one muted tint

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no identifiable face
- no depiction of a real news event

**promptCore**

> A double-exposure photographic image of a single anonymous silhouette in profile against a pale background, filled with a second scene that tells the story, blended softly in monochrome with one muted teal tint.

**Negative:** identifiable face, portrait, crowds, news event, illustration, cartoon, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **true**

**Sample subjects that suit it**

- a silhouette filled with a city skyline
- a silhouette filled with a solar farm
- a tree shape filled with a farmer's field

---

## 21. Paper cut

- **Slug:** `paper-cut`
- **Family:** Handmade craft
- **Summary:** Layered cut paper with soft shadows
- **Good for:** explainers, finance basics, festivals

| Field | Rule |
|---|---|
| Medium | layered cut-paper craft photographed in soft studio light |
| Palette | marigold #F2A541, leaf green #4C9A2A, deep teal #145C6E, rani pink #C83E7A, paper white #FAF7F2 |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no drawn ink lines
- no glossy plastic look

**promptCore**

> A layered cut-paper craft illustration photographed in soft studio light, with crisp cut edges, visible paper fibres and gentle shadows between stacked layers, in marigold, leaf green, deep teal and rani pink. Clear depth from background to foreground.

**Negative:** drawing, ink line, vector flat, plastic, glossy 3D, photograph of people, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a seedling growing out of coins
- a wallet with cards
- a city skyline at dawn

---

## 22. Clay

- **Slug:** `clay-puppet`
- **Family:** Handmade craft
- **Summary:** Stop-motion clay figures and sets
- **Good for:** light satire, politics (non-sensitive)

| Field | Rule |
|---|---|
| Medium | stop-motion plasticine figures on a handmade miniature set |
| Palette | saturated but soft clay colours: tomato red #D9483B, butter yellow #F2C94C, sky #6FB3E0, grass #5DAA4F, skin tones in warm natural clay |
| Line | rounded sculpted forms, no lines |
| Texture | visible fingerprints and tool marks in the clay, handmade set materials |
| Composition | a small theatrical scene on a set, characters interacting, shallow depth of field |
| Lighting | soft key light with a warm fill, small practical lights on the set |
| Figures | generic clay characters with big simple eyes; never a likeness of any real person |

**Do**

- show fingerprints and tool marks
- keep it playful but not mocking
- build a small theatrical set
- use shallow depth of field

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no likeness of any real person
- never used for sensitive stories

**promptCore**

> A stop-motion clay animation still: handmade plasticine characters with visible fingerprints and tool marks on a small handcrafted set, soft key light and shallow depth of field, in saturated soft clay colours. Playful and theatrical, with generic characters.

**Negative:** photograph of real people, realistic faces, likeness of real person, vector, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- two chess pieces facing each other as clay characters
- a handshake between two anonymous clay figures
- a parliament-like building made of clay

---

## 23. Felt and textile

- **Slug:** `felt-textile`
- **Family:** Handmade craft
- **Summary:** Stitched felt and fabric shapes with visible thread, soft and handmade
- **Good for:** personal finance, families, health, education, festivals, consumer

| Field | Rule |
|---|---|
| Medium | handmade felt and fabric appliqué with visible stitching, photographed in soft light |
| Palette | soft wool colours: berry #B23A5A, mustard #DDAA3B, teal #2F7F7A, cream #F1E7D3, grey #8E8E8E on a linen or felt background |
| Line | running stitches and blanket stitches in contrasting thread define edges and details |
| Texture | fuzzy felt surfaces, woven fabric texture, thread loops, slight puckering |
| Composition | simple layered shapes on a fabric ground, one clear focal object, shallow depth |
| Lighting | soft diffused daylight with gentle shadows under raised layers |
| Figures | plush generic figures with button or stitched eyes; never identifiable |

**Do**

- show felt fuzz and fabric weave up close
- outline shapes with visible stitches
- keep shapes simple and soft
- use a fabric or linen ground

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no glossy plastic or 3D render look
- no printed patterns that read as text
- no identifiable faces

**promptCore**

> A handmade felt and fabric appliqué scene photographed in soft daylight: simple shapes cut from fuzzy wool felt in berry, mustard, teal and cream, edged with visible running and blanket stitches in contrasting thread, layered on a linen background with gentle shadows, warm and tactile.

**Negative:** glossy, plastic, 3D render, vector, photograph of people, printed text, embroidery lettering, clutter, realistic faces

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a seedling growing out of coins
- a wallet with cards
- a farmer's field with a tractor

---

## 24. Origami

- **Slug:** `origami`
- **Family:** Handmade craft
- **Summary:** Folded paper forms with crisp creases and soft studio light
- **Good for:** explainers, logistics, startups, finance basics, environment, trade

| Field | Rule |
|---|---|
| Medium | folded paper origami models photographed on a seamless paper backdrop |
| Palette | matte coloured papers: coral #F07C5A, sky #7FB7D9, leaf #6BAA5E, sun #F2C14E, white #FAFAF7 on a pale backdrop #EEF0F2 |
| Line | no drawn lines; forms are defined by sharp folds and creases |
| Texture | matte paper with visible crease lines and slight fibre texture |
| Composition | one or a few folded models as a small scene, clean backdrop, generous space |
| Lighting | soft directional studio light from one side so each folded facet reads as a different tone, gentle contact shadows |
| Figures | folded paper figures with no faces; never identifiable |

**Do**

- show crisp folds and faceted planes
- light from one side so facets read clearly
- keep the backdrop seamless and plain
- use matte coloured paper

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no printed patterns or writing on the paper
- no glossy plastic look
- no real people

**promptCore**

> Origami paper models folded from matte coloured paper in coral, sky blue, leaf green and sun yellow, with crisp creases and faceted planes, arranged as a small scene on a pale seamless paper backdrop, lit by soft directional studio light so each fold reads as a different tone, gentle contact shadows.

**Negative:** printed paper, writing, glossy, plastic, 3D render look, illustration, clutter, people, faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a ship with containers at a port
- a city skyline at dawn
- a seedling growing out of coins

---

## 25. Soft 3D

- **Slug:** `soft-3d`
- **Family:** 3D render
- **Summary:** Rounded matte 3D objects, studio light
- **Good for:** personal finance, products, apps

| Field | Rule |
|---|---|
| Medium | soft matte 3D render with rounded clay-like objects |
| Palette | pastel lavender #C3B1E1, mint #B8E0D2, peach #FFC8A2, butter #FFE8A3, background soft blue-grey #E6ECF2; optional ET red #E8262D on one object |
| Line | no lines; rounded bevelled forms |
| Texture | matte, slightly soft surfaces, no reflections |
| Composition | a few hero objects floating or resting on a seamless studio backdrop, centred and balanced |
| Lighting | soft global illumination, gentle contact shadows |
| Figures | generic rounded mannequin figures only, no faces |

**Do**

- round every edge
- keep surfaces matte
- use seamless pastel backdrops
- show soft contact shadows

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no glossy or chrome materials
- no realistic human faces

**promptCore**

> A soft matte 3D render of rounded, clay-like objects on a seamless pastel studio backdrop, lit with soft global illumination and gentle contact shadows, in lavender, mint, peach and butter yellow. Simple, friendly and balanced.

**Negative:** photograph, glossy, chrome, realistic textures, faces, vector flat, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a wallet with cards
- a rupee coin balanced on a scale
- a smartphone with light coming out

---

## 26. Isometric 3D

- **Slug:** `isometric`
- **Family:** 3D render
- **Summary:** 30-degree isometric scenes, tidy and diagrammatic
- **Good for:** tech, infrastructure, supply chains

| Field | Rule |
|---|---|
| Medium | clean isometric illustration on a strict 30-degree grid |
| Palette | slate #3D4A5C, sky blue #7FB3D5, mint #A8DADC, warm white #F8F9FA, signal yellow #F4D35E; optional ET red #E8262D for one highlighted element |
| Line | thin uniform strokes or none; perfectly parallel isometric edges |
| Texture | smooth flat fills with gentle top, left and right face tonal steps |
| Composition | a contained isometric platform or block scene, tidy flow from one corner to the other, lots of breathing room |
| Lighting | consistent light from top-left: top faces lightest, right faces darkest |
| Figures | tiny generic figures only, a few pixels of detail, never identifiable |

**Do**

- keep every edge on the 30-degree grid
- show flow between components
- group the scene on one platform
- use tonal steps on each face for depth

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no perspective distortion
- no large or detailed human figures

**promptCore**

> A clean isometric explainer illustration on a strict 30-degree grid, a tidy contained scene on a single platform with smooth flat fills and consistent top-left lighting, in slate, sky blue, mint and warm white with a signal yellow highlight. Tiny generic figures only.

**Negative:** photograph, perspective view, painterly texture, messy, large people, faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a ship with containers at a port
- a solar farm and wind turbines
- a railway platform

---

## 27. Low poly

- **Slug:** `low-poly`
- **Family:** 3D render
- **Summary:** Faceted low-polygon 3D forms with flat-shaded triangles and clean gradients of light
- **Good for:** tech, energy, space, infrastructure, geography, markets

| Field | Rule |
|---|---|
| Medium | low-polygon 3D render with visible triangular facets and flat shading |
| Palette | cool to warm ramp: deep indigo #2B2D6E, teal #2A9D8F, mint #A8E6CF, peach #FFB385, coral #F2645A; soft light background #EEF1F6 |
| Line | no outlines; edges are the boundaries between flat-shaded facets |
| Texture | perfectly smooth facets, each triangle a single flat tone |
| Composition | one sculptural object or small landscape on a plain background, slight three-quarter view, generous space |
| Lighting | single soft key light so neighbouring facets step through clear tonal changes, soft ground shadow |
| Figures | faceted generic figures without facial features; never identifiable |

**Do**

- keep facets large and clearly visible
- shade each facet flat
- use a smooth cool-to-warm palette
- keep the background plain

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no smooth subdivided surfaces or realistic materials
- no outlines or cel lines
- no identifiable faces

**promptCore**

> A low-poly 3D render of a sculptural object made of large visible triangular facets, each flat-shaded in a smooth palette running from deep indigo and teal to mint, peach and coral, on a plain light background, lit by a single soft key light so the facets step through clear tones, with a soft ground shadow.

**Negative:** smooth surfaces, realistic materials, photograph, outlines, cel shading, clutter, high detail, realistic faces, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a satellite over the earth
- a stock chart turning into a mountain path
- a solar farm and wind turbines

---

## 28. Miniature diorama

- **Slug:** `diorama`
- **Family:** 3D render
- **Summary:** Tilt-shift miniature world
- **Good for:** cities, real estate, logistics

| Field | Rule |
|---|---|
| Medium | miniature model diorama photographed with a tilt-shift effect |
| Palette | natural model colours: brick #B5543C, asphalt #4A4A4A, park green #6E9E4A, sky #9CC7E8, warm light #FFD9A0 |
| Line | no lines; crisp model edges |
| Texture | model-railway textures: flock grass, painted plastic, tiny printed details without readable signs |
| Composition | high-angle view of a small world, a narrow band of sharp focus across the focal point |
| Lighting | warm late-afternoon light, small long shadows |
| Figures | tiny generic model figures only, never identifiable |

**Do**

- shoot from a high angle
- keep a narrow band of focus
- make it feel like a hand-built model
- use warm low-angle light

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no readable signs or street names
- no close-up people

**promptCore**

> A miniature model diorama of a small world, photographed from a high angle with a tilt-shift lens so only a narrow band is in focus, warm late-afternoon light and tiny long shadows. Hand-built model textures and tiny generic figures.

**Negative:** full-size photograph, close-up people, readable signs, vector, painting, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a market street with stalls
- a ship with containers at a port
- a city skyline at dawn

---

## 29. Object still life

- **Slug:** `still-life`
- **Family:** Photo and realism
- **Summary:** Studio photo of symbolic objects
- **Good for:** personal finance, commodities, earnings

| Field | Rule |
|---|---|
| Medium | studio still-life photograph of symbolic objects |
| Palette | neutral backdrops in warm grey #CFC8BE, deep green #1F3D33 or terracotta #B8643F, with natural object colours |
| Line | photographic, crisp edges |
| Texture | real material textures: metal, paper, wood, fabric |
| Composition | a small arrangement of objects with a clear hero object, minimal and considered |
| Lighting | soft studio key light with a gentle shadow, controlled reflections |
| Figures | never people; objects only |

**Do**

- use a small, considered arrangement
- make one object the hero
- use soft studio light
- choose objects that symbolise the story

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people, hands or body parts
- no depiction of a real news event

**promptCore**

> A minimal studio still-life photograph of a few symbolic objects on a neutral backdrop, with a clear hero object, real material textures and soft studio light with a gentle shadow. Objects only, no people.

**Negative:** people, hands, faces, news event, crowd, illustration, cartoon, text

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **true**

**Sample subjects that suit it**

- a gold bar and a magnifying glass
- a rupee coin balanced on a scale
- a wallet with cards

---

## 30. Conceptual photo

- **Slug:** `conceptual-photo`
- **Family:** Photo and realism
- **Summary:** Studio photographs of real objects staged as visual metaphors: surreal props, handmade set pieces and clean, deliberate composition
- **Good for:** economy, markets, inflation, policy, technology, climate, business strategy, personal finance, opinion

| Field | Rule |
|---|---|
| Medium | photograph of a physical, hand-built set: real objects, props and simple constructed set pieces shot in a studio, minimal retouching |
| Palette | one dominant flat background colour plus 2-3 object colours: warm paper #EDE6DA, butter yellow #F2C94C, coral #E8664A, teal #2E7D7A, charcoal #2B2B2B, metallic gold #C9A227 |
| Line | crisp real-world edges from the objects themselves; strong silhouettes against a seamless backdrop |
| Texture | tactile real materials: paper, metal, wax, fabric, food, ceramic, plastic; visible surface detail and slight imperfections that prove it is handmade |
| Composition | single hero object or small group centred or on a clear diagonal, seamless sweep or tabletop, lots of negative space, one surprising transformation (melting, breaking, balancing, sprouting) carrying the idea |
| Lighting | controlled studio light: one hard key light with a crisp cast shadow, or soft overhead window-like light; no colour-gelled club lighting |
| Figures | no people |

**Do**

- build the idea from one or two everyday objects transformed in a surprising way
- use a seamless single-colour background
- keep the shadow believable and physically consistent
- make materials look tactile and real
- leave clean negative space for a headline to sit outside the image
- keep it to one clear metaphor

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people
- nothing that looks like a real news photograph of an event
- no banknotes or coins of a real currency with readable markings
- no CGI-looking plastic sheen or impossible floating clutter
- no busy backgrounds or real locations

**promptCore**

> Studio photograph of a hand-built conceptual still life: a single everyday object physically transformed into a visual metaphor (melting, cracking, balancing or growing), set on a seamless single-colour paper backdrop, one hard key light casting a crisp shadow, tactile real materials with small handmade imperfections, generous negative space, clean editorial magazine look, sharp focus, true-to-life colour.

**Negative:** people, hands, faces, text, letters, numbers, writing, logo, brand, watermark, signature, news photo, crowd, street, CGI render, plastic sheen, cluttered background, readable currency

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **true**

**Sample subjects that suit it**

- a rupee coin balanced on a scale
- a puzzle with one missing piece
- a wallet with cards

---

## 31. Duotone

- **Slug:** `duotone`
- **Family:** Photo and realism
- **Summary:** Two-tone photo treatment of places or objects
- **Good for:** markets, corporate, cities

| Field | Rule |
|---|---|
| Medium | duotone photographic treatment mapped to two inks |
| Palette | pairs: navy #14213D with amber #FCA311, or deep teal #0B3C49 with coral #FF6F59, or black #111111 with ET red #E8262D |
| Line | photographic edges with high contrast |
| Texture | smooth tonal mapping, optional fine grain |
| Composition | bold architectural or object crops, strong geometry, lots of sky or negative space |
| Lighting | high contrast, graphic light and shadow |
| Figures | never people |

**Do**

- map the photo to exactly two colours
- crop boldly for geometry
- keep strong contrast
- use places and objects only

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people
- no depiction of a real news event or a recognisable landmark under incident

**promptCore**

> A bold duotone photographic image of architecture, places or objects mapped to two inks, navy and amber, with strong contrast, graphic geometry and generous negative space. No people.

**Negative:** people, faces, crowds, full colour, illustration, cartoon, news event, text

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **true**

**Sample subjects that suit it**

- a city skyline at dawn
- a bank vault door
- an oil derrick at sunset

---

## 32. Cinematic scene

- **Slug:** `cinematic-scene`
- **Family:** Photo and realism
- **Summary:** Moody, film-like photographs of empty places and industrial sites at dusk or night, with no identifiable people
- **Good for:** infrastructure, manufacturing, trade, ports, energy, real estate, urban economy, logistics, night economy

| Field | Rule |
|---|---|
| Medium | photograph, as if shot on a medium-format or cinema camera with a long exposure; colour negative film look |
| Palette | film-graded night palette: sodium orange #E38B2C, teal shadow #1F4E5A, deep navy sky #14213D, mercury green #7FA88B, warm white #F2E6CF, near-black #0E0E10 |
| Line | clean architectural lines, strong verticals kept straight, crisp silhouettes of structures against the sky |
| Texture | fine film grain, soft halation around light sources, light haze, mist or wet reflective ground |
| Composition | wide, often symmetrical or one-point-perspective frame; a single lit subject (factory, crane, petrol station, port, empty street, diner) isolated in darkness; low horizon and lots of atmosphere |
| Lighting | blue hour or night; practical light sources only (streetlamps, floodlights, neon, windows) creating pools of light and long shadows; no flash |
| Figures | no people |

**Do**

- isolate one lit place or structure in a dark surrounding
- use practical light sources with visible glow and halation
- keep perspective lines straight and the frame calm
- add atmosphere with haze, mist or wet ground
- grade the colour like a film still with teal shadows and warm highlights
- keep the scene generic so it is not a specific identifiable landmark

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people
- nothing that looks like a real news photograph of an event
- no readable signs, billboards, licence plates or shop names
- no fire, explosions, accidents or disaster aftermath
- no HDR halo or oversaturated neon

**promptCore**

> Cinematic night photograph of an empty place: a single lit industrial or urban scene such as a refinery, container port crane, petrol forecourt, factory gate or deserted street, glowing under sodium and fluorescent practical lights in a dark blue-hour sky, light haze and wet reflective ground, straight architectural lines, wide calm composition, film grain and soft halation, teal shadows and warm orange highlights, quiet and still.

**Negative:** people, person, crowd, figure, face, car occupants, text, letters, numbers, signage, billboard text, licence plate, logo, brand, watermark, signature, news photo, fire, explosion, accident, HDR, oversaturated, cartoon, illustration

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **true**

**Sample subjects that suit it**

- an empty railway platform at night
- a monsoon street with umbrellas
- a city skyline at dawn

---

## 33. Editorial cartoon

- **Slug:** `editorial-cartoon`
- **Family:** Cartoon and comic
- **Summary:** Newspaper-cartoon pen line and watercolour wash with comic exaggeration, applied to objects, symbols and generic figures
- **Good for:** economy and markets, inflation and prices, budget and tax, policy debates, corporate governance, tech disruption, jobs and workplace, opinion pages, climate and energy

| Field | Rule |
|---|---|
| Medium | dip-pen or brush ink line drawing finished with loose watercolour and grey ink wash on off-white cartoon paper |
| Palette | warm paper white #F6F1E6, ink black #1A1A1A, wash grey #8C8C8C, brick red #B5523B, faded blue #5B7FA6, mustard #D9A93F, sage #9DB08A; colour applied sparingly as transparent washes |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no caricatures or likenesses of real politicians, celebrities or public figures
- no speech bubbles, captions or labels on objects
- no photoreal rendering, 3D shading or smooth digital gradients
- no party symbols or flags used to mock groups
- no gore or graphic violence

**promptCore**

> Single-panel editorial cartoon drawn with a dip pen in confident black ink lines and cross-hatching, finished with loose transparent watercolour and grey ink wash on off-white paper. One clear visual metaphor built from everyday objects and generic everyman figures with exaggerated proportions, minimal background, generous white space, hand-drawn wobble, wash blooms and paper grain.

**Negative:** text, letters, numbers, speech bubbles, captions, labels, logos, watermark, signature, caricature of real person, celebrity likeness, photorealistic, 3D render, smooth gradients, flat vector, glossy, cluttered background, gore

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- two chess pieces facing each other
- a robot hand and a human hand
- a mountain of paper documents

---

## 34. Comic halftone

- **Slug:** `comic-halftone`
- **Family:** Cartoon and comic
- **Summary:** Comic book panel art with heavy inked outlines, Ben-Day halftone dot shading, print colour and dramatic camera angles
- **Good for:** market crash drama, corporate showdowns, startup battles, fraud and crime stories, energy and power, tech rivalry, turnaround stories, pop culture business

| Field | Rule |
|---|---|
| Medium | inked comic art with brush and pen line, reproduced in a mechanical four-colour print look with halftone and Ben-Day dot shading |
| Palette | print primaries: cyan #00A3D9, magenta #E5007E, process yellow #FFE11A, key black #111111, comic red #D7261E, newsprint cream #F3E9D2; midtones built from dot screens rather than blends |
| Line | heavy confident black contours with tapered brush strokes, spotted solid blacks, feathering and speed lines |
| Texture | visible halftone dot screens of varying size and angle, slight colour misregistration, newsprint grain |
| Composition | single comic panel with dramatic perspective: worm's-eye or bird's-eye angle, foreshortening, strong diagonals, bold silhouettes; optional thick panel border |
| Lighting | high-contrast chiaroscuro with hard-edged cast shadows filled solid black and flat-colour rim light |
| Figures | generic, never identifiable people: archetypal heroes, business people, crowds and robots with stylised comic anatomy; never existing superheroes or franchise characters |

**Do**

- fill midtones and skin with halftone dot patterns
- use extreme camera angles and foreshortening for drama
- spot large areas of solid black
- keep the palette to print primaries plus black
- add speed lines or impact bursts without lettering
- allow slight print misregistration for authenticity

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no speech balloons, sound-effect lettering or caption boxes
- no existing superheroes, costumes or franchise characters
- no likeness of real people
- no soft airbrush gradients or painterly blending
- no gore or graphic violence

**promptCore**

> Dramatic comic book panel with heavy black brush-inked outlines, spotted solid blacks and Ben-Day halftone dot shading in a limited four-colour print palette of cyan, magenta, yellow and black on cream newsprint. Extreme low or high camera angle, foreshortened generic figures, speed lines, hard-edged high-contrast shadows and slight print misregistration.

**Negative:** text, speech bubbles, sound effect lettering, captions, logos, watermark, signature, real person likeness, existing superhero, photorealistic, 3D render, airbrush gradients, watercolour, painterly, gore

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a rocket launch over the sea
- a bank vault door
- a robot hand and a human hand

---

## 35. Clean-line comic

- **Slug:** `clean-line-comic`
- **Family:** Cartoon and comic
- **Summary:** Ligne claire comic illustration: even black outlines, flat unshaded colour, no hatching, precise settings and simple figures
- **Good for:** cities and infrastructure, travel and tourism, workplace scenes, explainers, real estate, transport and mobility, consumer lifestyle, retro-futurist tech

| Field | Rule |
|---|---|
| Medium | ligne claire comic illustration: uniform-weight ink outlines with flat gouache or digital colour fills |
| Palette | muted retro flats: cream #F2E6C9, sky blue #8EC5E0, teal #2F7F86, tomato red #E0533D, ochre #E2A83B, sage #A9BF8E, outline black #1B1B1B |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no hatching, cross-hatching or textured shading
- no gradients, airbrush or painterly effects
- no speech bubbles or captions
- no existing comic characters or recognisable franchise designs
- no likeness of real people

**promptCore**

> Ligne claire comic illustration with uniform-weight black outlines around every shape and flat, unshaded colour fills in a muted retro palette of cream, sky blue, teal, tomato red and ochre. No hatching, no gradients. Precisely drawn architecture and objects combined with simple generic cartoon figures, orderly frontal or isometric staging, calm and highly legible.

**Negative:** text, speech bubbles, captions, logos, watermark, signature, hatching, cross-hatching, gradients, airbrush, painterly texture, sketchy line, variable line weight, photorealistic, 3D render, real person likeness, existing comic characters

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a market street with stalls
- a railway platform
- a classroom with empty desks

---

## 36. Doodle & sketchnote

- **Slug:** `doodle-sketchnote`
- **Family:** Cartoon and comic
- **Summary:** Playful hand-drawn marker doodles: wobbly outlines, simple characters, icons and arrows filling the page, no words
- **Good for:** personal finance tips, productivity, explainers, listicles, startups, education, workplace culture, lifestyle, ideas and brainstorming

| Field | Rule |
|---|---|
| Medium | felt-tip and brush marker drawing on white paper in the manner of sketchbook doodles and sketchnote visual notes |
| Palette | paper white #FFFFFF, marker black #141414, plus two or three bright accents: highlighter yellow #FFE14D, coral #FF6B5B, sky blue #4DB6F0, mint #5ED3A6 |
| Line | single-weight rounded marker line, slightly wobbly and imperfect, quick confident strokes, open loops |
| Texture | marker streaks, uneven flat fills, slight bleed, spot colour that misses the outlines |
| Composition | all-over doodle clusters or one central motif surrounded by connected icons, arrows, stars, swirls and small characters; dense but airy; no single perspective |
| Lighting | none; completely flat |
| Figures | generic, never identifiable people: blobby characters, stick figures and smiling objects with simple dot eyes |

**Do**

- fill the space with small connected doodles around a clear central idea
- use arrows, stars, swirls and connector lines in place of words
- keep the line wobbly and hand-made
- add a few bright marker accents only
- give objects simple faces and personality
- leave some white paper breathing room

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no words, handwritten lettering, labels or speech bubbles
- no shading, gradients or 3D rendering
- no precise vector geometry
- no likeness of real people

**promptCore**

> Playful hand-drawn doodle illustration in black felt-tip marker on white paper with a few bright marker accents. Wobbly single-weight outlines, cute simple characters and everyday objects with dot eyes, arrows, stars, swirls and connector lines arranged in a lively all-over sketchnote layout, uneven marker fills that slip past the lines.

**Negative:** text, words, handwriting, lettering, labels, numbers, logos, watermark, signature, photorealistic, 3D render, gradients, vector precision, shading, real person likeness

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a smartphone with light coming out
- a puzzle with one missing piece
- a seedling growing out of coins

---

## 37. Pop art

- **Slug:** `pop-art`
- **Family:** Pop and bold graphic
- **Summary:** Bold outlines, Ben-Day dots and saturated primaries applied to everyday objects
- **Good for:** consumer, brands, markets, retail, entertainment business, lifestyle

| Field | Rule |
|---|---|
| Medium | pop-art illustration with thick black outlines, flat primaries and Ben-Day dot shading |
| Palette | saturated primaries: red #E63228, yellow #FFD400, blue #1E5BC6, black #111111, white #FFFFFF, optional pink #F28AB2 |
| Line | thick, even black outlines around every shape |
| Texture | Ben-Day dot screens for tone, flat colour elsewhere, slight print offset |
| Composition | one everyday object shown big and iconic, cropped close, against a dotted or striped background |
| Lighting | graphic highlights as white shapes and shadows as dot screens |
| Figures | generic stylised figures only; never a likeness of a real person, actor or celebrity |

**Do**

- outline every shape in thick black
- shade with Ben-Day dots
- make one everyday object big and iconic
- use saturated primaries

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no speech bubbles or comic lettering
- no likeness of celebrities or real people
- no brand logos or packaging marks

**promptCore**

> A pop-art illustration of one everyday object shown big and iconic, with thick black outlines, flat saturated red, yellow and blue, Ben-Day dot shading, graphic white highlights and a dotted background, like a vintage printed comic panel without any lettering.

**Negative:** speech bubble, lettering, celebrity likeness, real person, brand logo, photograph, 3D render, gradient, muted colours, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a gold bar and a magnifying glass
- a smartphone with light coming out
- a wallet with cards

---

## 38. Swiss geometric

- **Slug:** `swiss-geometric`
- **Family:** Pop and bold graphic
- **Summary:** Grid, primary shapes, bold negative space
- **Good for:** data, economy, policy

| Field | Rule |
|---|---|
| Medium | Swiss-style geometric composition of primary shapes on a strict grid |
| Palette | signal red #E63946, cobalt #1D3557, sun yellow #FFC300, black #111111, white #F8F8F8 |
| Line | precise geometric edges, no hand-drawn lines |
| Texture | perfectly flat, optional very fine print grain |
| Composition | strict modular grid, asymmetric balance, bold negative space, shapes implying movement or tension |
| Lighting | none; pure flat colour |
| Figures | no people; ideas expressed with shapes only |

**Do**

- express the idea through shape relationships
- respect a modular grid
- use bold negative space
- keep to three or four colours

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people or faces
- no illustrative detail

**promptCore**

> A Swiss-style geometric composition of circles, squares, bars and arcs on a strict modular grid, in signal red, cobalt, sun yellow and black on white, with bold negative space and asymmetric balance. Pure flat colour, the idea expressed through shape relationships alone.

**Negative:** photograph, illustration detail, people, faces, texture-heavy, 3D, text

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a balance of two shapes for a budget
- rising and falling bars as pure form
- a circle breaking a grid

---

## 39. Bauhaus

- **Slug:** `bauhaus`
- **Family:** Pop and bold graphic
- **Summary:** Primary geometry, circles, squares and triangles balanced on a strict modernist grid
- **Good for:** economy, policy, design, industry, markets, data

| Field | Rule |
|---|---|
| Medium | Bauhaus-style modernist composition of basic geometric forms |
| Palette | red #D7372D, yellow #F2C12E, blue #2251A3, black #151515, off-white #F2EEE3 |
| Line | precise straight edges and true circles; thick black bars used as structural lines |
| Texture | flat ink on slightly warm paper, optional faint print grain |
| Composition | circles, squares, triangles and bars in asymmetric balance on a grid, strong diagonals, generous off-white space |
| Lighting | none; purely flat graphic colour |
| Figures | none; the idea is carried by geometry alone |

**Do**

- use only basic shapes: circle, square, triangle, bar
- balance the composition asymmetrically
- keep to the primary palette plus black
- leave generous off-white space

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people or figurative detail
- no lettering, numbers or poster type
- no gradients or 3D effects

**promptCore**

> A Bauhaus-style modernist composition of circles, squares, triangles and thick black bars in red, yellow, blue and black on warm off-white paper, arranged in asymmetric balance on a strict grid with strong diagonals and generous empty space. Flat ink, no figures.

**Negative:** people, figures, lettering, typography, numbers, gradient, 3D, photograph, texture overload, clutter, text

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a factory with smoke turning into clouds
- a road splitting in two directions
- a rupee coin balanced on a scale

---

## 40. Neon retro

- **Slug:** `neon-retro`
- **Family:** Pop and bold graphic
- **Summary:** Synthwave glow: neon outlines, purple dusk, grid horizons and chrome highlights
- **Good for:** tech, gaming business, startups, crypto, entertainment business, AI

| Field | Rule |
|---|---|
| Medium | retro synthwave digital illustration with glowing neon outlines |
| Palette | deep purple night #1B0B3A, magenta #FF2E88, cyan #2EE6FF, sunset orange #FF8A3D, hot pink-to-orange sun gradient |
| Line | glowing neon tubes and outlines with soft bloom |
| Texture | smooth digital surfaces, subtle scanlines, light haze and bloom |
| Composition | a perspective grid floor running to the horizon, a large banded sun, one glowing focal object in the foreground |
| Lighting | emissive neon light with coloured bloom and reflections on glossy surfaces |
| Figures | generic silhouettes only, small and distant; never identifiable |

**Do**

- light the focal object with neon outlines and bloom
- use a perspective grid to the horizon
- keep the purple, magenta and cyan palette
- add subtle scanlines

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no neon signs that read as words
- no identifiable people
- no daylight or natural palette

**promptCore**

> A retro synthwave illustration at night: a glowing perspective grid floor running to the horizon under a large banded magenta-to-orange sun, one focal object drawn in glowing neon cyan and magenta outlines with soft bloom and glossy reflections, deep purple sky, subtle scanlines and haze.

**Negative:** neon lettering, signs with words, daylight, photograph, realistic faces, muted colours, clutter, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a city skyline at night
- a satellite over the earth
- a smartphone with light coming out

---

## 41. Hand-painted Bollywood poster

- **Slug:** `retro-indian`
- **Family:** Indian art
- **Summary:** Vintage Indian poster and matchbox-label print look
- **Good for:** brands, nostalgia, consumer

| Field | Rule |
|---|---|
| Medium | vintage Indian commercial print look with flat inks, decorative borders and aged paper |
| Palette | vermilion #E34234, peacock blue #1F6E8C, turmeric #E1A90F, leaf green #3E7C3A, aged paper #EFDDB8 |
| Line | bold decorative outlines and ornamental flourishes |
| Texture | aged paper, ink wear, slight misregistration and halftone |
| Composition | centred emblem-like composition with ornamental frame, symmetrical balance |
| Lighting | flat with simple two-tone shading |
| Figures | stylised illustrated figures in a vintage commercial manner, friendly and non-mocking |

**Do**

- use ornamental borders and frames
- keep a centred emblem layout
- age the paper
- use bold flat inks

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no readable words, slogans or brand names
- no real brand imagery

**promptCore**

> A vintage Indian commercial print illustration in the manner of old matchbox labels and hand-painted posters, with flat vermilion, peacock blue and turmeric inks, ornamental borders, a centred emblem-like composition and aged, slightly misregistered paper.

**Negative:** photograph, modern flat vector, 3D render, readable words, real brands, text

**Safety:** allowsPeople: **true**, allowsRealPeople: **true**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a wallet with cards as an emblem
- a gold bar and a magnifying glass
- a market street with stalls

---

## 42. Madhubani

- **Slug:** `madhubani`
- **Family:** Indian art
- **Summary:** Mithila folk painting: dense line patterns, double-line borders, flat natural-pigment colour, fish, peacock and tree-of-life motifs
- **Good for:** rural economy, agriculture, women and work, festive features, environment, handicrafts, Bihar stories, social themes, FMCG and consumption, Indian culture

| Field | Rule |
|---|---|
| Medium | Hand-painted Mithila folk painting on handmade paper or cloth, nib-pen and bamboo-twig line with flat natural-pigment fills (Bharni colour-fill and Kachni fine-line idioms). |
| Palette | Turmeric yellow #E8B12A, vermilion red #C8322A, indigo blue #2E3F8F, leaf green #3E8E4A, marigold orange #E57B25, lamp-black line #1A1A1A on handmade-paper cream ground #F3E6C8. |
| Line | Confident black outlines everywhere, every form and border drawn as a double line with the gap filled by hatching, dots or tiny repeating dashes; no sketchy or broken strokes. |
| Texture | Flat matte pigment fills on slightly fibrous handmade paper; no gradients, no shading, no airbrush, slight hand-made unevenness in line weight. |
| Composition | Horror vacui: every empty area filled with fish, birds, leaves, lotuses, suns and geometric patterns; a decorated double-line border frames the whole picture; symmetrical or frieze-like arrangement, flat with no perspective. |
| Lighting | None: no light source, no cast shadows, no highlights; colour is purely flat decorative fill. |
| Figures | Generic, never identifiable people; stylised profiles with large almond eye, pointed nose and frontal torso; animals (fish, peacocks, elephants, tigers, parrots) as decorative motifs. |

**Do**

- fill all negative space with pattern
- draw every outline as a double line with hatching between
- frame the image with an ornamented border
- use fish, peacock, lotus, sun and tree-of-life motifs
- keep figures in stylised profile with large almond eyes
- keep colour flat and saturated

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no religious deities or sacred symbols as the subject
- no shading, gradients, 3D or perspective depth
- no photoreal faces or identifiable real people
- no empty unpatterned background areas

**promptCore**

> Traditional Mithila (Madhubani) folk painting on handmade paper: bold black double-line outlines filled with fine hatching and dots, flat saturated natural-pigment colours of turmeric yellow, vermilion, indigo and leaf green, every empty space packed with fish, peacocks, lotuses, leaves and geometric patterns, stylised profile figures with large almond eyes, ornate double-line border around the whole picture, perfectly flat with no shading or perspective.

**Negative:** text, letters, numbers, writing, logo, watermark, signature, deity, religious icon, photorealism, 3D render, gradient, shading, perspective depth, realistic face, celebrity, blank background, airbrush

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a farmer's field with a tractor
- fish in a river with a small boat
- a tree with birds and a rising sun

---

## 43. Warli

- **Slug:** `warli`
- **Family:** Indian art
- **Summary:** Warli tribal painting: white stick figures, circles and triangles on an earth-brown ground, rhythmic village and dance-circle scenes
- **Good for:** rural economy, agriculture, community, sustainability, climate, labour and jobs, urban growth, festivals, Maharashtra stories, cooperatives

| Field | Rule |
|---|---|
| Medium | Warli tribal wall painting translated to cloth or paper: rice-paste white paint applied with a chewed bamboo stick on a mud, cow-dung or ochre-washed ground. |
| Palette | Rice-paste white #F4F1EA on earth-brown ground #6B3E26, optional terracotta red-ochre ground #9C4A2F or deep umber #3F2618; strictly two-tone, no other colours. |
| Line | Thin, slightly uneven white strokes and dots; figures built only from a circle head, two triangles joined at the tip for torso, and single-stroke stick limbs; no outlines around shapes, no black. |
| Texture | Matte, slightly grainy mud-plaster or cloth ground showing through; hand-applied white with mild variation in opacity and small dots. |
| Composition | Flat, map-like and rhythmic: many small repeated figures arranged in spirals, concentric dance circles (tarpa dance), rows of trees, huts, animals and fields; scenes spread across the surface with no horizon or perspective; may be bordered by a simple dotted or triangle band. |
| Lighting | None: no shading, no highlights, no light direction. |
| Figures | Generic, never identifiable people; all humans are identical geometric stick figures in motion (dancing, farming, fishing, carrying loads); animals equally schematic. |

**Do**

- use only white on an earth-brown ground
- build humans from circle plus two triangles plus stick limbs
- repeat small figures rhythmically in rows, spirals or circles
- include trees, huts, birds, animals and fields as simple geometric glyphs
- keep everything flat and two-dimensional
- leave the brown ground visible between motifs

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no religious deities or sacred symbols as the subject
- no extra colours, gradients or shading
- no realistic anatomy, faces or identifiable people
- no perspective, horizon lines or 3D depth

**promptCore**

> Traditional Warli tribal painting: thin white rice-paste lines and dots on a flat earth-brown mud ground, tiny geometric stick figures made of a circle head and two joined triangles, dancing in concentric circles, farming, fishing and carrying loads among simple triangle trees, huts, birds and animals, rhythmic repetition across the surface, strictly two-tone white on brown, completely flat with no shading or perspective.

**Negative:** text, letters, numbers, writing, logo, watermark, signature, deity, religious icon, colour, gradient, shading, 3D, perspective, realistic anatomy, detailed faces, photorealism, black outlines

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a farmer's field with a tractor
- a crowd of anonymous commuters
- a market street with stalls

---

## 44. Indian miniature

- **Slug:** `indian-miniature`
- **Family:** Indian art
- **Summary:** Mughal, Rajput and Pahari miniature painting: hair-fine brushwork, jewel-like flat colour, stacked flat perspective and ornamental borders
- **Good for:** heritage and culture, luxury and jewellery, tourism, royal and historical themes, trade and markets, festive features, banking and wealth, Rajasthan stories, agriculture, wildlife

| Field | Rule |
|---|---|
| Medium | Opaque watercolour (gouache) and gold on burnished wasli paper, painted with single-hair squirrel brushes in the Mughal, Rajput and Pahari court traditions. |
| Palette | Lapis blue #26428B, vermilion #D23A2B, Indian yellow #E9B53B, malachite green #3C8D5A, lamp-black #1E1B18, gold #C9A14A, ivory ground #F2E8D0, rose-pink border #D98C8C. |
| Line | Hair-fine, precise dark-brown or black outlines; delicate profile contours, fine detailing of textiles, foliage and architecture; no loose or sketchy strokes. |
| Texture | Smooth burnished matte gouache with touches of raised gold; subtle stippled modelling only on faces and trees; slight aged-paper warmth. |
| Composition | Flat, stacked (vertical) perspective where distance is shown higher up the page; architecture shown frontally with tilted floors; crowded narrative scenes or single figures in gardens and pavilions; image framed by a coloured rule border and a wider decorated margin with floral scroll. |
| Lighting | Even, shadowless, decorative light; no cast shadows, no single light source; night scenes rendered with dark ground and gold accents. |
| Figures | Generic, never identifiable people; stylised figures in strict profile with almond eyes, fine jewellery and patterned textiles; courtiers, merchants, musicians, farmers, horses, elephants and birds. |

**Do**

- use hair-fine outlines and meticulous detail
- keep figures in profile with almond eyes
- use stacked flat perspective with tilted architecture
- add a coloured rule border and decorated outer margin
- use jewel-tone flat colour with gold accents
- include gardens, pavilions, animals and flowering trees

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no religious deities or sacred symbols as the subject
- no calligraphy panels or inscription cartouches
- no Western linear perspective, cast shadows or photoreal modelling
- no identifiable real people, emperors or historical portraits

**promptCore**

> Indian miniature painting in the Mughal, Rajput and Pahari court tradition: opaque watercolour and gold on burnished paper, hair-fine outlines, figures in strict profile with almond eyes, richly patterned textiles and jewellery, flat stacked perspective with tilted pavilion floors and gardens, jewel-tone lapis, vermilion, Indian yellow and malachite colour, even shadowless light, framed by a coloured rule border and a decorated floral margin.

**Negative:** text, letters, numbers, writing, calligraphy, inscription, logo, watermark, signature, deity, religious icon, photorealism, 3D render, Western perspective, cast shadows, real person, emperor portrait, loose brushwork

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a market street with stalls
- a garden courtyard with a fountain
- a ship with containers at a port

---

## 45. Surreal concept

- **Slug:** `surreal-concept`
- **Family:** Abstract and surreal
- **Summary:** Dreamlike conceptual editorial scenes where impossible scale, objects and spaces turn an idea into one clear visual metaphor
- **Good for:** opinion pieces, big-idea features, economy metaphors, mental health, technology, climate, future of work, uncertainty, ambition and risk, magazine covers

| Field | Rule |
|---|---|
| Medium | Digitally painted illustration with a hand-made feel, soft grain and subtle brush or risograph-like texture over smooth shapes. |
| Palette | Limited, harmonious and slightly muted: dusk blue #2F4B7C, deep teal #1F5F5B, warm sand #E8D5B5, coral #E86F5A, ochre #D9A441, soft cream #F4EEE1, ink navy #1B2333. |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no recognisable real people, politicians or celebrities
- no photoreal rendering or 3D plastic look
- no cluttered scenes with many competing ideas
- no gore or horror imagery

**promptCore**

> Surreal conceptual editorial illustration: a single dreamlike visual metaphor with impossible scale and objects, small anonymous figures in a vast quiet space, floating or merged forms, doors and stairs leading nowhere. Smooth digitally painted shapes with fine grain texture, limited muted palette of dusk blue, teal, sand and coral, soft theatrical light with long shadows, generous negative space, calm and thought-provoking.

**Negative:** text, letters, numbers, captions, logos, watermarks, signatures, photorealism, 3D render, glossy plastic, real people, celebrities, clutter, busy background, gore, horror, comic speech bubbles

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a ladder reaching into the clouds
- a clock melting over a stack of coins
- a door standing alone in a desert

---

## 46. Abstract shapes

- **Slug:** `abstract-shapes`
- **Family:** Abstract and surreal
- **Summary:** Non-figurative compositions of organic blobs and geometric forms in bold flat colour fields, for mood and structure without people
- **Good for:** markets overview, economy, policy explainers, trend pieces, section openers, newsletters, backgrounds, data stories, design and culture, balance and tension

| Field | Rule |
|---|---|
| Medium | Flat digital vector or cut-paper/gouache-like shapes, crisp edges, collage feel. |
| Palette | Bold but balanced: cobalt #2546C8, tomato red #E5432F, sunflower #F5B921, mint #8FD3B6, blush pink #F2B8C6, forest green #1E5E43, off-white ground #F6F1E7, near-black #161616. |
| Line | No outlines; edges are defined by colour against colour; occasional thick single strokes or squiggles as shapes. |
| Texture | Mostly flat colour with optional subtle paper grain or slight print misregistration. |
| Composition | Overlapping and interlocking organic blobs, arches, circles, half-moons, stripes and rectangles; asymmetric balance; clear foreground/background layering; strong colour blocks; can suggest a horizon or growth without depicting anything literal. |
| Lighting | No directional lighting or cast shadows; flat colour fields only. |
| Figures | generic, never identifiable people; none at all, the style is strictly non-figurative with no faces, hands, animals or objects. |

**Do**

- compose with a few large shapes and a few small accents
- mix soft organic blobs with hard geometric forms
- use 4-6 colours with one dominant field
- let shapes overlap to create depth through colour, not shading
- keep edges crisp and the arrangement balanced

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no people, faces, animals or recognisable objects
- no gradients that look like 3D renders or glossy plastic
- no photographic textures
- no busy repeating wallpaper patterns

**promptCore**

> Abstract composition of overlapping organic blobs and geometric shapes (circles, arches, half-moons, stripes) in flat bold colour fields: cobalt blue, tomato red, sunflower yellow, mint and blush on an off-white ground. Crisp cut-paper edges, no outlines, no shading, subtle paper grain, asymmetric balanced layout with large calm areas and small accents. Non-figurative, no objects or people.

**Negative:** text, letters, numbers, logos, watermarks, signatures, people, faces, hands, animals, objects, 3D render, glossy, photorealistic, heavy gradients, cast shadows, clutter, repeating wallpaper pattern

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a heavy shape balanced against a light one
- rising forms like a growing market
- interlocking shapes like a supply chain

---

## 47. Data art

- **Slug:** `data-art`
- **Family:** Abstract and surreal
- **Summary:** Abstract charts and flows as art, no numbers
- **Good for:** markets, macro, trade

| Field | Rule |
|---|---|
| Medium | abstract generative data-art composition of lines, flows and particles |
| Palette | midnight #0B1D33, electric blue #2D9CDB, emerald #27AE60, amber #F2994A, soft white #EDEFF2 |
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

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no axes, numbers, labels or legends
- no people

**promptCore**

> An abstract data-art composition of fine luminous lines, flowing bundles and particles on a dark midnight ground, in electric blue, emerald and amber, suggesting a trend, flow or network. Elegant and artistic, with no axes, labels or numbers.

**Negative:** chart axes, numbers, labels, legend, people, photograph, cartoon, text

**Safety:** allowsPeople: **false**, allowsRealPeople: **false**, allowsSensitive: **true**, photoreal: **false**

**Sample subjects that suit it**

- a network of trade routes as flowing lines
- a stock chart turning into a mountain path
- money flowing between two shapes

---

## 48. Glitch digital

- **Slug:** `glitch-digital`
- **Family:** Abstract and surreal
- **Summary:** Digital-corruption aesthetics: pixel sorting, RGB channel split, scanlines and datamosh blocks for tech, cyber and disruption stories
- **Good for:** cybersecurity, hacking, AI and tech, misinformation, crypto, system outages, digital disruption, surveillance, online privacy, social media

| Field | Rule |
|---|---|
| Medium | Digital image processing look: pixel sorting, databending, compression artifacts and channel shifting over a simple illustrative or abstract base. |
| Palette | Screen colours on dark: black #0A0A0F, electric cyan #00E5FF, magenta #FF2BD6, signal red #FF3B30, acid green #39FF14, cold blue #3A5BFF, white highlights #F5F5F5. |
| Line | No drawn lines; horizontal and vertical streaks, sorted pixel bands and scanlines create the structure. |
| Texture | Hard pixel edges, JPEG macroblocks, interlace scanlines, noise and dithering, RGB fringing on every contour. |
| Composition | A clear simple subject or shape at the centre that is partly intact and partly torn apart by horizontal displacement, sorted pixel streams dripping or smearing across the frame, offset colour channels; strong contrast between clean and corrupted areas. |
| Lighting | Emissive screen glow, high contrast, no natural light; colours appear to emit from a dark background. |
| Figures | generic, never identifiable people; silhouettes or anonymous heads/hands only, heavily distorted by the glitch. |

**Do**

- keep one readable subject and corrupt part of it
- use RGB channel offsets on edges
- add pixel-sorted streaks in one dominant direction
- include block compression artifacts and scanlines
- use a dark ground with neon screen colours

**Don't**

- no text, letters, numbers or symbols that read as writing anywhere in the image
- no logos, brand marks, watermarks or signatures
- no imitation of any named artist's signature style
- no fake error messages, code, terminal text or UI windows
- no recognisable real people
- no photoreal faces
- no smooth painterly rendering

**promptCore**

> Glitch art editorial image: a simple central subject partly dissolving into digital corruption, pixel-sorted streaks smearing horizontally, RGB channel split with cyan and magenta fringes, JPEG macroblock artifacts, interlace scanlines and noise. Neon screen colours (cyan, magenta, acid green, signal red) glowing on near-black, high contrast, hard pixel edges, clean and broken areas side by side.

**Negative:** text, letters, numbers, code, error messages, user interface, terminal windows, logos, watermarks, signatures, real people, photoreal faces, painterly brushwork, watercolour, soft pastel palette, vintage film grain only

**Safety:** allowsPeople: **true**, allowsRealPeople: **false**, allowsSensitive: **false**, photoreal: **false**

**Sample subjects that suit it**

- a satellite over the earth
- a smartphone with light coming out
- a robot hand and a human hand

---

## Machine-readable seed

`scripts/seed-styles.ts` reads the JSON block below and upserts families and styles by slug. Keep it in sync with the sections above; the seed test fails if the two disagree.

```json
{
  "families": [
    {"slug": "flat-vector", "label": "Flat and vector", "sortOrder": 1},
    {"slug": "painting", "label": "Painting", "sortOrder": 2},
    {"slug": "drawing-sketch", "label": "Drawing and sketch", "sortOrder": 3},
    {"slug": "print-poster", "label": "Print and poster", "sortOrder": 4},
    {"slug": "collage-mixed", "label": "Collage and mixed media", "sortOrder": 5},
    {"slug": "handmade-craft", "label": "Handmade craft", "sortOrder": 6},
    {"slug": "render-3d", "label": "3D render", "sortOrder": 7},
    {"slug": "photo-realism", "label": "Photo and realism", "sortOrder": 8},
    {"slug": "cartoon-comic", "label": "Cartoon and comic", "sortOrder": 9},
    {"slug": "pop-graphic", "label": "Pop and bold graphic", "sortOrder": 10},
    {"slug": "indian-art", "label": "Indian art", "sortOrder": 11},
    {"slug": "abstract-surreal", "label": "Abstract and surreal", "sortOrder": 12}
  ],
  "styles": [
    {"slug": "editorial-flat", "familySlug": "flat-vector", "label": "Editorial flat", "summary": "Clean flat shapes, limited palette, smart visual metaphor", "goodFor": ["economy", "policy", "explainers"], "ruleSheet": {"medium": "flat vector-style illustration with solid colour fields and no outlines", "palette": "deep navy #1F2A44, warm sand #E9D8B4, teal #2A9D8F, soft coral #F4A261, off-white ground #FAF7F0; optional ET red #E8262D accent under 10% of the area", "line": "no outlines; edges defined by colour change only; crisp geometric curves", "texture": "perfectly flat fills with at most a fine paper grain overlay at 5% opacity", "composition": "one central visual metaphor, large simple shapes, generous negative space, focal point slightly off-centre", "lighting": "no shading or a single flat shadow shape per object at 15% darker tone", "figures": "generic, faceless or dot-eyed figures with simplified proportions; never identifiable", "do": ["build the whole image around one visual metaphor", "keep to five colours or fewer", "leave the top third calm for a headline overlay", "make shapes readable at thumbnail size"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no gradients or glossy effects", "no identifiable faces"], "promptCore": "A flat editorial illustration made of solid colour shapes with no outlines and no gradients, using a restrained palette of deep navy, warm sand, teal and soft coral on an off-white ground. The scene is built around one clear visual metaphor with large simple shapes and generous empty space.", "negative": "photograph, 3D render, gradient, glossy, outline drawing, clutter, realistic faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 1},
    {"slug": "mid-century", "familySlug": "flat-vector", "label": "Mid-century modern", "summary": "1950s to 60s editorial shapes, grain, warm muted colours", "goodFor": ["business", "lifestyle", "Prime long reads"], "ruleSheet": {"medium": "mid-century editorial illustration with cut shapes, stippled texture and limited overprinted colour", "palette": "mustard #D9A441, burnt orange #C8553D, olive #6B7F3A, teal #2F6F73, cream #F2E8D5, charcoal #2B2B2B", "line": "angular stylised shapes with occasional thin confident outlines", "texture": "dry-brush stipple, halftone grain and slight colour overprint offsets", "composition": "asymmetric balance, strong diagonals, stylised perspective, layered planes", "lighting": "flat with texture-based shading and simple cast shadows", "figures": "elongated, stylised figures with simple oval heads and minimal features", "do": ["use angular stylised forms", "add grain and stipple texture", "stack overlapping colour planes", "keep the palette warm and muted"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no modern gadgets drawn photorealistically", "no neon or saturated digital colour"], "promptCore": "A mid-century modern editorial illustration with angular stylised shapes, stipple and halftone grain, and warm muted colours of mustard, burnt orange, olive and teal on cream. Layered flat planes, strong diagonals and simple elongated figures.", "negative": "photograph, 3D render, neon, glossy, modern flat vector, photorealism, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 2},
    {"slug": "minimal-line", "familySlug": "flat-vector", "label": "Minimal line", "summary": "One confident continuous line on a calm ground, with a single flat accent shape", "goodFor": ["opinion", "personal finance", "wellbeing", "careers", "policy explainers", "tech"], "ruleSheet": {"medium": "single-weight continuous line drawing with one or two flat colour shapes behind it", "palette": "ink navy #1E2A3A line on warm off-white #F7F3EC; one accent shape in terracotta #D9734E or sage #9DB59A; optional ET red #E8262D accent under 5% of the area", "line": "one unbroken monoline of even weight, smooth and economical, drawn as if the pen never leaves the paper", "texture": "clean and flat; at most a faint paper grain", "composition": "a single idea drawn with as few lines as possible, centred or slightly off-centre, at least half the frame left empty", "lighting": "none; no shading, form is implied by the line alone", "figures": "generic figures reduced to a single contour, no facial features beyond a line; never identifiable", "do": ["draw the whole subject with one continuous line", "keep at least half the frame empty", "use one flat accent shape to anchor the idea", "keep line weight even throughout"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no hatching, shading or gradients", "no more than two colours besides the line", "no identifiable faces"], "promptCore": "A minimal continuous single-line drawing in an even ink-navy monoline on a warm off-white ground, with one flat terracotta or sage accent shape behind the subject. The whole idea is drawn with as few lines as possible, no shading, and at least half the frame left calm and empty.", "negative": "shading, hatching, gradients, photograph, 3D render, clutter, multiple line weights, realistic faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 3},
    {"slug": "bold-vector", "familySlug": "flat-vector", "label": "Bold vector", "summary": "Punchy geometric vector art with thick shapes, bright contrast and crisp edges", "goodFor": ["startups", "tech", "markets", "brands", "consumer", "sport business", "explainers"], "ruleSheet": {"medium": "bold vector illustration built from thick geometric shapes and smooth curves with crisp edges", "palette": "high contrast: electric blue #1F4FFF, hot orange #FF6B1A, lemon #FFD60A, deep ink #121826, white #FFFFFF; optional ET red #E8262D as the single strongest accent", "line": "no outlines, or one consistent thick outline in deep ink; perfectly clean vector curves", "texture": "flat fills with optional simple long shadows or a single halftone patch", "composition": "one large, graphic focal object filling much of the frame, strong diagonals, dynamic scale, simple background", "lighting": "flat, with at most one hard-edged highlight and one hard shadow shape per object", "figures": "chunky stylised figures with simple geometric heads and no detailed faces; never identifiable", "do": ["make the focal object big and graphic", "use strong diagonals and bold contrast", "keep every edge crisp and clean", "limit the palette to five colours"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no gradients, glossy effects or realistic texture", "no thin fussy detail", "no identifiable faces"], "promptCore": "A bold vector illustration made of thick geometric shapes and clean curves, with crisp edges, flat high-contrast fills in electric blue, hot orange, lemon yellow and deep ink, and one large graphic focal object on a simple background. Energetic diagonals, no gradients, no fine detail.", "negative": "photograph, 3D render, gradient, glossy, painterly texture, thin lines, clutter, realistic faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 4},
    {"slug": "watercolour", "familySlug": "painting", "label": "Watercolour", "summary": "Transparent washes, paper texture, airy", "goodFor": ["travel", "places", "health", "gentle stories"], "ruleSheet": {"medium": "transparent watercolour on rough cotton paper with light pencil underdrawing", "palette": "soft cerulean #6FA8DC, sap green #7BA05B, rose #E8A0A8, raw sienna #C98B4F, lots of white paper #FFFFFF", "line": "faint pencil underdrawing, edges defined by wet-on-wet and wet-on-dry washes", "texture": "rough cotton paper grain, granulation, blooms and hard drying edges", "composition": "airy, open composition with large untouched paper areas and a gentle focal point", "lighting": "light from the white of the paper, soft transparent shadows", "figures": "lightly painted figures with minimal features, gentle and respectful", "do": ["leave plenty of white paper", "let washes bloom and granulate", "keep it light and transparent", "suggest detail rather than render it"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no opaque heavy paint", "no harsh black outlines"], "promptCore": "A delicate transparent watercolour illustration on rough cotton paper with a faint pencil underdrawing, soft cerulean, sap green and rose washes, blooms and granulation, and large areas of untouched white paper. Airy, gentle and calm.", "negative": "photograph, vector, opaque paint, neon, heavy black lines, 3D render, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 5},
    {"slug": "gouache", "familySlug": "painting", "label": "Gouache editorial", "summary": "Opaque matte gouache, soft edges, rich colour", "goodFor": ["Prime features", "profiles", "culture"], "ruleSheet": {"medium": "opaque matte gouache painting on cold-press paper", "palette": "rich jewel tones: deep green #1E5B4F, ochre #C9922E, plum #6D3B5C, dusty pink #D8A7A0, midnight blue #23305A", "line": "soft painted edges, no outlines, visible brush direction", "texture": "chalky matte paint with slight streaks and paper tooth at the edges", "composition": "storybook framing, layered foreground and background, one warm focal area", "lighting": "soft directional light with warm highlights and cool shadows", "figures": "painted figures with simple features and natural proportions, respectful and calm", "do": ["let brush direction follow form", "use warm light against cool shadow", "keep surfaces matte", "frame the subject with layered foreground shapes"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no hard vector edges", "no glossy or wet-look highlights"], "promptCore": "An editorial gouache painting with opaque, matte, chalky paint and soft brushed edges, in rich jewel tones of deep green, ochre, plum and midnight blue. Warm directional light, layered foreground and background, visible paper tooth.", "negative": "photograph, vector, glossy, 3D render, hard outlines, neon, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 6},
    {"slug": "oil-impasto", "familySlug": "painting", "label": "Oil impasto", "summary": "Thick textured brushwork, dramatic light", "goodFor": ["big-picture essays", "history", "leadership"], "ruleSheet": {"medium": "oil painting with thick impasto brushwork and palette-knife passages", "palette": "umber #5B3A29, cadmium orange #E07A1F, Prussian blue #1F3B57, ivory #EDE6D6, deep crimson #8C1C2B", "line": "bold visible strokes that sculpt form, no drawn lines", "texture": "raised paint ridges, canvas weave visible in thin areas", "composition": "classical, weighty composition with a strong focal subject and dark surroundings", "lighting": "dramatic chiaroscuro, a single strong light source, deep shadows", "figures": "painterly figures with dignified posture, faces suggested by planes of colour", "do": ["sculpt forms with stroke direction", "use one strong light source", "keep dark, rich surroundings", "let texture show in highlights"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no smooth digital blending", "no cartoon proportions"], "promptCore": "A dramatic oil painting with thick impasto brushwork and palette-knife texture, lit by a single strong light source with deep chiaroscuro shadows, in umber, cadmium orange, Prussian blue and ivory. Weighty classical composition with raised paint ridges and visible canvas.", "negative": "photograph, vector, flat colour, cartoon, smooth digital airbrush, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 7},
    {"slug": "digital-painterly", "familySlug": "painting", "label": "Digital painterly", "summary": "Contemporary concept-art finish, cinematic", "goodFor": ["tech futures", "AI", "space", "energy"], "ruleSheet": {"medium": "digital painting with a contemporary concept-art finish and visible brush textures", "palette": "deep space blue #0E1A2B, electric cyan #3FC1C9, warm amber #FFB547, violet #6A4C93, haze grey #9AA5B1", "line": "painterly edges, lost-and-found contours, no ink outlines", "texture": "digital brush texture, atmospheric haze, subtle grain", "composition": "cinematic framing within a square frame, strong depth, a clear focal subject against atmosphere", "lighting": "volumetric light, rim light on the focal subject, glowing accents", "figures": "figures as small silhouettes or painterly forms against vast scenes, never detailed portraits", "do": ["use atmospheric depth and haze", "rim-light the focal subject", "frame it like a film still", "keep brushwork visible"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no photorealistic rendering", "no game-UI elements or screens with writing"], "promptCore": "A cinematic digital painting with a contemporary concept-art finish, visible brush texture, atmospheric haze and volumetric light, in deep space blue, electric cyan and warm amber. Wide framing with strong depth and a rim-lit focal subject.", "negative": "photograph, photorealistic, vector flat, cartoon, UI, screens with text, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 8},
    {"slug": "pencil-sketch", "familySlug": "drawing-sketch", "label": "Pencil sketch", "summary": "Graphite with hatching, reportage feel", "goodFor": ["courts", "hearings", "interviews"], "ruleSheet": {"medium": "graphite pencil drawing in a reportage sketchbook manner", "palette": "graphite greys #3A3A3A to #BDBDBD on warm sketchbook paper #F4EFE4; optional single muted wash of slate blue #6B7F99", "line": "searching, observational lines with cross-hatching and some construction lines left visible", "texture": "paper tooth, smudges, soft eraser marks", "composition": "on-the-spot reportage framing, the subject drawn fully and the surroundings left loose and unfinished", "lighting": "tone built by hatching density, strong side light", "figures": "observational figures with natural proportions, faces drawn simply and without exaggeration", "do": ["leave construction lines visible", "finish the focal subject and let edges fade out", "build tone with hatching", "keep it observational, not stylised"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no colour beyond one muted wash", "no caricature or exaggeration"], "promptCore": "A graphite pencil reportage sketch on warm sketchbook paper, with searching observational lines, cross-hatching and visible construction lines. The focal subject is fully drawn while the surroundings fade into loose unfinished strokes.", "negative": "photograph, colour painting, vector, ink, digital, cartoon, caricature, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 9},
    {"slug": "charcoal", "familySlug": "drawing-sketch", "label": "Charcoal", "summary": "Smudged charcoal, deep blacks, gravity", "goodFor": ["serious stories", "sombre stories"], "ruleSheet": {"medium": "compressed and willow charcoal on heavy grey-toned paper", "palette": "charcoal black #111111, smoky greys #555555 to #A0A0A0, toned paper #D8D4CC, white chalk highlights #F2F2F2", "line": "broad expressive strokes, smudged edges, few hard lines", "texture": "heavy paper tooth, dust, finger smudges, lifted highlights", "composition": "quiet, weighty composition with large dark areas and one point of light", "lighting": "low-key lighting, deep blacks, a single soft light source", "figures": "figures only as silhouettes or turned away, never identifiable faces", "do": ["use large areas of deep black", "lift a single point of light", "keep the mood quiet and respectful", "prefer symbolic objects over people"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no colour", "no identifiable faces or graphic detail"], "promptCore": "A sombre charcoal drawing on grey-toned paper with deep smudged blacks, smoky greys and a single soft point of light lifted in white chalk. Quiet, weighty composition with expressive broad strokes; any figures appear only as silhouettes.", "negative": "photograph, colour, vector, cartoon, bright, cheerful, gore, faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 10},
    {"slug": "ink-wash", "familySlug": "drawing-sketch", "label": "Ink and wash", "summary": "Loose ink line with grey and one accent wash", "goodFor": ["markets", "analysis", "opinion"], "ruleSheet": {"medium": "black ink brush line with grey wash on off-white paper", "palette": "ink black #1D1D1B, warm greys #8A8580 and #C9C4BC, paper #F5F1E8; one accent: ET red #E8262D at most 10% of the area", "line": "confident, varied weight, loose, some dry-brush strokes", "texture": "visible paper grain, wash blooms and soft pooled edges", "composition": "one strong focal element, generous negative space, off-centre placement", "lighting": "implied by wash density, no gradients or airbrush", "figures": "simplified faces with a few strokes, no caricature, natural proportions", "do": ["use a single visual metaphor", "leave the top-left third calm for headlines", "let wash bleed past the line in places", "keep the accent colour to one small area"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no more than one accent colour", "no photoreal faces"], "promptCore": "An editorial illustration in loose black ink brush line with soft grey wash on textured off-white paper, with a single small accent of red. Confident varied strokes, visible paper grain and pooled wash edges, one strong focal element and generous empty space.", "negative": "photograph, 3D render, vector flat, neon, heavy colour, digital gradient, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 11},
    {"slug": "stipple-hedcut", "familySlug": "drawing-sketch", "label": "Stipple hedcut", "summary": "Hand-inked stipple and engraved-line drawing in the newspaper hedcut manner, applied to objects, buildings and scenes on bare white paper", "goodFor": ["business news", "markets and finance", "company stories", "banking", "commodities", "economy explainers", "products and objects", "infrastructure", "policy and regulation", "corporate earnings"], "ruleSheet": {"medium": "Pen-and-ink stipple combined with fine engraved hatching on smooth white paper, like newspaper hedcuts and banknote engraving.", "palette": "Black ink #111111 on warm newsprint white #F7F4EC; at most one muted accent, e.g. banknote green #4E6B52 or oxblood #7A2E2A, used sparingly as a flat tint.", "line": "Tone built only from dots of varied size and spacing plus parallel and cross hatching that follows the form; very few hard outlines; no grey fills or gradients.", "texture": "Visible individual ink dots and engraved-line rhythm; crisp paper white in highlights; no wash, no smudge, no digital noise.", "composition": "One clear subject or small grouped still life, centred or in a tight vignette that fades to white at the edges; generous empty ground; reads at small column width.", "lighting": "Single directional light from upper left; dense dots and crossed lines in shadow, sparse dots to bare paper in highlights; strong 3D modelling.", "figures": "generic, never identifiable people; no portraits or likenesses of real persons; figures, if any, are small anonymous silhouettes, hands or backs rendered in the same stipple", "do": ["build every tone from dots and engraved hatching", "keep the background bare white or a soft vignette", "show objects with solid volume and a single light source", "use a crisp, precise, hand-inked finish", "keep to black ink with at most one muted accent"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no portraits or recognisable faces of real people", "no smooth grey gradients, airbrush or photo halftone screens", "no colour washes or full-colour rendering", "no cartoon outlines or flat vector shapes"], "promptCore": "Hand-inked stipple and engraving illustration on white paper: the subject is modelled entirely with thousands of tiny black ink dots of varying density plus fine parallel and cross-hatched engraved lines that follow its contours, like a newspaper hedcut or banknote vignette. Single light from upper left, dense dots in shadow, bare paper in highlights, soft vignette edges, crisp precise penwork, monochrome black ink with optional single muted accent tint.", "negative": "text, letters, numbers, logo, watermark, signature, photo, photorealistic, smooth gradient, airbrush, colour wash, watercolour, flat vector, cartoon, 3d render, blur, celebrity likeness, portrait of real person"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 12},
    {"slug": "linocut", "familySlug": "print-poster", "label": "Linocut", "summary": "Carved relief print, bold black with one colour", "goodFor": ["agriculture", "labour", "rural economy"], "ruleSheet": {"medium": "linocut relief print with carved gouge marks, printed in black plus one colour", "palette": "print black #161616, one colour chosen per image from brick red #B23A2E, indigo #2E3F7F or turmeric #D9A21B, on natural paper #F1EAD8", "line": "bold carved shapes, gouge-mark hatching, chunky confident contours", "texture": "uneven ink coverage, paper showing through, slight print registration shift", "composition": "strong, graphic, poster-like composition with clear silhouettes", "lighting": "no modelling; light expressed by carved white lines", "figures": "sturdy, dignified working figures with simplified carved features", "do": ["use carved gouge marks for tone", "limit to black plus one colour", "keep silhouettes bold", "let paper texture show through ink"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no gradients", "no fine photographic detail"], "promptCore": "A linocut relief print with bold carved shapes and gouge-mark hatching, printed in black and a single colour on natural paper, with uneven ink coverage and slight registration shift. Strong graphic composition with sturdy, dignified figures.", "negative": "photograph, gradient, digital painting, 3D render, smooth shading, many colours, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 13},
    {"slug": "risograph", "familySlug": "print-poster", "label": "Risograph", "summary": "Two-colour riso print, grain, slight misregistration", "goodFor": ["startups", "youth", "culture", "tech"], "ruleSheet": {"medium": "two-colour risograph print with overprinting and grainy texture", "palette": "fluorescent pink #FF48B0 and teal #00838A, overprint blend, on off-white #F7F3EA; alternate pair: blue #0078BF and yellow #FFE800", "line": "simple bold shapes, some line work, playful and graphic", "texture": "heavy grain, halftone dots, visible misregistration between the two colours", "composition": "bold, playful composition with overlapping forms where the two inks mix", "lighting": "flat, tone built with halftone and grain only", "figures": "friendly simplified figures, expressive but not caricatured", "do": ["use exactly two inks", "let overprint create a third colour", "show misregistration on purpose", "keep shapes bold and playful"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no more than two ink colours", "no photographic detail"], "promptCore": "A two-colour risograph print in fluorescent pink and teal on off-white paper, with heavy grain, halftone dots, overprinted areas and slight misregistration between the inks. Bold, playful shapes and friendly simplified figures.", "negative": "photograph, full colour, gradient, 3D render, glossy, realistic, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 14},
    {"slug": "screen-print", "familySlug": "print-poster", "label": "Screen print", "summary": "Silkscreen poster look: a few flat opaque ink layers, bold shapes, halftone dot shading and slight registration offsets on textured paper", "goodFor": ["feature openers", "culture and events", "travel and places", "industry stories", "energy and resources", "cities and urban life", "sports", "festivals", "agriculture", "explainers"], "ruleSheet": {"medium": "Hand-pulled screen print (serigraph) of 3 to 6 separately printed flat ink layers on uncoated poster paper.", "palette": "Limited spot inks, e.g. vermilion #E4572E, mustard #F2C14E, cobalt #2E6F95, teal #2A9D8F, near-black #1B1B1E on cream stock #F3EBDD; overprints create darker mixes; never more than 6 inks.", "line": "Bold flat shapes with clean cut edges; a single dark key layer carries the drawing; brush or cut-stencil edges, not vector-perfect strokes.", "texture": "Coarse round halftone dots for shading and gradients, slight ink build-up and pinholes, faint squeegee streaks, 1-2 mm registration offsets showing paper slivers between colours.", "composition": "Poster-like: strong central motif or silhouette, layered foreground/midground/background planes, large calm areas of flat colour, clear negative space.", "lighting": "Implied by flat colour planes and halftone fades rather than modelling; dusk, night or sunlit scenes shown through 2-3 value steps.", "figures": "generic, never identifiable people; simplified silhouettes or stylised figures built from flat shapes, no likenesses", "do": ["limit to a few flat opaque inks with visible overprint", "shade only with halftone dots", "show slight misregistration between layers", "keep shapes bold and readable at a distance", "let the paper colour show through as a colour"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no photographic detail or smooth digital gradients", "no more than six ink colours", "no glossy 3D rendering, glow or lens effects", "no recognisable film, band or brand characters"], "promptCore": "Screen-printed poster illustration made of four or five flat opaque spot inks on cream paper: bold simplified shapes, a dark key layer, coarse halftone dot shading for gradients, visible overprint colour mixes, slight registration offsets leaving thin paper gaps, faint ink texture and squeegee grain. Clear layered planes and strong silhouette, mid-century gig-poster craft, no gradients beyond halftone.", "negative": "text, letters, numbers, typography, logo, watermark, signature, photo, photorealistic, smooth gradient, airbrush, 3d render, glossy, lens flare, neon glow, watercolour, pencil sketch, celebrity likeness"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 15},
    {"slug": "vintage-poster", "familySlug": "print-poster", "label": "Vintage poster", "summary": "1920s-50s travel, propaganda and constructivist poster art: bold simplified forms, heroic angles and flat lithographic colour, with no lettering", "goodFor": ["travel and tourism", "infrastructure and railways", "aviation and shipping", "manufacturing and industry", "national campaigns", "energy", "cities", "agriculture", "economy and growth", "anniversaries"], "ruleSheet": {"medium": "Stone-lithograph-style poster painting with flat gouache-like colour areas, as in interwar travel, propaganda and constructivist posters.", "palette": "Signal red #C8102E, parchment cream #F4E3B2, deep navy #1F3A5F, ochre #E9A23B, sage #5B8C5A, ink black #2A2A2A; 4-6 colours, sun-faded and slightly warm.", "line": "Minimal outlines; forms defined by crisp flat colour shapes, geometric simplification, streamlined curves and strong diagonals.", "texture": "Subtle lithographic grain and slight paper ageing; soft airbrushed sky gradients allowed only as in period posters; no modern digital effects.", "composition": "Heroic and graphic: low horizon or worm's-eye view, monumental subject, radiating rays or bold diagonals, strong figure-ground, large clear sky or colour field (left empty, never filled with words).", "lighting": "Bright, idealised sunlight or dramatic dawn/dusk, shadows as single flat darker shapes, rim light on machines and silhouettes.", "figures": "generic, never identifiable people; idealised anonymous workers, travellers or crowds as simplified silhouettes and flat shapes, no leaders, politicians or likenesses", "do": ["simplify every form to bold geometric shapes", "use a limited period palette of 4-6 flat colours", "use heroic low angles, diagonals and radiating lines", "keep large calm areas of flat colour", "evoke 1920s-50s travel or constructivist poster craft"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no lettering, slogans, headlines, banners or poster typography of any kind", "no real political leaders, flags or party symbols", "no photographic detail, lens effects or 3D rendering", "no modern gadgets or anachronistic digital styling"], "promptCore": "Vintage 1930s travel and constructivist poster illustration with no lettering: monumental subject seen from a heroic low angle, bold geometric simplified forms, flat lithographic colour in a limited faded palette of signal red, cream, navy and ochre, strong diagonals and radiating rays, subtle grain and aged paper. Idealised anonymous figures as silhouettes, clean empty colour fields where a title would sit left blank.", "negative": "text, letters, numbers, words, slogan, headline, typography, banner, logo, watermark, signature, flag, political symbol, photo, photorealistic, 3d render, glossy, lens flare, modern UI, celebrity or politician likeness"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 16},
    {"slug": "collage", "familySlug": "collage-mixed", "label": "Paper collage", "summary": "Cut paper, textures, halftone, torn edges", "goodFor": ["politics", "culture", "multi-angle stories"], "ruleSheet": {"medium": "mixed-media collage of torn paper, halftone fragments, painted marks and textures", "palette": "newsprint grey #D6D2C8, ink black #1A1A1A, ET red #E8262D, mustard #D4A017, cobalt #2F4FA8", "line": "torn and cut edges, occasional scribbled marker lines", "texture": "halftone dots, paper grain, tape and fold marks", "composition": "layered, dynamic composition of fragments that together form one idea", "lighting": "flat, with shadows only where paper overlaps", "figures": "figures built from cut shapes and halftone silhouettes, no recognisable real faces", "do": ["layer fragments to build one idea", "mix torn edges with clean cuts", "use halftone texture", "keep a clear focal point despite the layers"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no readable newspaper text in fragments", "no recognisable faces cut from photos"], "promptCore": "A mixed-media editorial collage of torn and cut paper, halftone fragments, tape and painted marks in newsprint grey, black, red, mustard and cobalt. Layered fragments combine into one clear idea with a strong focal point.", "negative": "single photograph, clean vector, 3D render, readable newspaper text, real faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 17},
    {"slug": "photo-collage", "familySlug": "collage-mixed", "label": "Photo collage", "summary": "Cut-out photo elements composed surreally", "goodFor": ["tech", "economy", "culture"], "ruleSheet": {"medium": "surreal collage of cut-out photographic objects with clean cut edges", "palette": "clean studio backgrounds in pale blue #DCE8F2 or blush #F4DCD6, with natural object colours and one bold accent", "line": "clean cut-out edges with subtle drop shadows", "texture": "photographic textures of each object, consistent lighting across cut-outs", "composition": "a surreal juxtaposition of a few objects that creates a visual metaphor", "lighting": "consistent soft studio light across all elements", "figures": "never people; objects, plants, buildings and abstract forms only", "do": ["build a clear surreal metaphor", "match lighting across elements", "keep the set clean and minimal", "use three to five objects at most"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people or body parts", "no depiction of a real news event"], "promptCore": "A surreal photographic collage of a few cut-out objects arranged into a visual metaphor on a clean pale studio background, with consistent soft lighting, subtle drop shadows and one bold accent colour. Objects only, no people.", "negative": "people, faces, hands, crowds, news event, illustration, drawing, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": true}, "sortOrder": 18},
    {"slug": "torn-paper", "familySlug": "collage-mixed", "label": "Torn paper", "summary": "Hand-torn paper collage with ragged white fibre edges, layered coloured papers and mixed-media marks", "goodFor": ["opinion", "economy", "policy", "climate", "health", "society", "explainers", "culture"], "ruleSheet": {"medium": "physical collage of hand-torn coloured and printed papers, glued in overlapping layers, optionally with gouache, crayon or pencil marks, photographed or scanned flat", "palette": "limited 4-6 colour paper palette on a warm off-white ground: paper white #F4EFE6, newsprint grey #CFCAC0, ink black #1E1E1E, tomato red #D9472B, ochre #E0A030, deep blue #2C4A7A, sage #8FA88A", "line": "no outlines; shapes defined by ragged torn edges with a thin white fibrous core showing where the paper ripped; occasional loose crayon or pencil scribble", "texture": "visible paper grain, deckle and fibre edges, slight paper curl and soft drop shadows between layers, printed halftone or newsprint scraps, uneven glue wrinkles", "composition": "one bold central idea built from 3-7 large torn shapes, generous negative space, layered overlaps that create depth, simple editorial metaphor readable at thumbnail size", "lighting": "flat even scan or soft top light; only tiny contact shadows where paper layers lift", "figures": "simplified silhouettes or anonymous figures torn from paper, no facial detail beyond a few torn shapes; never a recognisable real person", "do": ["show raw torn edges with white fibre on most shapes", "layer papers so overlaps are visible", "use a restrained palette of 4-6 paper colours", "mix plain coloured paper with a few printed or newsprint scraps", "keep the concept to one clear visual metaphor", "leave breathing room around the main shape"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no clean vector edges or perfectly cut geometric shapes everywhere", "no glossy 3D render or photoreal lighting", "no recognisable real people or celebrity likenesses", "no busy wallpaper-like pattern filling the whole frame"], "promptCore": "Hand-made collage of torn coloured paper layered on a warm off-white sheet: bold shapes ripped by hand with ragged edges and a thin white fibrous core, a few scraps of printed newsprint and halftone paper, subtle paper grain and soft contact shadows where layers overlap, limited palette of red, ochre, deep blue and black, one simple central editorial metaphor with generous negative space, flat scanned look.", "negative": "text, letters, words, numbers, captions, logo, watermark, signature, vector art, clean digital edges, 3D render, glossy, photorealistic, gradient mesh, real person likeness, cluttered pattern"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 19},
    {"slug": "double-exposure", "familySlug": "collage-mixed", "label": "Double exposure", "summary": "Silhouette filled with a scene", "goodFor": ["profiles of sectors", "cities", "ideas"], "ruleSheet": {"medium": "double-exposure photograph: an anonymous silhouette or object shape filled with a second scene", "palette": "monochrome base #1C1C1C to #F2F2F2 with the inner scene in one muted tint: teal #2E6F73 or warm amber #D99A4E", "line": "the silhouette edge is clean; the inner scene blends softly", "texture": "photographic, soft blend with fine grain", "composition": "a single silhouette or shape against a pale background, the inner scene telling the story", "lighting": "soft, even light; the inner scene carries its own light", "figures": "only one anonymous silhouette in profile or from behind, never an identifiable face", "do": ["keep the silhouette anonymous", "let the inner scene tell the story", "use a pale clean background", "limit colour to one muted tint"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no identifiable face", "no depiction of a real news event"], "promptCore": "A double-exposure photographic image of a single anonymous silhouette in profile against a pale background, filled with a second scene that tells the story, blended softly in monochrome with one muted teal tint.", "negative": "identifiable face, portrait, crowds, news event, illustration, cartoon, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 20},
    {"slug": "paper-cut", "familySlug": "handmade-craft", "label": "Paper cut", "summary": "Layered cut paper with soft shadows", "goodFor": ["explainers", "finance basics", "festivals"], "ruleSheet": {"medium": "layered cut-paper craft photographed in soft studio light", "palette": "marigold #F2A541, leaf green #4C9A2A, deep teal #145C6E, rani pink #C83E7A, paper white #FAF7F2", "line": "clean cut edges, no drawn lines", "texture": "visible paper fibres, slight curl at edges, layered thickness", "composition": "stacked depth layers from background to foreground, centred or rule-of-thirds focal piece", "lighting": "soft top light casting gentle drop shadows between layers", "figures": "cut-paper figures with simple shapes, no facial detail beyond a few cut holes", "do": ["build depth with five or more layers", "show soft shadows between layers", "keep edges crisp", "use festive, warm colour combinations"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no drawn ink lines", "no glossy plastic look"], "promptCore": "A layered cut-paper craft illustration photographed in soft studio light, with crisp cut edges, visible paper fibres and gentle shadows between stacked layers, in marigold, leaf green, deep teal and rani pink. Clear depth from background to foreground.", "negative": "drawing, ink line, vector flat, plastic, glossy 3D, photograph of people, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 21},
    {"slug": "clay-puppet", "familySlug": "handmade-craft", "label": "Clay", "summary": "Stop-motion clay figures and sets", "goodFor": ["light satire", "politics (non-sensitive)"], "ruleSheet": {"medium": "stop-motion plasticine figures on a handmade miniature set", "palette": "saturated but soft clay colours: tomato red #D9483B, butter yellow #F2C94C, sky #6FB3E0, grass #5DAA4F, skin tones in warm natural clay", "line": "rounded sculpted forms, no lines", "texture": "visible fingerprints and tool marks in the clay, handmade set materials", "composition": "a small theatrical scene on a set, characters interacting, shallow depth of field", "lighting": "soft key light with a warm fill, small practical lights on the set", "figures": "generic clay characters with big simple eyes; never a likeness of any real person", "do": ["show fingerprints and tool marks", "keep it playful but not mocking", "build a small theatrical set", "use shallow depth of field"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no likeness of any real person", "never used for sensitive stories"], "promptCore": "A stop-motion clay animation still: handmade plasticine characters with visible fingerprints and tool marks on a small handcrafted set, soft key light and shallow depth of field, in saturated soft clay colours. Playful and theatrical, with generic characters.", "negative": "photograph of real people, realistic faces, likeness of real person, vector, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 22},
    {"slug": "felt-textile", "familySlug": "handmade-craft", "label": "Felt and textile", "summary": "Stitched felt and fabric shapes with visible thread, soft and handmade", "goodFor": ["personal finance", "families", "health", "education", "festivals", "consumer"], "ruleSheet": {"medium": "handmade felt and fabric appliqué with visible stitching, photographed in soft light", "palette": "soft wool colours: berry #B23A5A, mustard #DDAA3B, teal #2F7F7A, cream #F1E7D3, grey #8E8E8E on a linen or felt background", "line": "running stitches and blanket stitches in contrasting thread define edges and details", "texture": "fuzzy felt surfaces, woven fabric texture, thread loops, slight puckering", "composition": "simple layered shapes on a fabric ground, one clear focal object, shallow depth", "lighting": "soft diffused daylight with gentle shadows under raised layers", "figures": "plush generic figures with button or stitched eyes; never identifiable", "do": ["show felt fuzz and fabric weave up close", "outline shapes with visible stitches", "keep shapes simple and soft", "use a fabric or linen ground"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no glossy plastic or 3D render look", "no printed patterns that read as text", "no identifiable faces"], "promptCore": "A handmade felt and fabric appliqué scene photographed in soft daylight: simple shapes cut from fuzzy wool felt in berry, mustard, teal and cream, edged with visible running and blanket stitches in contrasting thread, layered on a linen background with gentle shadows, warm and tactile.", "negative": "glossy, plastic, 3D render, vector, photograph of people, printed text, embroidery lettering, clutter, realistic faces"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 23},
    {"slug": "origami", "familySlug": "handmade-craft", "label": "Origami", "summary": "Folded paper forms with crisp creases and soft studio light", "goodFor": ["explainers", "logistics", "startups", "finance basics", "environment", "trade"], "ruleSheet": {"medium": "folded paper origami models photographed on a seamless paper backdrop", "palette": "matte coloured papers: coral #F07C5A, sky #7FB7D9, leaf #6BAA5E, sun #F2C14E, white #FAFAF7 on a pale backdrop #EEF0F2", "line": "no drawn lines; forms are defined by sharp folds and creases", "texture": "matte paper with visible crease lines and slight fibre texture", "composition": "one or a few folded models as a small scene, clean backdrop, generous space", "lighting": "soft directional studio light from one side so each folded facet reads as a different tone, gentle contact shadows", "figures": "folded paper figures with no faces; never identifiable", "do": ["show crisp folds and faceted planes", "light from one side so facets read clearly", "keep the backdrop seamless and plain", "use matte coloured paper"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no printed patterns or writing on the paper", "no glossy plastic look", "no real people"], "promptCore": "Origami paper models folded from matte coloured paper in coral, sky blue, leaf green and sun yellow, with crisp creases and faceted planes, arranged as a small scene on a pale seamless paper backdrop, lit by soft directional studio light so each fold reads as a different tone, gentle contact shadows.", "negative": "printed paper, writing, glossy, plastic, 3D render look, illustration, clutter, people, faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 24},
    {"slug": "soft-3d", "familySlug": "render-3d", "label": "Soft 3D", "summary": "Rounded matte 3D objects, studio light", "goodFor": ["personal finance", "products", "apps"], "ruleSheet": {"medium": "soft matte 3D render with rounded clay-like objects", "palette": "pastel lavender #C3B1E1, mint #B8E0D2, peach #FFC8A2, butter #FFE8A3, background soft blue-grey #E6ECF2; optional ET red #E8262D on one object", "line": "no lines; rounded bevelled forms", "texture": "matte, slightly soft surfaces, no reflections", "composition": "a few hero objects floating or resting on a seamless studio backdrop, centred and balanced", "lighting": "soft global illumination, gentle contact shadows", "figures": "generic rounded mannequin figures only, no faces", "do": ["round every edge", "keep surfaces matte", "use seamless pastel backdrops", "show soft contact shadows"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no glossy or chrome materials", "no realistic human faces"], "promptCore": "A soft matte 3D render of rounded, clay-like objects on a seamless pastel studio backdrop, lit with soft global illumination and gentle contact shadows, in lavender, mint, peach and butter yellow. Simple, friendly and balanced.", "negative": "photograph, glossy, chrome, realistic textures, faces, vector flat, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 25},
    {"slug": "isometric", "familySlug": "render-3d", "label": "Isometric 3D", "summary": "30-degree isometric scenes, tidy and diagrammatic", "goodFor": ["tech", "infrastructure", "supply chains"], "ruleSheet": {"medium": "clean isometric illustration on a strict 30-degree grid", "palette": "slate #3D4A5C, sky blue #7FB3D5, mint #A8DADC, warm white #F8F9FA, signal yellow #F4D35E; optional ET red #E8262D for one highlighted element", "line": "thin uniform strokes or none; perfectly parallel isometric edges", "texture": "smooth flat fills with gentle top, left and right face tonal steps", "composition": "a contained isometric platform or block scene, tidy flow from one corner to the other, lots of breathing room", "lighting": "consistent light from top-left: top faces lightest, right faces darkest", "figures": "tiny generic figures only, a few pixels of detail, never identifiable", "do": ["keep every edge on the 30-degree grid", "show flow between components", "group the scene on one platform", "use tonal steps on each face for depth"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no perspective distortion", "no large or detailed human figures"], "promptCore": "A clean isometric explainer illustration on a strict 30-degree grid, a tidy contained scene on a single platform with smooth flat fills and consistent top-left lighting, in slate, sky blue, mint and warm white with a signal yellow highlight. Tiny generic figures only.", "negative": "photograph, perspective view, painterly texture, messy, large people, faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 26},
    {"slug": "low-poly", "familySlug": "render-3d", "label": "Low poly", "summary": "Faceted low-polygon 3D forms with flat-shaded triangles and clean gradients of light", "goodFor": ["tech", "energy", "space", "infrastructure", "geography", "markets"], "ruleSheet": {"medium": "low-polygon 3D render with visible triangular facets and flat shading", "palette": "cool to warm ramp: deep indigo #2B2D6E, teal #2A9D8F, mint #A8E6CF, peach #FFB385, coral #F2645A; soft light background #EEF1F6", "line": "no outlines; edges are the boundaries between flat-shaded facets", "texture": "perfectly smooth facets, each triangle a single flat tone", "composition": "one sculptural object or small landscape on a plain background, slight three-quarter view, generous space", "lighting": "single soft key light so neighbouring facets step through clear tonal changes, soft ground shadow", "figures": "faceted generic figures without facial features; never identifiable", "do": ["keep facets large and clearly visible", "shade each facet flat", "use a smooth cool-to-warm palette", "keep the background plain"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no smooth subdivided surfaces or realistic materials", "no outlines or cel lines", "no identifiable faces"], "promptCore": "A low-poly 3D render of a sculptural object made of large visible triangular facets, each flat-shaded in a smooth palette running from deep indigo and teal to mint, peach and coral, on a plain light background, lit by a single soft key light so the facets step through clear tones, with a soft ground shadow.", "negative": "smooth surfaces, realistic materials, photograph, outlines, cel shading, clutter, high detail, realistic faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 27},
    {"slug": "diorama", "familySlug": "render-3d", "label": "Miniature diorama", "summary": "Tilt-shift miniature world", "goodFor": ["cities", "real estate", "logistics"], "ruleSheet": {"medium": "miniature model diorama photographed with a tilt-shift effect", "palette": "natural model colours: brick #B5543C, asphalt #4A4A4A, park green #6E9E4A, sky #9CC7E8, warm light #FFD9A0", "line": "no lines; crisp model edges", "texture": "model-railway textures: flock grass, painted plastic, tiny printed details without readable signs", "composition": "high-angle view of a small world, a narrow band of sharp focus across the focal point", "lighting": "warm late-afternoon light, small long shadows", "figures": "tiny generic model figures only, never identifiable", "do": ["shoot from a high angle", "keep a narrow band of focus", "make it feel like a hand-built model", "use warm low-angle light"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no readable signs or street names", "no close-up people"], "promptCore": "A miniature model diorama of a small world, photographed from a high angle with a tilt-shift lens so only a narrow band is in focus, warm late-afternoon light and tiny long shadows. Hand-built model textures and tiny generic figures.", "negative": "full-size photograph, close-up people, readable signs, vector, painting, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 28},
    {"slug": "still-life", "familySlug": "photo-realism", "label": "Object still life", "summary": "Studio photo of symbolic objects", "goodFor": ["personal finance", "commodities", "earnings"], "ruleSheet": {"medium": "studio still-life photograph of symbolic objects", "palette": "neutral backdrops in warm grey #CFC8BE, deep green #1F3D33 or terracotta #B8643F, with natural object colours", "line": "photographic, crisp edges", "texture": "real material textures: metal, paper, wood, fabric", "composition": "a small arrangement of objects with a clear hero object, minimal and considered", "lighting": "soft studio key light with a gentle shadow, controlled reflections", "figures": "never people; objects only", "do": ["use a small, considered arrangement", "make one object the hero", "use soft studio light", "choose objects that symbolise the story"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people, hands or body parts", "no depiction of a real news event"], "promptCore": "A minimal studio still-life photograph of a few symbolic objects on a neutral backdrop, with a clear hero object, real material textures and soft studio light with a gentle shadow. Objects only, no people.", "negative": "people, hands, faces, news event, crowd, illustration, cartoon, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 29},
    {"slug": "conceptual-photo", "familySlug": "photo-realism", "label": "Conceptual photo", "summary": "Studio photographs of real objects staged as visual metaphors: surreal props, handmade set pieces and clean, deliberate composition", "goodFor": ["economy", "markets", "inflation", "policy", "technology", "climate", "business strategy", "personal finance", "opinion"], "ruleSheet": {"medium": "photograph of a physical, hand-built set: real objects, props and simple constructed set pieces shot in a studio, minimal retouching", "palette": "one dominant flat background colour plus 2-3 object colours: warm paper #EDE6DA, butter yellow #F2C94C, coral #E8664A, teal #2E7D7A, charcoal #2B2B2B, metallic gold #C9A227", "line": "crisp real-world edges from the objects themselves; strong silhouettes against a seamless backdrop", "texture": "tactile real materials: paper, metal, wax, fabric, food, ceramic, plastic; visible surface detail and slight imperfections that prove it is handmade", "composition": "single hero object or small group centred or on a clear diagonal, seamless sweep or tabletop, lots of negative space, one surprising transformation (melting, breaking, balancing, sprouting) carrying the idea", "lighting": "controlled studio light: one hard key light with a crisp cast shadow, or soft overhead window-like light; no colour-gelled club lighting", "figures": "no people", "do": ["build the idea from one or two everyday objects transformed in a surprising way", "use a seamless single-colour background", "keep the shadow believable and physically consistent", "make materials look tactile and real", "leave clean negative space for a headline to sit outside the image", "keep it to one clear metaphor"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people", "nothing that looks like a real news photograph of an event", "no banknotes or coins of a real currency with readable markings", "no CGI-looking plastic sheen or impossible floating clutter", "no busy backgrounds or real locations"], "promptCore": "Studio photograph of a hand-built conceptual still life: a single everyday object physically transformed into a visual metaphor (melting, cracking, balancing or growing), set on a seamless single-colour paper backdrop, one hard key light casting a crisp shadow, tactile real materials with small handmade imperfections, generous negative space, clean editorial magazine look, sharp focus, true-to-life colour.", "negative": "people, hands, faces, text, letters, numbers, writing, logo, brand, watermark, signature, news photo, crowd, street, CGI render, plastic sheen, cluttered background, readable currency"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 30},
    {"slug": "duotone", "familySlug": "photo-realism", "label": "Duotone", "summary": "Two-tone photo treatment of places or objects", "goodFor": ["markets", "corporate", "cities"], "ruleSheet": {"medium": "duotone photographic treatment mapped to two inks", "palette": "pairs: navy #14213D with amber #FCA311, or deep teal #0B3C49 with coral #FF6F59, or black #111111 with ET red #E8262D", "line": "photographic edges with high contrast", "texture": "smooth tonal mapping, optional fine grain", "composition": "bold architectural or object crops, strong geometry, lots of sky or negative space", "lighting": "high contrast, graphic light and shadow", "figures": "never people", "do": ["map the photo to exactly two colours", "crop boldly for geometry", "keep strong contrast", "use places and objects only"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people", "no depiction of a real news event or a recognisable landmark under incident"], "promptCore": "A bold duotone photographic image of architecture, places or objects mapped to two inks, navy and amber, with strong contrast, graphic geometry and generous negative space. No people.", "negative": "people, faces, crowds, full colour, illustration, cartoon, news event, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 31},
    {"slug": "cinematic-scene", "familySlug": "photo-realism", "label": "Cinematic scene", "summary": "Moody, film-like photographs of empty places and industrial sites at dusk or night, with no identifiable people", "goodFor": ["infrastructure", "manufacturing", "trade", "ports", "energy", "real estate", "urban economy", "logistics", "night economy"], "ruleSheet": {"medium": "photograph, as if shot on a medium-format or cinema camera with a long exposure; colour negative film look", "palette": "film-graded night palette: sodium orange #E38B2C, teal shadow #1F4E5A, deep navy sky #14213D, mercury green #7FA88B, warm white #F2E6CF, near-black #0E0E10", "line": "clean architectural lines, strong verticals kept straight, crisp silhouettes of structures against the sky", "texture": "fine film grain, soft halation around light sources, light haze, mist or wet reflective ground", "composition": "wide, often symmetrical or one-point-perspective frame; a single lit subject (factory, crane, petrol station, port, empty street, diner) isolated in darkness; low horizon and lots of atmosphere", "lighting": "blue hour or night; practical light sources only (streetlamps, floodlights, neon, windows) creating pools of light and long shadows; no flash", "figures": "no people", "do": ["isolate one lit place or structure in a dark surrounding", "use practical light sources with visible glow and halation", "keep perspective lines straight and the frame calm", "add atmosphere with haze, mist or wet ground", "grade the colour like a film still with teal shadows and warm highlights", "keep the scene generic so it is not a specific identifiable landmark"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people", "nothing that looks like a real news photograph of an event", "no readable signs, billboards, licence plates or shop names", "no fire, explosions, accidents or disaster aftermath", "no HDR halo or oversaturated neon"], "promptCore": "Cinematic night photograph of an empty place: a single lit industrial or urban scene such as a refinery, container port crane, petrol forecourt, factory gate or deserted street, glowing under sodium and fluorescent practical lights in a dark blue-hour sky, light haze and wet reflective ground, straight architectural lines, wide calm composition, film grain and soft halation, teal shadows and warm orange highlights, quiet and still.", "negative": "people, person, crowd, figure, face, car occupants, text, letters, numbers, signage, billboard text, licence plate, logo, brand, watermark, signature, news photo, fire, explosion, accident, HDR, oversaturated, cartoon, illustration"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 32},
    {"slug": "editorial-cartoon", "familySlug": "cartoon-comic", "label": "Editorial cartoon", "summary": "Newspaper-cartoon pen line and watercolour wash with comic exaggeration, applied to objects, symbols and generic figures", "goodFor": ["economy and markets", "inflation and prices", "budget and tax", "policy debates", "corporate governance", "tech disruption", "jobs and workplace", "opinion pages", "climate and energy"], "ruleSheet": {"medium": "dip-pen or brush ink line drawing finished with loose watercolour and grey ink wash on off-white cartoon paper", "palette": "warm paper white #F6F1E6, ink black #1A1A1A, wash grey #8C8C8C, brick red #B5523B, faded blue #5B7FA6, mustard #D9A93F, sage #9DB08A; colour applied sparingly as transparent washes", "line": "confident variable-weight nib line with pressure swells, cross-hatching in shadows, slightly wobbly hand-drawn contours", "texture": "watercolour blooms, granulation and dry-brush edges; wash slips loosely past the ink lines; visible paper grain", "composition": "single-panel gag built on one clear visual metaphor; exaggerated scale contrasts (giant coin, tiny figure); minimal setting with a simple ground line; generous white space", "lighting": "flat; form implied by wash shading and hatching only, no realistic light sources", "figures": "generic, never identifiable people: everyman workers, investors, shoppers and officials with big noses, oversized shoes and simplified faces; anthropomorphic objects such as piggy banks, charts, coins and buildings", "do": ["build the image around one strong visual metaphor made of everyday objects", "exaggerate proportions and scale for comic effect", "let wash colour sit loosely inside and outside the ink lines", "keep the background minimal so the gag reads instantly", "use hatching and grey wash for shadow and depth", "give generic figures expressive body language"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no caricatures or likenesses of real politicians, celebrities or public figures", "no speech bubbles, captions or labels on objects", "no photoreal rendering, 3D shading or smooth digital gradients", "no party symbols or flags used to mock groups", "no gore or graphic violence"], "promptCore": "Single-panel editorial cartoon drawn with a dip pen in confident black ink lines and cross-hatching, finished with loose transparent watercolour and grey ink wash on off-white paper. One clear visual metaphor built from everyday objects and generic everyman figures with exaggerated proportions, minimal background, generous white space, hand-drawn wobble, wash blooms and paper grain.", "negative": "text, letters, numbers, speech bubbles, captions, labels, logos, watermark, signature, caricature of real person, celebrity likeness, photorealistic, 3D render, smooth gradients, flat vector, glossy, cluttered background, gore"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 33},
    {"slug": "comic-halftone", "familySlug": "cartoon-comic", "label": "Comic halftone", "summary": "Comic book panel art with heavy inked outlines, Ben-Day halftone dot shading, print colour and dramatic camera angles", "goodFor": ["market crash drama", "corporate showdowns", "startup battles", "fraud and crime stories", "energy and power", "tech rivalry", "turnaround stories", "pop culture business"], "ruleSheet": {"medium": "inked comic art with brush and pen line, reproduced in a mechanical four-colour print look with halftone and Ben-Day dot shading", "palette": "print primaries: cyan #00A3D9, magenta #E5007E, process yellow #FFE11A, key black #111111, comic red #D7261E, newsprint cream #F3E9D2; midtones built from dot screens rather than blends", "line": "heavy confident black contours with tapered brush strokes, spotted solid blacks, feathering and speed lines", "texture": "visible halftone dot screens of varying size and angle, slight colour misregistration, newsprint grain", "composition": "single comic panel with dramatic perspective: worm's-eye or bird's-eye angle, foreshortening, strong diagonals, bold silhouettes; optional thick panel border", "lighting": "high-contrast chiaroscuro with hard-edged cast shadows filled solid black and flat-colour rim light", "figures": "generic, never identifiable people: archetypal heroes, business people, crowds and robots with stylised comic anatomy; never existing superheroes or franchise characters", "do": ["fill midtones and skin with halftone dot patterns", "use extreme camera angles and foreshortening for drama", "spot large areas of solid black", "keep the palette to print primaries plus black", "add speed lines or impact bursts without lettering", "allow slight print misregistration for authenticity"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no speech balloons, sound-effect lettering or caption boxes", "no existing superheroes, costumes or franchise characters", "no likeness of real people", "no soft airbrush gradients or painterly blending", "no gore or graphic violence"], "promptCore": "Dramatic comic book panel with heavy black brush-inked outlines, spotted solid blacks and Ben-Day halftone dot shading in a limited four-colour print palette of cyan, magenta, yellow and black on cream newsprint. Extreme low or high camera angle, foreshortened generic figures, speed lines, hard-edged high-contrast shadows and slight print misregistration.", "negative": "text, speech bubbles, sound effect lettering, captions, logos, watermark, signature, real person likeness, existing superhero, photorealistic, 3D render, airbrush gradients, watercolour, painterly, gore"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 34},
    {"slug": "clean-line-comic", "familySlug": "cartoon-comic", "label": "Clean-line comic", "summary": "Ligne claire comic illustration: even black outlines, flat unshaded colour, no hatching, precise settings and simple figures", "goodFor": ["cities and infrastructure", "travel and tourism", "workplace scenes", "explainers", "real estate", "transport and mobility", "consumer lifestyle", "retro-futurist tech"], "ruleSheet": {"medium": "ligne claire comic illustration: uniform-weight ink outlines with flat gouache or digital colour fills", "palette": "muted retro flats: cream #F2E6C9, sky blue #8EC5E0, teal #2F7F86, tomato red #E0533D, ochre #E2A83B, sage #A9BF8E, outline black #1B1B1B", "line": "one even-weight black outline around every shape, no tapering, no hatching or cross-hatching, tidy closed contours", "texture": "none, or a very faint paper or risograph grain; colour fills are flat and uniform", "composition": "clear, orderly staging; accurately drawn architecture, vehicles and objects combined with simplified cartoon figures; frontal, profile or isometric views; balanced uncluttered layout", "lighting": "no modelled shading; any shadows are single flat tone shapes", "figures": "generic, never identifiable people: simplified cartoon figures with dot eyes, neat clothes and stylised hair", "do": ["outline every shape with the same line weight", "fill with flat unshaded colour", "draw backgrounds with precise, realistic detail", "keep figures simple and cartoon-like against detailed settings", "use a restrained retro palette", "keep the composition legible and calm"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no hatching, cross-hatching or textured shading", "no gradients, airbrush or painterly effects", "no speech bubbles or captions", "no existing comic characters or recognisable franchise designs", "no likeness of real people"], "promptCore": "Ligne claire comic illustration with uniform-weight black outlines around every shape and flat, unshaded colour fills in a muted retro palette of cream, sky blue, teal, tomato red and ochre. No hatching, no gradients. Precisely drawn architecture and objects combined with simple generic cartoon figures, orderly frontal or isometric staging, calm and highly legible.", "negative": "text, speech bubbles, captions, logos, watermark, signature, hatching, cross-hatching, gradients, airbrush, painterly texture, sketchy line, variable line weight, photorealistic, 3D render, real person likeness, existing comic characters"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 35},
    {"slug": "doodle-sketchnote", "familySlug": "cartoon-comic", "label": "Doodle & sketchnote", "summary": "Playful hand-drawn marker doodles: wobbly outlines, simple characters, icons and arrows filling the page, no words", "goodFor": ["personal finance tips", "productivity", "explainers", "listicles", "startups", "education", "workplace culture", "lifestyle", "ideas and brainstorming"], "ruleSheet": {"medium": "felt-tip and brush marker drawing on white paper in the manner of sketchbook doodles and sketchnote visual notes", "palette": "paper white #FFFFFF, marker black #141414, plus two or three bright accents: highlighter yellow #FFE14D, coral #FF6B5B, sky blue #4DB6F0, mint #5ED3A6", "line": "single-weight rounded marker line, slightly wobbly and imperfect, quick confident strokes, open loops", "texture": "marker streaks, uneven flat fills, slight bleed, spot colour that misses the outlines", "composition": "all-over doodle clusters or one central motif surrounded by connected icons, arrows, stars, swirls and small characters; dense but airy; no single perspective", "lighting": "none; completely flat", "figures": "generic, never identifiable people: blobby characters, stick figures and smiling objects with simple dot eyes", "do": ["fill the space with small connected doodles around a clear central idea", "use arrows, stars, swirls and connector lines in place of words", "keep the line wobbly and hand-made", "add a few bright marker accents only", "give objects simple faces and personality", "leave some white paper breathing room"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no words, handwritten lettering, labels or speech bubbles", "no shading, gradients or 3D rendering", "no precise vector geometry", "no likeness of real people"], "promptCore": "Playful hand-drawn doodle illustration in black felt-tip marker on white paper with a few bright marker accents. Wobbly single-weight outlines, cute simple characters and everyday objects with dot eyes, arrows, stars, swirls and connector lines arranged in a lively all-over sketchnote layout, uneven marker fills that slip past the lines.", "negative": "text, words, handwriting, lettering, labels, numbers, logos, watermark, signature, photorealistic, 3D render, gradients, vector precision, shading, real person likeness"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 36},
    {"slug": "pop-art", "familySlug": "pop-graphic", "label": "Pop art", "summary": "Bold outlines, Ben-Day dots and saturated primaries applied to everyday objects", "goodFor": ["consumer", "brands", "markets", "retail", "entertainment business", "lifestyle"], "ruleSheet": {"medium": "pop-art illustration with thick black outlines, flat primaries and Ben-Day dot shading", "palette": "saturated primaries: red #E63228, yellow #FFD400, blue #1E5BC6, black #111111, white #FFFFFF, optional pink #F28AB2", "line": "thick, even black outlines around every shape", "texture": "Ben-Day dot screens for tone, flat colour elsewhere, slight print offset", "composition": "one everyday object shown big and iconic, cropped close, against a dotted or striped background", "lighting": "graphic highlights as white shapes and shadows as dot screens", "figures": "generic stylised figures only; never a likeness of a real person, actor or celebrity", "do": ["outline every shape in thick black", "shade with Ben-Day dots", "make one everyday object big and iconic", "use saturated primaries"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no speech bubbles or comic lettering", "no likeness of celebrities or real people", "no brand logos or packaging marks"], "promptCore": "A pop-art illustration of one everyday object shown big and iconic, with thick black outlines, flat saturated red, yellow and blue, Ben-Day dot shading, graphic white highlights and a dotted background, like a vintage printed comic panel without any lettering.", "negative": "speech bubble, lettering, celebrity likeness, real person, brand logo, photograph, 3D render, gradient, muted colours, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 37},
    {"slug": "swiss-geometric", "familySlug": "pop-graphic", "label": "Swiss geometric", "summary": "Grid, primary shapes, bold negative space", "goodFor": ["data", "economy", "policy"], "ruleSheet": {"medium": "Swiss-style geometric composition of primary shapes on a strict grid", "palette": "signal red #E63946, cobalt #1D3557, sun yellow #FFC300, black #111111, white #F8F8F8", "line": "precise geometric edges, no hand-drawn lines", "texture": "perfectly flat, optional very fine print grain", "composition": "strict modular grid, asymmetric balance, bold negative space, shapes implying movement or tension", "lighting": "none; pure flat colour", "figures": "no people; ideas expressed with shapes only", "do": ["express the idea through shape relationships", "respect a modular grid", "use bold negative space", "keep to three or four colours"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people or faces", "no illustrative detail"], "promptCore": "A Swiss-style geometric composition of circles, squares, bars and arcs on a strict modular grid, in signal red, cobalt, sun yellow and black on white, with bold negative space and asymmetric balance. Pure flat colour, the idea expressed through shape relationships alone.", "negative": "photograph, illustration detail, people, faces, texture-heavy, 3D, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 38},
    {"slug": "bauhaus", "familySlug": "pop-graphic", "label": "Bauhaus", "summary": "Primary geometry, circles, squares and triangles balanced on a strict modernist grid", "goodFor": ["economy", "policy", "design", "industry", "markets", "data"], "ruleSheet": {"medium": "Bauhaus-style modernist composition of basic geometric forms", "palette": "red #D7372D, yellow #F2C12E, blue #2251A3, black #151515, off-white #F2EEE3", "line": "precise straight edges and true circles; thick black bars used as structural lines", "texture": "flat ink on slightly warm paper, optional faint print grain", "composition": "circles, squares, triangles and bars in asymmetric balance on a grid, strong diagonals, generous off-white space", "lighting": "none; purely flat graphic colour", "figures": "none; the idea is carried by geometry alone", "do": ["use only basic shapes: circle, square, triangle, bar", "balance the composition asymmetrically", "keep to the primary palette plus black", "leave generous off-white space"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people or figurative detail", "no lettering, numbers or poster type", "no gradients or 3D effects"], "promptCore": "A Bauhaus-style modernist composition of circles, squares, triangles and thick black bars in red, yellow, blue and black on warm off-white paper, arranged in asymmetric balance on a strict grid with strong diagonals and generous empty space. Flat ink, no figures.", "negative": "people, figures, lettering, typography, numbers, gradient, 3D, photograph, texture overload, clutter, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 39},
    {"slug": "neon-retro", "familySlug": "pop-graphic", "label": "Neon retro", "summary": "Synthwave glow: neon outlines, purple dusk, grid horizons and chrome highlights", "goodFor": ["tech", "gaming business", "startups", "crypto", "entertainment business", "AI"], "ruleSheet": {"medium": "retro synthwave digital illustration with glowing neon outlines", "palette": "deep purple night #1B0B3A, magenta #FF2E88, cyan #2EE6FF, sunset orange #FF8A3D, hot pink-to-orange sun gradient", "line": "glowing neon tubes and outlines with soft bloom", "texture": "smooth digital surfaces, subtle scanlines, light haze and bloom", "composition": "a perspective grid floor running to the horizon, a large banded sun, one glowing focal object in the foreground", "lighting": "emissive neon light with coloured bloom and reflections on glossy surfaces", "figures": "generic silhouettes only, small and distant; never identifiable", "do": ["light the focal object with neon outlines and bloom", "use a perspective grid to the horizon", "keep the purple, magenta and cyan palette", "add subtle scanlines"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no neon signs that read as words", "no identifiable people", "no daylight or natural palette"], "promptCore": "A retro synthwave illustration at night: a glowing perspective grid floor running to the horizon under a large banded magenta-to-orange sun, one focal object drawn in glowing neon cyan and magenta outlines with soft bloom and glossy reflections, deep purple sky, subtle scanlines and haze.", "negative": "neon lettering, signs with words, daylight, photograph, realistic faces, muted colours, clutter, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 40},
    {"slug": "retro-indian", "familySlug": "indian-art", "label": "Hand-painted Bollywood poster", "summary": "Vintage Indian poster and matchbox-label print look", "goodFor": ["brands", "nostalgia", "consumer"], "ruleSheet": {"medium": "vintage Indian commercial print look with flat inks, decorative borders and aged paper", "palette": "vermilion #E34234, peacock blue #1F6E8C, turmeric #E1A90F, leaf green #3E7C3A, aged paper #EFDDB8", "line": "bold decorative outlines and ornamental flourishes", "texture": "aged paper, ink wear, slight misregistration and halftone", "composition": "centred emblem-like composition with ornamental frame, symmetrical balance", "lighting": "flat with simple two-tone shading", "figures": "stylised illustrated figures in a vintage commercial manner, friendly and non-mocking", "do": ["use ornamental borders and frames", "keep a centred emblem layout", "age the paper", "use bold flat inks"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no readable words, slogans or brand names", "no real brand imagery"], "promptCore": "A vintage Indian commercial print illustration in the manner of old matchbox labels and hand-painted posters, with flat vermilion, peacock blue and turmeric inks, ornamental borders, a centred emblem-like composition and aged, slightly misregistered paper.", "negative": "photograph, modern flat vector, 3D render, readable words, real brands, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 41},
    {"slug": "madhubani", "familySlug": "indian-art", "label": "Madhubani", "summary": "Mithila folk painting: dense line patterns, double-line borders, flat natural-pigment colour, fish, peacock and tree-of-life motifs", "goodFor": ["rural economy", "agriculture", "women and work", "festive features", "environment", "handicrafts", "Bihar stories", "social themes", "FMCG and consumption", "Indian culture"], "ruleSheet": {"medium": "Hand-painted Mithila folk painting on handmade paper or cloth, nib-pen and bamboo-twig line with flat natural-pigment fills (Bharni colour-fill and Kachni fine-line idioms).", "palette": "Turmeric yellow #E8B12A, vermilion red #C8322A, indigo blue #2E3F8F, leaf green #3E8E4A, marigold orange #E57B25, lamp-black line #1A1A1A on handmade-paper cream ground #F3E6C8.", "line": "Confident black outlines everywhere, every form and border drawn as a double line with the gap filled by hatching, dots or tiny repeating dashes; no sketchy or broken strokes.", "texture": "Flat matte pigment fills on slightly fibrous handmade paper; no gradients, no shading, no airbrush, slight hand-made unevenness in line weight.", "composition": "Horror vacui: every empty area filled with fish, birds, leaves, lotuses, suns and geometric patterns; a decorated double-line border frames the whole picture; symmetrical or frieze-like arrangement, flat with no perspective.", "lighting": "None: no light source, no cast shadows, no highlights; colour is purely flat decorative fill.", "figures": "Generic, never identifiable people; stylised profiles with large almond eye, pointed nose and frontal torso; animals (fish, peacocks, elephants, tigers, parrots) as decorative motifs.", "do": ["fill all negative space with pattern", "draw every outline as a double line with hatching between", "frame the image with an ornamented border", "use fish, peacock, lotus, sun and tree-of-life motifs", "keep figures in stylised profile with large almond eyes", "keep colour flat and saturated"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no religious deities or sacred symbols as the subject", "no shading, gradients, 3D or perspective depth", "no photoreal faces or identifiable real people", "no empty unpatterned background areas"], "promptCore": "Traditional Mithila (Madhubani) folk painting on handmade paper: bold black double-line outlines filled with fine hatching and dots, flat saturated natural-pigment colours of turmeric yellow, vermilion, indigo and leaf green, every empty space packed with fish, peacocks, lotuses, leaves and geometric patterns, stylised profile figures with large almond eyes, ornate double-line border around the whole picture, perfectly flat with no shading or perspective.", "negative": "text, letters, numbers, writing, logo, watermark, signature, deity, religious icon, photorealism, 3D render, gradient, shading, perspective depth, realistic face, celebrity, blank background, airbrush"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 42},
    {"slug": "warli", "familySlug": "indian-art", "label": "Warli", "summary": "Warli tribal painting: white stick figures, circles and triangles on an earth-brown ground, rhythmic village and dance-circle scenes", "goodFor": ["rural economy", "agriculture", "community", "sustainability", "climate", "labour and jobs", "urban growth", "festivals", "Maharashtra stories", "cooperatives"], "ruleSheet": {"medium": "Warli tribal wall painting translated to cloth or paper: rice-paste white paint applied with a chewed bamboo stick on a mud, cow-dung or ochre-washed ground.", "palette": "Rice-paste white #F4F1EA on earth-brown ground #6B3E26, optional terracotta red-ochre ground #9C4A2F or deep umber #3F2618; strictly two-tone, no other colours.", "line": "Thin, slightly uneven white strokes and dots; figures built only from a circle head, two triangles joined at the tip for torso, and single-stroke stick limbs; no outlines around shapes, no black.", "texture": "Matte, slightly grainy mud-plaster or cloth ground showing through; hand-applied white with mild variation in opacity and small dots.", "composition": "Flat, map-like and rhythmic: many small repeated figures arranged in spirals, concentric dance circles (tarpa dance), rows of trees, huts, animals and fields; scenes spread across the surface with no horizon or perspective; may be bordered by a simple dotted or triangle band.", "lighting": "None: no shading, no highlights, no light direction.", "figures": "Generic, never identifiable people; all humans are identical geometric stick figures in motion (dancing, farming, fishing, carrying loads); animals equally schematic.", "do": ["use only white on an earth-brown ground", "build humans from circle plus two triangles plus stick limbs", "repeat small figures rhythmically in rows, spirals or circles", "include trees, huts, birds, animals and fields as simple geometric glyphs", "keep everything flat and two-dimensional", "leave the brown ground visible between motifs"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no religious deities or sacred symbols as the subject", "no extra colours, gradients or shading", "no realistic anatomy, faces or identifiable people", "no perspective, horizon lines or 3D depth"], "promptCore": "Traditional Warli tribal painting: thin white rice-paste lines and dots on a flat earth-brown mud ground, tiny geometric stick figures made of a circle head and two joined triangles, dancing in concentric circles, farming, fishing and carrying loads among simple triangle trees, huts, birds and animals, rhythmic repetition across the surface, strictly two-tone white on brown, completely flat with no shading or perspective.", "negative": "text, letters, numbers, writing, logo, watermark, signature, deity, religious icon, colour, gradient, shading, 3D, perspective, realistic anatomy, detailed faces, photorealism, black outlines"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 43},
    {"slug": "indian-miniature", "familySlug": "indian-art", "label": "Indian miniature", "summary": "Mughal, Rajput and Pahari miniature painting: hair-fine brushwork, jewel-like flat colour, stacked flat perspective and ornamental borders", "goodFor": ["heritage and culture", "luxury and jewellery", "tourism", "royal and historical themes", "trade and markets", "festive features", "banking and wealth", "Rajasthan stories", "agriculture", "wildlife"], "ruleSheet": {"medium": "Opaque watercolour (gouache) and gold on burnished wasli paper, painted with single-hair squirrel brushes in the Mughal, Rajput and Pahari court traditions.", "palette": "Lapis blue #26428B, vermilion #D23A2B, Indian yellow #E9B53B, malachite green #3C8D5A, lamp-black #1E1B18, gold #C9A14A, ivory ground #F2E8D0, rose-pink border #D98C8C.", "line": "Hair-fine, precise dark-brown or black outlines; delicate profile contours, fine detailing of textiles, foliage and architecture; no loose or sketchy strokes.", "texture": "Smooth burnished matte gouache with touches of raised gold; subtle stippled modelling only on faces and trees; slight aged-paper warmth.", "composition": "Flat, stacked (vertical) perspective where distance is shown higher up the page; architecture shown frontally with tilted floors; crowded narrative scenes or single figures in gardens and pavilions; image framed by a coloured rule border and a wider decorated margin with floral scroll.", "lighting": "Even, shadowless, decorative light; no cast shadows, no single light source; night scenes rendered with dark ground and gold accents.", "figures": "Generic, never identifiable people; stylised figures in strict profile with almond eyes, fine jewellery and patterned textiles; courtiers, merchants, musicians, farmers, horses, elephants and birds.", "do": ["use hair-fine outlines and meticulous detail", "keep figures in profile with almond eyes", "use stacked flat perspective with tilted architecture", "add a coloured rule border and decorated outer margin", "use jewel-tone flat colour with gold accents", "include gardens, pavilions, animals and flowering trees"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no religious deities or sacred symbols as the subject", "no calligraphy panels or inscription cartouches", "no Western linear perspective, cast shadows or photoreal modelling", "no identifiable real people, emperors or historical portraits"], "promptCore": "Indian miniature painting in the Mughal, Rajput and Pahari court tradition: opaque watercolour and gold on burnished paper, hair-fine outlines, figures in strict profile with almond eyes, richly patterned textiles and jewellery, flat stacked perspective with tilted pavilion floors and gardens, jewel-tone lapis, vermilion, Indian yellow and malachite colour, even shadowless light, framed by a coloured rule border and a decorated floral margin.", "negative": "text, letters, numbers, writing, calligraphy, inscription, logo, watermark, signature, deity, religious icon, photorealism, 3D render, Western perspective, cast shadows, real person, emperor portrait, loose brushwork"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 44},
    {"slug": "surreal-concept", "familySlug": "abstract-surreal", "label": "Surreal concept", "summary": "Dreamlike conceptual editorial scenes where impossible scale, objects and spaces turn an idea into one clear visual metaphor", "goodFor": ["opinion pieces", "big-idea features", "economy metaphors", "mental health", "technology", "climate", "future of work", "uncertainty", "ambition and risk", "magazine covers"], "ruleSheet": {"medium": "Digitally painted illustration with a hand-made feel, soft grain and subtle brush or risograph-like texture over smooth shapes.", "palette": "Limited, harmonious and slightly muted: dusk blue #2F4B7C, deep teal #1F5F5B, warm sand #E8D5B5, coral #E86F5A, ochre #D9A441, soft cream #F4EEE1, ink navy #1B2333.", "line": "Few or no outlines; forms defined by clean shape edges and soft tonal shading, occasional fine contour lines.", "texture": "Fine grain and speckle noise across flat areas, light paper texture, no glossy rendering.", "composition": "One strong central metaphor with plenty of negative space; impossible scale shifts (tiny figure, giant object), floating or merged objects, doors, stairs and horizons that should not exist; clear silhouette readable at thumbnail size.", "lighting": "Soft, calm, slightly theatrical light, long gentle shadows, quiet dawn or dusk atmosphere.", "figures": "generic, never identifiable people; small anonymous figures in simple clothing, faces minimal or turned away, used for scale and emotion.", "do": ["build the image around one surprising visual metaphor for the headline idea", "use impossible scale, gravity or architecture to create a dreamlike feel", "keep the palette limited and the background calm", "leave generous negative space around the central idea", "add fine grain texture so it feels printed, not glossy"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no recognisable real people, politicians or celebrities", "no photoreal rendering or 3D plastic look", "no cluttered scenes with many competing ideas", "no gore or horror imagery"], "promptCore": "Surreal conceptual editorial illustration: a single dreamlike visual metaphor with impossible scale and objects, small anonymous figures in a vast quiet space, floating or merged forms, doors and stairs leading nowhere. Smooth digitally painted shapes with fine grain texture, limited muted palette of dusk blue, teal, sand and coral, soft theatrical light with long shadows, generous negative space, calm and thought-provoking.", "negative": "text, letters, numbers, captions, logos, watermarks, signatures, photorealism, 3D render, glossy plastic, real people, celebrities, clutter, busy background, gore, horror, comic speech bubbles"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 45},
    {"slug": "abstract-shapes", "familySlug": "abstract-surreal", "label": "Abstract shapes", "summary": "Non-figurative compositions of organic blobs and geometric forms in bold flat colour fields, for mood and structure without people", "goodFor": ["markets overview", "economy", "policy explainers", "trend pieces", "section openers", "newsletters", "backgrounds", "data stories", "design and culture", "balance and tension"], "ruleSheet": {"medium": "Flat digital vector or cut-paper/gouache-like shapes, crisp edges, collage feel.", "palette": "Bold but balanced: cobalt #2546C8, tomato red #E5432F, sunflower #F5B921, mint #8FD3B6, blush pink #F2B8C6, forest green #1E5E43, off-white ground #F6F1E7, near-black #161616.", "line": "No outlines; edges are defined by colour against colour; occasional thick single strokes or squiggles as shapes.", "texture": "Mostly flat colour with optional subtle paper grain or slight print misregistration.", "composition": "Overlapping and interlocking organic blobs, arches, circles, half-moons, stripes and rectangles; asymmetric balance; clear foreground/background layering; strong colour blocks; can suggest a horizon or growth without depicting anything literal.", "lighting": "No directional lighting or cast shadows; flat colour fields only.", "figures": "generic, never identifiable people; none at all, the style is strictly non-figurative with no faces, hands, animals or objects.", "do": ["compose with a few large shapes and a few small accents", "mix soft organic blobs with hard geometric forms", "use 4-6 colours with one dominant field", "let shapes overlap to create depth through colour, not shading", "keep edges crisp and the arrangement balanced"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people, faces, animals or recognisable objects", "no gradients that look like 3D renders or glossy plastic", "no photographic textures", "no busy repeating wallpaper patterns"], "promptCore": "Abstract composition of overlapping organic blobs and geometric shapes (circles, arches, half-moons, stripes) in flat bold colour fields: cobalt blue, tomato red, sunflower yellow, mint and blush on an off-white ground. Crisp cut-paper edges, no outlines, no shading, subtle paper grain, asymmetric balanced layout with large calm areas and small accents. Non-figurative, no objects or people.", "negative": "text, letters, numbers, logos, watermarks, signatures, people, faces, hands, animals, objects, 3D render, glossy, photorealistic, heavy gradients, cast shadows, clutter, repeating wallpaper pattern"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 46},
    {"slug": "data-art", "familySlug": "abstract-surreal", "label": "Data art", "summary": "Abstract charts and flows as art, no numbers", "goodFor": ["markets", "macro", "trade"], "ruleSheet": {"medium": "abstract generative data-art composition of lines, flows and particles", "palette": "midnight #0B1D33, electric blue #2D9CDB, emerald #27AE60, amber #F2994A, soft white #EDEFF2", "line": "fine precise lines and curves, flowing bundles", "texture": "smooth with subtle glow and particle dust", "composition": "a single flowing structure across the frame that suggests a trend, network or exchange", "lighting": "luminous lines on a dark ground", "figures": "no people", "do": ["suggest the story's shape (rise, fall, flow, network)", "use fine luminous lines", "keep a dark ground", "make it feel like art, not a chart"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no axes, numbers, labels or legends", "no people"], "promptCore": "An abstract data-art composition of fine luminous lines, flowing bundles and particles on a dark midnight ground, in electric blue, emerald and amber, suggesting a trend, flow or network. Elegant and artistic, with no axes, labels or numbers.", "negative": "chart axes, numbers, labels, legend, people, photograph, cartoon, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 47},
    {"slug": "glitch-digital", "familySlug": "abstract-surreal", "label": "Glitch digital", "summary": "Digital-corruption aesthetics: pixel sorting, RGB channel split, scanlines and datamosh blocks for tech, cyber and disruption stories", "goodFor": ["cybersecurity", "hacking", "AI and tech", "misinformation", "crypto", "system outages", "digital disruption", "surveillance", "online privacy", "social media"], "ruleSheet": {"medium": "Digital image processing look: pixel sorting, databending, compression artifacts and channel shifting over a simple illustrative or abstract base.", "palette": "Screen colours on dark: black #0A0A0F, electric cyan #00E5FF, magenta #FF2BD6, signal red #FF3B30, acid green #39FF14, cold blue #3A5BFF, white highlights #F5F5F5.", "line": "No drawn lines; horizontal and vertical streaks, sorted pixel bands and scanlines create the structure.", "texture": "Hard pixel edges, JPEG macroblocks, interlace scanlines, noise and dithering, RGB fringing on every contour.", "composition": "A clear simple subject or shape at the centre that is partly intact and partly torn apart by horizontal displacement, sorted pixel streams dripping or smearing across the frame, offset colour channels; strong contrast between clean and corrupted areas.", "lighting": "Emissive screen glow, high contrast, no natural light; colours appear to emit from a dark background.", "figures": "generic, never identifiable people; silhouettes or anonymous heads/hands only, heavily distorted by the glitch.", "do": ["keep one readable subject and corrupt part of it", "use RGB channel offsets on edges", "add pixel-sorted streaks in one dominant direction", "include block compression artifacts and scanlines", "use a dark ground with neon screen colours"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no fake error messages, code, terminal text or UI windows", "no recognisable real people", "no photoreal faces", "no smooth painterly rendering"], "promptCore": "Glitch art editorial image: a simple central subject partly dissolving into digital corruption, pixel-sorted streaks smearing horizontally, RGB channel split with cyan and magenta fringes, JPEG macroblock artifacts, interlace scanlines and noise. Neon screen colours (cyan, magenta, acid green, signal red) glowing on near-black, high contrast, hard pixel edges, clean and broken areas side by side.", "negative": "text, letters, numbers, code, error messages, user interface, terminal windows, logos, watermarks, signatures, real people, photoreal faces, painterly brushwork, watercolour, soft pastel palette, vintage film grain only"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 48}
  ]
}
```
