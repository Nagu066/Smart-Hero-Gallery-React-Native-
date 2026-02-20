import {buildPages} from '../src/utils/buildPages';
import {GalleryItem} from '../src/types/gallery';

const image = (id: string): GalleryItem => ({
  _id: id,
  type: 'image',
  src: `${id}.jpg`,
});

const video = (id: string, aspectRatio?: number): GalleryItem => ({
  _id: id,
  type: 'video',
  src: `${id}.mp4`,
  aspectRatio,
});

describe('buildPages', () => {
  it('builds pages for only images', () => {
    const items = [image('i1'), image('i2'), image('i3'), image('i4'), image('i5'), image('i6')];

    const pages = buildPages(items);

    expect(pages).toHaveLength(2);
    expect(pages[0].left._id).toBe('i1');
    expect(pages[0].rightTop._id).toBe('i2');
    expect(pages[0].rightBottom._id).toBe('i3');
  });

  it('chooses closest 9:16 video per page', () => {
    const items = [
      image('i1'),
      video('v-wide', 1.2),
      image('i2'),
      video('v-portrait', 0.56),
      image('i3'),
      image('i4'),
      image('i5'),
      image('i6'),
    ];

    const pages = buildPages(items, {lookahead: 12});

    expect(pages[0].left._id).toBe('v-portrait');
    expect(pages[1].left._id).toBe('v-wide');
  });

  it('handles missing aspect ratios', () => {
    const items = [
      image('i1'),
      video('v-no-aspect'),
      image('i2'),
      video('v-good', 0.57),
      image('i3'),
      image('i4'),
    ];

    const pages = buildPages(items, {lookahead: 12});

    expect(pages).toHaveLength(1);
    expect(pages[0].left._id).toBe('v-good');
  });

  it('keeps max one video per page on long list', () => {
    const items: GalleryItem[] = [];

    for (let i = 0; i < 120; i += 1) {
      items.push(image(`img-${i}`));
      if (i % 9 === 0) {
        items.push(video(`vid-${i}`, 0.56));
      }
    }

    const pages = buildPages(items, {lookahead: 12});

    pages.forEach(page => {
      const count = [page.left, page.rightTop, page.rightBottom].filter(tile => tile.type === 'video').length;
      expect(count).toBeLessThanOrEqual(1);
    });
  });
});
