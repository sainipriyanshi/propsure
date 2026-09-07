from io import BytesIO
from PIL import Image, ImageOps, ImageEnhance
import pytesseract
import re


def prepare_image(image: Image.Image) -> Image.Image:
    image = ImageOps.exif_transpose(image)

    # Crop to the paper area for your current test photo
    image = image.crop((165, 15, 875, 555))

    image = ImageOps.grayscale(image)

    width, height = image.size
    image = image.resize((width * 2, height * 2))

    image = ImageEnhance.Contrast(image).enhance(1.5)

    return image


def extract_text_from_image_path(image_path: str, lang: str = "eng") -> str:
    image = Image.open(image_path)
    prepared_image = prepare_image(image)

    return pytesseract.image_to_string(
        prepared_image,
        lang=lang,
        config="--psm 11",
    ).strip()


def extract_text_from_image_bytes(image_bytes: bytes, lang: str = "eng") -> str:
    image = Image.open(BytesIO(image_bytes))
    print("API received image:", image.format, image.mode, image.size)

    prepared_image = prepare_image(image)
    prepared_image.save("api_debug_preprocessed.png")

    text = pytesseract.image_to_string(
        prepared_image,
        lang=lang,
        config="--psm 11",
    ).strip()

    print("API OCR:", repr(text))
    return text


def analyze_document(file_obj) -> dict:
    """
    file_obj: Django UploadedFile (from request.FILES['document'])
    returns: {
        "ocr_text": str,
        "extracted": {"pan": List[str]},
        "risks": List[{"rule": str, "severity": str, "message": str}]
    }
    """
    image_bytes = file_obj.read()
    ocr_text = extract_text_from_image_bytes(image_bytes)

    # PAN extraction (adapt pattern to your requirement)
    pan_pattern = r"[A-Z]{5}\d{4}[A-Z]"
    pan_matches = re.findall(pan_pattern, ocr_text)

    # Simple risk rules (extend as needed)
    risks = []

    if not pan_matches:
        risks.append({
            "rule": "pan_not_found",
            "severity": "high",
            "message": "No PAN detected in the document.",
        })
    else:
        # Example: validate PAN format more strictly if needed
        for pan in pan_matches:
            if not re.fullmatch(r"[A-Z]{5}\d{4}[A-Z]", pan):
                risks.append({
                    "rule": "pan_format_invalid",
                    "severity": "high",
                    "message": f"Detected PAN '{pan}' does not match expected format.",
                })

    return {
        "ocr_text": ocr_text,
        "extracted": {
            "pan": pan_matches,
        },
        "risks": risks,
    }