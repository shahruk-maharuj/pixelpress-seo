# Third-party software

The files in `engine/` are compiled builds of the open-source libraries below. Each keeps its own license. The rest of this repository is MIT licensed (see `LICENSE`).

| Library | Used for | License |
|---|---|---|
| [MozJPEG](https://github.com/mozilla/mozjpeg) | JPEG encoding | IJG License and BSD-3-Clause |
| [libwebp](https://chromium.googlesource.com/webm/libwebp) | WebP encoding | BSD-3-Clause |
| [libavif](https://github.com/AOMediaCodec/libavif) | AVIF encoding | BSD-2-Clause |
| [OxiPNG](https://github.com/shssoichiro/oxipng) | Lossless PNG optimization | MIT |
| [libimagequant](https://github.com/ImageOptim/libimagequant) | PNG palette quantization | GPL-3.0-or-later (or commercial) |
| [libheif](https://github.com/strukturag/libheif) | iPhone HEIC decoding | LGPL-3.0 |
| [gifsicle](https://github.com/kohler/gifsicle) | GIF optimization | GPL-2.0 |
| [SVGO](https://github.com/svg/svgo) | SVG optimization | MIT |
| [Squoosh](https://github.com/GoogleChromeLabs/squoosh) codec wrappers | WebAssembly builds of the codecs above | Apache-2.0 |

## Fonts

The files in `fonts/` are the Latin and Latin Extended subsets of these fonts, taken from [Fontsource](https://fontsource.org) packages. Each license text sits next to the files.

| Font | Weights | License |
|---|---|---|
| [Google Sans Flex](https://fonts.google.com/specimen/Google+Sans+Flex) | 400, 500 | SIL Open Font License 1.1 (`fonts/LICENSE-google-sans-flex.txt`) |
| [Roboto](https://fonts.google.com/specimen/Roboto) | 400, 500, 700 | SIL Open Font License 1.1 (`fonts/LICENSE-roboto.txt`) |
| [Roboto Mono](https://fonts.google.com/specimen/Roboto+Mono) | 400, 500 | SIL Open Font License 1.1 (`fonts/LICENSE-roboto-mono.txt`) |

If you redistribute this project, include these notices. If you plan to sell or relicense it, check the GPL components (libimagequant, gifsicle) first.
