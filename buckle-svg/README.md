# Buckle SVG generator

A standalone Python pipeline with **16 generated hardware SVGs**, cached vendor photos, PNG renders, masks, and an offline [contact sheet](output/contact-sheet.html). It does not import or modify the Next.js app.

## Install and run

Python 3.11–3.13 recommended. From this folder:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python build.py
```

The **single pipeline command is `.venv/bin/python build.py`**. Open `output/contact-sheet.html` directly in a browser; no server is needed. Or serve the folder with `python3 -m http.server 8080` and visit `http://localhost:8080/output/contact-sheet.html`.

The checked-in inputs make the default batch reproducible without the original reference clone:

```sh
.venv/bin/python build.py --offline
```

Cached downloads are reused by default. `--refresh` refreshes collection listings, kit discovery, and selected photos. Offline mode never makes network requests. Root npm scripts are unrelated to this Python tool.

## Inputs and options

```sh
# Add your own photos to the default web batch.
.venv/bin/python build.py --local /path/to/photos --overrides /path/to/overrides.json

# Local files only; same-stem SVGs take priority over tracing their photos.
.venv/bin/python build.py --no-web --local /path/to/photos --overrides /path/to/overrides.json

# Expand to another collection. 0 means all eligible products, not all variants.
.venv/bin/python build.py --collection magnetic --limit 24

# Optional, read-only import if the cached reference SVGs were removed.
.venv/bin/python build.py --reference /path/to/StrapBuilder
```

| Option | Meaning |
| --- | --- |
| `--local DIR` | PNG, JPEG, WebP, TIFF photos, nonrecursive; EXIF orientation is applied. Originals are copied into `input/local/`. Duplicate filename stems are rejected. |
| `--overrides FILE` | Metadata/calibration JSON, keyed by Shopify handle or original local filename stem. |
| `--sources FILE` | Alternate source registry; default `sources.json`. Vector paths resolve relative to this tool, or can be absolute. |
| `--collection HANDLE` | Paginated Shopify `/collections/<handle>/products.json`; selects hardware and excludes kits/downloads. Default uses the reviewed list of 16 products in `sources.json`. |
| `--limit N` | Maximum website products, default 16; 0 means all selected. Local files are additional. |
| `--no-web` | Only local files; requires `--local`. |
| `--offline` | Require existing caches, with no network. |
| `--refresh` | Refresh network caches; incompatible with `--offline`. |
| `--reference DIR` | Read-only reference clone, used only to seed missing copies of the two known SVGs. |

Every run replaces the previous generated batch in `output/`; cached inputs remain. Failures appear in `output/report.json` and the manifest, and the command exits nonzero. A registered but missing or broken vector is an error, rather than silently falling back to a photo. To preserve multiple batches, copy `output/` before running another selection.

### Widths and attachment points

`overrides.example.json` illustrates the format; **its values are examples, not measurements of the supplied photos**. An override can be just a number or an object:

```json
{
  "my-photo": {
    "name": "25 mm side-release buckle",
    "type": "side-release",
    "width_mm": 25,
    "reference_span": 180,
    "anchors": [[45, 160], [350, 160]]
  }
}
```

- `width_mm` means **nominal strap/slot width**, not the buckle's overall outside width. Use `null` to force unknown size and pixel units.
- `reference_span` is the length of that nominal-width feature in **source coordinates**: oriented image pixels, SVG viewBox units, or PDF page points. A 180 px slot with 25 mm webbing gives 25/180 mm per pixel. The entire drawing scales uniformly; its outer width will normally exceed 25 mm.
- `anchors` are the two attachment centers in the same source coordinates. The SVG stores their transformed positions in output units. The conventional IDs `anchor-left` and `anchor-right` identify the first/second attachment; a portrait or angled photo can make them appear top/bottom.
- `image_index` selects a different website product photo (zero-based). Confirm that it depicts the same buckle/size before applying a width override.
- Title dimensions take precedence over body text. Recognized nominal FIDLOCK family widths (for example “SNAP Buckle Flat 25”) take precedence over rounded inch equivalents. Fractions, inches, and mm are supported. Multiple sizes in a description remain unknown; the pipeline does not infer photo size from an arbitrary variant or SKU.
- Without manual calibration, a photo's longest elongated enclosed opening estimates slot width. If none exists, its shorter bounding-box dimension is used and explicitly labelled as an estimate. These are projected dimensions, not perspective-correct CAD measurements.
- Vector slot calibrations and attachment centers for the default batch are reviewed values in `sources.json`. The kits themselves say “not to scale”; preserving their curves exactly does **not** imply engineering dimensional accuracy.

### Vector priority and vendor kits

Priority is `vector-kit` → `existing-svg` → `cad` → `photo-trace`. Matching is explicit in `sources.json`, not based on visual similarity. A same-stem SVG is also discovered for a local photo. Add a `vector` object to a metadata override, or add registry entries, to supply further matches:

```json
{
  "my-photo": {
    "width_mm": 25,
    "vector": {
      "source_type": "cad",
      "path": "input/vectors/my-part.svg",
      "original_source": "my-part.dxf",
      "reference_span": 25,
      "anchors": [[2, 12.5], [48, 12.5]]
    }
  }
}
```

CAD/DXF should first be exported as SVG. PDF-compatible Illustrator/PDF files are supported with an explicit zero-based `page` and `[x0,y0,x1,y1]` `crop`; `sequence_numbers` optionally selects specific PDF drawing operations to exclude webbing. `parts` maps zero-based retained shape indices to semantic IDs such as `body`, `insert`, and `button`. See the real extraction recipes in `sources.json`.

The [vendor vector-file collection](https://www.aplusproducts.net/collections/vector-files) is checked before product tracing. Public direct SVG/AI/PDF/DXF/ZIP links, when present, are cached; multi-component kits require a reviewed component mapping before use. The current kit pages offer free checkout delivery without a public direct file link. No checkout or account action is performed. `input/web/manifest.json` records each listing and its availability.

Three of those kits already exist in this repository and are **actually used**, without modifying them:

| Output | Exact vector source |
| --- | --- |
| SNAP Buckle 15 | `../public/templates/downloads/SternLinkLite_Techpack_01.09.25_download.ai`, page 2, standalone component |
| V-BUCKLE 20 black flap | `../public/templates/downloads/APLUSsternumstrap_techpackasset.ai`, page 2, selected buckle paths with webbing excluded |
| V-BUCKLE 25 SB black flap | `../public/templates/downloads/FIDLOCKDogCollar_Techpack_02.25.25_.ai`, page 2, standalone component |
| V-BUCKLE 25 with pull tab | Cached `input/vectors/FL-V-11201.svg` from `StrapBuilder/attached_assets/FL-V-11201_1760148428952.svg` |

The second reference SVG, `FL-F7020`, is cached as a fallback for the SNAP illustration; its filename differs from the storefront SKU, so the explicitly labelled kit component wins. Source paths, extraction recipes, URLs, and SHA-256 checksums are embedded in output metadata. The full FIDLOCK and A+ Elite aluminum vector packs remain checkout-delivered; supplied copies can be added to the registry. Twelve defaults have no available matching vector and therefore use photo tracing. The simplistic `public/templates/*preview.svg` files are schematic placeholders, not part geometry.

## Outputs

- `output/<handle>.svg`: transparent background/slots, consistent slate palette, editable part IDs, hidden attachment circles, JSON `<metadata>`, and root `data-name`, `data-type`, `data-width-mm`, `data-source-type`, `data-source`, `data-units` attributes.
- Known widths produce a viewBox in **mm**, plus physical SVG width/height in mm. Unknown widths retain pixels. Blank `data-width-mm` and JSON `null` explicitly mean unknown.
- `output/contact-sheet.html`: cropped source photo beside the SVG, source type, width, scaling assumptions, links to originals, masks, and PNGs. Open without network access.
- `output/report.json`: the complete per-product metadata and failures.
- `output/previews/`: PNG renders of the actual generated SVGs.
- `output/sources/`: display crops of the photos; original cached files are unchanged.
- `output/masks/`: foreground masks for photo traces. White is foreground; black includes background and slots.
- `input/web/manifest.json`: selected photo URLs, original product URLs via reports, local paths, checksums, byte counts, and vendor-kit discovery results.

The retained photo downloads are well below 15 MB. Expanded collection runs may exceed that budget: inspect the manifest byte count before publishing a larger batch; retain the manifest and remove large photo caches if necessary, then rerun online to fetch them again. The default batch is preserved in this change.

## How tracing works, and limits

Photo tracing estimates a studio background from the image borders (or uses alpha), segments hardware, removes small disconnected noise, and preserves significant enclosed openings. It fits closed, simplified contours with locally rounded quadratic joins. Three smoothed tonal regions approximate visible panels, bars, and release features. All tonal paths are clipped to the body. They have stable `detail-01` etc. IDs rather than falsely identifying a highlight as a mechanical button. Vector artwork retains native Bézier geometry and authored internal detail; gradients/shadows are flattened into the common palette, and embedded raster effects are removed.

**IoU is measured by rendering the final smoothed silhouette path back onto the photo's pixel grid and comparing its alpha mask with the segmented photo mask.** It includes holes and is intersection/union, not a bounding-box score. The default photo batch scores approximately **0.953–0.993**. This measures contour approximation; it does not validate segmentation against hand-labelled ground truth or measure internal-detail fidelity. A wrong mask can still yield a high score. Inspect the masks, source photos, and checkerboard previews together.

The pipeline works best on one opaque object against a uniform light background. Shadows, reflective/transparent parts, dark backgrounds, occlusion, multiple overlapping objects, and perspective need manual review or vector sources. Fine engraving and thin highlights may be removed. Photography cannot recover hidden slots, the opposite face, precise depth, or true orthographic dimensions. Automatic anchors are estimates; supply reviewed coordinates for production strap placement.

PDF extraction supports lines, rectangles, quadrilaterals, and cubic curves. It deliberately excludes colored callouts and uses curated crops/sequences, not automatic semantic disassembly of an Illustrator artboard. SVG normalization supports basic shapes/groups/paths and Illustrator class styles; linked `<use>` instances, text, complex masks/clips, and raster content should be expanded to plain vector paths before import. Normalization preserves source geometry, not every original visual effect. These outputs are illustration assets, not manufacturing drawings.

## Verification

```sh
.venv/bin/python -m pip install -r requirements-dev.txt
.venv/bin/ruff check build.py test_build.py
.venv/bin/ruff format --check build.py test_build.py
.venv/bin/python build.py --offline
.venv/bin/python -m unittest discover -v
```

Tests cover inch/fraction parsing and ambiguous sizes, transparent slots, PDF winding direction, exact SVG path preservation, local vector priority, offline determinism, missing-vector failures, SVG IDs/metadata/units, and rendering every retained output. PNGs were inspected and the slot winding and tonal-noise issues corrected.

The root application needs no ignore/config changes: this folder contains no app TypeScript or JavaScript. `npm run build` passed. Root `npm run lint` was also checked; it reports 16 existing errors and 13 warnings in unchanged application files, outside this tool's scope. All contact-sheet image/file links were checked locally. No commits or pushes were made.
