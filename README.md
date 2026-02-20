# Smart Hero Gallery Assignment

This project implements the `SmartHeroGallery` React Native take-home assignment in a bare React Native app.

## Setup

1. Install JavaScript dependencies:
```bash
npm install
```

2. iOS pods:
```bash
cd ios
pod install
cd ..
```

3. Start Metro:
```bash
npm run start
```

4. Run app:
```bash
npm run ios
# or
npm run android
```

5. Run tests:
```bash
npm test
```

## Implemented Requirements

- Fetches gallery from Alive API and reads `data.gallery`.
- Builds pages using deterministic pure `buildPages(items, { lookahead })`.
- 2-column layout per page: left hero tile + two equal right stacked tiles.
- Maximum one video per page.
- Video preference is applied page-by-page using closest `9:16` rule.
- Horizontal paged `FlatList` for smooth 100+ items behavior.
- Progressive image loading: preview -> processed -> original fallback.
- Progressive video poster loading: preview thumbnail -> processed thumbnail -> original thumbnail.
- Video source fallback: processed -> original.
- If playback fails, poster remains and `Tap to retry` overlay appears.
- First page nudge button scrolls to page 2 and auto-hides.
- Fullscreen modal carousel with prev/next controls.
- Fullscreen media shown in `contain` mode.
- Image supports pinch and double-tap zoom in fullscreen.
- Video has no zoom.

## Core Logic

File: `src/utils/buildPages.ts`

Rules implemented:
- Preserve API order as much as possible.
- For each page, choose one video from remaining items using closest score to `0.5625` (`9/16`) in a configurable lookahead window.
- Tie-break naturally keeps earlier item because scan is in order.
- Fill order:
  - Left: selected video else image
  - Right top and right bottom: images
- If right images are insufficient, selected video may move to right and left becomes image.
- Stops when a complete 3-tile page cannot be formed.

## Smart Cover Approach

Tile media uses `resizeMode="cover"` for page layout. The tile geometry is fixed (left tall hero + right equal stack), which tends to crop primarily on one axis depending on source aspect ratio. In fullscreen, media switches to `contain` to avoid truncation.

## Fallback Handling

File: `src/utils/mediaUrls.ts` builds all URLs from:
- `CDN_BASE = https://cdn.iamalive.app`
- `PROCESSED_MOBILE_PREFIX = /processed/mobile/`
- `PREVIEW_PREFIX = /processed/preview/`

Image pipeline:
- Try preview placeholder
- Load processed
- Fallback to original if processed fails

Video pipeline:
- Poster sequence: preview -> processed -> original
- Video sequence: processed -> original
- Playback failure keeps poster + retry overlay

## Performance Work

- Horizontal `FlatList` with paging and snap behavior.
- Memoized tiles (`React.memo`) and stable callbacks (`useCallback`).
- Viewability-based active page with 60% threshold.
- Video playback restricted to visible page only.
- Prefetch runs when page changes.
- Page-building computation done outside render via `useMemo`.
- `removeClippedSubviews`, small render window, and `getItemLayout` added.

## Extra Tasks (all 4 done)

1. Prefetch
- On page `N`, prefetches images for `N+1` and `N+2`.
- For videos, prefetches only posters/thumbnails.

2. Viewability control for video
- Video plays only on visible page and pauses otherwise (60% threshold).

3. Unit tests for `buildPages`
- Added tests for:
  - only images
  - multiple videos with varying aspect ratios
  - missing aspect ratios
  - long list one-video-per-page behavior

4. Page indicator
- Dot indicator showing current page index.

## Project Structure

- `src/components/SmartHeroGallery.tsx`: main screen and layout
- `src/components/GalleryTile.tsx`: progressive image/video tile rendering
- `src/components/FullscreenCarouselModal.tsx`: full-screen carousel
- `src/components/ZoomableImage.tsx`: pinch and double-tap image zoom
- `src/components/PageIndicator.tsx`: page dots
- `src/hooks/useSmartGallery.ts`: fetch + state + page derivation
- `src/utils/buildPages.ts`: deterministic layout builder
- `src/utils/mediaUrls.ts`: CDN URL and fallback builders
- `src/api/galleryApi.ts`: API fetch/normalization
- `__tests__/buildPages.test.ts`: unit tests

## With More Time

- Add integration tests for fallback transitions and playback failure states.
- Improve Android fullscreen gesture interactions with a newer zoom library.
- Add analytic events for video retries and asset fallback rates.
- Fine tune page residual handling for datasets dominated by videos.
