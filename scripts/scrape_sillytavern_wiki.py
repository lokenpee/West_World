import os
import re
from urllib.parse import urljoin, urlparse
from pathlib import Path

import requests
from bs4 import BeautifulSoup
from markdownify import markdownify as md

BASE_URL = "https://sillytavern.wiki/"
OUTPUT_DIR = Path(__file__).resolve().parents[1] / "docs" / "sillytavern-wiki"
MAX_DEPTH = 2
MAX_PAGES = 40

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
}

seen = set()


def normalize_slug(url: str) -> str:
    parsed = urlparse(url)
    path = parsed.path.strip("/")
    if not path:
        return "index"
    path = re.sub(r"[^a-zA-Z0-9_\-/]+", "-", path)
    path = re.sub(r"-+", "-", path).strip("-")
    return path or "index"


def is_local_url(url: str) -> bool:
    if not url:
        return False
    if url.startswith("mailto:") or url.startswith("javascript:"):
        return False
    parsed = urlparse(url)
    if parsed.netloc and parsed.netloc.lower() not in {"sillytavern.wiki", "www.sillytavern.wiki"}:
        return False
    return True


def fetch(url: str) -> str:
    resp = requests.get(url, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.text


def extract_main_content(html: str) -> str:
    soup = BeautifulSoup(html, "html.parser")
    main = soup.select_one("main") or soup.select_one("article") or soup

    for sel in ["nav", "aside", "header", "footer", "script", "style", ".toc", ".sidebar", ".navbar", ".site-header"]:
        for tag in main.select(sel):
            tag.decompose()

    # remove obvious duplicate/UX clutter if present
    for tag in main.select("[class*='nav'], [id*='nav'], [class*='sidebar'], [id*='sidebar']"):
        tag.decompose()

    # keep content; convert html to markdown
    markdown = md(str(main), heading_style="ATX")
    markdown = markdown.strip()
    if not markdown:
        markdown = md(str(soup), heading_style="ATX")
    return markdown


def save_page(url: str, markdown: str, depth: int) -> str:
    slug = normalize_slug(url)
    filename = f"{slug}.md"
    out_dir = OUTPUT_DIR / f"depth-{depth}"
    target = out_dir / filename
    target.parent.mkdir(parents=True, exist_ok=True)

    front_matter = f"---\nsource: {url}\n---\n\n"
    target.write_text(front_matter + markdown + "\n", encoding="utf-8")
    return str(target.relative_to(Path(__file__).resolve().parents[1]))


def discover_links(html: str, base_url: str):
    soup = BeautifulSoup(html, "html.parser")
    links = []
    for a in soup.select("a[href]"):
        href = a.get("href")
        if not href:
            continue
        full = urljoin(base_url, href)
        if not is_local_url(full):
            continue
        if "#" in full:
            full = full.split("#", 1)[0]
        if full.endswith("/"):
            full = full[:-1]
        if full.startswith("https://sillytavern.wiki"):
            links.append(full)
    return sorted(set(links))


def crawl(url: str, depth: int = 0, max_pages: int = MAX_PAGES):
    if depth > MAX_DEPTH or len(seen) >= max_pages:
        return
    if url in seen:
        return
    seen.add(url)

    try:
        html = fetch(url)
    except Exception as exc:  # pragma: no cover
        print(f"[skip] {url} -> {exc}")
        return

    markdown = extract_main_content(html)
    if markdown:
        relative_path = save_page(url, markdown, depth)
        print(f"[saved] {url} -> {relative_path}")

    if depth >= MAX_DEPTH:
        return

    for link in discover_links(html, url):
        if len(seen) >= max_pages:
            break
        crawl(link, depth + 1, max_pages)


def build_index():
    index_path = OUTPUT_DIR / "README.md"
    files = sorted(OUTPUT_DIR.rglob("*.md"))
    rels = []
    for f in files:
        if f.name == "README.md":
            continue
        rels.append(f"- [{f.relative_to(OUTPUT_DIR).as_posix()}]({f.relative_to(OUTPUT_DIR).as_posix()})")
    index_path.write_text(
        "# SillyTavern Wiki 本地知识库\n\n"
        "这是基于官方网站抓取后生成的本地 Markdown 文档集合，适合做插件开发和 RAG 索引。\n\n"
        "## 文档列表\n\n" + ("\n".join(rels) if rels else "- 暂无文档") + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Output dir: {OUTPUT_DIR}")
    crawl(BASE_URL, depth=0, max_pages=MAX_PAGES)
    build_index()
    print(f"Done. Total pages: {len(seen)}")
