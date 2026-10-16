"""Regression checks for geometry, provenance, units, and local/offline operation."""

import contextlib
import io
import json
import tempfile
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from unittest.mock import patch

import numpy as np
from PIL import Image, ImageDraw

import build


class WidthTests(unittest.TestCase):
    def test_units_and_ambiguous_variants(self):
        for title, expected in [
            ("25mm buckle", 25),
            ("1 inch buckle", 25.4),
            ('1 1/2" Roller', 38.1),
            ('3/4" hook', 19.05),
            ("SNAP Buckle Flat 25", 25),
        ]:
            self.assertAlmostEqual(build.infer_width({"title": title})[0], expected)
        self.assertIsNone(
            build.infer_width({"title": "Buckle", "body_html": "Sizes 15mm to 25mm"})[0]
        )
        self.assertIsNone(build.infer_width({"title": "Model 2954 buckle"})[0])


class GeometryTests(unittest.TestCase):
    def test_transparent_slot_survives_photo_trace(self):
        image = Image.new("RGBA", (240, 140), "white")
        draw = ImageDraw.Draw(image)
        draw.rounded_rectangle((20, 20, 220, 120), radius=14, fill="#242424")
        draw.rectangle((40, 40, 65, 100), fill="white")
        draw.rectangle((175, 40, 200, 100), fill="white")
        art, _, mask, _, score = build.photo_asset(image)
        raster = np.asarray(build.render(build.serialize(art), 240))
        self.assertEqual(raster[70, 50, 3], 0)
        self.assertEqual(raster[70, 190, 3], 0)
        self.assertEqual(raster[70, 120, 3], 255)
        self.assertGreater(score, 0.96)
        self.assertEqual(mask[0, 0], 0)

    def test_pdf_counterclockwise_rectangle_remains_a_hole(self):
        config = json.loads((build.BASE / "sources.json").read_text())
        spec = config["vectors"]["fidlock-snap-buckle-15"][0]
        art = build.pdf_vector(build.BASE / spec["path"], spec)
        image = np.asarray(build.render(build.serialize(art), 730))
        # The kit crop begins at (365, 422), and is rendered at 10 px/unit.
        self.assertEqual(image[258, 622, 3], 0)  # right webbing slot (427.2, 447.8)
        self.assertEqual(image[258, 400, 3], 255)  # body

        # Another kit has the opposite outer contour orientation. Its slots must
        # also remain transparent after PDF transforms have been flattened.
        spec = config["vectors"]["fidlock-v-buckle-20-black-flap-with-pull-tab"][0]
        art = build.pdf_vector(build.BASE / spec["path"], spec)
        image = np.asarray(build.render(build.serialize(art), 2100))
        self.assertEqual(image[250, 250, 3], 0)  # left slot (325, 290)
        self.assertEqual(image[250, 100, 3], 255)  # body (310, 290)

    def test_existing_svg_retains_original_path_commands(self):
        path = build.BASE / "input/vectors/FL-V-11201.svg"
        source = ET.parse(path).getroot()
        normalized = build.clean_svg(path)
        self.assertEqual(
            [p.get("d") for p in source.findall(f".//{{{build.NS}}}path")],
            [p.get("d") for p in normalized.findall(f".//{{{build.NS}}}path")],
        )


class PipelineTests(unittest.TestCase):
    def test_local_vector_priority_units_and_offline_repeatability(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            local = root / "photos"
            local.mkdir()
            Image.new("RGB", (100, 70), "white").save(local / "sample.png")
            (local / "sample.svg").write_text(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 70"><path fill="#333333" d="M10 10H90V60H10Z M20 20V50H30V20Z" fill-rule="evenodd"/></svg>'
            )
            (root / "sources.json").write_text(
                '{"collection":"bags","products":[],"vectors":{}}'
            )
            (root / "overrides.json").write_text(
                '{"sample":{"width_mm":25,"reference_span":30,"anchors":[[25,35],[80,35]]}}'
            )
            argv = [
                "--local",
                str(local),
                "--no-web",
                "--offline",
                "--overrides",
                str(root / "overrides.json"),
            ]
            with (
                patch.object(build, "BASE", root),
                patch.object(
                    build.requests, "get", side_effect=AssertionError("network used")
                ),
            ):
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(build.main(argv), 0)
                    svg = (root / "output/local-sample.svg").read_bytes()
                    self.assertEqual(build.main(argv), 0)
                    self.assertEqual(
                        svg, (root / "output/local-sample.svg").read_bytes()
                    )
            result = ET.fromstring(svg)
            meta = json.loads(result.find(f"{{{build.NS}}}metadata").text)
            self.assertEqual(meta["source_type"], "existing-svg")
            self.assertEqual(meta["width_mm"], 25)
            self.assertTrue(result.get("width").endswith("mm"))
            self.assertIn("anchor-left", meta["anchors"])
            self.assertNotIn("image", [e.tag.split("}")[-1] for e in result.iter()])

    def test_missing_registered_vector_fails_instead_of_tracing(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            local = root / "photos"
            local.mkdir()
            Image.new("RGB", (100, 70), "white").save(local / "sample.png")
            config = {
                "collection": "bags",
                "products": [],
                "vectors": {
                    "local-sample": [
                        {"source_type": "existing-svg", "path": "missing.svg"}
                    ]
                },
            }
            (root / "sources.json").write_text(json.dumps(config))
            with (
                patch.object(build, "BASE", root),
                contextlib.redirect_stdout(io.StringIO()),
                contextlib.redirect_stderr(io.StringIO()),
            ):
                self.assertEqual(
                    build.main(["--local", str(local), "--no-web", "--offline"]), 1
                )
            self.assertFalse((root / "output/local-sample.svg").exists())

    def test_committed_output_contract(self):
        report = json.loads((build.BASE / "output/report.json").read_text())
        self.assertFalse(report["failures"])
        self.assertEqual(len(report["products"]), 16)
        for row in report["products"]:
            path = build.BASE / "output" / f"{row['id']}.svg"
            root = ET.parse(path).getroot()
            ids = [e.get("id") for e in root.iter() if e.get("id")]
            self.assertEqual(len(ids), len(set(ids)), row["id"])
            self.assertIn("body", ids)
            self.assertIn("anchor-left", ids)
            self.assertIn("anchor-right", ids)
            self.assertEqual(
                json.loads(root.find(f"{{{build.NS}}}metadata").text), row["metadata"]
            )
            self.assertTrue(
                build.render(path.read_text(), 100).getchannel("A").getbbox()
            )
            if row["metadata"]["source_type"] == "photo-trace":
                self.assertGreater(row["metadata"]["iou"], 0.9)
            for e in root.iter():
                self.assertNotIn(
                    e.tag.split("}")[-1], {"script", "image", "foreignObject"}
                )


if __name__ == "__main__":
    unittest.main()
