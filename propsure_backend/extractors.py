# extractors.py
import re


def extract_pan_numbers(text: str) -> list[str]:
    """
    Extract all Indian PAN numbers from OCR text.
    PAN pattern: 5 uppercase letters, 4 digits, 1 uppercase letter.
    """
    pattern = r"[A-Z]{5}[0-9]{4}[A-Z]"
    return re.findall(pattern, text)


def extract_all(text: str) -> dict:
    """
    Run all extractors on the given OCR text and return structured data.
    """
    return {
        "pan": extract_pan_numbers(text),
        # later you can add: "dates": extract_dates(text), etc.
    }