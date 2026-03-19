from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import requests
from bs4 import BeautifulSoup

import nltk
from nltk.corpus import stopwords
import re
from collections import Counter

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


@app.get("/analyze")
def analyze(top_n=5):
    text = extract_text(TEST_URL)
    stop_words = set(stopwords.words("english"))

    text = extract_text(TEST_URL)
    words = text.split(" ")

    # count words in lowercase so stop_words can be identified
    words = [word.lower() for word in words]
    word_counts = Counter(words)

    # sort by score
    words_and_scores = sorted(word_counts.items(), key=lambda x : x[1], reverse=True)
    # eliminate stop words
    words_and_scores = {word: score for word, score in words_and_scores if 
                        word not in stop_words}
                        
    return words_and_scores



   


