from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from .database import engine, Base as DBBase
from .models import sensor, document  # Import to register models
from .routes import anomalies, rag

app = FastAPI(
    title="AzVirt ML Service",
    description="Python microservice for Anomaly Detection and forecasting",
    version="1.0.0"
)

# Create database tables
DBBase.metadata.create_all(bind=engine)

# Include routers
app.include_router(anomalies.router)
app.include_router(rag.router)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class HealthResponse(BaseModel):
    status: str
    message: str

@app.get("/health", response_model=HealthResponse)
async def health_check():
    return {"status": "ok", "message": "ML Service is healthy."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
