const ROOM_ID = "room_3533";
const API = "http://localhost:8000";

const canvas = document.getElementById('board');
const ctx = canvas.getContext('2d');

let tool = "brush";
let drawing = false;
let color = "#000000";
let brushSize = 5;
let textSize = 16;
let startX = 0;
let startY = 0;
let beforeFilterImage = null;
const undoStack = [];
const redoStack = [];

let snapshotBeforeShape = null;

const FILTERS = ['blur', 'invert', 'grayscale', 'duotone', 'posterize', 'mirror']
const filterSelect = document.getElementById("filter-select");
FILTERS.forEach(filter => {
    const option = document.createElement("option");
    option.value = filter;
    option.textContent = filter.charAt(0).toUpperCase() + filter.slice(1);
    filterSelect.appendChild(option);
});

const toolSelect = document.getElementById("tool-select");
toolSelect.addEventListener("change", (e) => {
    tool = e.target.value;
});

const colorPicker = document.getElementById("color-picker");
colorPicker.addEventListener('input', (e) => {
    color = e.target.value;
});

const brushSizeInput = document.getElementById("brush-size");
brushSizeInput.addEventListener('input', (e) => {
    brushSize = e.target.value;
});

const textSizeInput = document.getElementById("text-size");
if (textSizeInput) {
    textSizeInput.addEventListener("input", (e) => {
        textSize = e.target.value;
    });
}

function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack.length = 0;
}

function restoreState(state) {
    const img = new Image();
    img.src = state;
    img.onload = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
}

function undo() {
    if (undoStack.length > 1) {
        const currentState = undoStack.pop();
        redoStack.push(currentState);
        const previousState = undoStack[undoStack.length - 1];
        restoreState(previousState);
    } else {
        alert("Немає дій для відміни!");
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        restoreState(nextState);
    } else {
        alert("Немає дій для повернення!");
    }
}

document.getElementById("undo").addEventListener("click", undo);
document.getElementById("redo").addEventListener("click", redo);
window.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
    } else if (e.ctrlKey && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
    }
});

function saveBeforeFilterImage() {
    beforeFilterImage = canvas.toDataURL();
}

function restoreBeforeFilterImage() {
    if (!beforeFilterImage) {
        alert("Немає зображення для оновлення!");
        return;
    }
    restoreState(beforeFilterImage);
}

document.getElementById("refresh").addEventListener("click", restoreBeforeFilterImage);

async function applyFilter() {
    const { width, height } = canvas;

    ctx.save();
    ctx.globalCompositeOperation = "destination-over";
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.restore();

    const imgData = ctx.getImageData(0, 0, width, height);
    const dataArray = Array.from(imgData.data);

    const filterName = filterSelect.value;
    try {
        const res = await fetch(`${API}/filter/${ROOM_ID}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                image_data: dataArray,
                filter_name: filterName,
                width,
                height,
            }),
        });
        if (!res.ok) {
            throw new Error(`Error applying filter: ${res.status}`);
        }
        const json = await res.json();
        const newData = new Uint8ClampedArray(json.image_data);
        ctx.putImageData(new ImageData(newData, width, height), 0, 0);
    } catch (error) {
        console.error("Error applying filter:", error);
    }
}

document.getElementById("apply-filter").addEventListener("click", () => {
    saveBeforeFilterImage();
    applyFilter();
});

function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}
document.getElementById("clear-draw").addEventListener("click", () => {
    const confirmClear = confirm("Очистити малюнок?");
    if (confirmClear) {
        clearCanvas();
        saveState();
    }
});

document.getElementById("save-image").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `whiteboard_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});

function initializeCanvas() {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    saveState();
}

initializeCanvas();

function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}

function drawRectangle(x1, y1, x2, y2) {
    const width  = x2 - x1;
    const height = y2 - y1;
    ctx.strokeRect(x1, y1, width, height);
}

function drawCircle(x1, y1, x2, y2) {
    const radius = Math.hypot(x2 - x1, y2 - y1);
    ctx.beginPath();
    ctx.arc(x1, y1, radius, 0, Math.PI * 2);
    ctx.stroke();
}

canvas.addEventListener("mousedown", (e) => {
    saveState();
    drawing = true;

    startX = e.offsetX;
    startY = e.offsetY;

    snapshotBeforeShape = ctx.getImageData(0, 0, canvas.width, canvas.height);

    if (tool === "brush" || tool === "eraser") {
        ctx.beginPath();
        ctx.moveTo(startX, startY);
    }
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;

    const currX = e.offsetX;
    const currY = e.offsetY;

    if (tool === "brush" || tool === "eraser") {
        ctx.lineWidth = brushSize;
        ctx.lineCap = "round";
        ctx.strokeStyle = (tool === "eraser") ? "#ffffff" : color;

        ctx.lineTo(currX, currY);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(currX, currY);
    }
    else if (tool === "line" || tool === "rectangle" || tool === "circle" || tool === "text") {
        ctx.putImageData(snapshotBeforeShape, 0, 0);

        if (tool === "text") {
            ctx.strokeStyle = "#444";
            ctx.lineWidth = 1;
            ctx.strokeRect(startX, startY, currX - startX, currY - startY);
        }
        else if (tool === "line") {
            drawLine(startX, startY, currX, currY);
        }
        else if (tool === "rectangle") {
            drawRectangle(startX, startY, currX, currY);
        }
        else if (tool === "circle") {
            drawCircle(startX, startY, currX, currY);
        }
    }
});

canvas.addEventListener("mouseup", (e) => {
    if (!drawing) return;
    drawing = false;

    const endX = e.offsetX;
    const endY = e.offsetY;

    if (tool === "line") {
        drawLine(startX, startY, endX, endY);
    }
    else if (tool === "rectangle") {
        drawRectangle(startX, startY, endX, endY);
    }
    else if (tool === "circle") {
        drawCircle(startX, startY, endX, endY);
    }
    else if (tool === "text") {
        ctx.putImageData(snapshotBeforeShape, 0, 0);

        const userText = prompt("Введіть текст:");
        if (userText && userText.trim() !== "") {
            const rectW = endX - startX;
            const rectH = endY - startY;

            ctx.font = `${textSize}px Arial`;
            ctx.fillStyle = color;

            ctx.fillText(userText, startX, startY + parseInt(textSize, 10));
        }
    }

    ctx.beginPath();
    snapshotBeforeShape = null;
});