from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.subscription import Subscription
from app.schemas.subscription import SubscriptionCreate, SubscriptionUpdate

class CRUDSubscription:
    def get(self, db: Session, *, id: int) -> Optional[Subscription]:
        return db.query(Subscription).filter(Subscription.id == id).first()

    def get_by_name(self, db: Session, *, name: str) -> Optional[Subscription]:
        return db.query(Subscription).filter(Subscription.name == name).first()

    def get_multi(self, db: Session, *, skip: int = 0, limit: int = 100) -> List[Subscription]:
        return db.query(Subscription).offset(skip).limit(limit).all()

    def get_active(self, db: Session) -> List[Subscription]:
        return db.query(Subscription).filter(Subscription.is_active == True).all()

    def create(self, db: Session, *, obj_in: SubscriptionCreate) -> Subscription:
        db_obj = Subscription(
            name=obj_in.name,
            display_name=obj_in.display_name,
            description=obj_in.description,
            price=obj_in.price,
            duration_days=obj_in.duration_days,
            is_active=obj_in.is_active,
            features=obj_in.features,
            max_concurrent_users=obj_in.max_concurrent_users,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: Subscription, obj_in: SubscriptionUpdate) -> Subscription:
        if obj_in.name is not None:
            db_obj.name = obj_in.name
        if obj_in.display_name is not None:
            db_obj.display_name = obj_in.display_name
        if obj_in.description is not None:
            db_obj.description = obj_in.description
        if obj_in.price is not None:
            db_obj.price = obj_in.price
        if obj_in.duration_days is not None:
            db_obj.duration_days = obj_in.duration_days
        if obj_in.is_active is not None:
            db_obj.is_active = obj_in.is_active
        if obj_in.features is not None:
            db_obj.features = obj_in.features
        if obj_in.max_concurrent_users is not None:
            db_obj.max_concurrent_users = obj_in.max_concurrent_users
        
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove(self, db: Session, *, id: int) -> Subscription:
        obj = db.query(Subscription).get(id)
        db.delete(obj)
        db.commit()
        return obj

subscription = CRUDSubscription() 