document.addEventListener('DOMContentLoaded', () => {

    // --- स्टेट वेरिएबल्स (State Variables) ---
    let currentChatId = null;
    let currentChatName = null;
    let currentChatType = null;
    let chats = []; // स्टोर करेगा { id, name, type, profilePic, lastMessagePreview, lastUpdateTime }
    let messages = {}; // ऑब्जेक्ट चैट आईडी द्वारा संदेशों को स्टोर करने के लिए { chatId: [messages] }
    let selectedFile = null; // अपलोड के लिए चयनित फ़ाइल
    let currentTheme = localStorage.getItem('theme') || 'light-mode';

    // --- DOM एलिमेंट्स ---
    const chatListElement = document.getElementById('chat-list');
    const messageListElement = document.getElementById('message-list');
    const chatHeaderName = document.getElementById('chat-header-name');
    const chatHeaderStatus = document.getElementById('chat-header-status');
    const chatHeaderPic = document.getElementById('chat-header-pic');
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const attachBtn = document.getElementById('attach-btn');
    const fileInput = document.getElementById('file-input');
    const imagePreviewArea = document.getElementById('image-preview-area');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');
    const newChatBtn = document.getElementById('new-chat-btn');
    const createChatModal = document.getElementById('create-chat-modal');
    const createChatForm = document.getElementById('create-chat-form');
    const createChatPicInput = document.getElementById('create-chat-pic-input');
    const createChatPicPreview = document.getElementById('create-chat-pic-preview');
    const defaultView = document.getElementById('default-view');
    const chatView = document.getElementById('chat-view');
    const themeToggleBtn = document.getElementById('theme-toggle-btn');
    const chatSearchBtn = document.getElementById('chat-search-btn');
    const chatSearchBar = document.querySelector('.chat-search-bar');
    const closeChatSearchBtn = document.getElementById('close-chat-search-btn');
    const pinnedMessagePlaceholder = document.getElementById('pinned-message-placeholder'); // पिन संदेश के लिए

    // --- हेल्पर फंक्शन्स ---
    const showModal = (modalId) => document.getElementById(modalId).classList.remove('hidden');
    const hideModal = (modalId) => document.getElementById(modalId).classList.add('hidden');
    const formatTimestamp = (timestamp) => new Date(timestamp).toLocaleTimeString('hi-IN', { hour: 'numeric', minute: '2-digit' });

    // --- थीम मैनेजमेंट ---
    function applyTheme(theme) {
        document.body.className = theme;
        localStorage.setItem('theme', theme);
        themeToggleBtn.innerHTML = theme === 'dark-mode' ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
        currentTheme = theme;
    }

    themeToggleBtn.addEventListener('click', () => {
        applyTheme(currentTheme === 'light-mode' ? 'dark-mode' : 'light-mode');
    });

    // --- चैट फंक्शन्स ---
    async function loadChats() {
        chatListElement.innerHTML = '<li class="loading-placeholder">चैट्स लोड हो रहे हैं...</li>';
        // --- BACKEND INTEGRATION ---
        // यहाँ से वास्तविक चैट लिस्ट बैकएंड (Firebase/Supabase) से fetch करें
        // उदा. const fetchedChats = await fetch('/api/chats').then(res => res.json());
        // chats = fetchedChats;

        // --- सिमुलेशन ---
        await new Promise(resolve => setTimeout(resolve, 700)); // नेटवर्क डिले सिमुलेशन
        chats = [
            { id: 'channel_1', name: 'मेरा खास चैनल', type: 'channel', profilePic: 'images/channel-icon.png', lastMessagePreview: 'नया अपडेट देखें!', lastUpdateTime: Date.now() - 60000 },
            { id: 'group_1', name: 'डेवलपमेंट टीम ग्रुप', type: 'group', profilePic: 'images/group-icon.png', lastMessagePreview: 'एडमिन: मीटिंग का समय?', lastUpdateTime: Date.now() - 3600000 },
            { id: 'channel_2', name: 'Getup Pages Announcements', type: 'channel', profilePic: 'images/getup-logo.png', lastMessagePreview: 'v1.1 जारी किया गया', lastUpdateTime: Date.now() - 86400000 },
        ];
        messages['channel_1'] = [ // डेमो संदेश
            { id: 'm1', sender: 'admin', type: 'text', content: 'चैनल में स्वागत है!', timestamp: Date.now() - 120000 },
            { id: 'm2', sender: 'admin', type: 'image', content: 'images/sample-image.jpg', caption: 'यह एक सैंपल इमेज है। #getup', timestamp: Date.now() - 65000 }
        ];
         messages['group_1'] = [
            { id: 'g1', sender: 'other_user', type: 'text', content: 'क्या हम कल मीटिंग कर सकते हैं?', timestamp: Date.now() - 4000000 },
             { id: 'g2', sender: 'admin', type: 'text', content: 'हाँ, सुबह 10 बजे?', timestamp: Date.now() - 3600000 }
        ];
        // --- सिमुलेशन खत्म ---

        sortAndRenderChats();
    }

    function sortAndRenderChats() {
        // सबसे हालिया अपडेट के आधार पर सॉर्ट करें (बैकएंड से आने पर अधिक विश्वसनीय)
        chats.sort((a, b) => (b.lastUpdateTime || 0) - (a.lastUpdateTime || 0));
        renderChatList();
    }

    function renderChatList() {
        chatListElement.innerHTML = ''; // पुरानी लिस्ट साफ़ करें
        if (chats.length === 0) {
            chatListElement.innerHTML = '<li class="loading-placeholder">कोई चैट नहीं मिली।</li>';
            return;
        }
        chats.forEach(chat => {
            const li = document.createElement('li');
            li.className = `chat-item ${chat.id === currentChatId ? 'active' : ''}`;
            li.dataset.chatId = chat.id;
            li.innerHTML = `
                <img src="${chat.profilePic || 'images/placeholder-profile.png'}" alt="${chat.name.charAt(0)}" class="profile-pic">
                <div class="chat-info">
                    <span class="chat-name">${chat.name}</span>
                    <span class="last-message-preview">${chat.lastMessagePreview || '...'}</span>
                </div>
                <span class="last-message-time">${chat.lastUpdateTime ? formatTimestamp(chat.lastUpdateTime) : ''}</span>
            `;
            li.addEventListener('click', () => selectChat(chat.id));
            chatListElement.appendChild(li);
        });
    }

    function selectChat(chatId) {
        const selectedChat = chats.find(c => c.id === chatId);
        if (!selectedChat) return;

        currentChatId = chatId;
        currentChatName = selectedChat.name;
        currentChatType = selectedChat.type;

        // पुराने एक्टिव को हटाएं, नए को एक्टिव करें
        document.querySelectorAll('.chat-item.active').forEach(el => el.classList.remove('active'));
        chatListElement.querySelector(`.chat-item[data-chat-id="${chatId}"]`)?.classList.add('active');

        // हेडर अपडेट करें
        chatHeaderName.textContent = selectedChat.name;
        chatHeaderStatus.textContent = selectedChat.type === 'channel' ? 'चैनल' : 'ग्रुप';
        chatHeaderPic.src = selectedChat.profilePic || 'images/placeholder-profile.png';

        // व्यू बदलें
        defaultView.classList.add('hidden');
        chatView.classList.remove('hidden');
        chatSearchBar.classList.add('hidden'); // चैट बदलते समय सर्च बार बंद करें

        // संदेश लोड/रेंडर करें
        renderMessages(chatId);

        // इनपुट एरिया सक्षम करें
        messageInput.disabled = false;
        sendBtn.disabled = false;
        attachBtn.disabled = false;
    }

    // --- संदेश फंक्शन्स ---
    function renderMessages(chatId) {
        messageListElement.innerHTML = ''; // पुराने संदेश हटाएं
        const chatMessages = messages[chatId] || [];

        if (chatMessages.length === 0) {
            messageListElement.innerHTML = '<li class="loading-placeholder">इस चैट में कोई संदेश नहीं है।</li>';
        } else {
            // पिन किए गए संदेश का सिमुलेशन (वास्तविक के लिए बैकएंड से डेटा चाहिए)
            if (chatId === 'channel_1') { // उदा. के लिए
                 pinnedMessagePlaceholder.classList.remove('hidden');
                 pinnedMessagePlaceholder.querySelector('span').textContent = "महत्वपूर्ण घोषणा: नया अपडेट जल्द आ रहा है!";
            } else {
                 pinnedMessagePlaceholder.classList.add('hidden');
            }

            chatMessages.slice().reverse().forEach(msg => { // नवीनतम नीचे दिखाने के लिए रिवर्स करें
                const li = document.createElement('li');
                // वर्तमान में केवल एडमिन भेज रहा है, तो सभी 'sent' हैं
                const isSent = true; // msg.sender === 'admin'; // भविष्य के लिए
                li.className = `message-item ${isSent ? 'sent' : 'received'}`;

                let contentHTML = '';
                switch (msg.type) {
                    case 'text':
                        contentHTML = `<div class="text">${linkify(msg.content)}</div>`;
                        break;
                    case 'image':
                        contentHTML = `<img src="${msg.content}" alt="छवि" class="image">`;
                        if (msg.caption) {
                            contentHTML += `<div class="message-caption">${linkify(msg.caption)}</div>`;
                        }
                        break;
                    case 'video': // Placeholder
                        contentHTML = `<div class="video"><i class="fas fa-video"></i><span>वीडियो फ़ाइल (Placeholder)</span></div>`;
                         if (msg.caption) {
                             contentHTML += `<div class="message-caption">${linkify(msg.caption)}</div>`;
                         }
                        break;
                    case 'document': // Placeholder
                        contentHTML = `<div class="document"><i class="fas fa-file-alt"></i><span>डॉक्यूमेंट (Placeholder)</span></div>`;
                         if (msg.caption) {
                             contentHTML += `<div class="message-caption">${linkify(msg.caption)}</div>`;
                         }
                        break;
                    default:
                        contentHTML = `<div class="text">[असमर्थित संदेश प्रकार]</div>`;
                }

                li.innerHTML = `
                    <div class="message-bubble">
                        <div class="message-content">${contentHTML}</div>
                        <div class="message-timestamp">${formatTimestamp(msg.timestamp)}</div>
                    </div>
                `;
                messageListElement.appendChild(li);
            });
        }
        // स्क्रॉल को नीचे रखें (जो दिखने में ऊपर है flex-direction: column-reverse के कारण)
        messageListElement.scrollTop = messageListElement.scrollHeight;
    }

    function handleSendMessage() {
        const text = messageInput.value.trim();
        if (!text && !selectedFile) return; // भेजने के लिए कुछ नहीं है
        if (!currentChatId) return;

        const timestamp = Date.now();
        let newMessage = {
            id: 'temp_' + timestamp, // अस्थायी आईडी
            sender: 'admin', // वर्तमान में केवल एडमिन
            timestamp: timestamp,
        };

        // --- BACKEND INTEGRATION ---
        // यहाँ वास्तविक संदेश/फ़ाइल बैकएंड पर भेजें
        // अगर फ़ाइल है, तो पहले उसे अपलोड करें (Firebase Storage/Supabase Storage)
        // फिर संदेश डेटा (टेक्स्ट/कैप्शन, फ़ाइल URL, चैट आईडी) को डेटाबेस में सेव करें

        if (selectedFile) {
            // सिमुलेशन: मान लें फ़ाइल अपलोड हो गई और URL मिला
            const simulatedFileUrl = URL.createObjectURL(selectedFile); // केवल लोकल प्रीव्यू के लिए
            newMessage.type = selectedFile.type.startsWith('image/') ? 'image' : (selectedFile.type.startsWith('video/') ? 'video' : 'document');
            newMessage.content = simulatedFileUrl; // बैकएंड से वास्तविक URL का उपयोग करें
            newMessage.caption = text; // टेक्स्ट कैप्शन बन जाता है

            console.log(`सिमुलेटिंग फ़ाइल (${selectedFile.name}) पोस्ट कैप्शन के साथ: ${text}`);
            // BACKEND: await uploadFileAndPost(currentChatId, selectedFile, text);
        } else {
            newMessage.type = 'text';
            newMessage.content = text;
            console.log(`सिमुलेटिंग टेक्स्ट पोस्ट: ${text}`);
            // BACKEND: await postTextMessage(currentChatId, text);
        }

        // --- सिमुलेशन: UI अपडेट ---
        if (!messages[currentChatId]) {
            messages[currentChatId] = [];
        }
        messages[currentChatId].push(newMessage); // संदेश को लोकल स्टेट में जोड़ें

        renderMessages(currentChatId); // संदेश लिस्ट री-रेंडर करें

        // चैट लिस्ट में प्रीव्यू अपडेट करें
        const chatIndex = chats.findIndex(c => c.id === currentChatId);
        if (chatIndex > -1) {
            let preview = '';
            if (newMessage.type === 'image') preview = '📷 फोटो' + (newMessage.caption ? `: ${newMessage.caption}` : '');
            else if (newMessage.type === 'video') preview = '🎥 वीडियो' + (newMessage.caption ? `: ${newMessage.caption}` : '');
            else if (newMessage.type === 'document') preview = '📄 डॉक्यूमेंट' + (newMessage.caption ? `: ${newMessage.caption}` : '');
            else preview = newMessage.content;

            chats[chatIndex].lastMessagePreview = preview.substring(0, 35) + (preview.length > 35 ? '...' : '');
            chats[chatIndex].lastUpdateTime = timestamp;
            sortAndRenderChats(); // लिस्ट को री-सॉर्ट और री-रेंडर करें
        }

        // इनपुट एरिया रीसेट करें
        messageInput.value = '';
        messageInput.style.height = 'auto'; // ऊंचाई रीसेट करें
        selectedFile = null;
        fileInput.value = null; // फ़ाइल इनपुट साफ़ करें
        imagePreviewArea.classList.add('hidden');
        // --- सिमुलेशन खत्म ---
    }

    // टेक्स्ट में लिंक बनाने के लिए हेल्पर
    function linkify(text) {
        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/ig;
        return text.replace(urlRegex, url => `<a href="${url}" target="_blank" style="color: var(--link-color);">${url}</a>`);
    }

    // --- फ़ाइल अटैचमेंट ---
    attachBtn.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            selectedFile = file;
            // केवल इमेज के लिए प्रीव्यू दिखाएं
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    imagePreview.src = event.target.result;
                    imagePreviewArea.classList.remove('hidden');
                }
                reader.readAsDataURL(file);
            } else {
                // अन्य फ़ाइल प्रकारों के लिए, आप फ़ाइल नाम दिखा सकते हैं
                imagePreviewArea.classList.add('hidden'); // या एक अलग प्रीव्यू दिखाएं
                messageInput.value = `फ़ाइल संलग्न: ${file.name}`; // उदाहरण
            }
        }
    });

    removeImageBtn.addEventListener('click', () => {
        selectedFile = null;
        fileInput.value = null;
        imagePreviewArea.classList.add('hidden');
        imagePreview.src = '#';
    });

    // --- नया चैट क्रिएशन ---
    newChatBtn.addEventListener('click', () => {
        createChatForm.reset(); // फॉर्म रीसेट करें
        createChatPicPreview.src = 'images/placeholder-profile.png'; // डिफ़ॉल्ट प्रीव्यू
        document.getElementById('create-chat-error').classList.add('hidden'); // एरर छिपाएं
        showModal('create-chat-modal');
    });

    createChatPicInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                createChatPicPreview.src = event.target.result;
            }
            reader.readAsDataURL(file);
        }
    });

    createChatForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('chat-name');
        const typeInput = document.querySelector('input[name="chat_type"]:checked');
        const descriptionInput = document.getElementById('chat-description');
        const errorElement = document.getElementById('create-chat-error');
        const submitBtn = document.getElementById('create-chat-submit-btn');

        if (!nameInput.value.trim()) {
            errorElement.textContent = 'कृपया नाम दर्ज करें।';
            errorElement.classList.remove('hidden');
            return;
        }
        errorElement.classList.add('hidden');
        submitBtn.disabled = true;
        submitBtn.textContent = 'बनाया जा रहा है...';

        const chatData = {
            name: nameInput.value.trim(),
            type: typeInput.value,
            description: descriptionInput.value.trim()
        };
        const profilePicFile = createChatPicInput.files[0];

        // --- BACKEND INTEGRATION ---
        // 1. अगर profilePicFile है, तो इसे बैकएंड स्टोरेज पर अपलोड करें और URL प्राप्त करें।
        // 2. chatData और प्रोफाइल पिक्चर URL को बैकएंड API पर भेजें ताकि चैट बनाया जा सके।
        // उदा. const result = await fetch('/api/create_chat', { method: 'POST', body: JSON.stringify(chatData), headers: {...} });
        // const newChat = await result.json();

        // --- सिमुलेशन ---
        await new Promise(resolve => setTimeout(resolve, 1000)); // डिले सिमुलेशन
        const newChat = {
            id: 'new_' + Date.now(),
            name: chatData.name,
            type: chatData.type,
            profilePic: profilePicFile ? URL.createObjectURL(profilePicFile) : (chatData.type === 'group' ? 'images/group-icon.png' : 'images/channel-icon.png'), // लोकल प्रीव्यू
            lastMessagePreview: 'चैट बनाया गया!',
            lastUpdateTime: Date.now()
        };
        console.log("सिमुलेटेड नया चैट:", newChat);
        chats.unshift(newChat); // लिस्ट में सबसे ऊपर जोड़ें
        messages[newChat.id] = []; // नए चैट के लिए संदेश ऐरे इनिशियलाइज़ करें
        sortAndRenderChats();
        hideModal('create-chat-modal');
        selectChat(newChat.id); // नए चैट को चुनें
        // --- सिमुलेशन खत्म ---

        submitBtn.disabled = false;
        submitBtn.textContent = 'बनाएं';
    });

    // --- इन-चैट सर्च ---
    chatSearchBtn.addEventListener('click', () => {
        chatSearchBar.classList.remove('hidden');
        document.getElementById('in-chat-search-input').focus();
    });
    closeChatSearchBtn.addEventListener('click', () => {
        chatSearchBar.classList.add('hidden');
        // यहाँ सर्च रिजल्ट्स को साफ़ करने का लॉजिक भी जोड़ें
    });
     // इन-चैट सर्च इनपुट पर टाइपिंग को हैंडल करने के लिए इवेंट लिसनर जोड़ें (बैकएंड इंटीग्रेशन की आवश्यकता होगी)


    // --- इनपुट ऑटो-रीसाइज़ ---
    messageInput.addEventListener('input', () => {
        messageInput.style.height = 'auto'; // ऊंचाई रीसेट करें
        messageInput.style.height = `${messageInput.scrollHeight}px`; // स्क्रॉल ऊंचाई पर सेट करें
    });

     // Enter से भेजें (Shift+Enter नई लाइन के लिए)
     messageInput.addEventListener('keydown', (e) => {
         if (e.key === 'Enter' && !e.shiftKey) {
             e.preventDefault(); // नई लाइन न डालें
             handleSendMessage();
         }
     });

    // --- इनिशियलाइज़ेशन ---
    function init() {
        console.log("गेटअप पेजेस एडमिन पैनल इनिशियलाइज़ हो रहा है...");
        applyTheme(currentTheme); // संग्रहीत थीम लागू करें
        loadChats(); // चैट लोड करें
        // डिफ़ॉल्ट रूप से इनपुट अक्षम करें
        messageInput.disabled = true;
        sendBtn.disabled = true;
        attachBtn.disabled = true;
    }

    init();
});
