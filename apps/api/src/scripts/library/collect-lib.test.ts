import { describe, expect, test } from 'bun:test';
import { dedupeKey, extractImageCandidates, looksLikeUiImage, parseRobots, parseSrcset, robotsAllows, sniffImageType, upgradeUrl } from './collect-lib';

describe('robots.txt', () => {
  const rules = parseRobots(`
User-agent: Googlebot
Disallow: /

User-agent: *
Disallow: /private/
Disallow: /*.pdf$
Allow: /private/press/

User-agent: other
Disallow: /work/
`);

  test('only the rules for every agent apply', () => {
    expect(robotsAllows(rules, '/work/one')).toBe(true);
    expect(robotsAllows(rules, '/')).toBe(true);
  });

  test('longest match wins, Allow wins a tie, wildcards and anchors work', () => {
    expect(robotsAllows(rules, '/private/x.jpg')).toBe(false);
    expect(robotsAllows(rules, '/private/press/x.jpg')).toBe(true);
    expect(robotsAllows(rules, '/files/a.pdf')).toBe(false);
    expect(robotsAllows(rules, '/files/a.pdf?x=1')).toBe(true);
  });

  test('an empty Disallow allows everything', () => {
    expect(robotsAllows(parseRobots('User-agent: *\nDisallow:\n'), '/anything')).toBe(true);
  });
});

describe('image candidates', () => {
  const page = 'https://artist.example/work/project';
  const html = `
<html><head>
<meta property="og:image" content="https://cdn.example/og-cover.jpg">
<meta name="twitter:image" content="/img/twitter.jpg">
</head><body>
<img src="/img/logo.png" alt="logo">
<img src="/img/small.jpg" width="300">
<img srcset="https://cdn.example/a-400.jpg 400w, https://cdn.example/a-1600.jpg 1600w, https://cdn.example/a-800.jpg 800w" src="https://cdn.example/a-400.jpg">
<img data-srcset="https://res.cloudinary.com/x/image/upload/w_500,h_300/b.jpg 500w, https://res.cloudinary.com/x/image/upload/w_2000,h_1200/b.jpg 2000w">
<img data-image="https://images.squarespace-cdn.com/content/v1/abc/piece.jpg" data-image-dimensions="2500x1667" src="https://images.squarespace-cdn.com/content/v1/abc/piece.jpg?format=300w">
<img src="https://example.org/wp-content/uploads/2024/05/print-1024x683.jpg">
<img src="https://cdn.example/anim.gif">
<img src="https://cdn.example/icon-sprite.png">
<img src="data:image/png;base64,AAAA">
<a href="/full/piece-2.png">full size</a>
</body></html>`;
  const urls = extractImageCandidates(html, page).map((c) => c.url);

  test('reads og and twitter images, the largest srcset entry and links to image files', () => {
    expect(urls).toContain('https://cdn.example/og-cover.jpg');
    expect(urls).toContain('https://artist.example/img/twitter.jpg');
    expect(urls).toContain('https://cdn.example/a-1600.jpg');
    expect(urls).not.toContain('https://cdn.example/a-400.jpg');
    expect(urls).toContain('https://res.cloudinary.com/x/image/upload/w_2000,h_1200/b.jpg');
    expect(urls).toContain('https://artist.example/full/piece-2.png');
  });

  test('asks Squarespace and WordPress for their largest version, keeping the original as a fallback', () => {
    const sq = extractImageCandidates(html, page).find((c) => c.url.includes('squarespace'))!;
    expect(sq.url).toBe('https://images.squarespace-cdn.com/content/v1/abc/piece.jpg?format=2500w');
    expect(sq.alternates.length).toBe(1);
    expect(urls).toContain('https://example.org/wp-content/uploads/2024/05/print.jpg');
  });

  test('skips logos, icons, sprites, gifs, data URIs and images stated under 600px', () => {
    expect(urls.some((u) => /logo|sprite|anim\.gif|small\.jpg|^data:/.test(u))).toBe(false);
  });

  test('on Behance, keeps the largest variant of each project module only', () => {
    const behance = `
<img srcset="https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/abc123.jpg 1200w, https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/abc123.jpg 1400w">
<img src="https://mir-s3-cdn-cf.behance.net/projects/404/cover.jpg">
<script>{"src":"https:\\/\\/mir-s3-cdn-cf.behance.net\\/project_modules\\/source\\/def456.png"}</script>
<img src="https://mir-s3-cdn-cf.behance.net/project_modules/disp/def456.png">`;
    const found = extractImageCandidates(behance, 'https://www.behance.net/gallery/1/x').map((c) => c.url);
    expect(found).toEqual([
      'https://mir-s3-cdn-cf.behance.net/project_modules/1400_opt_1/abc123.jpg',
      'https://mir-s3-cdn-cf.behance.net/project_modules/source/def456.png',
    ]);
  });

  test('srcset parsing keeps commas inside URLs', () => {
    expect(parseSrcset('https://x/w_1,h_2/a.jpg 100w, https://x/b.jpg 2x')).toEqual([
      { url: 'https://x/w_1,h_2/a.jpg', width: 100 },
      { url: 'https://x/b.jpg', width: 2000 },
    ]);
  });

  test('the same file at another size has one identity', () => {
    expect(dedupeKey('https://mir-s3-cdn-cf.behance.net/project_modules/disp/a.jpg')).toBe(dedupeKey('https://mir-s3-cdn-cf.behance.net/project_modules/max_1200/a.jpg'));
    expect(dedupeKey('https://a.example/cdn-cgi/image/width=900,quality=75/g/p.jpg')).toBe(dedupeKey('https://a.example/cdn-cgi/image/width=1200/g/p.jpg'));
    expect(upgradeUrl('https://gallery.example/sites/default/files/styles/medium/public/tiger_1.jpg?itok=abc')).toEqual({
      url: 'https://gallery.example/sites/default/files/tiger_1.jpg',
      alternates: ['https://gallery.example/sites/default/files/styles/medium/public/tiger_1.jpg?itok=abc'],
    });
    expect(upgradeUrl('https://cdn.example/a.jpg')).toEqual({ url: 'https://cdn.example/a.jpg', alternates: [] });
    expect(looksLikeUiImage('https://cdn.example/avatar/me.jpg', null)).toBe(true);
    expect(looksLikeUiImage('https://cdn.example/work/harbour.jpg', 1200)).toBe(false);
  });
});

describe('type sniffing', () => {
  test('accepts JPEG, PNG and WebP by their bytes only', () => {
    expect(sniffImageType(new Uint8Array([0xff, 0xd8, 0xff, 0xe0]))).toBe('jpeg');
    expect(sniffImageType(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))).toBe('png');
    expect(sniffImageType(new Uint8Array([0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50]))).toBe('webp');
    expect(sniffImageType(new Uint8Array([0x47, 0x49, 0x46, 0x38]))).toBeNull();
    expect(sniffImageType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'))).toBeNull();
  });
});
