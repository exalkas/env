from datetime import datetime
from typing import Optional
from pydantic import BaseModel

# Shared properties
class RoleBase(BaseModel):
    name: str
    display_name: str
    description: Optional[str] = None
    level: int
    is_active: bool = True

# Properties to receive via API on creation
class RoleCreate(RoleBase):
    pass

# Properties to receive via API on update
class RoleUpdate(BaseModel):
    name: Optional[str] = None
    display_name: Optional[str] = None
    description: Optional[str] = None
    level: Optional[int] = None
    is_active: Optional[bool] = None

# Properties shared by models stored in DB
class RoleInDBBase(RoleBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# Properties to return via API
class Role(RoleInDBBase):
    pass

# Properties stored in DB
class RoleInDB(RoleInDBBase):
    pass 