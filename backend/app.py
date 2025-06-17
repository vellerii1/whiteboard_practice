from fastapi import FastAPI, HTTPException
from config import ROOM_ID, FILTERS
from fastapi.middleware.cors import CORSMiddleware
from filter import apply_filter_cpp


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:8001"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_store = []
@app.get("/")
def root():
    return {"message": "Welcome to the drawing API"}

@app.post("/draw/{room_id}")
def draw(room_id: str, command: dict):
    if room_id != ROOM_ID:
        raise HTTPException(status_code=404, detail="Room not found")
    _store.append(command)
    return {"status": "ok"}

@app.get("/draw/{room_id}")
def get_draw(room_id: str):
    if room_id != ROOM_ID:
        raise HTTPException(status_code=404, detail="Room not found")
    return _store

@app.post("/filter/{room_id}")
def filter_image(room_id: str, payload: dict):
    if room_id != ROOM_ID:
        raise HTTPException(status_code=404, detail="Room not found")
    data = payload["image_data"]
    width = payload["width"]
    height = payload["height"]
    filter_name = payload["filter_name"]

    filtered = apply_filter_cpp(data, width, height, filter_name)
    return {"image_data": filtered}

@app.delete("/draw/{room_id}")
def clear_draw(room_id: str):
    global _store
    if room_id != ROOM_ID:
        raise HTTPException(status_code=404, detail="Room not found")
    _store = []
    return {"status": "ok", "message": f"All commands for room {room_id} have been cleared"}
