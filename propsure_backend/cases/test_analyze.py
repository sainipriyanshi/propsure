# test_analyze.py
import requests
from PIL import Image

url = "http://127.0.0.1:8000/api/analyze/"

img = Image.open("clean_text.jpg")
print("Format:", img.format)
print("Mode:", img.mode)
print("Size:", img.size)

with open("clean_text.jpg", "rb") as f:
    files = {"image": f}
    response = requests.post(url, files=files)

print("Status:", response.status_code)
print(response.json())