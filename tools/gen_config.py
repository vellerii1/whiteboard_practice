import hashlib

def generate_config():
    with open('../student_id.txt', encoding='utf-8') as f:
        sid = f.read().strip()
    h = int(hashlib.sha256(sid.encode()).hexdigest(), 16)
    room_id = f"room_{h % 10000}"
    filters = ["blur", "invert", "edge_detect", "emboss"]
    selected = [filters[i % len(filters)] for i in range(h % len(filters) + 1)]
    with open('config.py', 'w', encoding='utf-8') as f:
        f.write(f'ROOM_ID = "{room_id}"\n')
        f.write(f'FILTERS = {selected}\n')
        f.write('THEME = "light"\n')

if __name__ == "__main__":
    generate_config()
