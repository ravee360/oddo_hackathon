from sqlalchemy import (
    Column,
    Integer,
    Float,
    DateTime,
    ForeignKey
)

from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base


class FuelLog(Base):
    __tablename__ = "fuel_logs"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    trip_id = Column(
        Integer,
        ForeignKey("trips.id"),
        nullable=True
    )

    liters = Column(
        Float,
        nullable=False
    )

    cost = Column(
        Float,
        nullable=False
    )

    fuel_date = Column(
        DateTime,
        default=datetime.utcnow
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id")
    )

    vehicle = relationship("Vehicle")
    trip = relationship("Trip")
    creator = relationship("User")