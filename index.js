const DEFAULT_BASE_URL = 'https://us-central1-aiplatform.googleapis.com/v1/projects/folkloric-vault-454309-q6/locations/us-central1/reasoningEngines/3836948135263862784';

let currentSessionId = null;
let currentUserId = null;

const ACCESS_TOKEN_KEY = 'agent_access_token';
const AGENT_URL_KEY = 'agent_base_endpoint';

function getApiEndpoints() {
    const baseUrl = document.getElementById('agentUrl').value.trim() || DEFAULT_BASE_URL;
    return {
        session: `${baseUrl}:query`,
        stream: `${baseUrl}:streamQuery?alt=sse`
    };
}

function setStatus(message, type = 'loading') {
    const statusDiv = document.getElementById('status');
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
}

function appendToResponse(text) {
    const responseDiv = document.getElementById('response');
    responseDiv.textContent += text;
}

function appendFormattedJSON(jsonData) {
    const responseDiv = document.getElementById('response');
    const formatted = JSON.stringify(jsonData, null, 2);
    responseDiv.textContent += formatted + '\n\n---\n\n';
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

function saveAccessToken() {
    const accessToken = document.getElementById('accessToken').value.trim();
    
    if (!accessToken) {
        setStatus('Please enter an access token to save', 'error');
        return;
    }
    
    try {
        localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
        setStatus('Access token saved successfully!', 'success');
        
        // Clear the status after 2 seconds
        setTimeout(() => {
            if (document.getElementById('status').textContent === 'Access token saved successfully!') {
                document.getElementById('status').textContent = '';
                document.getElementById('status').className = 'status';
            }
        }, 2000);
    } catch (error) {
        console.error('Error saving access token:', error);
        setStatus('Error saving access token', 'error');
    }
}

function loadAccessToken() {
    try {
        const savedToken = localStorage.getItem(ACCESS_TOKEN_KEY);
        if (savedToken) {
            document.getElementById('accessToken').value = savedToken;
            return true;
        }
    } catch (error) {
        console.error('Error loading access token:', error);
    }
    return false;
}

function saveAgentUrl() {
    const agentUrl = document.getElementById('agentUrl').value.trim();
    
    if (!agentUrl) {
        setStatus('Please enter an agent URL to save', 'error');
        return;
    }
    
    try {
        localStorage.setItem(AGENT_URL_KEY, agentUrl);
        setStatus('Agent URL saved successfully!', 'success');
        
        // Clear the status after 2 seconds
        setTimeout(() => {
            if (document.getElementById('status').textContent === 'Agent URL saved successfully!') {
                document.getElementById('status').textContent = '';
                document.getElementById('status').className = 'status';
            }
        }, 2000);
    } catch (error) {
        console.error('Error saving agent URL:', error);
        setStatus('Error saving agent URL', 'error');
    }
}

function loadAgentUrl() {
    try {
        const savedUrl = localStorage.getItem(AGENT_URL_KEY);
        if (savedUrl) {
            document.getElementById('agentUrl').value = savedUrl;
            return true;
        } else {
            // Set default value if nothing saved
            document.getElementById('agentUrl').value = DEFAULT_BASE_URL;
        }
    } catch (error) {
        console.error('Error loading agent URL:', error);
        document.getElementById('agentUrl').value = DEFAULT_BASE_URL;
    }
    return false;
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
        const endpoints = getApiEndpoints();
        const response = await fetch(endpoints.session, {
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
            appendToResponse(`Session Created:\n${JSON.stringify(data, null, 2)}\n\n---\n\n`);
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
        const endpoints = getApiEndpoints();
        const response = await fetch(endpoints.stream, {
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
                
                try {
                    const parsed = JSON.parse(line);
                    appendFormattedJSON(parsed);
                } catch (e) {
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
    disableChatSection(); // Ensure chat is disabled initially
    
    // Load saved agent URL and access token if they exist
    loadAgentUrl();
    const tokenLoaded = loadAccessToken();
    
    // Focus on the appropriate field
    if (tokenLoaded) {
        document.getElementById('userId').focus();
    } else {
        document.getElementById('accessToken').focus();
    }
});