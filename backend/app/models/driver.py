from sqlalchemy import Column, Integer, String, Date, DateTime, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.enums.driver_status import DriverStatus


class Driver(Base):
    __tablename__ = "drivers"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
        unique=True
    )

    license_number = Column(
        String,
        unique=True,
        nullable=False
    )

    license_category = Column(
        String,
        nullable=False
    )

    license_expiry_date = Column(
        Date,
        nullable=False
    )

    safety_score = Column(
        Integer,
        default=100
    )

    status = Column(
        Enum(DriverStatus),
        default=DriverStatus.AVAILABLE
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    user = relationship("User")