# Python HTML Parser

Alternative Python implementation of the HTML content parser.

## Installation

```bash
cd python
pip install -r requirements.txt
```

## Usage

### Command Line

```bash
python parser.py https://example.com
```

### Programmatic

```python
from parser import HTMLParser

parser = HTMLParser(
    include_metadata=True,
    include_structure=True,
    max_depth=10,
    include_attributes=True
)

result = parser.parse_from_url('https://example.com')
print(result)
```

## Features

- BeautifulSoup4 for robust HTML parsing
- Dataclasses for clean type definitions
- Full support for all block types
- Metadata and structure extraction
- JSON serialization support

## Dependencies

- beautifulsoup4: HTML parsing
- requests: HTTP requests
- lxml: Fast XML/HTML processing
- pydantic: Data validation (optional)
