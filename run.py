#!/usr/bin/env python
import os
import sys
import subprocess
import webbrowser
import time
import platform


def setup_project():
    print("Налаштування проекту Whiteboard...")

    if not os.path.exists(".venv"):
        print("Створення віртуального середовища...")
        subprocess.run([sys.executable, "-m", "venv", ".venv"])

    if platform.system() == "Windows":
        python_path = os.path.join(os.getcwd(), ".venv", "Scripts", "python.exe")
        pip_path = os.path.join(os.getcwd(), ".venv", "Scripts", "pip.exe")
    else:
        python_path = os.path.join(os.getcwd(), ".venv", "bin", "python")
        pip_path = os.path.join(os.getcwd(), ".venv", "bin", "pip")

    print("Встановлення залежностей...")
    with open("requirements.txt", "r") as f:
        requirements = f.readlines()

    with open("temp_requirements.txt", "w") as f:
        for req in requirements:
            if not "cpp_module" in req:
                f.write(req)

    subprocess.run([pip_path, "install", "-r", "temp_requirements.txt"])

    if os.path.exists("temp_requirements.txt"):
        os.remove("temp_requirements.txt")

    print("Налаштування завершено!")


def run_backend():
    print("Запуск сервера FastAPI...")
    if platform.system() == "Windows":
        python_path = os.path.join(os.getcwd(), ".venv", "Scripts", "python.exe")
    else:
        python_path = os.path.join(os.getcwd(), ".venv", "bin", "python")

    return subprocess.Popen(
        [python_path, "-m", "uvicorn", "backend.app:app", "--host", "127.0.0.1", "--port", "8000"]
    )


def run_frontend():
    print("Відкриття фронтенду в браузері...")
    frontend_path = os.path.join("frontend", "index.html")
    if os.path.exists(frontend_path):
        frontend_url = "file://" + os.path.abspath(frontend_path)
        webbrowser.open(frontend_url)
    else:
        print(f"Помилка: Файл {frontend_path} не знайдений!")


if __name__ == "__main__":
    setup_project()

    backend_process = run_backend()
    time.sleep(2)
    run_frontend()

    try:
        print("Додаток запущено. Натисніть Ctrl+C для завершення...")
        backend_process.wait()
    except KeyboardInterrupt:
        print("Завершення роботи...")
        backend_process.terminate()
        sys.exit(0)