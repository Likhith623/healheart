from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routes import auth, stores, medicines, upload, customer

# Create FastAPI app
app = FastAPI(
    title="Emergency Medicine Locator API",
    description="API for finding medicines in nearby stores during emergencies",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(stores.router, prefix="/api")
app.include_router(medicines.router, prefix="/api")
app.include_router(upload.router, prefix="/api")
app.include_router(customer.router, prefix="/api")


@app.get("/")
async def root():
    return {
        "message": "Emergency Medicine Locator API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "healthy"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "Emergency Medicine Locator"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug
    )
