"""
L2pControl Windows Service

Install:   python service.py install
Start:     python service.py start
Stop:      python service.py stop
Remove:    python service.py remove

Or use Windows Services (services.msc) to manage after installation.
"""

import time
import sys
import os
from datetime import datetime, timezone

import win32serviceutil
import win32service
import win32event
import servicemanager
import requests

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))
from config import API_URL, HEARTBEAT_INTERVAL, get_pc_id, get_or_create_uuid


class L2pControlService(win32serviceutil.ServiceFramework):
    _svc_name_ = "L2pControlClient"
    _svc_display_name_ = "L2pControl Client Service"
    _svc_description_ = "Sends PC status events to L2pControl server"

    def __init__(self, args):
        win32serviceutil.ServiceFramework.__init__(self, args)
        self.stop_event = win32event.CreateEvent(None, 0, 0, None)
        self.running = True
        self.pc_id = get_pc_id()
        self.client_uuid = get_or_create_uuid()

    def SvcStop(self):
        """Called when service is stopped"""
        self.ReportServiceStatus(win32service.SERVICE_STOP_PENDING)
        self.running = False
        self.send_event("stop")
        win32event.SetEvent(self.stop_event)

    def SvcDoRun(self):
        """Main service entry point"""
        servicemanager.LogMsg(
            servicemanager.EVENTLOG_INFORMATION_TYPE,
            servicemanager.PYS_SERVICE_STARTED,
            (self._svc_name_, "")
        )
        self.main()

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
            servicemanager.LogInfoMsg(f"Sent {event_type} event successfully")
            return True
        except requests.exceptions.RequestException as e:
            servicemanager.LogErrorMsg(f"Failed to send {event_type}: {str(e)}")
            return False

    def main(self):
        """Main service loop"""
        # Send start event
        self.send_event("start")

        # Main loop - send heartbeats
        while self.running:
            # Wait for stop event or timeout
            result = win32event.WaitForSingleObject(
                self.stop_event,
                HEARTBEAT_INTERVAL * 1000  # Convert to milliseconds
            )

            if result == win32event.WAIT_OBJECT_0:
                # Stop event was signaled
                break

            # Timeout - send heartbeat
            if self.running:
                self.send_event("heartbeat")


def main():
    if len(sys.argv) == 1:
        # Running as service
        servicemanager.Initialize()
        servicemanager.PrepareToHostSingle(L2pControlService)
        servicemanager.StartServiceCtrlDispatcher()
    else:
        # Running from command line
        win32serviceutil.HandleCommandLine(L2pControlService)


if __name__ == "__main__":
    main()
