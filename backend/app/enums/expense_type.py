from enum import Enum

class ExpenseType(str, Enum):
    FUEL = "fuel"
    TOLL = "toll"
    MAINTENANCE = "maintenance"
    REPAIR = "repair"
    OTHER = "other"