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

    # Specify permanent installation path
    _svc_reg_class_ = r"C:\Program Files\L2pControl\service.L2pControlService"

    # Configure service to start automatically
    _exe_name_ = "pythonservice.exe"
    _svc_deps_ = None  # No dependencies
    _exe_args_ = None

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

    def SvcShutdown(self):
        """Called when system is shutting down"""
        self.running = False
        self.send_event("stop")
        self.SvcStop()

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

    def check_network_connectivity(self):
        """Check if network is available"""
        try:
            # Quick DNS check to Google's DNS
            import socket
            socket.create_connection(("8.8.8.8", 53), timeout=3)
            return True
        except OSError:
            return False

    def main(self):
        """Main service loop"""
        # Try to send start event immediately - don't wait for network check first
        # If network is ready, this succeeds instantly
        # If not, fall back to retry logic with network checks
        max_retries = 15

        for attempt in range(max_retries):
            if self.send_event("start"):
                break  # Success!
            else:
                # Failed - now check if it's a network issue
                if not self.check_network_connectivity():
                    servicemanager.LogWarningMsg(
                        f"Network not ready (attempt {attempt + 1}/{max_retries}), waiting..."
                    )
                    time.sleep(2)
                else:
                    # Network is up but API failed - use exponential backoff
                    if attempt < max_retries - 1:
                        retry_delay = min(attempt + 1, 5)
                        servicemanager.LogWarningMsg(
                            f"Failed to send start event (attempt {attempt + 1}/{max_retries}), "
                            f"retrying in {retry_delay} seconds..."
                        )
                        time.sleep(retry_delay)
                    else:
                        servicemanager.LogErrorMsg(
                            f"Failed to send start event after {max_retries} attempts"
                        )

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
