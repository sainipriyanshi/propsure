# risk_rules.py
from datetime import datetime
import re


def extract_dates_ddmmyyyy(text: str) -> list[datetime]:
    """
    Extract dates in DD-MM-YYYY or DD/MM/YYYY format from OCR text.
    Returns a list of datetime objects.
    """
    pattern = r"\b(\d{2})[-/](\d{2})[-/](\d{4})\b"
    dates = []
    for match in re.finditer(pattern, text):
        day, month, year = match.groups()
        try:
            dt = datetime(int(year), int(month), int(day))
            dates.append(dt)
        except ValueError:
            # invalid date like 32-13-2020
            continue
    return dates


def evaluate_risks(extracted: dict, ocr_text: str = "") -> list[dict]:
    """
    Given extraction results and optional raw OCR text,
    return a list of risk findings.
    """
    risks = []

    # Rule 1: Missing PAN
    pan_list = extracted.get("pan", [])
    if not pan_list:
        risks.append({
            "rule": "missing_pan",
            "severity": "high",
            "message": "No PAN number detected in the document."
        })

    # Rule 2: Future document date
    dates = extract_dates_ddmmyyyy(ocr_text)
    today = datetime.now().date()
    for dt in dates:
        if dt.date() > today:
            risks.append({
                "rule": "future_date",
                "severity": "medium",
                "message": f"Document contains a future date: {dt.strftime('%d-%m-%Y')}."
            })

    return risks