import os
import json
import uuid
import socket

CONFIG_FILE = os.path.join(os.path.dirname(__file__), "client_config.json")

# Default values (development)
DEFAULT_API_URL = "http://localhost:8000/api/events"
DEFAULT_HEARTBEAT_INTERVAL = 30


def load_config():
    """Load configuration from client_config.json"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, "r") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            pass
    return {}


# Load configuration
_config = load_config()
API_URL = _config.get("apiUrl", DEFAULT_API_URL)
HEARTBEAT_INTERVAL = _config.get("heartbeatInterval", DEFAULT_HEARTBEAT_INTERVAL)


def get_pc_id():
    """Get PC identifier (hostname)"""
    return socket.gethostname()


def get_or_create_uuid():
    """Get existing UUID or create and persist a new one"""
    config = load_config()

    if "clientUuid" in config:
        return config["clientUuid"]

    # Generate new UUID
    new_uuid = str(uuid.uuid4())

    # Save to config file (preserve existing config)
    config["clientUuid"] = new_uuid
    with open(CONFIG_FILE, "w") as f:
        json.dump(config, f, indent=2)

    return new_uuid
