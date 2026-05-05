"""Async MongoDB client using Motor."""

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from app.core.config import get_settings

settings = get_settings()

_client: AsyncIOMotorClient | None = None
_db: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    """Create the Motor client and connect to MongoDB Atlas."""
    global _client, _db
    _client = AsyncIOMotorClient(settings.MONGODB_URI)
    _db = _client[settings.MONGODB_DB_NAME]

    # Create indexes
    await _db.users.create_index("email", unique=True)
    await _db.invoices.create_index([("user_id", 1), ("created_at", -1)])
    await _db.invoices.create_index(
        [("user_id", 1), ("gstin_supplier", 1), ("invoice_number", 1)],
        unique=True,
        sparse=True,
    )
    await _db.gst_records.create_index([("user_id", 1), ("gstin", 1)])
    await _db.gst_records.create_index(
        [("user_id", 1), ("gstin", 1), ("invoice_number", 1)]
    )
    await _db.reconciliation_results.create_index([("user_id", 1), ("run_id", 1)])
    await _db.reconciliation_runs.create_index([("user_id", 1), ("run_date", -1)])
    await _db.ai_queries.create_index([("user_id", 1), ("created_at", -1)])
    await _db.token_blocklist.create_index("token", unique=True)
    await _db.token_blocklist.create_index(
        "expires_at", expireAfterSeconds=0
    )

    print(f"[OK] Connected to MongoDB: {settings.MONGODB_DB_NAME}")


async def close_mongo_connection() -> None:
    """Close the Motor client."""
    global _client
    if _client:
        _client.close()
        print("[OK] MongoDB connection closed")


def get_database() -> AsyncIOMotorDatabase:
    """Return the database instance."""
    if _db is None:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return _db
