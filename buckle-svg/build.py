#!/usr/bin/env python3
"""Vector-first buckle catalog builder. All generated files stay beside this script."""

from __future__ import annotations

import argparse
import copy
import hashlib
import html
import io
import json
import math
import re
import shutil
import sys
import tempfile
import time
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib.parse import quote, urljoin, urlparse

import cv2
import numpy as np
import pymupdf
import requests
import resvg_py
from PIL import Image, ImageOps

BASE = Path(__file__).resolve().parent
STORE = "https://www.aplusproducts.net"
NS = "http://www.w3.org/2000/svg"
ET.register_namespace("", NS)
PALETTE = ["#374151", "#526176", "#718196", "#9ba9b9"]


def node(tag, attrs=None, parent=None):
    e = ET.Element(f"{{{NS}}}{tag}", {k: str(v) for k, v in (attrs or {}).items()})
    if parent is not None:
        parent.append(e)
    return e


def write_json(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def slug(value):
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "buckle"


def digest(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def fetch(url, target, offline=False, refresh=False):
    if target.exists() and not refresh:
        return target
    if offline:
        raise FileNotFoundError(f"Not cached: {target}. Run once without --offline.")
    # Network is restricted to the public vendor and Shopify CDN.
    if urlparse(url).hostname not in {
        "www.aplusproducts.net",
        "aplusproducts.net",
        "cdn.shopify.com",
    }:
        raise ValueError(f"Unsupported download host: {url}")
    for attempt in range(3):
        try:
            response = requests.get(url, timeout=(15, 60))
            response.raise_for_status()
            target.parent.mkdir(parents=True, exist_ok=True)
            tmp = target.with_suffix(target.suffix + ".tmp")
            tmp.write_bytes(response.content)
            tmp.replace(target)
            return target
        except requests.RequestException:
            if attempt == 2:
                raise
            time.sleep(attempt + 1)
    raise RuntimeError("Download failed")


def collection(handle, args):
    products = []
    for page in range(1, 101):
        url = f"{STORE}/collections/{quote(handle, safe='')}/products.json?limit=250&page={page}"
        cache = BASE / "input/web" / f"collection-{slug(handle)}-{page}.json"
        if cache.exists() and not args.refresh:
            batch = json.loads(cache.read_text())["products"]
        else:
            # Store only fields used by this tool, not the entire store response.
            with tempfile.TemporaryDirectory() as tmp:
                raw = fetch(
                    url, Path(tmp) / "collection.json", args.offline, args.refresh
                )
                batch = json.loads(raw.read_text())["products"]
            batch = [
                {
                    k: p[k]
                    for k in (
                        "id",
                        "handle",
                        "title",
                        "body_html",
                        "product_type",
                        "images",
                        "variants",
                    )
                }
                for p in batch
            ]
            write_json(cache, {"source_url": url, "products": batch})
        products.extend(batch)
        if len(batch) < 250:
            return products
    raise ValueError("Collection pagination exceeded 100 pages")


def discover_kits(args):
    """Record direct downloads if present; checkout-only listings remain explicit."""
    kits = collection("vector-files", args)
    records = []
    for p in kits:
        url = f"{STORE}/products/{p['handle']}"
        cache = BASE / "input/web" / f"kit-links-{p['handle']}.json"
        if cache.exists() and not args.refresh:
            records.append(json.loads(cache.read_text()))
            continue
        if args.offline:
            raise FileNotFoundError(f"Missing kit discovery cache: {cache}")
        response = requests.get(url, timeout=(15, 60))
        response.raise_for_status()
        links = sorted(
            set(
                urljoin(url, html.unescape(v))
                for v in re.findall(
                    r"""(?:href|src)=["']([^"']+\.(?:ai|pdf|zip|dxf|svg)(?:\?[^"']*)?)["']""",
                    response.text,
                    re.I,
                )
                if "/files/" in v
            )
        )
        downloads = []
        for link in links:
            dest = (
                BASE
                / "input/web/kits"
                / (slug(p["handle"]) + "-" + Path(urlparse(link).path).name)
            )
            fetch(link, dest, args.offline, args.refresh)
            downloads.append(
                {
                    "url": link,
                    "path": str(dest.relative_to(BASE)),
                    "sha256": digest(dest),
                }
            )
        record = {
            "name": p["title"],
            "source_url": url,
            "downloads": downloads,
            "status": "direct files cached; map individual components in sources.json"
            if downloads
            else "No public direct asset link in product HTML; storefront offers checkout delivery. Local tech packs used when available.",
        }
        write_json(cache, record)
        records.append(record)
    return records


def plain(value):
    return html.unescape(re.sub("<[^>]+>", " ", value))


def inches(value):
    total = 0.0
    for piece in value.strip().split():
        if "/" in piece:
            a, b = piece.split("/")
            total += float(a) / float(b)
        else:
            total += float(piece)
    return total * 25.4


def widths_in(text):
    values = []
    for m in re.finditer(r"(?<![\w.])(\d+(?:\.\d+)?)\s*mm\b", text, re.I):
        values.append(float(m[1]))
    for m in re.finditer(
        r'(?<![\w./])(\d+\s+\d+/\d+|\d+/\d+|\d+(?:\.\d+)?)\s*(?:["″]|inches\b|inch\b|in\b)',
        text,
        re.I,
    ):
        values.append(inches(m[1]))
    return sorted(set(round(v, 4) for v in values if v > 0))


def infer_width(product):
    title = product["title"]
    widths = widths_in(title)
    if len(widths) == 1:
        return widths[0], "product title"
    # These vendor family numbers denote nominal strap width, not part number.
    family = re.search(
        r"(?:V-BUCKLE(?: S)?|SNAP Buckle(?: Flat)?|SLIDER|HOOK)\s+(15|20|25|30|38|40|50)\b",
        title,
        re.I,
    )
    if family:
        return float(family[1]), "nominal strap width in product family title"
    widths = widths_in(plain(product.get("body_html", "")))
    if len(widths) == 1:
        return widths[0], "product description"
    return (
        None,
        "unknown or multiple sizes; supply an override for the pictured variant",
    )


def render(svg, width=None):
    kwargs = {"svg_string": svg, "dpi": 96}
    if width:
        kwargs["width"] = width
    return Image.open(io.BytesIO(resvg_py.svg_to_bytes(**kwargs))).convert("RGBA")


def serialize(svg):
    return ET.tostring(svg, encoding="unicode")


def pdf_vector(path, spec):
    doc = pymupdf.open(path)
    page = doc[spec.get("page", 0)]
    crop = pymupdf.Rect(spec["crop"])
    root = node("svg", {"viewBox": f"{crop.x0} {crop.y0} {crop.width} {crop.height}"})
    selection = spec.get("sequence_numbers")
    count = 0
    for drawing in page.get_drawings():
        if not crop.contains(drawing["rect"]):
            continue
        if selection is not None and drawing["seqno"] not in selection:
            continue
        # Exclude colored technical callouts/backgrounds, retain grayscale hardware.
        fill = drawing.get("fill")
        color = drawing.get("color")
        if any(c and max(c) - min(c) > 0.12 for c in (fill, color)):
            continue
        segments, last, start = [], None, None

        def move(p):
            nonlocal last, start
            if last is None or abs(last.x - p.x) + abs(last.y - p.y) > 0.001:
                if last is not None and fill is not None:
                    segments.append("Z")
                segments.append(f"M{p.x:.5f},{p.y:.5f}")
                start = p
            last = p

        for item in drawing["items"]:
            kind = item[0]
            if kind in {"l", "c"}:
                move(item[1])
                if kind == "l":
                    segments.append(f"L{item[2].x:.5f},{item[2].y:.5f}")
                else:
                    segments.append(
                        "C" + " ".join(f"{p.x:.5f},{p.y:.5f}" for p in item[2:])
                    )
                last = item[-1]
            elif kind in {"re", "qu"}:
                rect = item[1]
                points = [rect.tl, rect.tr, rect.br, rect.bl]
                # PDF positive winding is counterclockwise; page y points down.
                if kind == "re" and item[2] > 0:
                    points.reverse()
                move(points[0])
                segments.extend(f"L{p.x:.5f},{p.y:.5f}" for p in points[1:])
                segments.append("Z")
                last = None
            else:
                raise ValueError(f"Unsupported PDF vector operation: {kind}")
        if (
            fill is not None
            or drawing.get("closePath")
            or (start is not None and last == start)
        ):
            segments.append("Z")
        if not segments:
            continue
        shade = PALETTE[
            0
            if fill is None or np.mean(fill) < 0.32
            else 1
            if np.mean(fill) < 0.6
            else 2
        ]
        node(
            "path",
            {
                "d": " ".join(segments),
                "fill": shade if fill is not None else "none",
                "stroke": "#1f2937" if color else "none",
                "stroke-width": drawing.get("width") or 0.35,
                "fill-rule": spec.get(
                    "fill_rule", "evenodd" if drawing.get("even_odd") else "nonzero"
                ),
                "data-source-sequence": drawing["seqno"],
            },
            root,
        )
        count += 1
    doc.close()
    if not count:
        raise ValueError(f"No paths in PDF component crop: {path}")
    return root


def clean_svg(path):
    """Resolve Illustrator class styles; discard editor metadata and raster shadows."""
    source = ET.parse(path).getroot()
    css = {}
    for style in source.findall(f".//{{{NS}}}style"):
        for selectors, body in re.findall(r"([^{}]+)\{([^{}]+)\}", style.text or ""):
            props = dict(re.findall(r"([\w-]+)\s*:\s*([^;]+)", body))
            for selector in selectors.split(","):
                css.setdefault(selector.strip().lstrip("."), {}).update(props)
    root = node("svg", {"viewBox": source.attrib.get("viewBox", "0 0 100 100")})
    allowed = {"g", "path", "rect", "circle", "ellipse", "polygon", "polyline", "line"}

    def copy_shape(src, dst):
        tag = src.tag.split("}")[-1]
        if tag not in allowed:
            return
        attrs = {}
        for cls in src.get("class", "").split():
            attrs.update(css.get(cls, {}))
        attrs.update(dict(re.findall(r"([\w-]+)\s*:\s*([^;]+)", src.get("style", ""))))
        attrs.update(src.attrib)
        attrs = {
            k: v
            for k, v in attrs.items()
            if k
            in {
                "d",
                "x",
                "y",
                "width",
                "height",
                "rx",
                "ry",
                "cx",
                "cy",
                "r",
                "points",
                "x1",
                "y1",
                "x2",
                "y2",
                "transform",
                "fill",
                "fill-rule",
                "stroke",
                "stroke-width",
                "opacity",
                "stroke-linecap",
                "stroke-linejoin",
            }
        }
        for key in ("fill", "stroke"):
            if key in attrs and attrs[key] != "none":
                value = attrs[key]
                if value.startswith("url("):
                    attrs[key] = PALETTE[1]
                elif key == "stroke":
                    attrs[key] = "#1f2937"
                else:
                    nums = re.findall(r"[0-9a-f]{2}", value.lstrip("#"), re.I)
                    brightness = (
                        np.mean([int(n, 16) for n in nums]) if len(nums) == 3 else 70
                    )
                    attrs[key] = PALETTE[
                        0 if brightness < 80 else 1 if brightness < 170 else 2
                    ]
        child = node(tag, attrs, dst)
        for sub in src:
            copy_shape(sub, child)

    for child in source:
        copy_shape(child, root)
    return root


def vector_asset(spec):
    path = (BASE / spec["path"]).resolve()
    if path.suffix.lower() in {".ai", ".pdf"}:
        root = pdf_vector(path, spec)
    elif path.suffix.lower() == ".svg":
        root = clean_svg(path)
    else:
        raise ValueError(
            "Export CAD/DXF as SVG first, then declare source_type=cad in sources.json."
        )
    vb = [float(v) for v in root.attrib["viewBox"].replace(",", " ").split()]
    preview = render(serialize(root), 1600)
    box = preview.getchannel("A").getbbox()
    if not box:
        raise ValueError(f"Empty vector: {path}")
    ratio = vb[2] / preview.width
    bounds = [
        vb[0] + box[0] * ratio,
        vb[1] + box[1] * ratio,
        (box[2] - box[0]) * ratio,
        (box[3] - box[1]) * ratio,
    ]
    paths = [e for e in root.iter() if e.tag.split("}")[-1] not in {"svg", "g"}]
    assigned = set()
    for i, e in enumerate(paths):
        name = spec.get("parts", {}).get(str(i), f"part-{i + 1:03d}")
        if name in assigned:
            raise ValueError(f"Duplicate part id {name}")
        e.set("id", name)
        assigned.add(name)
    if "body" not in assigned:
        paths[0].set("id", "body")
    return root, bounds, path


def mask_photo(image):
    rgba = np.asarray(image.convert("RGBA"))
    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]
    if np.any(alpha < 250):
        mask = (alpha > 127).astype(np.uint8) * 255
    else:
        # Studio backgrounds are estimated from all four borders. This also works
        # for light gray backgrounds and colored objects without a hard white cut.
        border = np.concatenate(
            [
                rgb[:4].reshape(-1, 3),
                rgb[-4:].reshape(-1, 3),
                rgb[:, :4].reshape(-1, 3),
                rgb[:, -4:].reshape(-1, 3),
            ]
        )
        background = np.median(border, axis=0)
        delta = np.linalg.norm(rgb.astype(float) - background, axis=2)
        gray = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY)
        threshold, _ = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        mask = ((delta > 28) & (gray < min(235, max(150, threshold + 30)))).astype(
            np.uint8
        ) * 255
    # Keep every substantial disconnected part, discard dust and isolated shadows.
    n, labels, stats, _ = cv2.connectedComponentsWithStats(mask)
    largest = max(stats[1:, cv2.CC_STAT_AREA], default=0)
    if largest < 30:
        raise ValueError("No foreground found; use a plain contrasting background.")
    keep = [
        i for i in range(1, n) if stats[i, cv2.CC_STAT_AREA] >= max(25, largest * 0.004)
    ]
    mask = np.isin(labels, keep).astype(np.uint8) * 255
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    # Only fill tiny interior specks; actual webbing slots remain transparent.
    contours, hierarchy = cv2.findContours(
        mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE
    )
    for c, h in zip(contours, hierarchy[0]):
        if h[3] >= 0 and cv2.contourArea(c) < 18:
            cv2.drawContours(mask, [c], -1, 255, -1)
    return rgb, mask


def smooth_path(contour, epsilon=0.65):
    points = cv2.approxPolyDP(contour, epsilon, True).reshape(-1, 2).astype(float)
    if len(points) < 3:
        return ""
    # Round each simplified vertex locally; long straight bars stay straight.
    prev, nxt = np.roll(points, 1, axis=0), np.roll(points, -1, axis=0)
    before = points + (prev - points) * 0.16
    after = points + (nxt - points) * 0.16
    out = [f"M{after[-1, 0]:.3f},{after[-1, 1]:.3f}"]
    for a, p, b in zip(before, points, after):
        out.append(
            f"L{a[0]:.3f},{a[1]:.3f} Q{p[0]:.3f},{p[1]:.3f} {b[0]:.3f},{b[1]:.3f}"
        )
    return " ".join(out) + " Z"


def mask_paths(mask, min_area=18, epsilon=0.65):
    contours, hierarchy = cv2.findContours(mask, cv2.RETR_TREE, cv2.CHAIN_APPROX_SIMPLE)
    if hierarchy is None:
        return "", []
    contours = [c for c in contours if cv2.contourArea(c) >= min_area]
    return " ".join(filter(None, (smooth_path(c, epsilon) for c in contours))), contours


def photo_asset(image):
    rgb, mask = mask_photo(image)
    ys, xs = np.where(mask > 0)
    bounds = [
        float(xs.min()),
        float(ys.min()),
        float(xs.max() - xs.min() + 1),
        float(ys.max() - ys.min() + 1),
    ]
    root = node("svg", {"viewBox": f"0 0 {image.width} {image.height}"})
    d, _ = mask_paths(mask)
    node(
        "path", {"id": "body", "d": d, "fill": PALETTE[0], "fill-rule": "evenodd"}, root
    )
    # Closed tonal regions retain raised panels, release recesses and bars without
    # copying every photographic highlight or engraving. All are clipped to body.
    defs = node("defs", parent=root)
    clip = node("clipPath", {"id": "silhouette-clip"}, defs)
    node("path", {"d": d, "fill-rule": "evenodd", "clip-rule": "evenodd"}, clip)
    details = node("g", {"id": "details", "clip-path": "url(#silhouette-clip)"}, root)
    gray = cv2.cvtColor(cv2.bilateralFilter(rgb, 9, 30, 5), cv2.COLOR_RGB2GRAY)
    gray = cv2.GaussianBlur(gray, (0, 0), 1.8)
    foreground = gray[mask > 0]
    floor = float(np.percentile(foreground, 15))
    ceiling = float(np.percentile(foreground, 97))
    count = 0
    if ceiling - floor > 12:
        for t, shade in zip((0.3, 0.62, 0.84), PALETTE[1:]):
            region = ((gray > floor + (ceiling - floor) * t) & (mask > 0)).astype(
                np.uint8
            ) * 255
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            region = cv2.morphologyEx(region, cv2.MORPH_CLOSE, kernel)
            region = cv2.morphologyEx(region, cv2.MORPH_OPEN, kernel)
            n, labels, stats, _ = cv2.connectedComponentsWithStats(region)
            region = (
                np.isin(
                    labels,
                    [
                        i
                        for i in range(1, n)
                        if stats[i, cv2.CC_STAT_AREA]
                        > max(100, len(foreground) * 0.008)
                    ],
                ).astype(np.uint8)
                * 255
            )
            path, _ = mask_paths(region, 80, 1.1)
            if path:
                count += 1
                node(
                    "path",
                    {
                        "id": f"detail-{count:02d}",
                        "d": path,
                        "fill": shade,
                        "fill-rule": "evenodd",
                    },
                    details,
                )
    # Render the actual curved body path, rather than scoring the unsmoothed mask.
    score_root = node(
        "svg",
        {
            "viewBox": f"0 0 {image.width} {image.height}",
            "width": image.width,
            "height": image.height,
        },
    )
    node("path", {"d": d, "fill": "black", "fill-rule": "evenodd"}, score_root)
    traced = np.asarray(render(serialize(score_root)))[:, :, 3] >= 128
    truth = mask > 0
    iou = np.logical_and(traced, truth).sum() / np.logical_or(traced, truth).sum()
    contours, hierarchy = cv2.findContours(
        mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_SIMPLE
    )
    holes = [
        c
        for c, h in zip(contours, hierarchy[0])
        if h[3] >= 0 and cv2.contourArea(c) > 80
    ]
    return root, bounds, mask, holes, float(iou)


def attachment_geometry(bounds, holes):
    x, y, w, h = bounds
    horizontal = w >= h
    centers = []
    for c in holes:
        m = cv2.moments(c)
        centers.append([m["m10"] / m["m00"], m["m01"] / m["m00"]])
    axis = 0 if horizontal else 1
    centers.sort(key=lambda p: p[axis])
    if len(centers) >= 2:
        anchors = [centers[0], centers[-1]]
        method = "estimated: extreme enclosed openings; review attachment positions"
    else:
        anchors = (
            [[x + w * 0.08, y + h / 2], [x + w * 0.92, y + h / 2]]
            if horizontal
            else [[x + w / 2, y + h * 0.08], [x + w / 2, y + h * 0.92]]
        )
        method = "estimated: silhouette ends; no pair of enclosed slots detected"
    # Long dimension of an elongated enclosed opening estimates strap width.
    candidates = [
        (max(cv2.minAreaRect(c)[1]), min(cv2.minAreaRect(c)[1])) for c in holes
    ]
    spans = [a for a, b in candidates if a > 2 * b and a > min(w, h) * 0.25]
    return anchors, max(spans) if spans else min(w, h), method, bool(spans)


def finish_svg(art, bounds, meta, anchors, scale):
    x, y, w, h = bounds
    pad = 0.6 if meta["units"] == "mm" else 4
    width, height = w * scale + 2 * pad, h * scale + 2 * pad
    root = node(
        "svg",
        {
            "viewBox": f"0 0 {width:.6f} {height:.6f}",
            "width": f"{width:.6f}{meta['units']}",
            "height": f"{height:.6f}{meta['units']}",
            "data-name": meta["name"],
            "data-type": meta["type"],
            "data-width-mm": "" if meta["width_mm"] is None else meta["width_mm"],
            "data-source-type": meta["source_type"],
            "data-source": meta["source"],
            "data-units": meta["units"],
            "role": "img",
            "aria-labelledby": "title",
        },
    )
    node("title", {"id": "title"}, root).text = meta["name"]
    mapped = [
        [round((a - x) * scale + pad, 6), round((b - y) * scale + pad, 6)]
        for a, b in anchors
    ]
    meta["anchors"] = dict(zip(("anchor-left", "anchor-right"), mapped))
    meta["viewbox"] = [0, 0, round(width, 6), round(height, 6)]
    node("metadata", parent=root).text = json.dumps(
        meta, ensure_ascii=False, sort_keys=True
    )
    group = node(
        "g",
        {
            "id": "hardware",
            "transform": f"translate({pad:.6f} {pad:.6f}) scale({scale:.9f}) translate({-x:.6f} {-y:.6f})",
            "stroke-linejoin": "round",
            "stroke-linecap": "round",
        },
        root,
    )
    for child in art:
        group.append(copy.deepcopy(child))
    points = node(
        "g",
        {
            "id": "anchors",
            "visibility": "hidden",
            "data-units": meta["units"],
            "data-method": meta["anchor_method"],
        },
        root,
    )
    for name, (a, b) in meta["anchors"].items():
        node(
            "circle",
            {
                "id": name,
                "cx": a,
                "cy": b,
                "r": 0.5 if meta["units"] == "mm" else 3,
                "data-x": a,
                "data-y": b,
                "fill": "#f97316",
            },
            points,
        )
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + serialize(root) + "\n"


def bootstrap_vectors(config, reference):
    for candidates in config["vectors"].values():
        for spec in candidates:
            if spec.get("reference_path"):
                target = BASE / spec["path"]
                original = reference / spec["reference_path"] if reference else None
                if not target.exists() and original and original.exists():
                    target.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copyfile(original, target)


def contact_sheet(rows, output, manifest):
    esc = html.escape
    cards = []
    for r in rows:
        m = r["metadata"]
        width = (
            f"{m['width_mm']:g} mm nominal"
            if m["width_mm"] is not None
            else "Width unknown · pixel units"
        )
        metric = (
            f"Photo-mask IoU {m['iou']:.4f}"
            if m.get("iou") is not None
            else "Exact vector geometry · no tracing"
        )
        photo = "sources/" + r["id"] + ".png"
        original_photo = "../" + r["photo"]
        mask = (
            f'<a href="masks/{r["id"]}.png">Foreground mask</a>'
            if m["source_type"] == "photo-trace"
            else ""
        )
        cards.append(f'''<article data-source="{m["source_type"]}"><header><span class="tag">{m["source_type"]}</span><h2>{esc(m["name"])}</h2><p>{esc(m["type"])} · {width}</p></header>
<div class="comparison"><figure><img src="{esc(photo)}" alt="Source photo of {esc(m["name"])}" loading="lazy"><figcaption>Source photo</figcaption></figure><figure class="checker"><img src="{r["id"]}.svg" alt="Generated SVG of {esc(m["name"])}" loading="lazy"><figcaption>Normalized SVG</figcaption></figure></div>
<p class="metric">{metric}</p><p>{esc(m["scale_method"])}</p><details><summary>Provenance &amp; review notes</summary><p>{esc(m["source"])}</p><p>{esc(m["anchor_method"])}</p><p>{esc(m.get("note", ""))}</p><p>Width evidence: {esc(m["width_evidence"])}</p></details><footer><a href="{r["id"]}.svg">SVG</a><a href="previews/{r["id"]}.png">Rendered PNG</a>{mask}<a href="{esc(original_photo)}">Original photo</a><a href="{esc(m.get("product_url") or original_photo)}">Source</a></footer></article>''')
    counts = {
        kind: sum(r["metadata"]["source_type"] == kind for r in rows)
        for kind in ("vector-kit", "existing-svg", "cad", "photo-trace")
    }
    page = """<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Buckle SVG review</title><style>
*{box-sizing:border-box}body{margin:0;background:#edf1f5;color:#17283c;font:15px/1.5 system-ui,sans-serif}main{max-width:1500px;margin:auto;padding:40px 24px}h1{font-size:38px;letter-spacing:-1.5px;margin:0}h2{font-size:19px;line-height:1.3;margin:9px 0}p{margin:8px 0}.intro{max-width:940px;margin-bottom:28px}.stats{display:flex;gap:12px;flex-wrap:wrap;margin:24px 0}.stats span,.tag{background:#dce8ef;border-radius:5px;padding:5px 9px}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(390px,1fr));gap:22px}article{background:white;border:1px solid #d2dce6;border-radius:12px;overflow:hidden}header,article>p,details,footer{padding:0 20px}header{padding-top:20px}.tag{font:12px ui-monospace,monospace}.comparison{display:grid;grid-template-columns:1fr 1fr;margin:18px 0;border-block:1px solid #e2e8f0}figure{margin:0;min-width:0;background:#fafafa}figure img{width:100%;height:245px;object-fit:contain;padding:15px}.checker{background:repeating-conic-gradient(#f0f3f6 0% 25%,white 0% 50%) 0/18px 18px}figcaption{font-size:12px;text-align:center;background:#f8fafc;padding:8px}.metric{font-weight:650;color:#156156}details{font-size:12px;overflow-wrap:anywhere;margin:14px 0}footer{display:flex;gap:16px;flex-wrap:wrap;padding-bottom:20px}a{color:#14618a}summary{cursor:pointer}aside{padding:16px;background:#fff7df;border-radius:8px}@media(max-width:500px){.grid{grid-template-columns:1fr}main{padding:24px 12px}figure img{height:180px}}
</style><main><div class="intro"><h1>Buckle SVG review</h1><p>Vector artwork first. Photo traces when a matching vector is unavailable.</p>"""
    page += (
        '<div class="stats">'
        + "".join(f"<span>{n} {kind}</span>" for kind, n in counts.items() if n)
        + "</div>"
    )
    page += """<aside>Widths describe nominal webbing size. Kit artwork preserves source geometry; scale uses the specified slot span. Photo dimensions and automatically placed anchors are estimates, especially in perspective views. IoU measures the traced silhouette against the automatically segmented photo mask, not against a manually labelled ground truth or a CAD model. Tonal detail regions are editable but do not identify mechanical parts automatically.</aside><p>Review on a checkerboard to see transparent slots. Photos and vectors may show different orientations. <a href="report.json">Machine-readable report</a> · <a href="../input/web/manifest.json">Source manifest and kit availability</a></p></div><div class="grid">"""
    page += "\n".join(cards) + "</div></main></html>\n"
    (output / "contact-sheet.html").write_text(page)
    write_json(
        output / "report.json",
        {"counts": counts, "products": rows, "failures": manifest["failures"]},
    )


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--local",
        type=Path,
        help="Optional folder of PNG/JPEG/WebP photos and same-stem SVGs",
    )
    parser.add_argument(
        "--overrides",
        type=Path,
        help="JSON keyed by product handle or local filename stem",
    )
    parser.add_argument("--sources", type=Path, default=BASE / "sources.json")
    parser.add_argument(
        "--reference",
        type=Path,
        help="Read-only StrapBuilder clone; needed only to seed uncached SVGs",
    )
    parser.add_argument(
        "--collection", help="Process hardware products from another Shopify collection"
    )
    parser.add_argument(
        "--limit",
        type=int,
        default=16,
        help="Maximum website products; 0 means all selected products",
    )
    parser.add_argument(
        "--no-web", action="store_true", help="Only process --local inputs"
    )
    parser.add_argument(
        "--offline", action="store_true", help="Require cached network inputs"
    )
    parser.add_argument("--refresh", action="store_true", help="Refresh network caches")
    args = parser.parse_args(argv)
    if args.offline and args.refresh:
        parser.error("--offline and --refresh are mutually exclusive")
    if args.no_web and not args.local:
        parser.error("--no-web requires --local")
    if args.limit < 0:
        parser.error("--limit must be nonnegative")
    config = json.loads(args.sources.read_text())
    overrides = json.loads(args.overrides.read_text()) if args.overrides else {}
    bootstrap_vectors(config, args.reference)
    products, kits = [], []
    if not args.no_web:
        kits = discover_kits(args)
        all_products = collection(args.collection or config["collection"], args)
        if args.collection:
            products = [
                p
                for p in all_products
                if re.search(r"buckle|hook|ring|slider|keeper", p["title"], re.I)
                and not re.search(r"kit|download|tech pack", p["title"], re.I)
            ]
        else:
            by_handle = {p["handle"]: p for p in all_products}
            missing = set(config["products"]) - set(by_handle)
            if missing:
                raise ValueError(
                    f"Configured products missing from collection: {sorted(missing)}"
                )
            products = [by_handle[h] for h in config["products"]]
        if args.limit:
            products = products[: args.limit]
    if args.local:
        if not args.local.is_dir():
            parser.error("--local must be an existing folder")
        for photo in sorted(args.local.iterdir()):
            if photo.suffix.lower() in {
                ".jpg",
                ".jpeg",
                ".png",
                ".webp",
                ".tif",
                ".tiff",
            }:
                products.append(
                    {
                        "handle": "local-" + slug(photo.stem),
                        "title": photo.stem,
                        "product_type": "local hardware",
                        "local_path": str(photo.resolve()),
                        "body_html": "",
                    }
                )
    if not products:
        raise ValueError("No input products/photos selected")
    manifest = {
        "store": STORE,
        "collection": args.collection or config["collection"],
        "kits": kits,
        "inputs": [],
        "failures": [],
    }
    rows = []
    output = BASE / "output"
    output.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory(prefix=".staging-", dir=output) as temp:
        stage = Path(temp)
        (stage / "previews").mkdir()
        (stage / "masks").mkdir()
        (stage / "sources").mkdir()
        used_ids = set()
        for product in products:
            handle = product["handle"]
            try:
                if handle in used_ids:
                    raise ValueError(
                        f"Filename collision: {handle}; rename duplicate local stems"
                    )
                used_ids.add(handle)
                override = overrides.get(
                    handle, overrides.get(Path(product.get("local_path", "")).stem, {})
                )
                if isinstance(override, (int, float)):
                    override = {"width_mm": override}
                if "local_path" in product:
                    original = Path(product["local_path"])
                    photo_path = (
                        BASE / "input/local" / f"{handle}{original.suffix.lower()}"
                    )
                    photo_path.parent.mkdir(parents=True, exist_ok=True)
                    if original != photo_path:
                        shutil.copyfile(original, photo_path)
                    photo_url = str(original)
                else:
                    index = int(override.get("image_index", 0))
                    photo_url = product["images"][index]["src"]
                    photo_url += ("&" if "?" in photo_url else "?") + "width=800"
                    photo_path = (
                        BASE
                        / "input/web"
                        / f"{handle}{Path(urlparse(photo_url).path).suffix.lower() or '.jpg'}"
                    )
                    fetch(photo_url, photo_path, args.offline, args.refresh)
                image = ImageOps.exif_transpose(Image.open(photo_path)).convert("RGBA")
                # Display a tight source crop for a fair side-by-side comparison.
                # This does not alter the original photo or tracing coordinates.
                try:
                    _, display_mask = mask_photo(image)
                    yy, xx = np.where(display_mask > 0)
                    display_box = (
                        max(0, int(xx.min()) - 12),
                        max(0, int(yy.min()) - 12),
                        min(image.width, int(xx.max()) + 13),
                        min(image.height, int(yy.max()) + 13),
                    )
                except ValueError:
                    # A vector input must not depend on successful photo segmentation.
                    display_box = (0, 0, image.width, image.height)
                image.crop(display_box).save(stage / "sources" / f"{handle}.png")
                width, evidence = infer_width(product)
                candidates = list(config["vectors"].get(handle, []))
                if "vector" in override:
                    candidates.insert(0, override["vector"])
                if "local_path" in product:
                    sibling = Path(product["local_path"]).with_suffix(".svg")
                    if sibling.exists():
                        candidates.append(
                            {"path": str(sibling), "source_type": "existing-svg"}
                        )
                candidates.sort(
                    key=lambda s: {"vector-kit": 0, "existing-svg": 1, "cad": 2}.get(
                        s["source_type"], 9
                    )
                )
                spec = next(
                    (s for s in candidates if (BASE / s["path"]).exists()), None
                )
                if candidates and spec is None:
                    raise FileNotFoundError(
                        f"Matching vector is registered but unavailable for {handle}; restore it instead of tracing."
                    )
                if spec and spec.get("width_mm") is not None:
                    width, evidence = spec["width_mm"], "vector component specification"
                if "width_mm" in override:
                    width, evidence = override["width_mm"], "metadata override"
                if width is not None and (
                    not isinstance(width, (int, float))
                    or not math.isfinite(width)
                    or width <= 0
                ):
                    raise ValueError("width_mm must be positive and finite, or null")
                meta = {
                    "name": override.get("name", product["title"]),
                    "type": override.get("type", product["product_type"]),
                    "width_mm": width,
                    "width_evidence": evidence,
                    "units": "mm" if width is not None else "px",
                    "product_url": f"{STORE}/products/{handle}"
                    if "local_path" not in product
                    else None,
                    "photo_source": photo_url,
                    "iou": None,
                }
                if spec:
                    art, bounds, vector_path = vector_asset(spec)
                    anchors = spec.get("anchors")
                    if not anchors:
                        anchors, _, method, _ = attachment_geometry(bounds, [])
                    else:
                        method = "reviewed vector slot centers in source coordinates"
                    span = override.get(
                        "reference_span", spec.get("reference_span", min(bounds[2:]))
                    )
                    scale_method = (
                        "Nominal width calibrated to vector slot span; exact source curves, illustrative dimensions."
                        if "reference_span" in spec or "reference_span" in override
                        else "Estimated scale: nominal width assigned to short artwork dimension; supply reference_span."
                    )
                    meta.update(
                        source_type=spec["source_type"],
                        source=spec.get("original_source", spec["path"]),
                        source_url=spec.get("source_url"),
                        source_sha256=digest(vector_path),
                        note=spec.get("note", ""),
                        vector_recipe=spec,
                    )
                    meta["anchor_method"] = method
                else:
                    art, bounds, mask, holes, iou = photo_asset(image)
                    Image.fromarray(mask).save(stage / "masks" / f"{handle}.png")
                    anchors, span, method, has_slot = attachment_geometry(bounds, holes)
                    meta.update(
                        source_type="photo-trace",
                        source=photo_url,
                        source_sha256=digest(photo_path),
                        iou=round(iou, 6),
                        anchor_method=method,
                    )
                    scale_method = (
                        "Estimated projected scale from longest enclosed strap slot; perspective is retained."
                        if has_slot
                        else "Estimated scale: nominal width assigned to silhouette short dimension; no slot calibration found."
                    )
                if "anchors" in override:
                    anchors = override["anchors"]
                    meta["anchor_method"] = "metadata override in source coordinates"
                if "reference_span" in override:
                    span = override["reference_span"]
                    scale_method = "Nominal width calibrated to reference_span from metadata override."
                if (
                    not isinstance(span, (int, float))
                    or not math.isfinite(span)
                    or span <= 0
                ):
                    raise ValueError("reference_span must be positive and finite")
                if len(anchors) != 2 or any(
                    len(p) != 2
                    or not all(
                        isinstance(v, (int, float)) and math.isfinite(v) for v in p
                    )
                    for p in anchors
                ):
                    raise ValueError(
                        "anchors must contain two finite [x,y] coordinate pairs"
                    )
                meta["scale_method"] = (
                    scale_method
                    if width is not None
                    else "Unknown width: source coordinate units retained as pixels."
                )
                meta["reference_span"] = span
                meta["source_bounds"] = bounds
                meta["source_to_output_scale"] = (
                    width / span if width is not None else 1
                )
                svg = finish_svg(
                    art, bounds, meta, anchors, meta["source_to_output_scale"]
                )
                (stage / f"{handle}.svg").write_text(svg)
                render(svg, 800).save(stage / "previews" / f"{handle}.png")
                photo_rel = str(photo_path.relative_to(BASE))
                rows.append({"id": handle, "photo": photo_rel, "metadata": meta})
                manifest["inputs"].append(
                    {
                        "id": handle,
                        "photo_url": photo_url,
                        "path": photo_rel,
                        "sha256": digest(photo_path),
                        "bytes": photo_path.stat().st_size,
                        "source_type": meta["source_type"],
                        "vector_source": meta["source"] if spec else None,
                    }
                )
                print(
                    f"{handle}: {meta['source_type']}"
                    + (f" IoU={meta['iou']:.4f}" if meta["iou"] is not None else ""),
                    flush=True,
                )
            except Exception as exc:
                manifest["failures"].append({"id": handle, "error": str(exc)})
                print(f"ERROR {handle}: {exc}", file=sys.stderr)
        contact_sheet(rows, stage, manifest)
        # Only replace generated artifacts after this complete report is ready.
        previous = output / "report.json"
        if previous.exists():
            for row in json.loads(previous.read_text()).get("products", []):
                old_id = row["id"]
                if not re.fullmatch(r"[a-z0-9-]+", old_id):
                    raise ValueError("Invalid ID in previous report")
                for old in (
                    output / f"{old_id}.svg",
                    output / "previews" / f"{old_id}.png",
                    output / "masks" / f"{old_id}.png",
                    output / "sources" / f"{old_id}.png",
                ):
                    old.unlink(missing_ok=True)
        for file in stage.rglob("*"):
            if file.is_file():
                dest = output / file.relative_to(stage)
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copyfile(file, dest)
    manifest["cached_photo_bytes"] = sum(
        p.stat().st_size
        for p in (BASE / "input/web").glob("*")
        if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    write_json(BASE / "input/web/manifest.json", manifest)
    print(f"Wrote {len(rows)} SVGs and {output / 'contact-sheet.html'}", flush=True)
    return 1 if manifest["failures"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
