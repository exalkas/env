import os
import json
import logging
import time
import traceback
from datetime import datetime, date
from typing import List, Dict, Any, Optional
import requests
from pydantic import BaseModel

# Configuration
MAX_RETRIES = 3

# Default combined prompt for news and analysis
DEFAULT_COMBINED_PROMPT = """Can you search internet and find at least 10 news about 
EUAs, GOO, VCM, CBAM, biofuels, EUA 2, green energy
from yesterday and today
that could add to our platform.
I'd like at least 2-3 sentences after the headline for the news you found.
Note at which category(ies) those news belong to
Can you also add tags?

After generating the individual news articles, create a daily analysis report from all the news.
The daily analysis should be of high value for our readers.
Without giving direct predictions like price will go up or down we should be able to point to the proper directions.
It must be useful for ship owners, factories, sustainability managers, big companies and anyone that is involved in green energy in any way.

Please return the response as a JSON object with two fields:
1. "news_articles": an array where each news item is an object with fields: title, summary, content, tags, category
2. "daily_analysis": an object with fields: title, summary, content

Available categories are: EUA, EUA2, GOO, GEO, VOLUNTARY_MARKETS, BIOFUELS, GENERAL
If a news item doesn't fit any specific category, use GENERAL."""

class NewsItem(BaseModel):
    title: str
    summary: str
    content: str
    tags: str
    category: str

class DailyAnalysis(BaseModel):
    title: str
    summary: str
    content: str

class OpenAIService:
    def __init__(self):
        from app.core.config import settings
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable is required")
    
    def _get_valid_categories(self, db=None):
        """Get valid categories from database"""
        if db:
            from app.models.news_category import NewsCategory
            categories = db.query(NewsCategory).filter(NewsCategory.is_active == True).all()
            return [cat.name for cat in categories]
        else:
            # Fallback to hardcoded categories if no DB session
            return ['EUA', 'EUA2', 'GOO', 'GEO', 'VOLUNTARY_MARKETS', 'BIOFUELS', 'GENERAL', 'DAILY_ANALYSIS', 'CBAM']

    def call_gpt(self, user_prompt: str, system_prompt: str = "") -> dict:
        """Call GPT API with text-only content"""
        payload = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system_prompt or "You are a helpful assistant that returns responses in JSON format."},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 4000,  # Increased for combined response
            "temperature": 0.3,
            "response_format": {"type": "json_object"}
        }
        
        for attempt in range(1, MAX_RETRIES + 1):
            try:
                response = requests.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {self.api_key}"},
                    json=payload,
                    timeout=60
                )
                response.raise_for_status()
                rsp_json = response.json()["choices"][0]["message"]["content"]
                return json.loads(rsp_json)
            except (json.JSONDecodeError, KeyError) as e:
                logging.warning(f"Bad JSON from GPT-4o, retrying ({attempt}/{MAX_RETRIES})... Error: {e}")
            except requests.HTTPError as e:
                logging.error(f"HTTP error: {e}")
                if e.response.status_code == 429:  # rate limit
                    time.sleep(10)
                else:
                    time.sleep(5)
            except Exception as e:
                logging.error(f"Unexpected error: {traceback.format_exc()}")
                time.sleep(5)
        
        raise RuntimeError("GPT-4o failed after retries")

    def generate_news_and_analysis(self, 
                                  start_date: Optional[date] = None, 
                                  end_date: Optional[date] = None,
                                  custom_prompt: Optional[str] = None,
                                  db=None) -> tuple[List[NewsItem], Optional[DailyAnalysis]]:
        """Generate news articles and daily analysis in one call for efficiency"""
        
        # Use provided dates or default to today
        if not start_date:
            start_date = date.today()
        if not end_date:
            end_date = date.today()
            
        # Create date-specific prompt
        date_prompt = f"from {start_date.strftime('%Y-%m-%d')} to {end_date.strftime('%Y-%m-%d')}"
        
        # Use custom prompt or default
        base_prompt = custom_prompt or DEFAULT_COMBINED_PROMPT
        final_prompt = base_prompt.replace("from yesterday and today", date_prompt)
        
        try:
            response = self.call_gpt(final_prompt)
            
            news_items = []
            daily_analysis = None
            
            # Parse news articles
            news_data = response.get('news_articles', [])
            if not news_data and 'news' in response:
                news_data = response['news']
            elif not news_data and isinstance(response, list):
                news_data = response
            
            for item in news_data:
                try:
                    # Handle tags: convert list to comma-separated string if needed
                    tags_raw = item.get('tags', '')
                    if isinstance(tags_raw, list):
                        tags = ', '.join(str(tag).strip() for tag in tags_raw)
                    else:
                        tags = str(tags_raw) if tags_raw else ''
                    
                    # Handle category: ensure it's a string
                    category_raw = item.get('category', 'GENERAL')
                    if isinstance(category_raw, list):
                        # If category is a list, take the first item
                        category = str(category_raw[0]) if category_raw else 'GENERAL'
                    else:
                        category = str(category_raw) if category_raw else 'GENERAL'
                    
                    # Ensure all required fields exist and normalize category
                    news_item = NewsItem(
                        title=item.get('title', 'Untitled'),
                        summary=item.get('summary', ''),
                        content=item.get('content', item.get('summary', '')),
                        tags=tags,
                        category=self._normalize_category(category, db)
                    )
                    news_items.append(news_item)
                except Exception as e:
                    logging.warning(f"Skipping invalid news item: {e}")
                    continue
            
            # Parse daily analysis
            analysis_data = response.get('daily_analysis')
            if analysis_data:
                try:
                    daily_analysis = DailyAnalysis(
                        title=analysis_data.get('title', f'Daily Analysis for {end_date.strftime("%m/%d/%Y")}'),
                        summary=analysis_data.get('summary', ''),
                        content=analysis_data.get('content', '')
                    )
                except Exception as e:
                    logging.warning(f"Failed to parse daily analysis: {e}")
            
            return news_items, daily_analysis
            
        except Exception as e:
            logging.error(f"Error generating news and analysis: {e}")
            raise

# Legacy method removed - daily analysis is now generated together with news for efficiency

    def _normalize_category(self, category: str, db=None) -> str:
        """Normalize category names to match database enum"""
        if not category:
            return 'GENERAL'
            
        # Get valid categories from database
        valid_categories = set(self._get_valid_categories(db))
        
        # Category mapping for common variations
        category_map = {
            'EUA': 'EUA',
            'EUA2': 'EUA2', 
            'GOO': 'GOO',
            'GEO': 'GEO',
            'VCM': 'VOLUNTARY_MARKETS',
            'VOLUNTARY_MARKETS': 'VOLUNTARY_MARKETS',
            'VOLUNTARY MARKETS': 'VOLUNTARY_MARKETS',
            'VOLUNTARY': 'VOLUNTARY_MARKETS',
            'CARBON MARKETS': 'VOLUNTARY_MARKETS',
            'CARBON': 'EUA',
            'EMISSIONS': 'EUA',
            'CBAM': 'CBAM',
            'BIOFUELS': 'BIOFUELS',
            'BIOFUEL': 'BIOFUELS',
            'BIO-FUELS': 'BIOFUELS',
            'BIODIESEL': 'BIOFUELS',
            'ETHANOL': 'BIOFUELS',
            'GREEN ENERGY': 'GENERAL',
            'RENEWABLE': 'GENERAL',
            'RENEWABLES': 'GENERAL',
            'SOLAR': 'GENERAL',
            'WIND': 'GENERAL',
            'HYDRO': 'GENERAL',
            'NUCLEAR': 'GENERAL',
            'GENERAL': 'GENERAL',
            'NEWS': 'GENERAL',
            'MARKET': 'GENERAL',
            'POLICY': 'GENERAL',
            'REGULATION': 'GENERAL'
        }
        
        normalized = category.upper().strip()
        mapped_category = category_map.get(normalized, 'GENERAL')
        
        # Double-check that the mapped category is valid
        return mapped_category if mapped_category in valid_categories else 'GENERAL'

# Global service instance
openai_service = OpenAIService() 