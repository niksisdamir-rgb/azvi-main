from fastapi import APIRouter, Depends
from pydantic import BaseModel
from ..database import get_db
from ..services.sensor_service import SensorService

router = APIRouter(prefix="/api/anomalies", tags=["anomalies"])

class AnomalyRequest(BaseModel):
    sensor_id: str
    contamination: float = 0.1

@router.post("/detect")
async def detect_anomalies(request: AnomalyRequest, db = Depends(get_db)):
    service = SensorService(db)
    anomalies = service.detect_anomalies(request.sensor_id, request.contamination)

    return {
        "status": "success",
        "anomalies": anomalies,
        "message": f"Anomaly detection completed for sensor {request.sensor_id}"
    }
