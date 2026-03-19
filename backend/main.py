from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text(url):
    extracted_text = ""
    response = requests.get(url)
    html_content = response.text
    soup = BeautifulSoup(html_content, 'html.parser')

    paragraphs = soup.find_all('p')
    
    for p in paragraphs:
        extracted_text += p.get_text(strip=True)

    return extracted_text

@app.get("/")
def root():
    test_url = "https://losgatan.com/cats-hill-50th-anniversary-this-saturday/"
    return {"status": "ok", "testing_text": extract_text(test_url)}



