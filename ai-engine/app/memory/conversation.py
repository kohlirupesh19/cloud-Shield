from collections import defaultdict
from typing import List, Dict


class ConversationMemory:
    def __init__(self):
        self._messages: Dict[str, List[str]] = defaultdict(list)

    def add(self, session_id: str, message: str):
        self._messages[session_id].append(message)

    def get(self, session_id: str) -> List[str]:
        return self._messages.get(session_id, [])

    def clear(self):
        self._messages.clear()


memory_store = ConversationMemory()
