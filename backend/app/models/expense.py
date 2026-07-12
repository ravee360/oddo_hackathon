from sqlalchemy import (
    Column,
    Integer,
    Float,
    String,
    DateTime,
    ForeignKey,
    Enum
)

from sqlalchemy.orm import relationship
from datetime import datetime

from app.core.database import Base
from app.enums.expense_type import ExpenseType


class Expense(Base):
    __tablename__ = "expenses"

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

    expense_type = Column(
        Enum(ExpenseType),
        nullable=False
    )

    description = Column(
        String,
        nullable=True
    )

    amount = Column(
        Float,
        nullable=False
    )

    expense_date = Column(
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