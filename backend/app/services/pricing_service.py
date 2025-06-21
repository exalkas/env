from typing import Dict, Optional, List
from datetime import datetime, date
import requests
import asyncio
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.market import Asset
from app.models.order import Order

class PricingService:
    """Service for managing real-time pricing and markup calculations"""
    
    def __init__(self):
        self.markup_config = {
            "EUA": {"buy_markup": 0.50, "sell_markup": 0.30},  # EUR per MT
            "EUA2": {"buy_markup": 0.45, "sell_markup": 0.35},
            "GOO": {"buy_markup": 0.15, "sell_markup": 0.10},  # EUR per MWh
            "GEO": {"buy_markup": 0.12, "sell_markup": 0.08},
            "BIOFUEL": {"buy_markup": 5.0, "sell_markup": 3.0},  # EUR per MT
        }
        self.price_cache = {}
        self.cache_duration = 300  # 5 minutes
    
    async def get_live_price(self, asset_symbol: str, vintage_year: Optional[int] = None) -> Optional[float]:
        """Get live price from external provider"""
        cache_key = f"{asset_symbol}_{vintage_year or 'current'}"
        
        # Check cache first
        if cache_key in self.price_cache:
            cached_data = self.price_cache[cache_key]
            if (datetime.utcnow() - cached_data["timestamp"]).seconds < self.cache_duration:
                return cached_data["price"]
        
        # Fetch from external provider
        price = await self._fetch_external_price(asset_symbol, vintage_year)
        
        if price:
            self.price_cache[cache_key] = {
                "price": price,
                "timestamp": datetime.utcnow()
            }
        
        return price
    
    async def _fetch_external_price(self, asset_symbol: str, vintage_year: Optional[int] = None) -> Optional[float]:
        """Fetch price from external provider - implement your preferred API"""
        
        # Example implementation for different providers
        if asset_symbol.startswith("EUA"):
            return await self._fetch_eua_price(asset_symbol, vintage_year)
        elif asset_symbol in ["GOO", "GEO"]:
            return await self._fetch_certificate_price(asset_symbol)
        else:
            return await self._fetch_generic_price(asset_symbol)
    
    async def _fetch_eua_price(self, asset_symbol: str, vintage_year: Optional[int] = None) -> Optional[float]:
        """Fetch EUA price from ICE or other provider"""
        # For demo purposes, return mock prices - replace with real API
        mock_prices = {
            "EUA": 85.50,
            "EUA2": 82.30,
        }
        
        base_price = mock_prices.get(asset_symbol, 80.0)
        
        # Adjust for vintage year
        if vintage_year:
            current_year = datetime.now().year
            if vintage_year > current_year:
                base_price *= 0.98  # Future vintages slightly cheaper
        
        return base_price
    
    async def _fetch_certificate_price(self, asset_symbol: str) -> Optional[float]:
        """Fetch certificate prices (GOO, GEO)"""
        mock_prices = {
            "GOO": 1.25,  # EUR per MWh
            "GEO": 1.15,
        }
        return mock_prices.get(asset_symbol, 1.0)
    
    async def _fetch_generic_price(self, asset_symbol: str) -> Optional[float]:
        """Fetch other asset prices"""
        return 50.0  # Default mock price
    
    def calculate_indicative_price(self, 
                                   asset_symbol: str, 
                                   side: str, 
                                   market_price: float,
                                   quantity: float = 1.0) -> Dict[str, float]:
        """Calculate indicative price with markup"""
        
        markup_config = self.markup_config.get(asset_symbol, {"buy_markup": 0.25, "sell_markup": 0.15})
        
        if side.upper() == "BUY":
            # User buying from us - we add markup to market price
            markup = markup_config["buy_markup"]
            indicative_price = market_price + markup
        else:
            # User selling to us - we subtract markup from market price  
            markup = markup_config["sell_markup"]
            indicative_price = market_price - markup
        
        total_value = indicative_price * quantity
        
        return {
            "market_price": market_price,
            "markup": markup,
            "indicative_price": indicative_price,
            "total_value": total_value
        }
    
    def get_markup_config(self, asset_symbol: str) -> Dict[str, float]:
        """Get markup configuration for an asset"""
        return self.markup_config.get(asset_symbol, {"buy_markup": 0.25, "sell_markup": 0.15})
    
    def update_markup_config(self, asset_symbol: str, buy_markup: float, sell_markup: float):
        """Update markup configuration"""
        self.markup_config[asset_symbol] = {
            "buy_markup": buy_markup,
            "sell_markup": sell_markup
        }
    
    async def get_price_with_markup(self, 
                                    asset_symbol: str, 
                                    side: str,
                                    quantity: float = 1.0,
                                    vintage_year: Optional[int] = None) -> Optional[Dict[str, float]]:
        """Get live price with markup applied"""
        
        market_price = await self.get_live_price(asset_symbol, vintage_year)
        if not market_price:
            return None
        
        return self.calculate_indicative_price(asset_symbol, side, market_price, quantity)
    
    def bulk_update_prices(self, price_updates: List[Dict]) -> Dict[str, bool]:
        """Bulk update multiple asset prices"""
        results = {}
        
        for update in price_updates:
            asset_symbol = update.get("asset_symbol")
            price = update.get("price")
            vintage_year = update.get("vintage_year")
            
            if asset_symbol and price:
                cache_key = f"{asset_symbol}_{vintage_year or 'current'}"
                self.price_cache[cache_key] = {
                    "price": price,
                    "timestamp": datetime.utcnow()
                }
                results[asset_symbol] = True
            else:
                results[asset_symbol] = False
        
        return results
    
    def get_market_summary(self) -> Dict[str, Dict]:
        """Get market summary with current prices"""
        summary = {}
        
        for asset_symbol in self.markup_config.keys():
            cache_key = f"{asset_symbol}_current"
            if cache_key in self.price_cache:
                cached_data = self.price_cache[cache_key]
                age_seconds = (datetime.utcnow() - cached_data["timestamp"]).seconds
                
                summary[asset_symbol] = {
                    "market_price": cached_data["price"],
                    "markup_config": self.markup_config[asset_symbol],
                    "last_updated": cached_data["timestamp"],
                    "age_seconds": age_seconds,
                    "is_stale": age_seconds > self.cache_duration
                }
        
        return summary

# Global pricing service instance
pricing_service = PricingService() 