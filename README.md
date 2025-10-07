# Agent Backend Tester

A simple frontend application for testing communication and interaction with an Agent backend that uses ADK (Agent Development Kit).

## Overview

This application provides a web interface to:
- Create new sessions with the agent backend
- Send messages and receive streaming responses
- View formatted JSON responses from the agent

## Getting Started

### Prerequisites

- Access to a gcloud account with permissions for the agent backend
- A web browser
- Terminal access for generating access tokens

### Setup

1. **Get an Access Token**
   ```bash
   gcloud auth print-access-token
   ```
   If you don't have gcloud access, ask an admin how to get access to the gcloud account.

2. **Open the Application**
   - Open `index.html` in your web browser
   - No server setup required - runs entirely in the browser

### Usage

#### Step 1: Create a Session

1. **Enter Access Token**: Paste the token from `gcloud auth print-access-token`
   - Click "Save" to store it locally for future use
2. **Set User ID** (optional): Leave as "001" or enter a custom user ID
3. **Click "Create New Session"**: This will create a new session with the backend

#### Step 2: Send Messages

1. **Enter your message** in the text area (e.g., "Give me a count of the number of pharmacies in Portland, Maine")
2. **Click "Send Message"** or press Enter
3. **View the streaming response** formatted as JSON in the response area

## Technical Details

The application connects to:
- **Session Creation**: `reasoningEngines/{id}:query` endpoint
- **Message Streaming**: `reasoningEngines/{id}:streamQuery` endpoint

Response format: Raw JSON objects streamed line-by-line (not Server-Sent Events format).

## Files

- `index.html` - Main application interface
- `index.js` - JavaScript functionality for API calls and response handling
- `README.md` - This documentation

## Troubleshooting

**"Please enter an access token" error**
- Run `gcloud auth print-access-token` and paste the result
- Make sure you have valid gcloud authentication

**"Error creating session" message**
- Check that your access token is valid and not expired
- Verify you have permissions to access the agent backend
- Contact an admin if you need gcloud account access

## Development

This is a simple HTML/JavaScript application with no build process required. To modify:

1. Edit `index.html` for UI changes
2. Edit `index.js` for functionality changes
3. Refresh the browser to see changes