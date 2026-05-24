from fastapi import FastAPI
from app.api.routes import router as ai_router
from app.utils.config import settings

app = FastAPI(title=settings.app_name, version="1.0.0")
app.include_router(ai_router)


@app.get("/")
async def root():
    return {"service": settings.app_name, "status": "running"}
