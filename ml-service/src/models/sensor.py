from sqlalchemy import Column, Integer, String, Float, DateTime
from . import Base
import datetime

class SensorReading(Base):
    __tablename__ = "sensor_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(String, index=True)
    value = Column(Float)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
    location = Column(String)