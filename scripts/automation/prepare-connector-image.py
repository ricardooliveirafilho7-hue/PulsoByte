#!/usr/bin/env python3
"""Prepara e valida capa editorial no CONNECTOR_FALLBACK.

Pode ser buscado isoladamente pelo conector GitHub e executado em diretório
temporário, sem clone do repositório. Requer Python 3.10+ e Pillow.
"""
from __future__ import annotations
import argparse, hashlib, json, sys
from pathlib import Path
try:
    from PIL import Image, ImageOps
except ImportError as exc:
    raise SystemExit("Pillow obrigatório: python -m pip install Pillow") from exc


def sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def ahash(image: Image.Image) -> str:
    gray = ImageOps.grayscale(image).resize((8, 8), Image.Resampling.LANCZOS)
    values = list(gray.getdata())
    mean = sum(values) / 64
    return "".join("1" if value >= mean else "0" for value in values)


def distance(a: str, b: str) -> int:
    return sum(x != y for x, y in zip(a, b))


def previous_images(catalog: dict):
    for article in catalog.get("articles", []):
        slug = str(article.get("slug", "unknown"))
        if article.get("coverPerceptualHash"):
            yield slug, str(article["coverPerceptualHash"]), article.get("coverSha256")
        for item in article.get("internalImages", []) or []:
            if item.get("perceptualHash"):
                yield slug, str(item["perceptualHash"]), item.get("sha256")


def save_under_limit(image: Image.Image, output: Path, max_bytes: int) -> int:
    output.parent.mkdir(parents=True, exist_ok=True)
    for quality in (86, 82, 78, 74, 70, 66, 62, 58, 54, 50, 46, 42):
        image.save(output, "WEBP", quality=quality, method=6, exact=True)
        if output.stat().st_size <= max_bytes:
            return quality
    raise RuntimeError(f"não foi possível comprimir abaixo de {max_bytes} bytes")


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("--input", required=True, type=Path)
    p.add_argument("--output", required=True, type=Path)
    p.add_argument("--catalog", required=True, type=Path)
    p.add_argument("--manifest", required=True, type=Path)
    p.add_argument("--source-url", required=True)
    p.add_argument("--license", required=True, dest="license_name")
    p.add_argument("--width", type=int, default=1600)
    p.add_argument("--height", type=int, default=900)
    p.add_argument("--max-bytes", type=int, default=512000)
    p.add_argument("--block-distance", type=int, default=10)
    p.add_argument("--warn-distance", type=int, default=13)
    a = p.parse_args()
    if not a.input.is_file() or a.input.stat().st_size == 0:
        raise SystemExit("imagem de entrada ausente ou vazia")
    if not a.catalog.is_file():
        raise SystemExit("catálogo canônico ausente")
    if not a.source_url.startswith("https://"):
        raise SystemExit("URL de origem deve usar HTTPS")
    catalog = json.loads(a.catalog.read_text(encoding="utf-8"))
    with Image.open(a.input) as opened:
        opened.verify()
    with Image.open(a.input) as opened:
        image = ImageOps.exif_transpose(opened).convert("RGB")
        if image.width < a.width or image.height < a.height:
            raise SystemExit(f"origem {image.width}x{image.height} abaixo de {a.width}x{a.height}")
        fitted = ImageOps.fit(image, (a.width, a.height), Image.Resampling.LANCZOS, centering=(0.5, 0.5))
        quality = save_under_limit(fitted, a.output, a.max_bytes)
    with Image.open(a.output) as result:
        result.verify()
    with Image.open(a.output) as result:
        if result.format != "WEBP" or result.size != (a.width, a.height):
            raise SystemExit("WebP ou dimensões finais inválidos")
        if result.info.get("exif") or result.info.get("xmp") or result.info.get("icc_profile"):
            raise SystemExit("metadados incorporados ainda presentes")
        perceptual = ahash(result.convert("RGB"))
    digest = sha256(a.output)
    nearest = None
    for slug, old_hash, old_sha in previous_images(catalog):
        if old_sha == digest:
            raise SystemExit(f"imagem byte a byte já existe no catálogo: {slug}")
        d = distance(perceptual, old_hash)
        if nearest is None or d < nearest["distance"]:
            nearest = {"slug": slug, "distance": d}
    if nearest and nearest["distance"] <= a.block_distance:
        raise SystemExit(f"duplicidade perceptual com {nearest['slug']}: {nearest['distance']}/64")
    manifest = {
        "schemaVersion": 1,
        "output": str(a.output),
        "sourceUrl": a.source_url,
        "license": a.license_name,
        "format": "webp",
        "width": a.width,
        "height": a.height,
        "bytes": a.output.stat().st_size,
        "quality": quality,
        "sha256": digest,
        "perceptualHash": perceptual,
        "nearestCatalogImage": nearest,
        "perceptualWarning": bool(nearest and nearest["distance"] <= a.warn_distance),
        "metadataRemoved": True,
        "reopenedSuccessfully": True
    }
    a.manifest.parent.mkdir(parents=True, exist_ok=True)
    a.manifest.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False))
    return 0

if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, RuntimeError, json.JSONDecodeError) as exc:
        print(f"prepare-connector-image: {exc}", file=sys.stderr)
        raise SystemExit(1)
