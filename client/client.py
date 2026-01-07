"""
L2pControl Client - Standalone runner for testing
Run this script directly to test the client without installing as a Windows service.
"""

import time
import signal
import sys
from datetime import datetime, timezone
import requests

from config import API_URL, HEARTBEAT_INTERVAL, get_pc_id, get_or_create_uuid


class L2pClient:
    def __init__(self):
        self.pc_id = get_pc_id()
        self.client_uuid = get_or_create_uuid()
        self.running = True

        print(f"L2pControl Client initialized")
        print(f"  PC ID: {self.pc_id}")
        print(f"  Client UUID: {self.client_uuid}")
        print(f"  API URL: {API_URL}")

    def send_event(self, event_type):
        """Send event to backend API"""
        payload = {
            "pcId": self.pc_id,
            "clientUuid": self.client_uuid,
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        try:
            response = requests.post(API_URL, json=payload, timeout=10)
            response.raise_for_status()
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent {event_type} event - OK")
            return True
        except requests.exceptions.RequestException as e:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Failed to send {event_type}: {e}")
            return False

    def start(self):
        """Send start event"""
        return self.send_event("start")

    def heartbeat(self):
        """Send heartbeat event"""
        return self.send_event("heartbeat")

    def stop(self):
        """Send stop event"""
        return self.send_event("stop")

    def run(self):
        """Main loop - send start, then heartbeats"""
        self.start()

        while self.running:
            time.sleep(HEARTBEAT_INTERVAL)
            if self.running:
                self.heartbeat()

    def shutdown(self):
        """Graceful shutdown"""
        print("\nShutting down...")
        self.running = False
        self.stop()


def main():
    client = L2pClient()

    def signal_handler(sig, frame):
        client.shutdown()
        sys.exit(0)

    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    print(f"\nStarting client (heartbeat every {HEARTBEAT_INTERVAL}s)")
    print("Press Ctrl+C to stop\n")

    try:
        client.run()
    except KeyboardInterrupt:
        client.shutdown()


if __name__ == "__main__":
    main()
