const STREAM_API_ENDPOINT = 'https://us-central1-aiplatform.googleapis.com/v1/projects/folkloric-vault-454309-q6/locations/us-central1/reasoningEngines/3836948135263862784:streamQuery?alt=sse';
const SESSION_API_ENDPOINT = 'https://us-central1-aiplatform.googleapis.com/v1/projects/folkloric-vault-454309-q6/locations/us-central1/reasoningEngines/3836948135263862784:query';

let currentSessionId = null;
let currentUserId = null;

function setStatus(message, type = 'loading') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

function appendToResponse(text) {
    const responseDiv = document.getElementById('response');
    responseDiv.textContent += text;
}

function clearResponse() {
    document.getElementById('response').textContent = '';
    document.getElementById('status').textContent = '';
    document.getElementById('status').className = 'status';
}

function formatJSON(jsonString) {
    try {
        const parsed = JSON.parse(jsonString);
        return JSON.stringify(parsed, null, 2);
    } catch (e) {
        return jsonString;
    }
}

function enableChatSection() {
    const chatSection = document.getElementById('chatSection');
    const sendButton = document.getElementById('sendButton');
    
    chatSection.classList.remove('section-disabled');
    sendButton.disabled = false;
}

function disableChatSection() {
    const chatSection = document.getElementById('chatSection');
    const sendButton = document.getElementById('sendButton');
    
    chatSection.classList.add('section-disabled');
    sendButton.disabled = true;
}

function updateSessionInfo(sessionId, userId) {
    currentSessionId = sessionId;
    currentUserId = userId;
    
    document.getElementById('currentSessionId').textContent = sessionId;
    document.getElementById('currentUserId').textContent = userId;
    document.getElementById('sessionInfo').style.display = 'block';
    
    enableChatSection();
}

async function createSession() {
    const accessToken = document.getElementById('accessToken').value.trim();
    const userId = document.getElementById('userId').value.trim() || '001';
    const createSessionButton = document.getElementById('createSessionButton');

    if (!accessToken) {
        setStatus('Please enter an access token', 'error');
        return;
    }

    setStatus('Creating new session...', 'loading');
    createSessionButton.disabled = true;

    const requestBody = {
        class_method: "async_create_session",
        input: {
            user_id: userId
        }
    };

    try {
        const response = await fetch(SESSION_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.output && data.output.id) {
            updateSessionInfo(data.output.id, userId);
            setStatus('Session created successfully!', 'success');
            clearResponse();
            appendToResponse(`Session Created:\n${formatJSON(JSON.stringify(data))}\n\n---\n\n`);
        } else {
            throw new Error('Invalid response format - missing session ID');
        }

    } catch (error) {
        console.error('Error creating session:', error);
        setStatus(`Error creating session: ${error.message}`, 'error');
        disableChatSection();
    } finally {
        createSessionButton.disabled = false;
    }
}

async function sendMessage() {
    const accessToken = document.getElementById('accessToken').value.trim();
    const message = document.getElementById('message').value.trim();
    const sendButton = document.getElementById('sendButton');

    if (!currentSessionId || !currentUserId) {
        setStatus('Please create a session first', 'error');
        return;
    }

    if (!accessToken) {
        setStatus('Please enter an access token', 'error');
        return;
    }

    if (!message) {
        setStatus('Please enter a message', 'error');
        return;
    }

    clearResponse();
    setStatus('Sending request...', 'loading');
    sendButton.disabled = true;

    const requestBody = {
        class_method: "async_stream_query",
        input: {
            user_id: currentUserId,
            session_id: currentSessionId,
            message: message
        }
    };

    try {
        const response = await fetch(STREAM_API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
                'Accept': 'text/event-stream'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        setStatus('Receiving streaming response...', 'loading');

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                setStatus('Stream completed', 'success');
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            
            // Process complete lines
            const lines = buffer.split('\n');
            buffer = lines.pop(); // Keep incomplete line in buffer

            for (const line of lines) {
                if (line.trim() === '') continue;
                
                // Handle SSE format
                if (line.startsWith('data: ')) {
                    const data = line.substring(6);
                    if (data.trim() === '[DONE]') {
                        setStatus('Stream completed', 'success');
                        break;
                    }
                    
                    try {
                        // Format and display the JSON
                        const formattedJSON = formatJSON(data);
                        appendToResponse(formattedJSON + '\n\n---\n\n');
                    } catch (e) {
                        // If it's not valid JSON, just display as is
                        appendToResponse(data + '\n\n');
                    }
                } else {
                    // Handle other SSE fields or raw data
                    appendToResponse(line + '\n');
                }
            }
        }

    } catch (error) {
        console.error('Error:', error);
        setStatus(`Error: ${error.message}`, 'error');
        appendToResponse(`Error occurred: ${error.message}\n\nCheck console for more details.`);
    } finally {
        sendButton.disabled = false;
    }
}

// Allow Enter key to send message
document.getElementById('message').addEventListener('keypress', function(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
});

// Auto-focus on access token input when page loads
window.addEventListener('load', function() {
    document.getElementById('accessToken').focus();
    disableChatSection(); // Ensure chat is disabled initially
});