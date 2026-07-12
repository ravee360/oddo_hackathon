from sqlalchemy import (
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    Enum
)

from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.enums.trip_status import TripStatus


class Trip(Base):
    __tablename__ = "trips"

    id = Column(
        Integer,
        primary_key=True,
        index=True
    )

    source_location = Column(
        String,
        nullable=False
    )

    destination_location = Column(
        String,
        nullable=False
    )

    vehicle_id = Column(
        Integer,
        ForeignKey("vehicles.id"),
        nullable=False
    )

    driver_id = Column(
        Integer,
        ForeignKey("drivers.id"),
        nullable=False
    )

    cargo_weight = Column(
        Float,
        nullable=False
    )

    planned_distance = Column(
        Float,
        nullable=False
    )

    actual_distance = Column(
        Float,
        nullable=True
    )

    status = Column(
        Enum(TripStatus),
        default=TripStatus.DRAFT
    )

    dispatch_time = Column(
        DateTime,
        nullable=True
    )

    completion_time = Column(
        DateTime,
        nullable=True
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id")
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow
    )

    vehicle = relationship("Vehicle")
    driver = relationship("Driver")
    creator = relationship("User")