import json
import redis
from app.utils.config import settings


redis_client = redis.Redis.from_url(settings.redis_url, decode_responses=True)


def cache_get(key: str):
    raw = redis_client.get(key)
    return json.loads(raw) if raw else None


def cache_set(key: str, value, ttl: int = 900):
    redis_client.setex(key, ttl, json.dumps(value, default=str))


def cache_clear(prefix: str = "workflow:"):
    keys = list(redis_client.scan_iter(match=f"{prefix}*") )
    if keys:
        redis_client.delete(*keys)
