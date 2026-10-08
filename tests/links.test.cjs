const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const html = fs.readFileSync(path.resolve(__dirname, '../dist/index.html'), 'utf8');
const supplied = [
  ['Instagram', 'https://www.instagram.com/_hishikachandan_/'],
  ['Substack', 'https://substack.com/@hishikachandan'],
  ['Amazon', 'https://amzn.in/d/0c3AoaPS'],
  ['Flipkart', 'https://dl.flipkart.com/s/c5dcizNNNN'],
  ['Google Play Books', 'https://play.google.com/store/books/details/Hishika_Chandan_Us_Unscripted?id=Mf4PEgAAQBAJ']
];
const links = [...html.matchAll(/<a\b([^>]+)>([\s\S]*?)<\/a>/g)].map(([, attrs, content]) => ({
  attrs: Object.fromEntries([...attrs.matchAll(/([\w-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value])),
  text: content.replace(/<[^>]+>/g, '')
}));
for (const [platform, url] of supplied) {
  test(`${platform} uses the exact supplied URL and opens safely in a new tab`, () => {
    const matching = links.filter(link => link.attrs.href === url);
    assert(matching.length > 0);
    const decorated = matching.find(link => link.attrs.class?.includes('floral-link'));
    assert(decorated, 'A decorated, keyboard-accessible link is present');
    assert(decorated.text.includes(platform));
    for (const link of matching) {
      assert.equal(link.attrs.target, '_blank');
      assert(link.attrs.rel.split(' ').includes('noopener'));
      assert(link.attrs.rel.split(' ').includes('noreferrer'));
      assert(!link.attrs.onclick, 'Navigation is handled by a real anchor');
    }
  });
}
test('Goodreads remains pending and no former Amazon destination remains', () => {
  assert(html.includes('Goodreads'));
  assert(html.includes('LINK COMING SOON'));
  assert(!links.some(link => /goodreads\.com/.test(link.attrs.href || '')));
  assert(!html.includes('https://www.amazon.in/dp/9379034296'));
});
