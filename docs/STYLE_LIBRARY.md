# ET house style library

**Service:** editorial-art  
**Version:** 1.0, 26 October 2026  
**Status:** draft rule sheets for review. Styles go live only after reference approval.

## Purpose

This file defines the 24 ET house styles that the editorial-art service uses to illustrate articles. Each style is specified tightly enough that two images made in the same style look like they belong to one publication.

## How the styles are used

- **promptCore** is inserted, word for word, at the start of every image prompt for that style (previews, finals and exemplars).
- **negative** is appended as a list of things the image must avoid.
- **Do** and **Don't** guide the people writing and reviewing references and are summarised into the judge's rubric.
- **Safety flags** (allowsPeople, allowsRealPeople, allowsSensitive, photoreal) are enforced in code by the pipeline, not only in prompts. A style that does not allow sensitive stories is never offered for one; a style that does not allow real people never receives likeness photos.
- **No artist names ever appear** in this file, in prompts or in the database. Styles describe a medium and a look, never a person.
- A style becomes **LIVE** (visible to editors) only after it has **at least 15 approved references** on the AI Studio Admin screen. Until then it stays in CURATING.
- Every style has the same three base don'ts: no text, letters or numbers; no logos, watermarks or signatures; no imitation of any named artist.

## Families

### 1. Illustration (`illustration`, 4 styles)

Drawn images built for ideas. These styles turn an abstract story (a policy shift, a market mood, a supply chain) into a single clear visual metaphor. They are the safest default for most desks because they read instantly at thumbnail size, carry no risk of being mistaken for a photograph, and can depict people in a simplified, respectful way.

### 2. Painting (`painting`, 4 styles)

Hand-painted looks with visible medium: opaque gouache, thick oil, transparent watercolour and a contemporary digital painterly finish. These carry warmth and weight, so they suit features, profiles, long reads and big-picture essays where the image should feel considered rather than quick. Brushwork is part of the message, so these styles avoid hard vector edges.

### 3. Drawing and print (`drawing-print`, 4 styles)

Graphite, charcoal and printmaking traditions: pencil reportage, smudged charcoal, carved linocut and two-colour risograph. These styles feel human and documentary. Pencil and charcoal suit serious and sombre stories, linocut suits labour and the rural economy, and risograph brings a younger, independent-press energy for startups and culture.

### 4. Craft and 3D (`craft-3d`, 4 styles)

Physical-looking worlds: layered paper, clay figures on a tiny set, soft matte 3D objects and tilt-shift miniatures. These are friendly and tactile, ideal for explainers, personal finance and city stories. Clay puppet is the one satirical style and is never used for sensitive stories or real people.

### 5. Graphic and collage (`graphic-collage`, 4 styles)

Design-led images made from shapes, grids, cut fragments and abstract data forms. Collage handles stories with many angles; Swiss geometric and data art turn numbers and policy into pure form without a single digit on screen; retro Indian print borrows the warmth of vintage Indian commercial printing for consumer and brand stories.

### 6. Photo-based (restricted) (`photo-based`, 4 styles)

Photographic treatments with strict limits. They depict objects, places and abstract scenes only, never people (double exposure allows one anonymous silhouette) and never a specific news event as if it were photographed. These rules are enforced in code and by the final judge, because a convincing fake news photo is the single biggest reputational risk this service carries.

## Styles at a glance

| # | Family | Style | Slug | People | Real people | Sensitive | Photoreal |
|---|---|---|---|---|---|---|---|
| 1 | Illustration | Editorial flat | `editorial-flat` | yes | no | yes | no |
| 2 | Illustration | Ink and wash | `ink-wash` | yes | yes | yes | no |
| 3 | Illustration | Mid-century modern | `mid-century` | yes | yes | no | no |
| 4 | Illustration | Isometric explainer | `isometric` | yes | no | yes | no |
| 5 | Painting | Gouache editorial | `gouache` | yes | yes | no | no |
| 6 | Painting | Oil impasto | `oil-impasto` | yes | yes | no | no |
| 7 | Painting | Watercolour | `watercolour` | yes | yes | yes | no |
| 8 | Painting | Digital painterly | `digital-painterly` | yes | yes | no | no |
| 9 | Drawing and print | Pencil sketch | `pencil-sketch` | yes | yes | yes | no |
| 10 | Drawing and print | Charcoal | `charcoal` | yes | no | yes | no |
| 11 | Drawing and print | Linocut | `linocut` | yes | yes | yes | no |
| 12 | Drawing and print | Risograph | `risograph` | yes | yes | no | no |
| 13 | Craft and 3D | Paper cut | `paper-cut` | yes | yes | no | no |
| 14 | Craft and 3D | Clay puppet | `clay-puppet` | yes | no | no | no |
| 15 | Craft and 3D | Soft 3D | `soft-3d` | yes | no | yes | no |
| 16 | Craft and 3D | Miniature diorama | `diorama` | yes | no | yes | no |
| 17 | Graphic and collage | Mixed-media collage | `collage` | yes | yes | no | no |
| 18 | Graphic and collage | Swiss geometric | `swiss-geometric` | no | no | yes | no |
| 19 | Graphic and collage | Retro Indian print | `retro-indian` | yes | yes | no | no |
| 20 | Graphic and collage | Data art | `data-art` | no | no | yes | no |
| 21 | Photo-based (restricted) | Object still life | `still-life` | no | no | yes | yes |
| 22 | Photo-based (restricted) | Duotone | `duotone` | no | no | yes | yes |
| 23 | Photo-based (restricted) | Photo collage | `photo-collage` | no | no | no | yes |
| 24 | Photo-based (restricted) | Double exposure | `double-exposure` | yes | no | yes | yes |

---

## 1. Editorial flat

- **Slug:** `editorial-flat`
- **Family:** Illustration
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

## 2. Ink and wash

- **Slug:** `ink-wash`
- **Family:** Illustration
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

## 3. Mid-century modern

- **Slug:** `mid-century`
- **Family:** Illustration
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

## 4. Isometric explainer

- **Slug:** `isometric`
- **Family:** Illustration
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

## 5. Gouache editorial

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

## 6. Oil impasto

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

## 7. Watercolour

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
| Composition | cinematic wide framing, strong depth, a clear focal subject against atmosphere |
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
- **Family:** Drawing and print
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
- **Family:** Drawing and print
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

## 11. Linocut

- **Slug:** `linocut`
- **Family:** Drawing and print
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

## 12. Risograph

- **Slug:** `risograph`
- **Family:** Drawing and print
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

## 13. Paper cut

- **Slug:** `paper-cut`
- **Family:** Craft and 3D
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

## 14. Clay puppet

- **Slug:** `clay-puppet`
- **Family:** Craft and 3D
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

## 15. Soft 3D

- **Slug:** `soft-3d`
- **Family:** Craft and 3D
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

## 16. Miniature diorama

- **Slug:** `diorama`
- **Family:** Craft and 3D
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

## 17. Mixed-media collage

- **Slug:** `collage`
- **Family:** Graphic and collage
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

## 18. Swiss geometric

- **Slug:** `swiss-geometric`
- **Family:** Graphic and collage
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

## 19. Retro Indian print

- **Slug:** `retro-indian`
- **Family:** Graphic and collage
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

## 20. Data art

- **Slug:** `data-art`
- **Family:** Graphic and collage
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

## 21. Object still life

- **Slug:** `still-life`
- **Family:** Photo-based (restricted)
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

## 22. Duotone

- **Slug:** `duotone`
- **Family:** Photo-based (restricted)
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

## 23. Photo collage

- **Slug:** `photo-collage`
- **Family:** Photo-based (restricted)
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

## 24. Double exposure

- **Slug:** `double-exposure`
- **Family:** Photo-based (restricted)
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

## Machine-readable seed

`scripts/seed-styles.ts` reads the JSON block below and upserts families and styles by slug. Keep it in sync with the sections above; the seed test fails if the two disagree.

```json
{
  "families": [
    {"slug": "illustration", "label": "Illustration", "sortOrder": 1},
    {"slug": "painting", "label": "Painting", "sortOrder": 2},
    {"slug": "drawing-print", "label": "Drawing and print", "sortOrder": 3},
    {"slug": "craft-3d", "label": "Craft and 3D", "sortOrder": 4},
    {"slug": "graphic-collage", "label": "Graphic and collage", "sortOrder": 5},
    {"slug": "photo-based", "label": "Photo-based (restricted)", "sortOrder": 6}
  ],
  "styles": [
    {"slug": "editorial-flat", "familySlug": "illustration", "label": "Editorial flat", "summary": "Clean flat shapes, limited palette, smart visual metaphor", "goodFor": ["economy", "policy", "explainers"], "ruleSheet": {"medium": "flat vector-style illustration with solid colour fields and no outlines", "palette": "deep navy #1F2A44, warm sand #E9D8B4, teal #2A9D8F, soft coral #F4A261, off-white ground #FAF7F0; optional ET red #E8262D accent under 10% of the area", "line": "no outlines; edges defined by colour change only; crisp geometric curves", "texture": "perfectly flat fills with at most a fine paper grain overlay at 5% opacity", "composition": "one central visual metaphor, large simple shapes, generous negative space, focal point slightly off-centre", "lighting": "no shading or a single flat shadow shape per object at 15% darker tone", "figures": "generic, faceless or dot-eyed figures with simplified proportions; never identifiable", "do": ["build the whole image around one visual metaphor", "keep to five colours or fewer", "leave the top third calm for a headline overlay", "make shapes readable at thumbnail size"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no gradients or glossy effects", "no identifiable faces"], "promptCore": "A flat editorial illustration made of solid colour shapes with no outlines and no gradients, using a restrained palette of deep navy, warm sand, teal and soft coral on an off-white ground. The scene is built around one clear visual metaphor with large simple shapes and generous empty space.", "negative": "photograph, 3D render, gradient, glossy, outline drawing, clutter, realistic faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 1},
    {"slug": "ink-wash", "familySlug": "illustration", "label": "Ink and wash", "summary": "Loose ink line with grey and one accent wash", "goodFor": ["markets", "analysis", "opinion"], "ruleSheet": {"medium": "black ink brush line with grey wash on off-white paper", "palette": "ink black #1D1D1B, warm greys #8A8580 and #C9C4BC, paper #F5F1E8; one accent: ET red #E8262D at most 10% of the area", "line": "confident, varied weight, loose, some dry-brush strokes", "texture": "visible paper grain, wash blooms and soft pooled edges", "composition": "one strong focal element, generous negative space, off-centre placement", "lighting": "implied by wash density, no gradients or airbrush", "figures": "simplified faces with a few strokes, no caricature, natural proportions", "do": ["use a single visual metaphor", "leave the top-left third calm for headlines", "let wash bleed past the line in places", "keep the accent colour to one small area"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no more than one accent colour", "no photoreal faces"], "promptCore": "An editorial illustration in loose black ink brush line with soft grey wash on textured off-white paper, with a single small accent of red. Confident varied strokes, visible paper grain and pooled wash edges, one strong focal element and generous empty space.", "negative": "photograph, 3D render, vector flat, neon, heavy colour, digital gradient, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 2},
    {"slug": "mid-century", "familySlug": "illustration", "label": "Mid-century modern", "summary": "1950s to 60s editorial shapes, grain, warm muted colours", "goodFor": ["business", "lifestyle", "Prime long reads"], "ruleSheet": {"medium": "mid-century editorial illustration with cut shapes, stippled texture and limited overprinted colour", "palette": "mustard #D9A441, burnt orange #C8553D, olive #6B7F3A, teal #2F6F73, cream #F2E8D5, charcoal #2B2B2B", "line": "angular stylised shapes with occasional thin confident outlines", "texture": "dry-brush stipple, halftone grain and slight colour overprint offsets", "composition": "asymmetric balance, strong diagonals, stylised perspective, layered planes", "lighting": "flat with texture-based shading and simple cast shadows", "figures": "elongated, stylised figures with simple oval heads and minimal features", "do": ["use angular stylised forms", "add grain and stipple texture", "stack overlapping colour planes", "keep the palette warm and muted"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no modern gadgets drawn photorealistically", "no neon or saturated digital colour"], "promptCore": "A mid-century modern editorial illustration with angular stylised shapes, stipple and halftone grain, and warm muted colours of mustard, burnt orange, olive and teal on cream. Layered flat planes, strong diagonals and simple elongated figures.", "negative": "photograph, 3D render, neon, glossy, modern flat vector, photorealism, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 3},
    {"slug": "isometric", "familySlug": "illustration", "label": "Isometric explainer", "summary": "30-degree isometric scenes, tidy and diagrammatic", "goodFor": ["tech", "infrastructure", "supply chains"], "ruleSheet": {"medium": "clean isometric illustration on a strict 30-degree grid", "palette": "slate #3D4A5C, sky blue #7FB3D5, mint #A8DADC, warm white #F8F9FA, signal yellow #F4D35E; optional ET red #E8262D for one highlighted element", "line": "thin uniform strokes or none; perfectly parallel isometric edges", "texture": "smooth flat fills with gentle top, left and right face tonal steps", "composition": "a contained isometric platform or block scene, tidy flow from one corner to the other, lots of breathing room", "lighting": "consistent light from top-left: top faces lightest, right faces darkest", "figures": "tiny generic figures only, a few pixels of detail, never identifiable", "do": ["keep every edge on the 30-degree grid", "show flow between components", "group the scene on one platform", "use tonal steps on each face for depth"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no perspective distortion", "no large or detailed human figures"], "promptCore": "A clean isometric explainer illustration on a strict 30-degree grid, a tidy contained scene on a single platform with smooth flat fills and consistent top-left lighting, in slate, sky blue, mint and warm white with a signal yellow highlight. Tiny generic figures only.", "negative": "photograph, perspective view, painterly texture, messy, large people, faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 4},
    {"slug": "gouache", "familySlug": "painting", "label": "Gouache editorial", "summary": "Opaque matte gouache, soft edges, rich colour", "goodFor": ["Prime features", "profiles", "culture"], "ruleSheet": {"medium": "opaque matte gouache painting on cold-press paper", "palette": "rich jewel tones: deep green #1E5B4F, ochre #C9922E, plum #6D3B5C, dusty pink #D8A7A0, midnight blue #23305A", "line": "soft painted edges, no outlines, visible brush direction", "texture": "chalky matte paint with slight streaks and paper tooth at the edges", "composition": "storybook framing, layered foreground and background, one warm focal area", "lighting": "soft directional light with warm highlights and cool shadows", "figures": "painted figures with simple features and natural proportions, respectful and calm", "do": ["let brush direction follow form", "use warm light against cool shadow", "keep surfaces matte", "frame the subject with layered foreground shapes"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no hard vector edges", "no glossy or wet-look highlights"], "promptCore": "An editorial gouache painting with opaque, matte, chalky paint and soft brushed edges, in rich jewel tones of deep green, ochre, plum and midnight blue. Warm directional light, layered foreground and background, visible paper tooth.", "negative": "photograph, vector, glossy, 3D render, hard outlines, neon, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 5},
    {"slug": "oil-impasto", "familySlug": "painting", "label": "Oil impasto", "summary": "Thick textured brushwork, dramatic light", "goodFor": ["big-picture essays", "history", "leadership"], "ruleSheet": {"medium": "oil painting with thick impasto brushwork and palette-knife passages", "palette": "umber #5B3A29, cadmium orange #E07A1F, Prussian blue #1F3B57, ivory #EDE6D6, deep crimson #8C1C2B", "line": "bold visible strokes that sculpt form, no drawn lines", "texture": "raised paint ridges, canvas weave visible in thin areas", "composition": "classical, weighty composition with a strong focal subject and dark surroundings", "lighting": "dramatic chiaroscuro, a single strong light source, deep shadows", "figures": "painterly figures with dignified posture, faces suggested by planes of colour", "do": ["sculpt forms with stroke direction", "use one strong light source", "keep dark, rich surroundings", "let texture show in highlights"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no smooth digital blending", "no cartoon proportions"], "promptCore": "A dramatic oil painting with thick impasto brushwork and palette-knife texture, lit by a single strong light source with deep chiaroscuro shadows, in umber, cadmium orange, Prussian blue and ivory. Weighty classical composition with raised paint ridges and visible canvas.", "negative": "photograph, vector, flat colour, cartoon, smooth digital airbrush, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 6},
    {"slug": "watercolour", "familySlug": "painting", "label": "Watercolour", "summary": "Transparent washes, paper texture, airy", "goodFor": ["travel", "places", "health", "gentle stories"], "ruleSheet": {"medium": "transparent watercolour on rough cotton paper with light pencil underdrawing", "palette": "soft cerulean #6FA8DC, sap green #7BA05B, rose #E8A0A8, raw sienna #C98B4F, lots of white paper #FFFFFF", "line": "faint pencil underdrawing, edges defined by wet-on-wet and wet-on-dry washes", "texture": "rough cotton paper grain, granulation, blooms and hard drying edges", "composition": "airy, open composition with large untouched paper areas and a gentle focal point", "lighting": "light from the white of the paper, soft transparent shadows", "figures": "lightly painted figures with minimal features, gentle and respectful", "do": ["leave plenty of white paper", "let washes bloom and granulate", "keep it light and transparent", "suggest detail rather than render it"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no opaque heavy paint", "no harsh black outlines"], "promptCore": "A delicate transparent watercolour illustration on rough cotton paper with a faint pencil underdrawing, soft cerulean, sap green and rose washes, blooms and granulation, and large areas of untouched white paper. Airy, gentle and calm.", "negative": "photograph, vector, opaque paint, neon, heavy black lines, 3D render, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 7},
    {"slug": "digital-painterly", "familySlug": "painting", "label": "Digital painterly", "summary": "Contemporary concept-art finish, cinematic", "goodFor": ["tech futures", "AI", "space", "energy"], "ruleSheet": {"medium": "digital painting with a contemporary concept-art finish and visible brush textures", "palette": "deep space blue #0E1A2B, electric cyan #3FC1C9, warm amber #FFB547, violet #6A4C93, haze grey #9AA5B1", "line": "painterly edges, lost-and-found contours, no ink outlines", "texture": "digital brush texture, atmospheric haze, subtle grain", "composition": "cinematic wide framing, strong depth, a clear focal subject against atmosphere", "lighting": "volumetric light, rim light on the focal subject, glowing accents", "figures": "figures as small silhouettes or painterly forms against vast scenes, never detailed portraits", "do": ["use atmospheric depth and haze", "rim-light the focal subject", "frame it like a film still", "keep brushwork visible"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no photorealistic rendering", "no game-UI elements or screens with writing"], "promptCore": "A cinematic digital painting with a contemporary concept-art finish, visible brush texture, atmospheric haze and volumetric light, in deep space blue, electric cyan and warm amber. Wide framing with strong depth and a rim-lit focal subject.", "negative": "photograph, photorealistic, vector flat, cartoon, UI, screens with text, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 8},
    {"slug": "pencil-sketch", "familySlug": "drawing-print", "label": "Pencil sketch", "summary": "Graphite with hatching, reportage feel", "goodFor": ["courts", "hearings", "interviews"], "ruleSheet": {"medium": "graphite pencil drawing in a reportage sketchbook manner", "palette": "graphite greys #3A3A3A to #BDBDBD on warm sketchbook paper #F4EFE4; optional single muted wash of slate blue #6B7F99", "line": "searching, observational lines with cross-hatching and some construction lines left visible", "texture": "paper tooth, smudges, soft eraser marks", "composition": "on-the-spot reportage framing, the subject drawn fully and the surroundings left loose and unfinished", "lighting": "tone built by hatching density, strong side light", "figures": "observational figures with natural proportions, faces drawn simply and without exaggeration", "do": ["leave construction lines visible", "finish the focal subject and let edges fade out", "build tone with hatching", "keep it observational, not stylised"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no colour beyond one muted wash", "no caricature or exaggeration"], "promptCore": "A graphite pencil reportage sketch on warm sketchbook paper, with searching observational lines, cross-hatching and visible construction lines. The focal subject is fully drawn while the surroundings fade into loose unfinished strokes.", "negative": "photograph, colour painting, vector, ink, digital, cartoon, caricature, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 9},
    {"slug": "charcoal", "familySlug": "drawing-print", "label": "Charcoal", "summary": "Smudged charcoal, deep blacks, gravity", "goodFor": ["serious stories", "sombre stories"], "ruleSheet": {"medium": "compressed and willow charcoal on heavy grey-toned paper", "palette": "charcoal black #111111, smoky greys #555555 to #A0A0A0, toned paper #D8D4CC, white chalk highlights #F2F2F2", "line": "broad expressive strokes, smudged edges, few hard lines", "texture": "heavy paper tooth, dust, finger smudges, lifted highlights", "composition": "quiet, weighty composition with large dark areas and one point of light", "lighting": "low-key lighting, deep blacks, a single soft light source", "figures": "figures only as silhouettes or turned away, never identifiable faces", "do": ["use large areas of deep black", "lift a single point of light", "keep the mood quiet and respectful", "prefer symbolic objects over people"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no colour", "no identifiable faces or graphic detail"], "promptCore": "A sombre charcoal drawing on grey-toned paper with deep smudged blacks, smoky greys and a single soft point of light lifted in white chalk. Quiet, weighty composition with expressive broad strokes; any figures appear only as silhouettes.", "negative": "photograph, colour, vector, cartoon, bright, cheerful, gore, faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 10},
    {"slug": "linocut", "familySlug": "drawing-print", "label": "Linocut", "summary": "Carved relief print, bold black with one colour", "goodFor": ["agriculture", "labour", "rural economy"], "ruleSheet": {"medium": "linocut relief print with carved gouge marks, printed in black plus one colour", "palette": "print black #161616, one colour chosen per image from brick red #B23A2E, indigo #2E3F7F or turmeric #D9A21B, on natural paper #F1EAD8", "line": "bold carved shapes, gouge-mark hatching, chunky confident contours", "texture": "uneven ink coverage, paper showing through, slight print registration shift", "composition": "strong, graphic, poster-like composition with clear silhouettes", "lighting": "no modelling; light expressed by carved white lines", "figures": "sturdy, dignified working figures with simplified carved features", "do": ["use carved gouge marks for tone", "limit to black plus one colour", "keep silhouettes bold", "let paper texture show through ink"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no gradients", "no fine photographic detail"], "promptCore": "A linocut relief print with bold carved shapes and gouge-mark hatching, printed in black and a single colour on natural paper, with uneven ink coverage and slight registration shift. Strong graphic composition with sturdy, dignified figures.", "negative": "photograph, gradient, digital painting, 3D render, smooth shading, many colours, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": true, "photoreal": false}, "sortOrder": 11},
    {"slug": "risograph", "familySlug": "drawing-print", "label": "Risograph", "summary": "Two-colour riso print, grain, slight misregistration", "goodFor": ["startups", "youth", "culture", "tech"], "ruleSheet": {"medium": "two-colour risograph print with overprinting and grainy texture", "palette": "fluorescent pink #FF48B0 and teal #00838A, overprint blend, on off-white #F7F3EA; alternate pair: blue #0078BF and yellow #FFE800", "line": "simple bold shapes, some line work, playful and graphic", "texture": "heavy grain, halftone dots, visible misregistration between the two colours", "composition": "bold, playful composition with overlapping forms where the two inks mix", "lighting": "flat, tone built with halftone and grain only", "figures": "friendly simplified figures, expressive but not caricatured", "do": ["use exactly two inks", "let overprint create a third colour", "show misregistration on purpose", "keep shapes bold and playful"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no more than two ink colours", "no photographic detail"], "promptCore": "A two-colour risograph print in fluorescent pink and teal on off-white paper, with heavy grain, halftone dots, overprinted areas and slight misregistration between the inks. Bold, playful shapes and friendly simplified figures.", "negative": "photograph, full colour, gradient, 3D render, glossy, realistic, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 12},
    {"slug": "paper-cut", "familySlug": "craft-3d", "label": "Paper cut", "summary": "Layered cut paper with soft shadows", "goodFor": ["explainers", "finance basics", "festivals"], "ruleSheet": {"medium": "layered cut-paper craft photographed in soft studio light", "palette": "marigold #F2A541, leaf green #4C9A2A, deep teal #145C6E, rani pink #C83E7A, paper white #FAF7F2", "line": "clean cut edges, no drawn lines", "texture": "visible paper fibres, slight curl at edges, layered thickness", "composition": "stacked depth layers from background to foreground, centred or rule-of-thirds focal piece", "lighting": "soft top light casting gentle drop shadows between layers", "figures": "cut-paper figures with simple shapes, no facial detail beyond a few cut holes", "do": ["build depth with five or more layers", "show soft shadows between layers", "keep edges crisp", "use festive, warm colour combinations"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no drawn ink lines", "no glossy plastic look"], "promptCore": "A layered cut-paper craft illustration photographed in soft studio light, with crisp cut edges, visible paper fibres and gentle shadows between stacked layers, in marigold, leaf green, deep teal and rani pink. Clear depth from background to foreground.", "negative": "drawing, ink line, vector flat, plastic, glossy 3D, photograph of people, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 13},
    {"slug": "clay-puppet", "familySlug": "craft-3d", "label": "Clay puppet", "summary": "Stop-motion clay figures and sets", "goodFor": ["light satire", "politics (non-sensitive)"], "ruleSheet": {"medium": "stop-motion plasticine figures on a handmade miniature set", "palette": "saturated but soft clay colours: tomato red #D9483B, butter yellow #F2C94C, sky #6FB3E0, grass #5DAA4F, skin tones in warm natural clay", "line": "rounded sculpted forms, no lines", "texture": "visible fingerprints and tool marks in the clay, handmade set materials", "composition": "a small theatrical scene on a set, characters interacting, shallow depth of field", "lighting": "soft key light with a warm fill, small practical lights on the set", "figures": "generic clay characters with big simple eyes; never a likeness of any real person", "do": ["show fingerprints and tool marks", "keep it playful but not mocking", "build a small theatrical set", "use shallow depth of field"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no likeness of any real person", "never used for sensitive stories"], "promptCore": "A stop-motion clay animation still: handmade plasticine characters with visible fingerprints and tool marks on a small handcrafted set, soft key light and shallow depth of field, in saturated soft clay colours. Playful and theatrical, with generic characters.", "negative": "photograph of real people, realistic faces, likeness of real person, vector, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": false}, "sortOrder": 14},
    {"slug": "soft-3d", "familySlug": "craft-3d", "label": "Soft 3D", "summary": "Rounded matte 3D objects, studio light", "goodFor": ["personal finance", "products", "apps"], "ruleSheet": {"medium": "soft matte 3D render with rounded clay-like objects", "palette": "pastel lavender #C3B1E1, mint #B8E0D2, peach #FFC8A2, butter #FFE8A3, background soft blue-grey #E6ECF2; optional ET red #E8262D on one object", "line": "no lines; rounded bevelled forms", "texture": "matte, slightly soft surfaces, no reflections", "composition": "a few hero objects floating or resting on a seamless studio backdrop, centred and balanced", "lighting": "soft global illumination, gentle contact shadows", "figures": "generic rounded mannequin figures only, no faces", "do": ["round every edge", "keep surfaces matte", "use seamless pastel backdrops", "show soft contact shadows"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no glossy or chrome materials", "no realistic human faces"], "promptCore": "A soft matte 3D render of rounded, clay-like objects on a seamless pastel studio backdrop, lit with soft global illumination and gentle contact shadows, in lavender, mint, peach and butter yellow. Simple, friendly and balanced.", "negative": "photograph, glossy, chrome, realistic textures, faces, vector flat, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 15},
    {"slug": "diorama", "familySlug": "craft-3d", "label": "Miniature diorama", "summary": "Tilt-shift miniature world", "goodFor": ["cities", "real estate", "logistics"], "ruleSheet": {"medium": "miniature model diorama photographed with a tilt-shift effect", "palette": "natural model colours: brick #B5543C, asphalt #4A4A4A, park green #6E9E4A, sky #9CC7E8, warm light #FFD9A0", "line": "no lines; crisp model edges", "texture": "model-railway textures: flock grass, painted plastic, tiny printed details without readable signs", "composition": "high-angle view of a small world, a narrow band of sharp focus across the focal point", "lighting": "warm late-afternoon light, small long shadows", "figures": "tiny generic model figures only, never identifiable", "do": ["shoot from a high angle", "keep a narrow band of focus", "make it feel like a hand-built model", "use warm low-angle light"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no readable signs or street names", "no close-up people"], "promptCore": "A miniature model diorama of a small world, photographed from a high angle with a tilt-shift lens so only a narrow band is in focus, warm late-afternoon light and tiny long shadows. Hand-built model textures and tiny generic figures.", "negative": "full-size photograph, close-up people, readable signs, vector, painting, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 16},
    {"slug": "collage", "familySlug": "graphic-collage", "label": "Mixed-media collage", "summary": "Cut paper, textures, halftone, torn edges", "goodFor": ["politics", "culture", "multi-angle stories"], "ruleSheet": {"medium": "mixed-media collage of torn paper, halftone fragments, painted marks and textures", "palette": "newsprint grey #D6D2C8, ink black #1A1A1A, ET red #E8262D, mustard #D4A017, cobalt #2F4FA8", "line": "torn and cut edges, occasional scribbled marker lines", "texture": "halftone dots, paper grain, tape and fold marks", "composition": "layered, dynamic composition of fragments that together form one idea", "lighting": "flat, with shadows only where paper overlaps", "figures": "figures built from cut shapes and halftone silhouettes, no recognisable real faces", "do": ["layer fragments to build one idea", "mix torn edges with clean cuts", "use halftone texture", "keep a clear focal point despite the layers"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no readable newspaper text in fragments", "no recognisable faces cut from photos"], "promptCore": "A mixed-media editorial collage of torn and cut paper, halftone fragments, tape and painted marks in newsprint grey, black, red, mustard and cobalt. Layered fragments combine into one clear idea with a strong focal point.", "negative": "single photograph, clean vector, 3D render, readable newspaper text, real faces, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 17},
    {"slug": "swiss-geometric", "familySlug": "graphic-collage", "label": "Swiss geometric", "summary": "Grid, primary shapes, bold negative space", "goodFor": ["data", "economy", "policy"], "ruleSheet": {"medium": "Swiss-style geometric composition of primary shapes on a strict grid", "palette": "signal red #E63946, cobalt #1D3557, sun yellow #FFC300, black #111111, white #F8F8F8", "line": "precise geometric edges, no hand-drawn lines", "texture": "perfectly flat, optional very fine print grain", "composition": "strict modular grid, asymmetric balance, bold negative space, shapes implying movement or tension", "lighting": "none; pure flat colour", "figures": "no people; ideas expressed with shapes only", "do": ["express the idea through shape relationships", "respect a modular grid", "use bold negative space", "keep to three or four colours"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people or faces", "no illustrative detail"], "promptCore": "A Swiss-style geometric composition of circles, squares, bars and arcs on a strict modular grid, in signal red, cobalt, sun yellow and black on white, with bold negative space and asymmetric balance. Pure flat colour, the idea expressed through shape relationships alone.", "negative": "photograph, illustration detail, people, faces, texture-heavy, 3D, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 18},
    {"slug": "retro-indian", "familySlug": "graphic-collage", "label": "Retro Indian print", "summary": "Vintage Indian poster and matchbox-label print look", "goodFor": ["brands", "nostalgia", "consumer"], "ruleSheet": {"medium": "vintage Indian commercial print look with flat inks, decorative borders and aged paper", "palette": "vermilion #E34234, peacock blue #1F6E8C, turmeric #E1A90F, leaf green #3E7C3A, aged paper #EFDDB8", "line": "bold decorative outlines and ornamental flourishes", "texture": "aged paper, ink wear, slight misregistration and halftone", "composition": "centred emblem-like composition with ornamental frame, symmetrical balance", "lighting": "flat with simple two-tone shading", "figures": "stylised illustrated figures in a vintage commercial manner, friendly and non-mocking", "do": ["use ornamental borders and frames", "keep a centred emblem layout", "age the paper", "use bold flat inks"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no readable words, slogans or brand names", "no real brand imagery"], "promptCore": "A vintage Indian commercial print illustration in the manner of old matchbox labels and hand-painted posters, with flat vermilion, peacock blue and turmeric inks, ornamental borders, a centred emblem-like composition and aged, slightly misregistered paper.", "negative": "photograph, modern flat vector, 3D render, readable words, real brands, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": true, "allowsSensitive": false, "photoreal": false}, "sortOrder": 19},
    {"slug": "data-art", "familySlug": "graphic-collage", "label": "Data art", "summary": "Abstract charts and flows as art, no numbers", "goodFor": ["markets", "macro", "trade"], "ruleSheet": {"medium": "abstract generative data-art composition of lines, flows and particles", "palette": "midnight #0B1D33, electric blue #2D9CDB, emerald #27AE60, amber #F2994A, soft white #EDEFF2", "line": "fine precise lines and curves, flowing bundles", "texture": "smooth with subtle glow and particle dust", "composition": "a single flowing structure across the frame that suggests a trend, network or exchange", "lighting": "luminous lines on a dark ground", "figures": "no people", "do": ["suggest the story's shape (rise, fall, flow, network)", "use fine luminous lines", "keep a dark ground", "make it feel like art, not a chart"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no axes, numbers, labels or legends", "no people"], "promptCore": "An abstract data-art composition of fine luminous lines, flowing bundles and particles on a dark midnight ground, in electric blue, emerald and amber, suggesting a trend, flow or network. Elegant and artistic, with no axes, labels or numbers.", "negative": "chart axes, numbers, labels, legend, people, photograph, cartoon, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": false}, "sortOrder": 20},
    {"slug": "still-life", "familySlug": "photo-based", "label": "Object still life", "summary": "Studio photo of symbolic objects", "goodFor": ["personal finance", "commodities", "earnings"], "ruleSheet": {"medium": "studio still-life photograph of symbolic objects", "palette": "neutral backdrops in warm grey #CFC8BE, deep green #1F3D33 or terracotta #B8643F, with natural object colours", "line": "photographic, crisp edges", "texture": "real material textures: metal, paper, wood, fabric", "composition": "a small arrangement of objects with a clear hero object, minimal and considered", "lighting": "soft studio key light with a gentle shadow, controlled reflections", "figures": "never people; objects only", "do": ["use a small, considered arrangement", "make one object the hero", "use soft studio light", "choose objects that symbolise the story"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people, hands or body parts", "no depiction of a real news event"], "promptCore": "A minimal studio still-life photograph of a few symbolic objects on a neutral backdrop, with a clear hero object, real material textures and soft studio light with a gentle shadow. Objects only, no people.", "negative": "people, hands, faces, news event, crowd, illustration, cartoon, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 21},
    {"slug": "duotone", "familySlug": "photo-based", "label": "Duotone", "summary": "Two-tone photo treatment of places or objects", "goodFor": ["markets", "corporate", "cities"], "ruleSheet": {"medium": "duotone photographic treatment mapped to two inks", "palette": "pairs: navy #14213D with amber #FCA311, or deep teal #0B3C49 with coral #FF6F59, or black #111111 with ET red #E8262D", "line": "photographic edges with high contrast", "texture": "smooth tonal mapping, optional fine grain", "composition": "bold architectural or object crops, strong geometry, lots of sky or negative space", "lighting": "high contrast, graphic light and shadow", "figures": "never people", "do": ["map the photo to exactly two colours", "crop boldly for geometry", "keep strong contrast", "use places and objects only"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people", "no depiction of a real news event or a recognisable landmark under incident"], "promptCore": "A bold duotone photographic image of architecture, places or objects mapped to two inks, navy and amber, with strong contrast, graphic geometry and generous negative space. No people.", "negative": "people, faces, crowds, full colour, illustration, cartoon, news event, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 22},
    {"slug": "photo-collage", "familySlug": "photo-based", "label": "Photo collage", "summary": "Cut-out photo elements composed surreally", "goodFor": ["tech", "economy", "culture"], "ruleSheet": {"medium": "surreal collage of cut-out photographic objects with clean cut edges", "palette": "clean studio backgrounds in pale blue #DCE8F2 or blush #F4DCD6, with natural object colours and one bold accent", "line": "clean cut-out edges with subtle drop shadows", "texture": "photographic textures of each object, consistent lighting across cut-outs", "composition": "a surreal juxtaposition of a few objects that creates a visual metaphor", "lighting": "consistent soft studio light across all elements", "figures": "never people; objects, plants, buildings and abstract forms only", "do": ["build a clear surreal metaphor", "match lighting across elements", "keep the set clean and minimal", "use three to five objects at most"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no people or body parts", "no depiction of a real news event"], "promptCore": "A surreal photographic collage of a few cut-out objects arranged into a visual metaphor on a clean pale studio background, with consistent soft lighting, subtle drop shadows and one bold accent colour. Objects only, no people.", "negative": "people, faces, hands, crowds, news event, illustration, drawing, text"}, "safety": {"allowsPeople": false, "allowsRealPeople": false, "allowsSensitive": false, "photoreal": true}, "sortOrder": 23},
    {"slug": "double-exposure", "familySlug": "photo-based", "label": "Double exposure", "summary": "Silhouette filled with a scene", "goodFor": ["profiles of sectors", "cities", "ideas"], "ruleSheet": {"medium": "double-exposure photograph: an anonymous silhouette or object shape filled with a second scene", "palette": "monochrome base #1C1C1C to #F2F2F2 with the inner scene in one muted tint: teal #2E6F73 or warm amber #D99A4E", "line": "the silhouette edge is clean; the inner scene blends softly", "texture": "photographic, soft blend with fine grain", "composition": "a single silhouette or shape against a pale background, the inner scene telling the story", "lighting": "soft, even light; the inner scene carries its own light", "figures": "only one anonymous silhouette in profile or from behind, never an identifiable face", "do": ["keep the silhouette anonymous", "let the inner scene tell the story", "use a pale clean background", "limit colour to one muted tint"], "dont": ["no text, letters, numbers or symbols that read as writing anywhere in the image", "no logos, brand marks, watermarks or signatures", "no imitation of any named artist's signature style", "no identifiable face", "no depiction of a real news event"], "promptCore": "A double-exposure photographic image of a single anonymous silhouette in profile against a pale background, filled with a second scene that tells the story, blended softly in monochrome with one muted teal tint.", "negative": "identifiable face, portrait, crowds, news event, illustration, cartoon, text"}, "safety": {"allowsPeople": true, "allowsRealPeople": false, "allowsSensitive": true, "photoreal": true}, "sortOrder": 24}
  ]
}
```
