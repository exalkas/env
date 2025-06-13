from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from app.db.base_class import Base

class NewsCategory(Base):
    __tablename__ = "news_categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True, index=True)
    display_name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(Integer, nullable=True)  # Admin user ID who created the category 

    # Many-to-many relationship with news
    news_associations = relationship("NewsCategoryAssociation", back_populates="category", cascade="all, delete-orphan")
    
    @property
    def news_items(self):
        """Get all news items in this category"""
        return [assoc.news for assoc in self.news_associations] 