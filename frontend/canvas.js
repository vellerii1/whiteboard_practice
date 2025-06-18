const ROOM_ID = "room_3533";
const API = "http://127.0.0.1:8000";

// Отримання елементів canvas та контексту
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
let originalImage = null;
let filterApplied = false;
let undoStack = [];
let redoStack = [];

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

// Збереження зображення в localStorage
function saveImageToLocalStorage() {
    try {
        const imageData = canvas.toDataURL('image/png');
        localStorage.setItem('savedCanvas', imageData);
        console.log('Зображення збережено в localStorage');
    } catch (error) {
        console.error('Помилка при збереженні зображення:', error);
    }
}

// Збереження стану canvas
function saveState() {
    undoStack.push(canvas.toDataURL());
    redoStack.length = 0;
    saveImageToLocalStorage();
}

// Завантаження зображення з localStorage
function loadImageFromLocalStorage() {
    try {
        const savedCanvas = localStorage.getItem('savedCanvas');
        if (savedCanvas) {
            const img = new Image();
            img.onload = function() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);

                if (undoStack.length === 0) {
                    undoStack.push(canvas.toDataURL());
                }
            };
            img.src = savedCanvas;
        } else {
            console.log('Збережене зображення не знайдено, ініціалізація порожнього канвасу');
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            saveState();
        }
    } catch (error) {
        console.error('Помилка при завантаженні зображення:', error);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
}

// Відновлення стану canvas з збереженого зображення
function restoreState(state) {
    const img = new Image();
    img.onload = function() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
    };
    img.src = state;
}

//Undo/Redo функції
function undo() {
    if (undoStack.length > 1) {
        const currentState = undoStack.pop();
        redoStack.push(currentState);
        const previousState = undoStack[undoStack.length - 1];
        restoreState(previousState);

        localStorage.setItem('savedCanvas', previousState);

        try {
            localStorage.setItem('undoStack', JSON.stringify(undoStack));
            localStorage.setItem('redoStack', JSON.stringify(redoStack));
        } catch (e) {
            console.error("Не вдалося зберегти стеки в localStorage:", e);
        }
    } else {
        alert("Немає дій для відміни!");
    }
}

function redo() {
    if (redoStack.length > 0) {
        const nextState = redoStack.pop();
        undoStack.push(nextState);
        restoreState(nextState);

        localStorage.setItem('savedCanvas', nextState);

        try {
            localStorage.setItem('undoStack', JSON.stringify(undoStack));
            localStorage.setItem('redoStack', JSON.stringify(redoStack));
        } catch (e) {
            console.error("Не вдалося зберегти стеки в localStorage:", e);
        }
    } else {
        alert("Немає дій для повторення!");
    }
}

document.getElementById("undo").addEventListener("click", undo);
document.getElementById("redo").addEventListener("click", redo);

// Обробка комбінацій клавіш для Undo/Redo
document.addEventListener('keydown', function(event) {
    if (event.ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        undo();
    }

    if ((event.ctrlKey && event.shiftKey && event.key === 'z') ||
        (event.ctrlKey && event.key === 'y')) {
        event.preventDefault();
        redo();
    }
});

// Збереження зображення перед застосуванням фільтру
function saveBeforeFilterImage() {
    beforeFilterImage = canvas.toDataURL();

    if (!filterApplied) {
        originalImage = beforeFilterImage;
        filterApplied = true;
    }

    localStorage.setItem('beforeFilterImage', beforeFilterImage);
    localStorage.setItem('originalImage', originalImage);
    localStorage.setItem('filterApplied', filterApplied.toString());
}

// Обробка кнопки "Оновити" для видалення фільтрів
document.getElementById("refresh").addEventListener("click", function() {
    if (!beforeFilterImage) {
        alert("Немає фільтрів для видалення!");
        return;
    }

    const choice = confirm(
        "Виберіть дію:\n" +
        "OK - Видалити останній застосований фільтр\n" +
        "Скасувати - Видалити всі застосовані фільтри"
    );

    if (choice) {
        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            if (typeof saveState === 'function') {
                saveState();
            }
        };
        img.src = beforeFilterImage;
    } else {
        if (!originalImage) {
            alert("Немає оригінального зображення для відновлення!");
            return;
        }

        const img = new Image();
        img.onload = function() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);

            filterApplied = false;
            beforeFilterImage = null;

            localStorage.setItem('filterApplied', 'false');
            localStorage.removeItem('beforeFilterImage');

            if (typeof saveState === 'function') {
                saveState();
            }
        };
        img.src = originalImage;
    }
});

// Функція для застосування фільтру
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
        return true;
    } catch (error) {
        console.error("Error applying filter:", error);
        return false;
    }
}

// Обробка подій для малювання на canvas
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

// Завершення малювання на canvas
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

    saveState();
});

// Обробка кнопки "Очистити малюнок"
document.getElementById("clear-draw").addEventListener("click", () => {
    const confirmClear = confirm("Очистити малюнок?");
    if (confirmClear) {
        clearCanvas();
        saveState();
    }
});

// Обробка кнопки "Застосувати фільтр"
document.getElementById("apply-filter").addEventListener("click", async () => {
    saveBeforeFilterImage();
    await applyFilter();
    saveState();
});

// Функція для очищення canvas
function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Обробка кнопки "Зберегти зображення"
document.getElementById("save-image").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = `whiteboard_${Date.now()}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
});

// Ініціалізація canvas
function initializeCanvas() {
    console.log('Ініціалізація canvas');
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    loadImageFromLocalStorage();
}

// Завантаження станів фільтрів з localStorage
function loadFilterStates() {
    const savedBeforeFilter = localStorage.getItem('beforeFilterImage');
    const savedOriginal = localStorage.getItem('originalImage');
    const savedFilterApplied = localStorage.getItem('filterApplied');

    if (savedBeforeFilter) {
        beforeFilterImage = savedBeforeFilter;
    }

    if (savedOriginal) {
        originalImage = savedOriginal;
    }

    if (savedFilterApplied) {
        filterApplied = savedFilterApplied === 'true';
    }
}

// Додати обробник події для завантаження сторінки
window.addEventListener('load', function() {
    console.log('Сторінка завантажена');
    initializeCanvas();
    loadFilterStates();
});

// Функції для малювання різних фігур
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

// Додати обробник події для переміщення миші на canvas
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

// Завантаження стеків undo/redo з localStorage
function loadStacksFromLocalStorage() {
    try {
        const savedUndoStack = localStorage.getItem('undoStack');
        const savedRedoStack = localStorage.getItem('redoStack');

        if (savedUndoStack) {
            undoStack = JSON.parse(savedUndoStack);
            console.log('Завантажено undoStack з', undoStack.length, 'елементами');
        }

        if (savedRedoStack) {
            redoStack = JSON.parse(savedRedoStack);
            console.log('Завантажено redoStack з', redoStack.length, 'елементами');
        }
    } catch (e) {
        console.error("Помилка при завантаженні стеків з localStorage:", e);
    }
}

window.addEventListener('load', function() {
    loadStacksFromLocalStorage();

    if (undoStack.length === 0) {
        undoStack.push(canvas.toDataURL());
    }
});