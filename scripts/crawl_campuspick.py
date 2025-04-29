#!/usr/bin/env python3

import sys
import time
import re
import json
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from webdriver_manager.chrome import ChromeDriverManager

def is_ie_related(title, keywords):
    title_lower = title.lower()
    return any(k.lower() in title_lower for k in keywords)

def crawl_linkareer(keywords, max_results=10):
    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=options)

    results = []
    for page in range(1, 11):
        if len(results) >= max_results:
            break

        url = f"https://linkareer.com/list/contest?filterType=CATEGORY&orderBy_direction=DESC&orderBy_field=CREATED_AT&page={page}"
        driver.get(url)
        time.sleep(2)

        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CLASS_NAME, "ActivityListCardItem__StyledWrapper-sc-2386b9fe-0"))
            )
        except:
            continue

        soup = BeautifulSoup(driver.page_source, "html.parser")
        cards = soup.select("div[class^=ActivityListCardItem__StyledWrapper]")

        for card in cards:
            if len(results) >= max_results:
                break

            title_tag = card.find("h5", class_="activity-title")
            title = title_tag.text.strip() if title_tag else ""
            if not title or not is_ie_related(title, keywords):
                continue

            d_day_tag = card.find("div", string=re.compile(r"D-\d+"))
            if not d_day_tag:
                continue
            d_day_text = d_day_tag.text.strip()

            link_tag = card.find("a", href=re.compile(r"^/activity/\d+"))
            full_link = "https://linkareer.com" + link_tag['href'] if link_tag else "링크 없음"

            results.append({"title": title, "d_day": d_day_text, "link": full_link})

    driver.quit()

    # ⛔️ 여기서 딱 한 줄만 출력해야 route.ts가 JSON.parse 가능함
    if not results:
        print(json.dumps({ "error": "추천 공모전이 없습니다." }, ensure_ascii=False))
    else:
        print(json.dumps({ "recommendations": results }, ensure_ascii=False))

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({ "error": "키워드 리스트를 인자로 전달해야 합니다." }, ensure_ascii=False))
        sys.exit(1)
    try:
        keywords = json.loads(sys.argv[1])
        if not isinstance(keywords, list) or not all(isinstance(k, str) for k in keywords):
            raise ValueError()
    except:
        print(json.dumps({ "error": "올바른 키워드 리스트가 필요합니다." }, ensure_ascii=False))
        sys.exit(1)

    crawl_linkareer(keywords)
