# L2pControl Client - Installation Guide

## Prerequisites

- Python 3.8 or higher
- Windows OS
- Administrator privileges (for service installation)

## Installation Steps

### Step 1: Download the Client

Download the `client` folder to each PC you want to monitor.

### Step 2: Configure the API URL

Create a file named `client_config.json` in the client folder with the following content:

```json
{
  "apiUrl": "https://your-railway-app.railway.app/api/events",
  "heartbeatInterval": 60
}
```

Replace `your-railway-app.railway.app` with your actual Railway backend URL.

### Step 3: Install Dependencies

Open Command Prompt as Administrator and run:

```bash
cd path\to\client
pip install -r requirements.txt
```

### Step 4: Test the Client

Test the client before installing as a service:

```bash
python client.py
```

You should see output like:
```
L2pControl Client initialized
  PC ID: DESKTOP-ABC123
  Client UUID: 123e4567-e89b-12d3-a456-426614174000
  API URL: https://your-railway-app.railway.app/api/events

Starting client (heartbeat every 60s)
Press Ctrl+C to stop

[12:00:00] Sent start event - OK
[12:01:00] Sent heartbeat event - OK
```

Press Ctrl+C to stop the test.

### Step 5: Install as Windows Service

Install the client as a Windows Service so it starts automatically:

```bash
python service.py install
python service.py start
```

### Service Management Commands

```bash
# Start the service
python service.py start

# Stop the service
python service.py stop

# Restart the service
python service.py restart

# Remove the service
python service.py remove
```

## Troubleshooting

### Service won't start

1. Check the Windows Event Viewer for errors
2. Make sure `client_config.json` exists and is valid JSON
3. Verify Python and dependencies are installed correctly

### Client can't connect to server

1. Check that the `apiUrl` in `client_config.json` is correct
2. Make sure your firewall allows outbound HTTPS connections
3. Test the URL in your browser: `https://your-app.railway.app/health`

### How to update the configuration

1. Edit `client_config.json`
2. Restart the service:
   ```bash
   python service.py restart
   ```

## Uninstallation

```bash
python service.py stop
python service.py remove
```

Then delete the client folder.
