document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIGURATION ---
    // !! IMPORTANT: Replace with the URL of YOUR deployed backend service !!
    const BACKEND_API_URL = 'YOUR_BACKEND_ENDPOINT_HERE'; // e.g., 'https://your-backend.herokuapp.com/api/post_to_telegram'
    // !! IMPORTANT: This is for demonstration. Real authentication should be handled securely by the backend.
    // You might pass a secret header from here that your backend verifies.
    const ADMIN_SECRET_KEY = 'YOUR_SUPER_SECRET_KEY_OR_TOKEN'; // Use a strong, unique key

    // --- ELEMENTS ---
    const chatList = document.getElementById('chat-list');
    const messageList = document.getElementById('message-list');
    const imageUrlInput = document.getElementById('image-url-input');
    const captionInput = document.getElementById('caption-input');
    const sendButton = document.getElementById('send-button');
    const chatHeader = document.getElementById('chat-header');
    const headerProfilePic = document.getElementById('header-profile-pic');
    const headerChatName = document.getElementById('header-chat-name');
    const headerChatStatus = document.getElementById('header-chat-status');
    const searchChatsInput = document.getElementById('search-chats');
    const searchContentBtn = document.getElementById('search-content-btn');
    const searchContentOverlay = document.getElementById('search-content-overlay');
    const searchContentInput = document.getElementById('search-content-input');
    const closeSearchContentBtn = document.getElementById('close-search-content');
    const searchContentResults = document.getElementById('search-content-results');
    const logOverlay = document.getElementById('log-overlay');
    const logContent = document.getElementById('log-content');
    const showLogBtn = document.getElementById('show-log-btn');
    const closeLogBtn = document.getElementById('close-log-btn');
    const messagePlaceholder = document.querySelector('.message-placeholder');


    // --- STATE ---
    let currentChatId = null;
    let currentChatName = null;
    let chats = []; // Array to hold chat data {id, name, type, profilePic, lastUpdateTime, messages: []}
    let postLog = JSON.parse(localStorage.getItem('postLog') || '[]');

    // --- FUNCTIONS ---

    // Basic Logging
    function logAction(message) {
        const timestamp = new Date().toLocaleString();
        const logEntry = { timestamp, message };
        postLog.unshift(logEntry); // Add to beginning
        if (postLog.length > 50) { // Keep log size manageable
            postLog.pop();
        }
        localStorage.setItem('postLog', JSON.stringify(postLog));
        renderLog();
        console.log(`[LOG ${timestamp}] ${message}`);
    }

    function renderLog() {
        logContent.innerHTML = postLog.map(entry =>
            `<div><strong>${entry.timestamp}:</strong> ${entry.message}</div>`
        ).join('');
    }

    // Load Chats (Simulated - Replace with backend fetch if needed)
    function loadChats() {
        // In a real app, you might fetch this list from your backend
        // Or define it statically here if it rarely changes
        chats = [
            { id: '-1001234567890', name: 'My Awesome Channel', type: 'channel', profilePic: 'default-profile.png', lastUpdateTime: Date.now(), lastMessagePreview: 'Ready to post...', messages: [] },
            { id: '-1009876543210', name: 'My Cool Group', type: 'group', profilePic: 'group-icon.png', lastUpdateTime: Date.now() - 3600000, lastMessagePreview: 'Planning session', messages: [] },
            { id: '-1001122334455', name: 'Image Archive', type: 'channel', profilePic: 'archive-icon.png', lastUpdateTime: Date.now() - 86400000, lastMessagePreview: 'Old stuff', messages: [] },
            // Add more chats as needed
        ].sort((a, b) => b.lastUpdateTime - a.lastUpdateTime); // Sort by latest update initially

        renderChatList();
        logAction("Chats loaded/simulated.");
    }

    // Render Chat List in Sidebar
    function renderChatList(filter = '') {
        chatList.innerHTML = ''; // Clear existing list
        const filteredChats = chats.filter(chat =>
            chat.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filteredChats.length === 0) {
             chatList.innerHTML = '<div class="chat-item-placeholder">No chats found.</div>';
             return;
        }

        filteredChats.forEach(chat => {
            const chatItem = document.createElement('div');
            chatItem.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            chatItem.dataset.chatId = chat.id;
            chatItem.dataset.chatType = chat.type;
            chatItem.dataset.chatName = chat.name; // Store name for easy access

            const time = new Date(chat.lastUpdateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            // Add more sophisticated date formatting (like 'Yesterday') if needed

            chatItem.innerHTML = `
                <img src="${chat.profilePic || 'default-profile.png'}" alt="${chat.name.charAt(0)}" class="profile-pic">
                <div class="chat-info">
                    <span class="chat-name">${chat.name}</span>
                    <span class="last-message-preview">${chat.lastMessagePreview || 'No recent messages'}</span>
                </div>
                 <span class="last-message-time">${time}</span>
            `;
            chatItem.addEventListener('click', () => selectChat(chat.id));
            chatList.appendChild(chatItem);
        });
    }

     // Add a placeholder/simulated message to the UI
    function addMessageToUI(chatId, messageData, isSentByMe = true) {
        if (chatId !== currentChatId) return; // Only add if the chat is currently active

        const messageItem = document.createElement('div');
        messageItem.className = `message-item ${isSentByMe ? '' : 'other'}`; // Add 'other' class if not sent by admin

        let contentHTML = '';
        if (messageData.imageUrl) {
            contentHTML += `<img src="${messageData.imageUrl}" alt="Posted Image">`;
        }
        if (messageData.caption) {
            // Basic link detection and formatting (replace with more robust method if needed)
             let formattedCaption = messageData.caption.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
            contentHTML += `<div class="caption">${formattedCaption}</div>`;
        }

        const timestamp = new Date(messageData.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        messageItem.innerHTML = `
            ${contentHTML}
            <div class="message-timestamp">${timestamp}</div>
        `;

        messageList.insertBefore(messageItem, messageList.firstChild); // Add to top (because of flex-direction: column-reverse)

        // Hide placeholder if it's visible
        if(messagePlaceholder) messagePlaceholder.style.display = 'none';

        // Update last message preview in sidebar
        const chat = chats.find(c => c.id === chatId);
        if (chat) {
            chat.lastMessagePreview = messageData.imageUrl ? `Photo: ${messageData.caption || ''}`.substring(0, 30) + '...' : (messageData.caption || '').substring(0, 30) + '...';
            chat.lastUpdateTime = messageData.timestamp || Date.now();
            sortAndRenderChats(); // Re-render list to show update and correct order
        }
    }


    // Select a Chat
    function selectChat(chatId) {
        if (currentChatId === chatId) return; // Don't re-select the same chat

        currentChatId = chatId;
        const chat = chats.find(c => c.id === chatId);

        if (chat) {
            currentChatName = chat.name;
            headerProfilePic.src = chat.profilePic || 'default-profile.png';
            headerChatName.textContent = chat.name;
            headerChatStatus.textContent = chat.type === 'channel' ? 'Channel' : 'Group'; // Example status

            // Highlight the active chat in the sidebar
            document.querySelectorAll('.chat-item').forEach(item => {
                item.classList.toggle('active', item.dataset.chatId === chatId);
            });

            // Clear previous messages and show placeholder/load messages
            messageList.innerHTML = '';
            if (messagePlaceholder) messagePlaceholder.style.display = 'flex'; // Show placeholder
             // TODO: In a real app, you would fetch messages for this chat ID here
            // For now, we just clear it and rely on new messages being added by addMessageToUI
             // simulatedMessages.forEach(msg => addMessageToUI(chatId, msg, msg.sender === 'me'));


            // Enable input fields
            imageUrlInput.disabled = false;
            captionInput.disabled = false;
            sendButton.disabled = false;
            logAction(`Selected chat: ${chat.name} (${chat.id})`);
        } else {
            // Handle case where chat is not found (shouldn't happen with current setup)
            logAction(`Error: Chat with ID ${chatId} not found.`);
            currentChatId = null;
            currentChatName = null;
            headerChatName.textContent = 'Select a chat';
            headerChatStatus.textContent = '';
             // Disable inputs if no chat selected
            imageUrlInput.disabled = true;
            captionInput.disabled = true;
            sendButton.disabled = true;
        }
         // Close content search when switching chats
        searchContentOverlay.style.display = 'none';
    }

    // Sort chats by last update time and re-render list
    function sortAndRenderChats() {
        chats.sort((a, b) => b.lastUpdateTime - a.lastUpdateTime);
        renderChatList(searchChatsInput.value); // Re-render with current filter
    }

    // Handle Sending Post to Backend
    async function handleSendPost() {
        const imageUrl = imageUrlInput.value.trim();
        const caption = captionInput.value.trim();

        if (!imageUrl) {
            alert('Please paste an Image URL.');
            return;
        }
        if (!currentChatId) {
            alert('Please select a Channel or Group first.');
            return;
        }
        if (!BACKEND_API_URL || BACKEND_API_URL === 'YOUR_BACKEND_ENDPOINT_HERE') {
            alert('Backend API URL is not configured in script.js!');
             logAction("Error: Backend API URL not configured.");
            return;
        }


        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; // Loading indicator

        const postData = {
            chat_id: currentChatId,
            image_url: imageUrl,
            caption: caption,
            // Add any other data your backend needs (text overlay instructions, etc.)
        };

        logAction(`Attempting to post to ${currentChatName}: ${imageUrl.substring(0,50)}...`);

        try {
            const response = await fetch(BACKEND_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    // IMPORTANT: Add authentication header for your backend
                    'Authorization': `Bearer ${ADMIN_SECRET_KEY}` // Example: Use a Bearer token
                },
                body: JSON.stringify(postData)
            });

            const result = await response.json(); // Assuming backend returns JSON

            if (response.ok && result.success) {
                logAction(`Successfully posted to ${currentChatName}. Backend response: ${result.message || 'OK'}`);
                // Simulate adding the message locally for immediate feedback
                addMessageToUI(currentChatId, {
                    imageUrl: result.postedImageUrl || imageUrl, // Use URL returned by backend if available (e.g., after re-upload)
                    caption: caption,
                    timestamp: Date.now()
                }, true); // true = sent by me

                // Clear inputs after successful post
                imageUrlInput.value = '';
                captionInput.value = '';

            } else {
                 alert(`Error posting to Telegram: ${result.error || 'Unknown error from backend.'}`);
                 logAction(`Error posting to ${currentChatName}. Status: ${response.status}. Backend Error: ${result.error || 'N/A'}`);
            }

        } catch (error) {
            console.error('Error sending request to backend:', error);
            alert(`Failed to send request to the backend. Check console and backend logs. Error: ${error.message}`);
            logAction(`Failed to send request to backend for ${currentChatName}. Error: ${error.message}`);
        } finally {
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i>'; // Restore send icon
        }
    }


    // --- EVENT LISTENERS ---
    sendButton.addEventListener('click', handleSendPost);

    // Allow sending with Enter key in caption (Shift+Enter for newline)
    captionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault(); // Prevent newline
            handleSendPost();
        }
    });

    // Search Chats Listener
    searchChatsInput.addEventListener('input', (e) => {
        renderChatList(e.target.value);
    });

     // Search Content Listener (Basic Client-Side Simulation)
    searchContentBtn.addEventListener('click', () => {
         if (!currentChatId) {
             alert("Please select a chat first.");
             return;
         }
        searchContentOverlay.style.display = 'flex';
        searchContentInput.focus();
         logAction(`Opened content search for ${currentChatName}.`);
         searchContentResults.innerHTML = 'Start typing to search messages... (client-side demo)'; // Placeholder
    });

    closeSearchContentBtn.addEventListener('click', () => {
        searchContentOverlay.style.display = 'none';
        searchContentInput.value = '';
        searchContentResults.innerHTML = '';
    });

    // Basic content search simulation (searches currently displayed messages)
    searchContentInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        searchContentResults.innerHTML = ''; // Clear previous results
         if (!searchTerm) {
              searchContentResults.innerHTML = 'Start typing to search...';
              return;
         }

        const messages = messageList.querySelectorAll('.message-item');
        let count = 0;
        messages.forEach(msg => {
            const captionElement = msg.querySelector('.caption');
            const textContent = captionElement ? captionElement.textContent.toLowerCase() : '';
            if (textContent.includes(searchTerm)) {
                const resultItem = document.createElement('div');
                resultItem.className = 'search-result-item';
                resultItem.textContent = textContent.substring(0, 100) + (textContent.length > 100 ? '...' : '');
                // Optional: Add click handler to scroll to the message
                 // resultItem.onclick = () => { msg.scrollIntoView({ behavior: 'smooth' }); };
                searchContentResults.appendChild(resultItem);
                count++;
            }
        });
         if (count === 0) {
            searchContentResults.innerHTML = 'No matching messages found in current view.';
         } else {
            // Prepend count? e.g., searchContentResults.insertAdjacentHTML('afterbegin', `<div>Found ${count} results:</div>`);
         }
    });


    // Log Listeners
    showLogBtn.addEventListener('click', () => {
        logOverlay.style.display = 'flex';
        renderLog(); // Ensure it's up-to-date
    });
    closeLogBtn.addEventListener('click', () => {
        logOverlay.style.display = 'none';
    });

    // --- INITIALIZATION ---
    logAction("Admin Panel Initialized.");
    loadChats(); // Load initial chat list
    renderLog(); // Render any existing logs from localStorage

    // Initially disable inputs until a chat is selected
    imageUrlInput.disabled = true;
    captionInput.disabled = true;
    sendButton.disabled = true;

}); // End DOMContentLoaded
