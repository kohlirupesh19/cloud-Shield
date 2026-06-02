from collections import defaultdict
from typing import Dict
try:
    from langchain.memory import ConversationBufferMemory
except Exception:  # fallback if langchain not importable in some envs
    ConversationBufferMemory = None  # type: ignore


class ConversationMemory:
    """Thin wrapper around LangChain ConversationBufferMemory (or dict fallback).
    Persists per session_id so 'ConversationBufferMemory' claim is accurate.
    """

    def __init__(self):
        self._memories: Dict[str, "ConversationBufferMemory"] = {}
        self._fallbacks: Dict[str, list] = defaultdict(list)

    def _get_mem(self, session_id: str):
        if ConversationBufferMemory is None:
            return None
        if session_id not in self._memories:
            mem = ConversationBufferMemory(return_messages=True, memory_key="history")
            self._memories[session_id] = mem
        return self._memories[session_id]

    def add(self, session_id: str, message: str):
        mem = self._get_mem(session_id)
        if mem is None:
            self._fallbacks[session_id].append(message)
            return
        # treat as user turn for chat
        mem.chat_memory.add_user_message(message)

    def get(self, session_id: str):
        mem = self._get_mem(session_id)
        if mem is None:
            return self._fallbacks.get(session_id, [])
        # return list of str for compat with old (or full messages)
        try:
            msgs = mem.chat_memory.messages
            return [f"{m.type}: {m.content}" for m in msgs]
        except Exception:
            return []

    def get_buffer(self, session_id: str) -> str:
        mem = self._get_mem(session_id)
        if mem is None:
            return "\n".join(self._fallbacks.get(session_id, []))
        try:
            return mem.buffer  # str summary
        except Exception:
            return ""

    def clear(self):
        self._memories.clear()
        self._fallbacks.clear()


memory_store = ConversationMemory()
