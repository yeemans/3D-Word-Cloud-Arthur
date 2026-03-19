from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup

import nltk
from nltk.corpus import stopwords
import re
from collections import Counter
from pydantic import BaseModel

nltk.download("stopwords", quiet=True)

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)
TEST_URL = "https://losgatan.com/cats-hill-50th-anniversary-this-saturday/"

def extract_text(url):
    response = requests.get(url)
    html_content = response.text
    soup = BeautifulSoup(html_content, 'html.parser')

    # do not look at text that is not in article's body
    for tag in soup(["script", "style", "nav", "footer", "header"]):
        tag.decompose()

    paragraphs = soup.find_all('p')
    
    text = " ".join(p.get_text() for p in paragraphs)
    return re.sub(r"\s+", " ", text).strip()

@app.get("/")
def root():
    return {"status": "ok", "testing_text": extract_text(TEST_URL)}

class AnalyzeRequest(BaseModel):
    url: str

@app.post("/analyze")
def analyze(req: AnalyzeRequest, top_n: int = 60):
    try:
        text = extract_text(req.url)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to fetch article: {e}")

    stop_words = set(stopwords.words("english"))
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text.lower())
    word_counts = Counter(w for w in words if w not in stop_words)

    top_words = word_counts.most_common(top_n)
    max_score = top_words[0][1] if top_words else 1

    return {
        "words": [
            {"word": word, "weight": round(score / max_score)}
            for word, score in top_words
        ]
    }


   


