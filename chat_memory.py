import json
import os
import threading
from datetime import datetime

MEMORY_FILE = os.path.join(os.path.dirname(__file__), 'chat_memory.json')
LOCK = threading.Lock()
MAX_MESSAGES = 4  # keep last 4 messages (user/assistant entries)


def _load_all():
    if not os.path.exists(MEMORY_FILE):
        return {}
    try:
        with open(MEMORY_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}


def _save_all(data):
    tmp = MEMORY_FILE + '.tmp'
    with open(tmp, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    os.replace(tmp, MEMORY_FILE)


def get_messages(user_id: str):
    """Return list of messages for a user as [{'role':..., 'content':...}, ...]
    Most recent messages are at the end of the list.
    """
    with LOCK:
        data = _load_all()
        return data.get(user_id, [])


def add_message(user_id: str, role: str, content: str):
    """Append a message and trim to last MAX_MESSAGES entries."""
    with LOCK:
        data = _load_all()
        messages = data.get(user_id, [])
        messages.append({
            'role': role,
            'content': content,
            'time': datetime.utcnow().isoformat() + 'Z'
        })
        # keep only last MAX_MESSAGES messages
        if len(messages) > MAX_MESSAGES:
            messages = messages[-MAX_MESSAGES:]
        data[user_id] = messages
        _save_all(data)


def clear_user(user_id: str):
    with LOCK:
        data = _load_all()
        if user_id in data:
            del data[user_id]
            _save_all(data)


if __name__ == '__main__':
    print('Memory file:', MEMORY_FILE)
    print('Current contents:', _load_all())
