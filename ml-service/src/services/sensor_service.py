from sqlalchemy.orm import Session
from ..models.sensor import SensorReading
from typing import List, Optional
import pandas as pd
from sklearn.ensemble import IsolationForest
from sklearn.preprocessing import StandardScaler

class SensorService:
    def __init__(self, db: Session):
        self.db = db

    def create_reading(self, sensor_id: str, value: float, location: str) -> SensorReading:
        reading = SensorReading(sensor_id=sensor_id, value=value, location=location)
        self.db.add(reading)
        self.db.commit()
        self.db.refresh(reading)
        return reading

    def get_readings_by_sensor(self, sensor_id: str) -> List[SensorReading]:
        return self.db.query(SensorReading).filter(SensorReading.sensor_id == sensor_id).all()

    def get_all_readings(self) -> List[SensorReading]:
        return self.db.query(SensorReading).all()

    def get_readings_as_dataframe(self, sensor_id: Optional[str] = None) -> pd.DataFrame:
        query = self.db.query(SensorReading)
        if sensor_id:
            query = query.filter(SensorReading.sensor_id == sensor_id)
        readings = query.all()
        return pd.DataFrame([{
            'id': r.id,
            'sensor_id': r.sensor_id,
            'value': r.value,
            'timestamp': r.timestamp,
            'location': r.location
        } for r in readings])

    def detect_anomalies(self, sensor_id: str, contamination: float = 0.1) -> List[dict]:
        df = self.get_readings_as_dataframe(sensor_id)
        if df.empty:
            return []

        # Prepare data for anomaly detection
        data = df[['value']].values
        scaler = StandardScaler()
        data_scaled = scaler.fit_transform(data)

        # Isolation Forest for anomaly detection
        clf = IsolationForest(contamination=contamination, random_state=42)
        predictions = clf.fit_predict(data_scaled)

        # Get anomalies (predictions == -1)
        anomalies = []
        for i, pred in enumerate(predictions):
            if pred == -1:
                row = df.iloc[i]
                anomalies.append({
                    'id': int(row['id']),
                    'sensor_id': row['sensor_id'],
                    'value': float(row['value']),
                    'timestamp': row['timestamp'].isoformat(),
                    'location': row['location'],
                    'anomaly_score': float(clf.decision_function([data_scaled[i]])[0])
                })

        return anomalies