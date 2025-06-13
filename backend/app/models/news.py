from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, Enum
from sqlalchemy.orm import relationship
import enum

from app.db.base_class import Base

class NewsCategory(enum.Enum):
    EUA = "EUA"
    EUA2 = "EUA2"
    GOO = "GOO"
    GEO = "GEO"
    VOLUNTARY_MARKETS = "VOLUNTARY_MARKETS"
    BIOFUELS = "BIOFUELS"
    GENERAL = "GENERAL"

class News(Base):
    __tablename__ = "news"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    summary = Column(Text, nullable=True)
    content = Column(Text, nullable=False)
    category = Column(String, nullable=False, index=True)  # Keep for backward compatibility - primary category
    tags = Column(String, nullable=True)  # Comma-separated tags
    author = Column(String, nullable=True)
    source_url = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    is_featured = Column(Boolean, default=False)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime, nullable=True)
    scheduled_publish_at = Column(DateTime, nullable=True)  # When to auto-publish
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, nullable=True)  # Admin user ID who created the news 

    # Many-to-many relationship with categories
    category_associations = relationship("NewsCategoryAssociation", back_populates="news", cascade="all, delete-orphan")
    
    def get_categories(self):
        """Get all categories this news belongs to"""
        return [assoc.category for assoc in self.category_associations]
    
    def get_primary_category(self):
        """Get the primary category"""
        primary_assoc = next((assoc for assoc in self.category_associations if assoc.is_primary), None)
        return primary_assoc.category if primary_assoc else None
    
    def get_additional_categories(self):
        """Get non-primary categories"""
        return [assoc.category for assoc in self.category_associations if not assoc.is_primary] 