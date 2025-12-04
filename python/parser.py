"""
HTML Content Parser - Python Implementation
A powerful HTML parser that extracts structured content from websites
"""

from typing import List, Dict, Optional, Any, Union
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
import requests
from bs4 import BeautifulSoup, Tag, NavigableString
import json


class BlockType(str, Enum):
    HEADING = "heading"
    PARAGRAPH = "paragraph"
    IMAGE = "image"
    VIDEO = "video"
    IFRAME = "iframe"
    LIST = "list"
    CODE = "code"
    BLOCKQUOTE = "blockquote"
    LINK = "link"
    DIV = "div"
    SECTION = "section"
    ARTICLE = "article"


class LayoutType(str, Enum):
    SINGLE = "single"
    MULTI_COLUMN = "multi-column"
    GRID = "grid"
    FLEX = "flex"


@dataclass
class BaseBlock:
    id: str
    type: BlockType
    order: int
    parent: Optional[str] = None
    attributes: Dict[str, str] = field(default_factory=dict)


@dataclass
class HeadingBlock(BaseBlock):
    level: int
    text: str


@dataclass
class ParagraphBlock(BaseBlock):
    text: str


@dataclass
class ImageBlock(BaseBlock):
    src: str
    alt: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


@dataclass
class VideoBlock(BaseBlock):
    src: str
    poster: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


@dataclass
class IframeBlock(BaseBlock):
    src: str
    title: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None


@dataclass
class ListBlock(BaseBlock):
    ordered: bool
    items: List[str]


@dataclass
class CodeBlock(BaseBlock):
    code: str
    language: Optional[str] = None


@dataclass
class BlockquoteBlock(BaseBlock):
    text: str
    cite: Optional[str] = None


@dataclass
class ContainerBlock(BaseBlock):
    children: List[Any] = field(default_factory=list)
    layout: Optional[LayoutType] = None
    class_name: Optional[str] = None


@dataclass
class Metadata:
    description: Optional[str] = None
    keywords: Optional[List[str]] = None
    author: Optional[str] = None
    og_image: Optional[str] = None
    og_title: Optional[str] = None
    og_description: Optional[str] = None


@dataclass
class Structure:
    layout: LayoutType
    has_navigation: bool = False
    has_header: bool = False
    has_footer: bool = False
    has_sidebar: bool = False


@dataclass
class ParsedContent:
    url: str
    title: str
    metadata: Metadata
    blocks: List[Any]
    structure: Structure
    parsed_at: str


class HTMLParser:
    """HTML Content Parser with best practices"""

    def __init__(
        self,
        include_metadata: bool = True,
        include_structure: bool = True,
        max_depth: int = 10,
        ignore_selectors: Optional[List[str]] = None,
        include_attributes: bool = True,
    ):
        self.include_metadata = include_metadata
        self.include_structure = include_structure
        self.max_depth = max_depth
        self.ignore_selectors = ignore_selectors or [
            "script",
            "style",
            "noscript",
        ]
        self.include_attributes = include_attributes
        self.block_counter = 0

    def parse_from_url(self, url: str) -> ParsedContent:
        """Fetch and parse HTML from a URL"""
        try:
            headers = {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8",
                "Accept-Language": "en-US,en;q=0.9",
                "Accept-Encoding": "gzip, deflate, br",
                "Connection": "keep-alive",
                "Upgrade-Insecure-Requests": "1",
                "Sec-Fetch-Dest": "document",
                "Sec-Fetch-Mode": "navigate",
                "Sec-Fetch-Site": "none",
                "Cache-Control": "max-age=0",
            }
            response = requests.get(url, headers=headers, timeout=30)
            response.raise_for_status()
            return self.parse_html(response.text, url)
        except requests.RequestException as e:
            raise Exception(f"Failed to fetch URL: {str(e)}")

    def parse_html(self, html: str, url: str) -> ParsedContent:
        """Parse HTML string"""
        soup = BeautifulSoup(html, "lxml")
        self.block_counter = 0

        # Remove ignored elements
        for selector in self.ignore_selectors:
            for element in soup.select(selector):
                element.decompose()

        title = soup.title.string if soup.title else ""
        metadata = (
            self._extract_metadata(soup) if self.include_metadata else Metadata()
        )
        structure = (
            self._analyze_structure(soup)
            if self.include_structure
            else Structure(layout=LayoutType.SINGLE)
        )

        # Try to find main content area first
        content_element = (
            soup.find("main")
            or soup.find(attrs={"role": "main"})
            or soup.find("article")
            or soup.find(class_=["post-content", "blog-content", "entry-content", "content-area", "blog__post-content-wrapper"])
            or soup.find("body")
        )

        # Parse main content
        blocks = self._parse_element(content_element, 0) if content_element else []

        return ParsedContent(
            url=url,
            title=title,
            metadata=metadata,
            blocks=blocks,
            structure=structure,
            parsed_at=datetime.now().isoformat(),
        )

    def _extract_metadata(self, soup: BeautifulSoup) -> Metadata:
        """Extract metadata from HTML"""
        meta_desc = soup.find("meta", attrs={"name": "description"})
        meta_keywords = soup.find("meta", attrs={"name": "keywords"})
        meta_author = soup.find("meta", attrs={"name": "author"})
        og_image = soup.find("meta", property="og:image")
        og_title = soup.find("meta", property="og:title")
        og_desc = soup.find("meta", property="og:description")

        return Metadata(
            description=meta_desc.get("content") if meta_desc else None,
            keywords=(
                meta_keywords.get("content").split(",")
                if meta_keywords
                else None
            ),
            author=meta_author.get("content") if meta_author else None,
            og_image=og_image.get("content") if og_image else None,
            og_title=og_title.get("content") if og_title else None,
            og_description=og_desc.get("content") if og_desc else None,
        )

    def _analyze_structure(self, soup: BeautifulSoup) -> Structure:
        """Analyze page structure"""
        has_navigation = bool(soup.find("nav"))
        has_header = bool(soup.find("header"))
        has_footer = bool(soup.find("footer"))
        has_sidebar = bool(
            soup.find("aside")
            or soup.find(class_="sidebar")
            or soup.find(class_=lambda x: x and "sidebar" in x.lower())
        )

        # Detect layout type
        layout = LayoutType.SINGLE
        body = soup.find("body")
        if body:
            body_style = body.get("style", "")
            if "display: grid" in body_style or soup.find(
                style=lambda x: x and "display: grid" in x
            ):
                layout = LayoutType.GRID
            elif "display: flex" in body_style or soup.find(
                style=lambda x: x and "display: flex" in x
            ):
                layout = LayoutType.FLEX
            elif soup.find(class_=lambda x: x and ("col-" in x or "column" in x)):
                layout = LayoutType.MULTI_COLUMN

        return Structure(
            layout=layout,
            has_navigation=has_navigation,
            has_header=has_header,
            has_footer=has_footer,
            has_sidebar=has_sidebar,
        )

    def _parse_element(
        self, element: Tag, depth: int, parent: Optional[str] = None
    ) -> List[Any]:
        """Parse an element and its children recursively"""
        if depth > self.max_depth or not isinstance(element, Tag):
            return []

        blocks = []
        for child in element.children:
            if isinstance(child, Tag):
                block = self._parse_node(child, depth, parent)
                if block:
                    if isinstance(block, list):
                        blocks.extend(block)
                    else:
                        blocks.append(block)

        return blocks

    def _parse_node(
        self, element: Tag, depth: int, parent: Optional[str] = None
    ) -> Optional[Union[Any, List[Any]]]:
        """Parse a single node into a ContentBlock"""
        self.block_counter += 1
        block_id = f"block-{self.block_counter}"
        order = self.block_counter
        tag_name = element.name.lower()

        attributes = {}
        if self.include_attributes:
            attributes = {
                k: v
                for k, v in element.attrs.items()
                if k not in ["src", "href", "alt", "width", "height", "title"]
            }

        # Heading tags
        if tag_name in ["h1", "h2", "h3", "h4", "h5", "h6"]:
            text = element.get_text().strip()
            if not text:
                return None
            return HeadingBlock(
                id=block_id,
                type=BlockType.HEADING,
                order=order,
                parent=parent,
                level=int(tag_name[1]),
                text=text,
                attributes=attributes,
            )

        # Paragraph
        elif tag_name == "p":
            text = element.get_text().strip()
            if not text:
                return None
            return ParagraphBlock(
                id=block_id,
                type=BlockType.PARAGRAPH,
                order=order,
                parent=parent,
                text=text,
                attributes=attributes,
            )

        # Image
        elif tag_name == "img":
            # Handle lazy loading: check multiple possible src attributes
            # Priority: data-amsrc, data-src, data-lazy-src, data-original, data-lazy, then src (but skip base64)
            src = (
                element.get("data-amsrc")
                or element.get("data-src")
                or element.get("data-lazy-src")
                or element.get("data-original")
                or element.get("data-lazy")
            )

            # Check src only if it's not a data URI
            if not src:
                src_attr = element.get("src")
                if src_attr and not src_attr.startswith("data:"):
                    src = src_attr

            # If still no src, check srcset
            if not src:
                srcset = element.get("srcset") or element.get("data-srcset")
                if srcset:
                    # Extract first URL from srcset
                    src = srcset.split(",")[0].strip().split(" ")[0]

            # Filter out data URIs (base64, svg, etc.)
            if not src or src.startswith("data:"):
                return None

            return ImageBlock(
                id=block_id,
                type=BlockType.IMAGE,
                order=order,
                parent=parent,
                src=src,
                alt=element.get("alt"),
                width=self._parse_int(element.get("width")),
                height=self._parse_int(element.get("height")),
                attributes=attributes,
            )

        # Picture elements
        elif tag_name == "picture":
            source = element.find("source")
            img = element.find("img")

            # Try source data-srcset first
            src = None
            if source:
                src = source.get("data-srcset") or source.get("srcset")

            # Then try img attributes (prioritize data-amsrc and other lazy loading attrs)
            if not src and img:
                src = (
                    img.get("data-amsrc")
                    or img.get("data-src")
                    or img.get("data-lazy-src")
                    or img.get("data-original")
                )

                # Only use src if it's not a data URI
                if not src:
                    img_src = img.get("src")
                    if img_src and not img_src.startswith("data:"):
                        src = img_src

            if not src or src.startswith("data:"):
                return None

            # If srcset, get first URL
            if "," in src:
                src = src.split(",")[0].strip().split(" ")[0]

            return ImageBlock(
                id=block_id,
                type=BlockType.IMAGE,
                order=order,
                parent=parent,
                src=src,
                alt=img.get("alt") if img else None,
                width=self._parse_int(img.get("width")) if img else None,
                height=self._parse_int(img.get("height")) if img else None,
                attributes=attributes,
            )

        # Video
        elif tag_name == "video":
            src = element.get("src")
            if not src:
                source = element.find("source")
                src = source.get("src") if source else None
            if not src:
                return None
            return VideoBlock(
                id=block_id,
                type=BlockType.VIDEO,
                order=order,
                parent=parent,
                src=src,
                poster=element.get("poster"),
                width=self._parse_int(element.get("width")),
                height=self._parse_int(element.get("height")),
                attributes=attributes,
            )

        # Iframe
        elif tag_name == "iframe":
            src = element.get("src")
            if not src:
                return None
            return IframeBlock(
                id=block_id,
                type=BlockType.IFRAME,
                order=order,
                parent=parent,
                src=src,
                title=element.get("title"),
                width=self._parse_int(element.get("width")),
                height=self._parse_int(element.get("height")),
                attributes=attributes,
            )

        # Lists
        elif tag_name in ["ul", "ol"]:
            items = [li.get_text().strip() for li in element.find_all("li")]
            if not items:
                return None
            return ListBlock(
                id=block_id,
                type=BlockType.LIST,
                order=order,
                parent=parent,
                ordered=(tag_name == "ol"),
                items=items,
                attributes=attributes,
            )

        # Code
        elif tag_name in ["pre", "code"]:
            code = element.get_text().strip()
            if not code:
                return None
            language = None
            class_attr = element.get("class", [])
            if class_attr:
                for cls in class_attr:
                    if cls.startswith("language-"):
                        language = cls.replace("language-", "")
                        break
            return CodeBlock(
                id=block_id,
                type=BlockType.CODE,
                order=order,
                parent=parent,
                code=code,
                language=language,
                attributes=attributes,
            )

        # Blockquote
        elif tag_name == "blockquote":
            text = element.get_text().strip()
            if not text:
                return None
            return BlockquoteBlock(
                id=block_id,
                type=BlockType.BLOCKQUOTE,
                order=order,
                parent=parent,
                text=text,
                cite=element.get("cite"),
                attributes=attributes,
            )

        # Containers
        elif tag_name == "div":
            children = self._parse_element(element, depth + 1, block_id)

            # If no children found but div has direct text content, treat as paragraph
            if not children:
                text = element.get_text().strip()
                if text and len(text) > 0:
                    return ParagraphBlock(
                        id=block_id,
                        type=BlockType.PARAGRAPH,
                        order=order,
                        parent=parent,
                        text=text,
                        attributes=attributes,
                    )
                return None

            layout = self._detect_layout(element)
            return ContainerBlock(
                id=block_id,
                type=BlockType.DIV,
                order=order,
                parent=parent,
                children=children,
                layout=layout,
                class_name=element.get("class"),
                attributes=attributes,
            )

        elif tag_name in ["section", "article"]:
            children = self._parse_element(element, depth + 1, block_id)
            if not children:
                return None

            layout = self._detect_layout(element)
            container = ContainerBlock(
                id=block_id,
                type=BlockType(tag_name.upper()),
                order=order,
                parent=parent,
                children=children,
                layout=layout,
                class_name=element.get("class"),
                attributes=attributes,
            )
            return container

        # Inline elements with standalone content
        elif tag_name in ["span", "a", "strong", "em", "b", "i"]:
            text = element.get_text().strip()
            if text and len(text) > 20 and not parent:
                return ParagraphBlock(
                    id=block_id,
                    type=BlockType.PARAGRAPH,
                    order=order,
                    parent=parent,
                    text=text,
                    attributes=attributes,
                )
            # Otherwise, recursively parse children
            return self._parse_element(element, depth + 1, parent)

        # Other elements - parse children
        else:
            return self._parse_element(element, depth + 1, parent)

    def _detect_layout(self, element: Tag) -> LayoutType:
        """Detect layout type from element"""
        class_name = " ".join(element.get("class", []))
        style = element.get("style", "")

        if "display: grid" in style or "grid" in class_name:
            return LayoutType.GRID
        elif "display: flex" in style or "flex" in class_name:
            return LayoutType.FLEX
        elif "col-" in class_name or "column" in class_name:
            return LayoutType.MULTI_COLUMN

        return LayoutType.SINGLE

    def _parse_int(self, value: Any) -> Optional[int]:
        """Parse string to int"""
        if value is None:
            return None
        try:
            return int(value)
        except (ValueError, TypeError):
            return None


def block_to_dict(block: Any) -> Dict:
    """Convert block dataclass to dictionary"""
    if isinstance(block, (list, tuple)):
        return [block_to_dict(b) for b in block]

    result = {}
    for key, value in block.__dict__.items():
        if isinstance(value, Enum):
            result[key] = value.value
        elif isinstance(value, list):
            result[key] = [block_to_dict(item) for item in value]
        elif hasattr(value, "__dict__"):
            result[key] = block_to_dict(value)
        else:
            result[key] = value
    return result


def main():
    """CLI interface for the parser"""
    import sys

    if len(sys.argv) < 2:
        print("Usage: python parser.py <url>")
        print("Example: python parser.py https://example.com")
        sys.exit(1)

    url = sys.argv[1]

    try:
        print(f"Parsing URL: {url}\n")

        parser = HTMLParser(
            include_metadata=True,
            include_structure=True,
            max_depth=10,
            include_attributes=True,
        )

        result = parser.parse_from_url(url)
        result_dict = block_to_dict(result)

        print(json.dumps(result_dict, indent=2))

    except Exception as e:
        print(f"Error parsing URL: {str(e)}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
