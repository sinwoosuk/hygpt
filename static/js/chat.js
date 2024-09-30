document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.querySelector('.chat-input-send-button');
    const messageInput = document.getElementById('message-input');
    const chatMessages = document.querySelector('.chat-messages');
    const spinner = document.getElementById('spinner'); // 스피너 요소 선택
    const historyButton = document.querySelector('.history img');
    const historyPanel = document.querySelector('.history-panel');
    const closeHistoryButton = document.querySelector('.close-history-panel');
    const historyContent = document.querySelector('.history-content');

    let currentChat = [];

    function getFormattedDateAndTime() {
        const today = new Date();
        const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
        const formattedDate = `${today.getMonth() + 1}월 ${today.getDate()}일 ${weekdays[today.getDay()]}`;
        const formattedTime = today.getHours().toString().padStart(2, '0') + ':' + today.getMinutes().toString().padStart(2, '0');
        return { formattedDate, formattedTime };
    }

    const { formattedDate, formattedTime } = getFormattedDateAndTime();
    const dateDiv = document.createElement('div');
    dateDiv.classList.add('date');
    dateDiv.textContent = formattedDate;
    chatMessages.appendChild(dateDiv);

    addMessageToChat("안녕하세요! 궁금한 내용이 있으신가요?", 'received', formattedTime, false);

    function sendMessage() {
        const message = messageInput.value.trim();
        if (message) {
            const { formattedTime } = getFormattedDateAndTime();
            addMessageToChat(message, 'send', formattedTime, true);
            messageInput.value = '';

            showSpinner();

            fetch('/query/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ question: message }),
            })
                .then(response => response.json())
                .then(data => {
                    const { formattedTime } = getFormattedDateAndTime();
                    addMessageToChat(data.answer.content, 'received', formattedTime, true);
                })
                .catch((error) => {
                    console.error('Error:', error);
                })
                .finally(() => {
                    hideSpinner();
                });
        }
    }

    function addMessageToChat(message, type, time, shouldSave) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', type);

        const urlRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#/%?=~_|!:,.;]*[-A-Z0-9+&@#/%=~_|])/ig;
        const messageWithLinks = message.replace(urlRegex, function (url) {
            return `<a href="${url}" target="_blank">${url}</a>`;
        });

        let messageHTML = `<div class="text">${messageWithLinks}</div><div class="time_${type}">${time || ''}</div>`;

        if (type === 'received') {
            messageHTML = `<div class="name">한영대 GPT&nbsp;</div>` + messageHTML;
        }

        messageDiv.innerHTML = messageHTML;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        if (shouldSave) {
            currentChat.push({ message, type, time });
        }
    }

    function saveCurrentChat() {
        if (currentChat.length > 0) {
            const chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
            chatSessions.push(currentChat);
            localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
            currentChat = [];
        }
    }

    function loadChatHistory() {
        const chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
        historyContent.innerHTML = '';
        for (let i = chatSessions.length - 1; i >= 0; i--) {
            addChatSessionToHistory(chatSessions[i], chatSessions.length - i);
        }
    }

    function addChatSessionToHistory(session, index) {
        const sessionDiv = document.createElement('div');
        sessionDiv.classList.add('history-item');
        sessionDiv.dataset.sessionIndex = index - 1;

        const sessionTitle = document.createElement('span');
        sessionTitle.textContent = `대화 ${index}`;

        const deleteButton = document.createElement('button');
        deleteButton.classList.add('delete-button');
        deleteButton.innerHTML = '&times;';
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteChatSession(sessionDiv.dataset.sessionIndex);
        });

        sessionDiv.appendChild(sessionTitle);
        sessionDiv.appendChild(deleteButton);
        sessionDiv.addEventListener('click', () => {
            loadChatSession(sessionDiv.dataset.sessionIndex);
        });

        historyContent.prepend(sessionDiv);
    }

    function deleteChatSession(sessionIndex) {
        let chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
        chatSessions.splice(sessionIndex, 1);
        localStorage.setItem('chatSessions', JSON.stringify(chatSessions));
        loadChatHistory();
    }

    function loadChatSession(sessionIndex) {
        const chatSessions = JSON.parse(localStorage.getItem('chatSessions')) || [];
        const session = chatSessions[sessionIndex];
        chatMessages.innerHTML = '';
        session.forEach(({ message, type, time }) => {
            addMessageToChat(message, type, time, false);
        });
    }

    function showSpinner() {
        spinner.style.display = 'block';
    }

    function hideSpinner() {
        spinner.style.display = 'none';
    }

    historyButton.addEventListener('click', () => {
        historyPanel.classList.toggle('open');
        loadChatHistory();
    });

    closeHistoryButton.addEventListener('click', () => {
        historyPanel.classList.remove('open');
    });

    window.addEventListener('beforeunload', saveCurrentChat);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    sendButton.addEventListener('click', sendMessage);
});