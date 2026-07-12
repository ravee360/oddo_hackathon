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
from app.enums.maintenance_status import MaintenanceStatus


class MaintenanceLog(Base):
    __tablename__ = "maintenance_logs"

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

    issue_description = Column(
        String,
        nullable=False
    )

    maintenance_type = Column(
        String,
        nullable=False
    )

    estimated_cost = Column(
        Float,
        nullable=True
    )

    actual_cost = Column(
        Float,
        nullable=True
    )

    start_date = Column(
        DateTime,
        default=datetime.utcnow
    )

    end_date = Column(
        DateTime,
        nullable=True
    )

    status = Column(
        Enum(MaintenanceStatus),
        default=MaintenanceStatus.OPEN
    )

    created_by = Column(
        Integer,
        ForeignKey("users.id")
    )

    vehicle = relationship("Vehicle")
    creator = relationship("User")