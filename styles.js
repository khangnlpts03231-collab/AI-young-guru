// ============== PIN MANAGER ==============
class PinManager {
    constructor() {
        this.pins = [];
        this.usedPins = [];
        this.createdDate = null;
    }

    generateRandomPin() {
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let pin = '';
        for (let i = 0; i < 8; i++) {
            pin += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        return pin;
    }

    generatePins() {
        this.pins = [];
        this.usedPins = [];
        for (let i = 0; i < 8; i++) {
            let newPin;
            do {
                newPin = this.generateRandomPin();
            } while (this.pins.includes(newPin));
            this.pins.push(newPin);
        }
        this.createdDate = new Date();
        this.savePins();
        return this.pins;
    }

    savePins() {
        const pinsData = {
            pins: this.pins,
            usedPins: this.usedPins,
            createdDate: this.createdDate.getTime(),
            userEmail: appState.currentUser ? appState.currentUser.email : null
        };
        localStorage.setItem('userPins_' + (appState.currentUser ? appState.currentUser.email : ''), JSON.stringify(pinsData));
    }

    loadPins(email) {
        const pinsData = JSON.parse(localStorage.getItem('userPins_' + email) || 'null');
        if (pinsData) {
            this.pins = pinsData.pins || [];
            this.usedPins = pinsData.usedPins || [];
            this.createdDate = new Date(pinsData.createdDate);
            return true;
        }
        return false;
    }

    verifyPin(pin) {
        const pinUpper = pin.toUpperCase().trim();
        if (this.pins.includes(pinUpper) && !this.usedPins.includes(pinUpper)) {
            this.usedPins.push(pinUpper);
            this.savePins();
            return true;
        }
        return false;
    }

    canViewPins() {
        if (!this.createdDate) return false;
        const now = new Date();
        const diffTime = Math.abs(now - this.createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 30;
    }

    canGenerateNewPins() {
        // Chỉ được tạo mã PIN mới nếu đã dùng hết 8 cái
        return this.usedPins.length === this.pins.length && this.pins.length > 0;
    }

    getPinsStatus() {
        const remaining = this.pins.length - this.usedPins.length;
        return remaining;
    }

    getCreatedDateString() {
        if (!this.createdDate) return 'Chưa tạo';
        const options = { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' };
        return this.createdDate.toLocaleDateString('vi-VN', options);
    }

    getDaysUntilCanView() {
        if (!this.createdDate) return 0;
        const now = new Date();
        const diffTime = Math.abs(now - this.createdDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, 30 - diffDays);
    }

    getTimeUntilCanView() {
        if (!this.createdDate) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        
        const now = new Date();
        const viewDate = new Date(this.createdDate.getTime() + 30 * 24 * 60 * 60 * 1000);
        
        if (now >= viewDate) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        const diffTime = viewDate - now;
        const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diffTime % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diffTime % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
    }
}

const pinManager = new PinManager();

// ============== STATE MANAGEMENT ==============
class AppState {
    constructor() {
        this.currentUser = null;
        this.isAuthenticated = false;
        this.currentPage = 'login';
        this.healthHistory = [];
        this.initialHealthData = {
            name: '',
            health: '',
            busyTimes: [],
            freeTimes: [],
            goals: [],
            preferences: ''
        };
        this.initializeDemoUser();
        this.loadFromLocalStorage();
    }

    initializeDemoUser() {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (!users.some(function(u) { return u.email === 'demo@healthchat.com'; })) {
            users.push({
                id: Date.now(),
                name: 'Người Dùng Demo',
                email: 'demo@healthchat.com',
                password: '123456'
            });
            localStorage.setItem('users', JSON.stringify(users));
        }
    }

    loadFromLocalStorage() {
        const savedUser = localStorage.getItem('currentUser');
        const savedHealth = localStorage.getItem('healthHistory');
        const savedInitialHealth = localStorage.getItem('initialHealthData');
        
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.isAuthenticated = true;
            pinManager.loadPins(this.currentUser.email);
        }
        
        if (savedHealth) {
            this.healthHistory = JSON.parse(savedHealth);
        }

        if (savedInitialHealth) {
            this.initialHealthData = JSON.parse(savedInitialHealth);
        }
    }

    saveToLocalStorage() {
        if (this.currentUser) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }
        localStorage.setItem('healthHistory', JSON.stringify(this.healthHistory));
        localStorage.setItem('initialHealthData', JSON.stringify(this.initialHealthData));
    }
}

const appState = new AppState();

// ============== SETTINGS MANAGER ==============
class SettingsManager {
    constructor() {
        this.loadSettings();
    }

    loadSettings() {
        const saved = localStorage.getItem('userSettings');
        if (saved) {
            const settings = JSON.parse(saved);
            if (settings.theme === 'dark') {
                document.body.classList.add('dark-mode');
            }
            if (settings.primaryColor) {
                this.setThemeColor(settings.primaryColor);
            }
            if (settings.avatar) {
                this.updateAvatarDisplay(settings.avatar);
            }
        }
    }

    saveSettings(settings) {
        localStorage.setItem('userSettings', JSON.stringify(settings));
    }

    getSettings() {
        return JSON.parse(localStorage.getItem('userSettings') || '{}');
    }

    setThemeColor(color) {
        document.documentElement.style.setProperty('--primary-color', color);
        const dark = this.darkenColor(color, 0.2);
        const light = this.lightenColor(color, 0.3);
        document.documentElement.style.setProperty('--primary-dark', dark);
        document.documentElement.style.setProperty('--primary-light', light);
    }

    darkenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.max(0, (num >> 16) - amt);
        const G = Math.max(0, (num >> 8 & 0x00FF) - amt);
        const B = Math.max(0, (num & 0x0000FF) - amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    lightenColor(hex, percent) {
        const num = parseInt(hex.replace('#', ''), 16);
        const amt = Math.round(2.55 * percent);
        const R = Math.min(255, (num >> 16) + amt);
        const G = Math.min(255, (num >> 8 & 0x00FF) + amt);
        const B = Math.min(255, (num & 0x0000FF) + amt);
        return '#' + (0x1000000 + R * 0x10000 + G * 0x100 + B).toString(16).slice(1);
    }

    updateAvatarDisplay(avatarData) {
        const imgs = document.querySelectorAll('#avatarImg, #profileAvatarImg, #settingsAvatarImg');
        imgs.forEach(function(img) {
            if (img) img.src = avatarData;
        });
    }
}

const settingsManager = new SettingsManager();

// ============== AI ENGINE ==============
class AIEngine {
    constructor() {
        this.conversationContext = [];
    }

    generateResponse(message) {
        this.conversationContext.push(message);
        const lowerMessage = message.toLowerCase().trim();
        
        if (this.isGreeting(lowerMessage)) {
            return this.getGreeting();
        }

        if (this.isHealthRelated(lowerMessage)) {
            return this.handleHealthQuestion(lowerMessage, message);
        }

        if (this.isMealRelated(lowerMessage)) {
            return this.handleMealQuestion(lowerMessage, message);
        }

        if (this.isActivityRelated(lowerMessage)) {
            return this.handleActivityQuestion(lowerMessage, message);
        }

        if (this.isTimeRelated(lowerMessage)) {
            return this.handleTimeQuestion(lowerMessage, message);
        }

        if (this.isThanks(lowerMessage)) {
            return '😊 Không có chi! Tôi luôn sẵn lòng giúp bạn. Bạn có câu hỏi nào khác không?';
        }

        if (this.isApology(lowerMessage)) {
            return '😄 Không sao! Không cần xin lỗi. Hãy cứ thoải mái hỏi tôi bất cứ điều gì!';
        }

        return this.handleGeneralQuestion(lowerMessage, message);
    }

    isGreeting(msg) {
        const greetings = ['xin chào', 'chào', 'hello', 'hi', 'hey'];
        return greetings.some(function(g) { return msg.includes(g); });
    }

    isThanks(msg) {
        const thanks = ['cảm ơn', 'thanks', 'thank you', 'tks'];
        return thanks.some(function(t) { return msg.includes(t); });
    }

    isApology(msg) {
        const apologies = ['xin lỗi', 'lỗi', 'sorry'];
        return apologies.some(function(a) { return msg.includes(a); });
    }

    isHealthRelated(msg) {
        const healthKeywords = ['sức khỏe', 'khỏe', 'bệnh', 'bị', 'đau', 'mệt', 'cảm', 'lạnh', 'sốt', 'stress', 'giảm cân', 'tăng cơ', 'mất ngủ'];
        return healthKeywords.some(function(k) { return msg.includes(k); });
    }

    isMealRelated(msg) {
        const mealKeywords = ['ăn', 'bữa', 'cơm', 'thịt', 'rau', 'trái cây', 'dinh dưỡng', 'protein', 'đường', 'mặn', 'ngọt', 'nước', 'cafe', 'cà phê'];
        return mealKeywords.some(function(k) { return msg.includes(k); });
    }

    isActivityRelated(msg) {
        const activityKeywords = ['tập', 'chạy', 'yoga', 'gym', 'bơi', 'đạp xe', 'thể dục', 'luyện', 'exercise'];
        return activityKeywords.some(function(k) { return msg.includes(k); });
    }

    isTimeRelated(msg) {
        const timeKeywords = ['mấy giờ', 'giờ nào', 'khi nào', 'sáng', 'trưa', 'chiều', 'tối'];
        return timeKeywords.some(function(k) { return msg.includes(k); });
    }

    getGreeting() {
        const greetings = [
            '👋 Xin chào! Bạn khỏe không? Tôi là AI trợ lý sức khỏe của bạn.',
            '😊 Chào bạn! Rất vui được gặp bạn. Hôm nay tôi có thể giúp gì?',
            '👋 Hi! Tôi ở đây để hỗ trợ sức khỏe của bạn.'
        ];
        return greetings[Math.floor(Math.random() * greetings.length)];
    }

    handleHealthQuestion(lowerMsg) {
        if (lowerMsg.includes('mệt')) {
            return '😴 Bạn cảm thấy mệt mỏi?\n\n✅ Khắc phục:\n1. Ngủ 7-9 giờ mỗi đêm\n2. Ăn bữa sáng lành mạnh\n3. Uống 8-10 cốc nước/ngày\n4. Tập luyện 20-30 phút/ngày\n5. Kiểm tra với bác sĩ nếu kéo dài';
        }

        if (lowerMsg.includes('stress') || lowerMsg.includes('căng thẳng')) {
            return '😰 Giảm stress:\n1. Thiền 10-15 phút/ngày\n2. Tập thở sâu\n3. Nghe nhạc yêu thích\n4. Đi dạo 20-30 phút\n5. Tập thể dục 30 phút/ngày';
        }

        if (lowerMsg.includes('giảm cân')) {
            return '💪 Giảm cân an toàn:\n1. Ăn uống lành mạnh\n2. Tập 150-200 phút/tuần\n3. Uống nước đủ\n4. Ăn từ từ, nhai kỹ\n5. Không bỏ bữa';
        }

        if (lowerMsg.includes('tăng cơ')) {
            return '💪 Tăng cơ bắp:\n1. Ăn protein (1.6-2.2g/kg)\n2. Tập sức mạnh 3-4 lần/tuần\n3. Ngủ 7-9 giờ/đêm\n4. Tăng calories\n5. Kiên trì 8-12 tuần';
        }

        if (lowerMsg.includes('mất ngủ')) {
            return '😴 Khắc phục mất ngủ:\n1. Không dùng điện thoại trước ngủ\n2. Phòng tối, yên tĩnh\n3. Ngủ cùng giờ mỗi ngày\n4. Tránh caffein sau 3 PM\n5. Tập thể dục buổi sáng';
        }

        return '❤️ Sức khỏe là tài sản lớn nhất! Hãy ăn lành mạnh, tập luyện, ngủ đủ, quản lý stress.';
    }

    handleMealQuestion(lowerMsg) {
        if (lowerMsg.includes('sáng')) {
            return '🥣 Bữa sáng lành mạnh:\n• Cháo yến mạch + trái cây + sữa chua\n• Trứng + bánh mì + rau\n• Sữa + ngũ cốc + dâu tây\n\n💡 Ăn trong 1 giờ sau thức dậy!';
        }

        if (lowerMsg.includes('trưa')) {
            return '🍚 Bữa trưa cân bằng:\n• 50% rau xanh\n• 25% protein (cá, gà, tofu)\n• 25% carbs (cơm, khoai)\n\n💡 Ăn chậm, nhai kỹ!';
        }

        if (lowerMsg.includes('tối')) {
            return '🍜 Bữa tối nhẹ:\n• Ăn 2-3 giờ trước ngủ\n• Cơm + canh + cá/gà\n• Tránh nặng, dầu mỡ\n\n💡 Giúp ngủ ngon!';
        }

        if (lowerMsg.includes('protein')) {
            return '💪 Thực phẩm giàu protein:\n🐟 Cá hồi, cá trê\n🍗 Gà, trứng\n🥛 Sữa, phomai\n🫘 Đậu, hạt\n\n💡 0.8-1g/kg cân nặng/ngày!';
        }

        if (lowerMsg.includes('nước')) {
            return '💧 Uống nước đúng cách:\n• 8-10 cốc/ngày\n• Uống ấm vào sáng sớm\n• Uống trước-sau tập\n• Uống trước khi khát\n\n💡 Nước tốt nhất!';
        }

        return '🍽️ Ăn uống lành mạnh: 50% rau, 25% protein, 25% carbs. Ăn 3 bữa chính + 1-2 snack.';
    }

    handleActivityQuestion(lowerMsg) {
        if (lowerMsg.includes('chạy')) {
            return '🏃 Chạy bộ:\n• 30-45 phút, 3-4 lần/tuần\n• Nhịp độ vừa phải\n• Tăng từ từ\n• Giày tốt\n\n💡 Kiên trì 4-6 tuần!';
        }

        if (lowerMsg.includes('yoga')) {
            return '🧘 Yoga:\n• 20-30 phút/ngày\n• Tăng linh hoạt\n• Giảm stress\n• Sáng hoặc tối\n\n💡 Yoga + thiền = tuyệt vời!';
        }

        if (lowerMsg.includes('gym')) {
            return '💪 Gym:\n• 3-4 lần/tuần, 45-60 phút\n• Ngày làm, ngày nghỉ\n• Ăn protein trước-sau\n• Ngủ đủ\n\n💡 Đừng quá tích cực!';
        }

        if (lowerMsg.includes('bơi')) {
            return '🏊 Bơi:\n• 30 phút, 2-3 lần/tuần\n• Rèn toàn bộ cơ\n• Không áp lực\n• Tốt cho tim\n\n💡 Thể thao hoàn hảo!';
        }

        return '💪 Tập 150 phút/tuần: cardio + sức mạnh. Chạy, gym, yoga, bơi.';
    }

    handleTimeQuestion(lowerMsg) {
        if (lowerMsg.includes('sáng')) {
            return '☀️ Buổi sáng:\n6 AM: Thức dậy\n6:30 AM: Tập 30 phút\n7 AM: Tắm\n7:30 AM: Ăn sáng\n\n✅ Thức dậy sớm!';
        }

        if (lowerMsg.includes('trưa')) {
            return '🌞 Buổi trưa:\n11:30 AM: Bữa chính\n12:30 PM: Tập nhẹ\n1 PM: Nghỉ 20 phút\n\n✅ Bữa ăn chính!';
        }

        if (lowerMsg.includes('chiều')) {
            return '🏃 Buổi chiều (TỐI ƯU):\n3 PM: Ăn snack\n3:30 PM: Tập nặng\n4:30 PM: Kết thúc\n5 PM: Tắm\n\n✅ Năng lượng cao!';
        }

        if (lowerMsg.includes('tối')) {
            return '🌙 Buổi tối:\n6:30 PM: Bữa tối nhẹ\n7:30 PM: Yoga 20 phút\n8 PM: Đi dạo\n9 PM: Chuẩn bị ngủ\n10 PM: Ngủ\n\n✅ Chuẩn bị ngủ!';
        }

        return '⏰ Sáng (tập nhẹ) → Trưa (bữa chính) → Chiều (tập nặng) → Tối (thư giãn).';
    }

    handleGeneralQuestion(lowerMsg, originalMsg) {
        if (originalMsg.length > 50) {
            return '💭 Câu hỏi hay! Hãy cụ thể hơn để tôi giúp tốt nhất:\n• Vấn đề gì?\n• Muốn giải quyết sao?\n• Đã cố gắng gì chưa?';
        }

        const responses = [
            '🤔 Câu hỏi hay! Bạn có thể mô tả rõ hơn được không?\n\n✅ Tôi giúp: dinh dưỡng, tập luyện, giấc ngủ, stress.',
            '💡 Thú vị! Cho tôi biết thêm chi tiết để giúp tốt nhất!',
            '👂 Tôi nghe bạn! Hãy nói chi tiết hơn để tôi hiểu rõ.',
            '🎯 Hay lắm! Hãy cụ thể hóa để tôi giúp tối đa!'
        ];

        return responses[Math.floor(Math.random() * responses.length)];
    }

    escapeHtml(text) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return text.replace(/[&<>"']/g, function(m) { return map[m]; });
    }
}

const aiEngine = new AIEngine();

// ============== INITIAL CHAT FLOW ==============
class InitialChatFlow {
    constructor() {
        this.stage = 0;
        this.collectedInfo = {
            health: '',
            schedule: '',
            diet: '',
            goals: ''
        };
    }

    startFlow() {
        this.stage = 0;
        this.collectedInfo = { health: '', schedule: '', diet: '', goals: '' };
        this.showWelcomeMessage();
    }

    showWelcomeMessage() {
        const chatFlow = document.getElementById('chatFlow');
        chatFlow.innerHTML = '';

        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-bubble ai';
        aiMessage.innerHTML = '<p>🎉 Xin chào ' + appState.currentUser.name + '!\n\n💬 Hãy cho tôi biết về bạn.\n\nHôm nay bạn cảm thấy như thế nào?</p>';
        chatFlow.appendChild(aiMessage);
        this.createInputArea();
    }

    createInputArea() {
        const chatFlow = document.getElementById('chatFlow');
        const oldInput = chatFlow.querySelector('.user-input-area');
        if (oldInput) oldInput.remove();

        const inputContainer = document.createElement('div');
        inputContainer.className = 'user-input-area';

        const input = document.createElement('input');
        input.type = 'text';
        input.placeholder = 'Nhập câu trả lời...';
        input.style.flex = '1';
        input.style.padding = '12px 15px';
        input.style.border = '1px solid var(--border-color)';
        input.style.borderRadius = '24px';
        input.style.fontSize = '14px';

        const sendBtn = document.createElement('button');
        sendBtn.textContent = '➤';
        sendBtn.style.background = 'var(--primary-color)';
        sendBtn.style.border = 'none';
        sendBtn.style.color = 'white';
        sendBtn.style.width = '40px';
        sendBtn.style.height = '40px';
        sendBtn.style.borderRadius = '50%';
        sendBtn.style.cursor = 'pointer';
        sendBtn.style.fontSize = '18px';
        sendBtn.style.marginLeft = '10px';

        const self = this;

        sendBtn.addEventListener('click', function() {
            self.handleUserMessage(input.value);
            input.value = '';
            input.focus();
        });

        input.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                self.handleUserMessage(input.value);
                input.value = '';
                input.focus();
            }
        });

        inputContainer.appendChild(input);
        inputContainer.appendChild(sendBtn);
        chatFlow.appendChild(inputContainer);
        input.focus();
    }

    handleUserMessage(message) {
        if (!message.trim()) return;

        const chatFlow = document.getElementById('chatFlow');
        const userBubble = document.createElement('div');
        userBubble.className = 'chat-bubble user';
        userBubble.innerHTML = '<p>' + aiEngine.escapeHtml(message) + '</p>';
        chatFlow.appendChild(userBubble);

        const oldInput = chatFlow.querySelector('.user-input-area');
        if (oldInput) oldInput.remove();

        setTimeout(function() {
            chatFlow.scrollTop = chatFlow.scrollHeight;
        }, 100);

        const self = this;
        setTimeout(function() {
            self.processMessage(message);
        }, 500);
    }

    processMessage(message) {
        const chatFlow = document.getElementById('chatFlow');
        const loading = document.createElement('div');
        loading.className = 'chat-bubble ai';
        loading.innerHTML = '<div style="display: flex; gap: 6px;"><span style="width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%; animation: bounce 1.4s infinite;"></span><span style="width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%; animation: bounce 1.4s infinite; animation-delay: 0.2s;"></span><span style="width: 8px; height: 8px; background: var(--primary-color); border-radius: 50%; animation: bounce 1.4s infinite; animation-delay: 0.4s;"></span></div>';
        chatFlow.appendChild(loading);

        const self = this;

        setTimeout(function() {
            loading.remove();

            let response = '';

            if (self.stage === 0) {
                self.collectedInfo.health = message;
                response = '✅ Ghi nhận: ' + message + '.\n\n📅 Bạn rảnh giờ nào? (Sáng, trưa, chiều, tối?)';
                self.stage = 1;
            } else if (self.stage === 1) {
                self.collectedInfo.schedule = message;
                response = '✅ Bạn rảnh ' + message + '.\n\n🍽️ Bạn ăn gì trong ngày?';
                self.stage = 2;
            } else if (self.stage === 2) {
                self.collectedInfo.diet = message;
                response = '✅ Bạn ăn ' + message + '.\n\n🎯 Mục tiêu sức khỏe là gì?';
                self.stage = 3;
            } else if (self.stage === 3) {
                self.collectedInfo.goals = message;
                response = '✅ Mục tiêu: ' + message + '\n\n🎉 Lịch trình đã sẵn sàng!';
                self.stage = 4;
            }

            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-bubble ai';
            aiMessage.innerHTML = '<p>' + response + '</p>';
            chatFlow.appendChild(aiMessage);
            chatFlow.scrollTop = chatFlow.scrollHeight;

            if (self.stage === 4) {
                setTimeout(function() {
                    self.finishFlow();
                }, 1000);
            } else {
                self.createInputArea();
            }
        }, 800);
    }

    finishFlow() {
        const chatFlow = document.getElementById('chatFlow');
        const oldInput = chatFlow.querySelector('.user-input-area');
        if (oldInput) oldInput.remove();

        appState.initialHealthData.name = appState.currentUser.name;
        appState.initialHealthData.health = this.collectedInfo.health;
        appState.initialHealthData.preferences = this.collectedInfo.schedule + ' | ' + this.collectedInfo.diet + ' | ' + this.collectedInfo.goals;
        appState.saveToLocalStorage();

        const completeMsg = document.createElement('div');
        completeMsg.className = 'chat-bubble ai';
        completeMsg.innerHTML = '<p>📊 Thông tin của bạn:\n💪 ' + this.collectedInfo.health + '\n📅 ' + this.collectedInfo.schedule + '\n🍽️ ' + this.collectedInfo.diet + '\n🎯 ' + this.collectedInfo.goals + '</p>';
        chatFlow.appendChild(completeMsg);

        const startContainer = document.createElement('div');
        startContainer.style.padding = '20px';
        startContainer.style.textAlign = 'center';

        const startBtn = document.createElement('button');
        startBtn.textContent = '🚀 Bắt Đầu';
        startBtn.className = 'option-btn';
        startBtn.style.width = 'calc(100% - 40px)';
        startBtn.style.margin = '0 20px';
        startBtn.addEventListener('click', function() {
            app.goToPage('chat');
        });

        startContainer.appendChild(startBtn);
        chatFlow.appendChild(startContainer);
        chatFlow.scrollTop = chatFlow.scrollHeight;
    }
}

// ============== AVATAR CROP MANAGER ==============
class AvatarCropManager {
    constructor() {
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;
        this.imageSrc = '';
    }

    openModal(imageSrc) {
        const modal = document.getElementById('avatarCropModal');
        const cropImage = document.getElementById('cropImage');
        const zoomSlider = document.getElementById('zoomSlider');

        this.imageSrc = imageSrc;
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
        cropImage.src = imageSrc;
        zoomSlider.value = 1;
        cropImage.style.transform = 'translate(0, 0) scale(1)';

        modal.classList.add('active');

        this.setupDragListeners(cropImage);
        this.setupZoomListener(zoomSlider, cropImage);
    }

    closeModal() {
        const modal = document.getElementById('avatarCropModal');
        const cropImage = document.getElementById('cropImage');
        modal.classList.remove('active');
        cropImage.style.transform = 'translate(0, 0) scale(1)';
        this.offsetX = 0;
        this.offsetY = 0;
        this.scale = 1;
    }

    setupDragListeners(cropImage) {
        const self = this;

        cropImage.addEventListener('mousedown', function(e) {
            self.isDragging = true;
            self.startX = e.clientX - self.offsetX;
            self.startY = e.clientY - self.offsetY;
        });

        document.addEventListener('mousemove', function(e) {
            if (self.isDragging) {
                self.offsetX = e.clientX - self.startX;
                self.offsetY = e.clientY - self.startY;
                cropImage.style.transform = 'translate(' + self.offsetX + 'px, ' + self.offsetY + 'px) scale(' + self.scale + ')';
            }
        });

        document.addEventListener('mouseup', function() {
            self.isDragging = false;
        });

        cropImage.addEventListener('touchstart', function(e) {
            self.isDragging = true;
            self.startX = e.touches[0].clientX - self.offsetX;
            self.startY = e.touches[0].clientY - self.offsetY;
        });

        document.addEventListener('touchmove', function(e) {
            if (self.isDragging) {
                self.offsetX = e.touches[0].clientX - self.startX;
                self.offsetY = e.touches[0].clientY - self.startY;
                cropImage.style.transform = 'translate(' + self.offsetX + 'px, ' + self.offsetY + 'px) scale(' + self.scale + ')';
            }
        });

        document.addEventListener('touchend', function() {
            self.isDragging = false;
        });
    }

    setupZoomListener(zoomSlider, cropImage) {
        const self = this;
        zoomSlider.addEventListener('input', function(e) {
            self.scale = parseFloat(e.target.value);
            cropImage.style.transform = 'translate(' + self.offsetX + 'px, ' + self.offsetY + 'px) scale(' + self.scale + ')';
        });
    }

    cropImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const size = 280;

        canvas.width = size;
        canvas.height = size;

        const centerX = size / 2;
        const centerY = size / 2;
        const radius = size / 2;

        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        ctx.clip();

        const imageX = centerX - (150 * this.scale) + this.offsetX;
        const imageY = centerY - (150 * this.scale) + this.offsetY;
        const imageWidth = 300 * this.scale;
        const imageHeight = 300 * this.scale;

        const tempImg = new Image();
        tempImg.src = this.imageSrc;
        const self = this;

        return new Promise(function(resolve) {
            tempImg.onload = function() {
                ctx.drawImage(tempImg, imageX, imageY, imageWidth, imageHeight);
                resolve(canvas.toDataURL('image/png'));
            };
        });
    }
}

const avatarCropManager = new AvatarCropManager();

// ============== MAIN APP ==============
class HealthChatApp {
    constructor() {
        this.initialChat = new InitialChatFlow();
        this.settingsManager = settingsManager;
        this.avatarCropManager = avatarCropManager;
        this.currentFilterDays = 1;
        this.resetPasswordEmail = null;
        this.timerInterval = null;
        this.initializeEventListeners();
        
        if (appState.isAuthenticated) {
            this.goToPage('chat');
        }
    }

    initializeEventListeners() {
        const self = this;

        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', function(e) { self.handleLogin(e); });
        }

        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', function(e) { self.handleSignup(e); });
        }

        const switchToSignup = document.getElementById('switchToSignup');
        if (switchToSignup) {
            switchToSignup.addEventListener('click', function(e) {
                e.preventDefault();
                self.switchAuthPage('signup');
            });
        }

        const switchToLogin = document.getElementById('switchToLogin');
        if (switchToLogin) {
            switchToLogin.addEventListener('click', function(e) {
                e.preventDefault();
                self.switchAuthPage('login');
            });
        }

        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', function(e) {
                e.preventDefault();
                self.openForgotPasswordModal();
            });
        }

        const backToLoginBtn = document.getElementById('backToLoginBtn');
        if (backToLoginBtn) {
            backToLoginBtn.addEventListener('click', function() {
                self.closeForgotPasswordModal();
            });
        }

        const verifyPinBtn = document.getElementById('verifyPinBtn');
        if (verifyPinBtn) {
            verifyPinBtn.addEventListener('click', function() {
                self.verifyPin();
            });
        }

        const submitResetPasswordBtn = document.getElementById('submitResetPasswordBtn');
        if (submitResetPasswordBtn) {
            submitResetPasswordBtn.addEventListener('click', function() {
                self.submitResetPassword();
            });
        }

        const closeForgotBtn = document.getElementById('closeForgotBtn');
        if (closeForgotBtn) {
            closeForgotBtn.addEventListener('click', function() {
                self.closeForgotPasswordModal();
            });
        }

        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', function() { self.toggleSidebar(); });
        }

        const closeSidebar = document.getElementById('closeSidebar');
        if (closeSidebar) {
            closeSidebar.addEventListener('click', function() { self.toggleSidebar(); });
        }

        const overlay = document.getElementById('overlay');
        if (overlay) {
            overlay.addEventListener('click', function() { self.toggleSidebar(); });
        }

        document.querySelectorAll('.menu-item').forEach(function(item) {
            item.addEventListener('click', function(e) {
                document.querySelectorAll('.menu-item').forEach(function(i) { i.classList.remove('active'); });
                e.target.classList.add('active');
                const page = e.target.getAttribute('data-page');
                self.goToPage(page);
            });
        });

        const avatarBtn = document.getElementById('avatarBtn');
        if (avatarBtn) {
            avatarBtn.addEventListener('click', function() {
                const profileMenu = document.getElementById('profileMenu');
                if (profileMenu) profileMenu.classList.toggle('active');
            });
        }

        const settingsBtn = document.getElementById('settingsBtn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', function() {
                document.getElementById('profileMenu').classList.remove('active');
                self.goToPage('settings');
                setTimeout(function() { self.initializeSettingsPage(); }, 100);
            });
        }

        const securityBtn = document.getElementById('securityBtn');
        if (securityBtn) {
            securityBtn.addEventListener('click', function() {
                document.getElementById('profileMenu').classList.remove('active');
                self.goToPage('security');
                setTimeout(function() { self.initializeSecurityPage(); }, 100);
            });
        }

        const statsBtn = document.getElementById('statsBtn');
        if (statsBtn) {
            statsBtn.addEventListener('click', function() {
                document.getElementById('profileMenu').classList.remove('active');
                self.goToPage('stats');
                setTimeout(function() { self.initializeStatsPage(); }, 100);
            });
        }

        const backFromSettings = document.getElementById('backFromSettings');
        if (backFromSettings) {
            backFromSettings.addEventListener('click', function() { self.goToPage('chat'); });
        }

        const backFromSecurity = document.getElementById('backFromSecurity');
        if (backFromSecurity) {
            backFromSecurity.addEventListener('click', function() { self.goToPage('chat'); });
        }

        const backFromStats = document.getElementById('backFromStats');
        if (backFromStats) {
            backFromStats.addEventListener('click', function() { self.goToPage('chat'); });
        }

        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', function() { self.handleLogout(); });
        }

        const sendBtn = document.getElementById('mainSendBtn');
        if (sendBtn) {
            sendBtn.addEventListener('click', function() { self.sendMainMessage(); });
        }

        const mainChatInput = document.getElementById('mainChatInput');
        if (mainChatInput) {
            mainChatInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') self.sendMainMessage();
            });
        }

        const helpSendBtn = document.getElementById('helpSendBtn');
        if (helpSendBtn) {
            helpSendBtn.addEventListener('click', function() { self.sendHelpMessage(); });
        }

        const helpInput = document.getElementById('helpInput');
        if (helpInput) {
            helpInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') self.sendHelpMessage();
            });
        }

        document.querySelectorAll('input[type="range"]').forEach(function(input) {
            input.addEventListener('input', function(e) {
                const displayId = e.target.id + 'Display';
                const display = document.getElementById(displayId);
                if (display) display.textContent = e.target.value;
            });
        });

        const submitHealthBtn = document.getElementById('submitHealthBtn');
        if (submitHealthBtn) {
            submitHealthBtn.addEventListener('click', function() { self.submitHealthAssessment(); });
        }

        const clearAllHistoryBtn = document.getElementById('clearAllHistoryBtn');
        if (clearAllHistoryBtn) {
            clearAllHistoryBtn.addEventListener('click', function() { self.clearAllHistory(); });
        }

        document.addEventListener('click', function(e) {
            const profileMenu = document.getElementById('profileMenu');
            const avatarBtn = document.getElementById('avatarBtn');
            if (profileMenu && avatarBtn && !profileMenu.contains(e.target) && !avatarBtn.contains(e.target)) {
                profileMenu.classList.remove('active');
            }
        });
    }

    openForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.classList.add('active');
            document.getElementById('forgotPinInput').value = '';
            document.getElementById('pinVerifySection').style.display = 'block';
            document.getElementById('resetPasswordSection').style.display = 'none';
        }
    }

    closeForgotPasswordModal() {
        const modal = document.getElementById('forgotPasswordModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    verifyPin() {
        const pinInput = document.getElementById('forgotPinInput').value.trim();
        
        if (!pinInput) {
            alert('❌ Vui lòng nhập Mã PIN!');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        let found = false;

        for (let i = 0; i < users.length; i++) {
            const user = users[i];
            if (pinManager.loadPins(user.email)) {
                if (pinManager.verifyPin(pinInput)) {
                    this.resetPasswordEmail = user.email;
                    found = true;
                    break;
                }
            }
        }

        if (found) {
            document.getElementById('pinVerifySection').style.display = 'none';
            document.getElementById('resetPasswordSection').style.display = 'block';
            alert('✅ Mã PIN đúng! Hãy đặt mật khẩu mới.');
        } else {
            alert('❌ Mã PIN không đúng hoặc đã được sử dụng!');
        }
    }

    submitResetPassword() {
        const newPassword = document.getElementById('newPasswordReset').value;
        const confirmPassword = document.getElementById('confirmPasswordReset').value;

        if (!newPassword || !confirmPassword) {
            alert('❌ Vui lòng điền đầy đủ!');
            return;
        }

        if (newPassword !== confirmPassword) {
            alert('❌ Mật khẩu không trùng khớp!');
            return;
        }

        if (newPassword.length < 6) {
            alert('❌ Mật khẩu phải 6+ ký tự!');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIdx = users.findIndex(function(u) { return u.email === this.resetPasswordEmail; }.bind(this));

        if (userIdx !== -1) {
            users[userIdx].password = newPassword;
            localStorage.setItem('users', JSON.stringify(users));
            alert('✅ Mật khẩu đã cập nhật! Hãy đăng nhập lại.');
            this.closeForgotPasswordModal();
            this.switchAuthPage('login');
        }
    }

    handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value;

        if (email && password) {
            const users = JSON.parse(localStorage.getItem('users') || '[]');
            const user = users.find(function(u) { return u.email === email && u.password === password; });

            if (user) {
                appState.currentUser = user;
                appState.isAuthenticated = true;
                appState.saveToLocalStorage();
                pinManager.loadPins(user.email);
                
                const userNameEl = document.getElementById('userName');
                const userEmailEl = document.getElementById('userEmail');
                if (userNameEl) userNameEl.textContent = user.name;
                if (userEmailEl) userEmailEl.textContent = user.email;
                
                this.showInitialChat();
            } else {
                alert('❌ Email hoặc mật khẩu không chính xác!');
            }
        }
    }

    handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirm = document.getElementById('signupConfirm').value;

        if (!name || !email || !password || !confirm) {
            alert('❌ Vui lòng điền đầy đủ!');
            return;
        }

        if (password !== confirm) {
            alert('❌ Mật khẩu không trùng khớp!');
            return;
        }

        if (password.length < 6) {
            alert('❌ Mật khẩu phải 6+ ký tự!');
            return;
        }

        const users = JSON.parse(localStorage.getItem('users') || '[]');
        if (users.some(function(u) { return u.email === email; })) {
            alert('❌ Email đã được dùng!');
            return;
        }

        const newUser = { id: Date.now(), name: name, email: email, password: password };
        users.push(newUser);
        localStorage.setItem('users', JSON.stringify(users));

        document.getElementById('signupName').value = '';
        document.getElementById('signupEmail').value = '';
        document.getElementById('signupPassword').value = '';
        document.getElementById('signupConfirm').value = '';

        const successMsg = document.getElementById('signupSuccess');
        if (successMsg) {
            successMsg.style.display = 'block';
            const self = this;
            setTimeout(function() {
                successMsg.style.display = 'none';
                self.switchAuthPage('login');
            }, 2000);
        }
    }

    handleLogout() {
        appState.isAuthenticated = false;
        appState.currentUser = null;
        localStorage.removeItem('currentUser');
        this.goToPage('login');
    }

    showInitialChat() {
        this.goToPage('initialChat');
        this.initialChat.startFlow();
    }

    switchAuthPage(page) {
        const loginPage = document.getElementById('loginPage');
        const signupPage = document.getElementById('signupPage');

        if (page === 'signup') {
            if (loginPage) loginPage.classList.remove('active');
            if (signupPage) signupPage.classList.add('active');
        } else {
            if (signupPage) signupPage.classList.remove('active');
            if (loginPage) loginPage.classList.add('active');
        }
    }

    goToPage(pageName) {
        document.querySelectorAll('.page').forEach(function(page) { page.classList.remove('active'); });
        
        let pageId = '';
        switch(pageName) {
            case 'chat': pageId = 'chatPage'; break;
            case 'schedule': pageId = 'schedulePage'; break;
            case 'health': pageId = 'healthPage'; break;
            case 'help': pageId = 'helpPage'; break;
            case 'initialChat': pageId = 'initialChatPage'; break;
            case 'login': pageId = 'loginPage'; break;
            case 'signup': pageId = 'signupPage'; break;
            case 'settings': pageId = 'settingsPage'; break;
            case 'security': pageId = 'securityPage'; break;
            case 'stats': pageId = 'statsPage'; break;
        }
        
        if (pageId) {
            const page = document.getElementById(pageId);
            if (page) page.classList.add('active');
        }

        if (pageName !== 'login' && pageName !== 'signup' && pageName !== 'initialChat' && pageName !== 'settings' && pageName !== 'security' && pageName !== 'stats') {
            this.toggleSidebar(false);
            document.querySelectorAll('.menu-item').forEach(function(item) {
                item.classList.remove('active');
                if (item.getAttribute('data-page') === pageName) {
                    item.classList.add('active');
                }
            });
        }

        if (pageName === 'schedule') {
            this.generateSchedule();
        } else if (pageName === 'health') {
            this.updateHealthDisplay();
        }
    }

    toggleSidebar(force) {
        const sidebar = document.getElementById('sidebar');
        const overlay = document.getElementById('overlay');

        if (sidebar && overlay) {
            if (force !== null && force !== undefined) {
                if (force) {
                    sidebar.classList.add('active');
                    overlay.classList.add('active');
                } else {
                    sidebar.classList.remove('active');
                    overlay.classList.remove('active');
                }
            } else {
                sidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            }
        }
    }

    sendMainMessage() {
        const input = document.getElementById('mainChatInput');
        const message = input.value.trim();

        if (message) {
            const chatMessages = document.getElementById('chatMessages');

            const userBubble = document.createElement('div');
            userBubble.className = 'chat-bubble user';
            userBubble.innerHTML = '<p>' + aiEngine.escapeHtml(message) + '</p>';
            chatMessages.appendChild(userBubble);

            input.value = '';

            const loading = document.getElementById('loadingIndicator');
            if (loading) loading.style.display = 'flex';

            setTimeout(function() {
                if (loading) loading.style.display = 'none';
                
                const aiResponse = aiEngine.generateResponse(message);
                const aiBubble = document.createElement('div');
                aiBubble.className = 'chat-bubble ai';
                aiBubble.innerHTML = '<p>' + aiResponse + '</p>';
                chatMessages.appendChild(aiBubble);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }, 800);

            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    }

    sendHelpMessage() {
        const input = document.getElementById('helpInput');
        const message = input.value.trim();

        if (message) {
            const helpMessages = document.getElementById('helpMessages');

            const userBubble = document.createElement('div');
            userBubble.className = 'chat-bubble user';
            userBubble.innerHTML = '<p>' + aiEngine.escapeHtml(message) + '</p>';
            helpMessages.appendChild(userBubble);

            input.value = '';

            const loading = document.getElementById('helpLoadingIndicator');
            if (loading) loading.style.display = 'flex';

            setTimeout(function() {
                if (loading) loading.style.display = 'none';
                
                const aiResponse = aiEngine.generateResponse(message);
                const aiBubble = document.createElement('div');
                aiBubble.className = 'chat-bubble ai';
                aiBubble.innerHTML = '<p>' + aiResponse + '</p>';
                helpMessages.appendChild(aiBubble);
                helpMessages.scrollTop = helpMessages.scrollHeight;
            }, 800);

            helpMessages.scrollTop = helpMessages.scrollHeight;
        }
    }

    generateSchedule() {
        const schedule = [];
        const pref = appState.initialHealthData.preferences || '';

        schedule.push({
            time: '7:00 AM - 8:00 AM',
            emoji: '🥣',
            title: 'Bữa Sáng',
            suggestion: 'Cháo yến mạch + Trái cây + Sữa chua'
        });

        if (pref.includes('sáng')) {
            schedule.push({
                time: '8:00 AM - 9:00 AM',
                emoji: '💪',
                title: 'Tập Luyện',
                suggestion: 'Chạy bộ 30 phút hoặc Yoga'
            });
        }

        schedule.push({
            time: '12:00 PM - 1:00 PM',
            emoji: '🍚',
            title: 'Bữa Trưa',
            suggestion: 'Cơm + Thịt nướng + Rau xanh'
        });

        if (pref.includes('chiều')) {
            schedule.push({
                time: '3:00 PM - 5:00 PM',
                emoji: '⚽',
                title: 'Tập Luyện',
                suggestion: 'Gym hoặc Cardio'
            });
        }

        schedule.push({
            time: '6:30 PM - 7:30 PM',
            emoji: '🍜',
            title: 'Bữa Tối',
            suggestion: 'Cơm + Cá/Gà + Canh'
        });

        const scheduleContent = document.getElementById('scheduleContent');
        if (scheduleContent) {
            scheduleContent.innerHTML = schedule.map(function(item) {
                return '<div class="schedule-card"><h3>' + item.emoji + ' ' + item.title + '</h3><p><span class="schedule-time">' + item.time + '</span></p><p>' + item.suggestion + '</p></div>';
            }).join('');
        }
    }

    submitHealthAssessment() {
        const energy = parseInt(document.getElementById('energyLevel').value);
        const sleep = parseInt(document.getElementById('sleepQuality').value);
        const mood = parseInt(document.getElementById('mood').value);
        const stress = parseInt(document.getElementById('stress').value);
        const hunger = parseInt(document.getElementById('hunger').value);

        const score = Math.round(((energy + sleep + mood + (10 - stress) + hunger) / 5) * 10);

        const assessment = {
            date: new Date().toLocaleDateString('vi-VN'),
            time: new Date().toLocaleTimeString('vi-VN'),
            energy: energy,
            sleep: sleep,
            mood: mood,
            stress: stress,
            hunger: hunger,
            score: score
        };

        appState.healthHistory.push(assessment);
        appState.saveToLocalStorage();

        const scoreEl = document.getElementById('wellBeingScore');
        if (scoreEl) scoreEl.textContent = score;

        const statusEl = document.getElementById('scoreStatus');
        if (statusEl) {
            let status = '😊 Tuyệt vời!';
            if (score < 50) status = '😔 Cần cải thiện';
            else if (score < 70) status = '😐 Bình thường';
            statusEl.textContent = status + ' (' + score + '/100)';
        }

        this.updateHealthHistory();
        alert('✅ Đánh giá đã lưu!');
    }

    updateHealthDisplay() {
        if (appState.healthHistory.length > 0) {
            const latest = appState.healthHistory[appState.healthHistory.length - 1];
            const scoreEl = document.getElementById('wellBeingScore');
            if (scoreEl) scoreEl.textContent = latest.score;
        }
        this.updateHealthHistory();
    }

    updateHealthHistory() {
        const historyContainer = document.getElementById('healthHistory');
        if (historyContainer) {
            if (appState.healthHistory.length === 0) {
                historyContainer.innerHTML = '<div class="history-empty">📝 Chưa có đánh giá nào. Hãy bắt đầu đánh giá sức khỏe của bạn!</div>';
            } else {
                const sorted = appState.healthHistory.slice().reverse();
                historyContainer.innerHTML = sorted.map(function(item, index) {
                    return '<div class="history-item">' +
                        '<div class="history-item-content">' +
                            '<div class="history-date">📅 ' + item.date + ' ' + item.time + '</div>' +
                            '<div class="history-item-data">' +
                                '<p>💪 Năng lượng: <strong>' + item.energy + '/10</strong></p>' +
                                '<p>😴 Giấc ngủ: <strong>' + item.sleep + '/10</strong></p>' +
                                '<p>😊 Tâm trạng: <strong>' + item.mood + '/10</strong></p>' +
                                '<p>😰 Stress: <strong>' + item.stress + '/10</strong></p>' +
                                '<p>🍽️ Cơn đói: <strong>' + item.hunger + '/10</strong></p>' +
                            '</div>' +
                            '<div class="history-item-score">Điểm sức khỏe: <strong>' + item.score + '/100</strong></div>' +
                        '</div>' +
                        '<button class="btn-delete-item" data-index="' + index + '" title="Xóa">✕</button>' +
                        '</div>';
                }).join('');

                const self = this;
                document.querySelectorAll('.btn-delete-item').forEach(function(btn) {
                    btn.addEventListener('click', function() {
                        const index = parseInt(this.getAttribute('data-index'));
                        const actualIndex = appState.healthHistory.length - 1 - index;
                        self.deleteHealthRecord(actualIndex);
                    });
                });
            }
        }
    }

    deleteHealthRecord(index) {
        if (index >= 0 && index < appState.healthHistory.length) {
            appState.healthHistory.splice(index, 1);
            appState.saveToLocalStorage();
            this.updateHealthHistory();
        }
    }

    clearAllHistory() {
        if (appState.healthHistory.length === 0) {
            alert('❌ Không có lịch sử để xóa!');
            return;
        }

        if (confirm('⚠️ Xóa tất cả lịch sử? Không thể hoàn tác!')) {
            appState.healthHistory = [];
            appState.saveToLocalStorage();
            
            const scoreEl = document.getElementById('wellBeingScore');
            if (scoreEl) scoreEl.textContent = '0';
            
            const statusEl = document.getElementById('scoreStatus');
            if (statusEl) statusEl.textContent = 'Chưa đánh giá';
            
            this.updateHealthHistory();
            alert('✅ Đã xóa tất cả lịch sử!');
        }
    }

    initializeSettingsPage() {
        const settings = this.settingsManager.getSettings();
        const self = this;
        
        const nameInput = document.getElementById('settingsName');
        const emailInput = document.getElementById('settingsEmail');
        if (nameInput && appState.currentUser) nameInput.value = appState.currentUser.name || '';
        if (emailInput && appState.currentUser) emailInput.value = appState.currentUser.email || '';

        document.querySelectorAll('input[name="theme"]').forEach(function(radio) {
            if ((radio.value === 'dark' && document.body.classList.contains('dark-mode')) ||
                (radio.value === 'light' && !document.body.classList.contains('dark-mode'))) {
                radio.checked = true;
            }

            radio.addEventListener('change', function(e) {
                if (e.target.value === 'dark') {
                    document.body.classList.add('dark-mode');
                    const s = self.settingsManager.getSettings();
                    s.theme = 'dark';
                    self.settingsManager.saveSettings(s);
                } else {
                    document.body.classList.remove('dark-mode');
                    const s = self.settingsManager.getSettings();
                    s.theme = 'light';
                    self.settingsManager.saveSettings(s);
                }
            });
        });

        document.querySelectorAll('.color-btn').forEach(function(btn) {
            const color = btn.getAttribute('data-color');
            btn.style.backgroundColor = color;
            if (settings.primaryColor === color) btn.classList.add('active');
            btn.addEventListener('click', function() {
                document.querySelectorAll('.color-btn').forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                self.settingsManager.setThemeColor(color);
                const s = self.settingsManager.getSettings();
                s.primaryColor = color;
                self.settingsManager.saveSettings(s);
            });
        });

        const uploadAvatarBtn = document.getElementById('uploadAvatarBtn');
        const avatarFileInput = document.getElementById('avatarFileInput');

        if (uploadAvatarBtn && avatarFileInput) {
            uploadAvatarBtn.addEventListener('click', function() {
                avatarFileInput.click();
            });

            avatarFileInput.addEventListener('change', function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(event) {
                        self.avatarCropManager.openModal(event.target.result);
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const confirmCropBtn = document.getElementById('confirmCropBtn');
        if (confirmCropBtn) {
            confirmCropBtn.addEventListener('click', function() {
                self.avatarCropManager.cropImage().then(function(croppedImage) {
                    self.settingsManager.updateAvatarDisplay(croppedImage);
                    const s = self.settingsManager.getSettings();
                    s.avatar = croppedImage;
                    self.settingsManager.saveSettings(s);
                    alert('✅ Avatar đã cập nhật!');
                    self.avatarCropManager.closeModal();
                });
            });
        }

        const cancelCropBtn = document.getElementById('cancelCropBtn');
        const closeCropBtn = document.getElementById('closeCropBtn');
        if (cancelCropBtn) {
            cancelCropBtn.addEventListener('click', function() {
                self.avatarCropManager.closeModal();
            });
        }
        if (closeCropBtn) {
            closeCropBtn.addEventListener('click', function() {
                self.avatarCropManager.closeModal();
            });
        }

        const updateProfileBtn = document.getElementById('updateProfileBtn');
        if (updateProfileBtn) {
            updateProfileBtn.addEventListener('click', function() {
                const newName = document.getElementById('settingsName').value.trim();
                const newEmail = document.getElementById('settingsEmail').value.trim();

                if (!newName || !newEmail) {
                    alert('❌ Vui lòng điền đầy đủ!');
                    return;
                }

                appState.currentUser.name = newName;
                appState.currentUser.email = newEmail;
                appState.saveToLocalStorage();

                document.getElementById('userName').textContent = newName;
                document.getElementById('userEmail').textContent = newEmail;

                alert('✅ Thông tin đã cập nhật!');
            });
        }

        const updatePasswordBtn = document.getElementById('updatePasswordBtn');
        if (updatePasswordBtn) {
            updatePasswordBtn.addEventListener('click', function() {
                const currentPwd = document.getElementById('currentPassword').value;
                const newPwd = document.getElementById('newPassword').value;
                const confirmPwd = document.getElementById('confirmPassword').value;

                if (!currentPwd || !newPwd || !confirmPwd) {
                    alert('❌ Vui lòng điền đầy đủ!');
                    return;
                }

                if (currentPwd !== appState.currentUser.password) {
                    alert('❌ Mật khẩu sai!');
                    return;
                }

                if (newPwd !== confirmPwd) {
                    alert('❌ Mật khẩu không trùng!');
                    return;
                }

                if (newPwd.length < 6) {
                    alert('❌ Mật khẩu 6+ ký tự!');
                    return;
                }

                const users = JSON.parse(localStorage.getItem('users') || '[]');
                const userIdx = users.findIndex(function(u) { return u.email === appState.currentUser.email; });
                if (userIdx !== -1) {
                    users[userIdx].password = newPwd;
                    localStorage.setItem('users', JSON.stringify(users));
                    appState.currentUser.password = newPwd;
                    appState.saveToLocalStorage();
                    alert('✅ Mật khẩu cập nhật!');
                    
                    document.getElementById('currentPassword').value = '';
                    document.getElementById('newPassword').value = '';
                    document.getElementById('confirmPassword').value = '';
                }
            });
        }
    }

    initializeSecurityPage() {
        const self = this;

        const generatePinBtn = document.getElementById('generatePinBtn');
        if (generatePinBtn) {
            generatePinBtn.addEventListener('click', function() {
                self.generateNewPin();
            });
        }

        const viewPinBtn = document.getElementById('viewPinBtn');
        if (viewPinBtn) {
            viewPinBtn.addEventListener('click', function() {
                self.viewPins();
            });
        }

        this.updatePinStatus();
        this.startPinTimer();
    }

    generateNewPin() {
        if (!pinManager.createdDate) {
            // Chưa tạo lần nào
            const pins = pinManager.generatePins();
            this.displayPins(pins);
            this.updatePinStatus();
        } else if (pinManager.canGenerateNewPins()) {
            // Đã dùng hết 8 mã PIN, được tạo mới
            const pins = pinManager.generatePins();
            this.displayPins(pins);
            this.updatePinStatus();
        } else {
            // Chưa dùng hết 8 mã PIN
            const remaining = pinManager.getPinsStatus();
            alert('⚠️ Bạn còn ' + remaining + ' mã PIN chưa sử dụng!\n\nChỉ được tạo mã PIN mới khi đã dùng hết 8 mã hiện tại.');
        }
    }

    displayPins(pins) {
        const modal = document.getElementById('pinDisplayModal');
        const pinsGrid = document.getElementById('pinsGrid');

        pinsGrid.innerHTML = pins.map(function(pin) {
            return '<div class="pin-box">' + pin + '</div>';
        }).join('');

        const closePinDisplayBtn = document.getElementById('closePinDisplayBtn');
        const closePinDisplayBtnBottom = document.getElementById('closePinDisplayBtnBottom');

        const closePin = function() {
            modal.classList.remove('active');
        };

        if (closePinDisplayBtn) closePinDisplayBtn.addEventListener('click', closePin);
        if (closePinDisplayBtnBottom) closePinDisplayBtnBottom.addEventListener('click', closePin);

        modal.classList.add('active');
    }

    viewPins() {
        if (!pinManager.createdDate) {
            alert('❌ Chưa tạo Mã PIN! Hãy nhấn "Tạo Mã PIN Mới"');
            return;
        }

        const daysUntil = pinManager.getDaysUntilCanView();

        // Nếu chưa đủ 30 ngày, KHÓA không cho xem
        if (daysUntil > 0) {
            const time = pinManager.getTimeUntilCanView();
            let timeStr = '';
            if (time.days > 0) {
                timeStr = time.days + ' ngày ' + time.hours + ' giờ ' + time.minutes + ' phút';
            } else if (time.hours > 0) {
                timeStr = time.hours + ' giờ ' + time.minutes + ' phút ' + time.seconds + ' giây';
            } else {
                timeStr = time.minutes + ' phút ' + time.seconds + ' giây';
            }
            alert('🔒 BẢNG BẢO VỀ - Mã PIN bị khóa!\n\n⏳ Chỉ được xem sau: ' + timeStr);
            return;
        }

        // Nếu đã đủ 30 ngày, hiển thị mã PIN
        this.displayPins(pinManager.pins);
    }

    updatePinStatus() {
        const pinStatus = document.getElementById('pinStatus');
        if (pinStatus) {
            if (!pinManager.createdDate) {
                pinStatus.innerHTML = '<p>❌ Chưa tạo Mã PIN</p>';
            } else {
                const remaining = pinManager.getPinsStatus();
                const createdDate = pinManager.getCreatedDateString();
                const daysUntil = pinManager.getDaysUntilCanView();

                let html = '<p>✅ Mã PIN được tạo lúc: ' + createdDate + '</p>';
                html += '<p>📊 Mã PIN còn lại: <strong>' + remaining + '/8</strong></p>';
                
                if (daysUntil > 0) {
                    html += '<p>🔒 Mã PIN bị khóa - Có thể xem sau: <strong id="countdownTimer">' + daysUntil + ' ngày</strong></p>';
                } else {
                    html += '<p>🔓 Mã PIN đã mở khóa - Bạn có thể xem bất cứ lúc nào!</p>';
                }

                if (pinManager.canGenerateNewPins()) {
                    html += '<p style="color: var(--primary-color); font-weight: 600;">🆕 Bạn đã dùng hết 8 mã PIN, có thể tạo mã mới!</p>';
                } else if (remaining > 0) {
                    html += '<p style="color: var(--text-secondary);">⏳ Còn ' + remaining + ' mã chưa dùng, chờ dùng hết hoặc 30 ngày</p>';
                }

                pinStatus.innerHTML = html;
            }
        }
    }

    startPinTimer() {
        const self = this;
        if (this.timerInterval) clearInterval(this.timerInterval);

        this.timerInterval = setInterval(function() {
            if (pinManager.createdDate && !pinManager.canViewPins()) {
                const time = pinManager.getTimeUntilCanView();
                const timerEl = document.getElementById('countdownTimer');
                
                if (timerEl) {
                    if (time.days > 0) {
                        timerEl.textContent = time.days + ' ngày ' + time.hours + ' giờ ' + time.minutes + ' phút';
                    } else if (time.hours > 0 || time.minutes > 0) {
                        timerEl.textContent = time.hours + ' giờ ' + time.minutes + ' phút ' + time.seconds + ' giây';
                    } else {
                        timerEl.textContent = time.seconds + ' giây';
                    }

                    // Cập nhật lại khi thời gian hết
                    if (time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0) {
                        self.updatePinStatus();
                    }
                }
            }
        }, 1000);
    }

    initializeStatsPage() {
        const self = this;
        const filterBtns = document.querySelectorAll('.filter-btn');

        filterBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                filterBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                self.currentFilterDays = parseInt(btn.getAttribute('data-days'));
                self.updateStatistics();
            });
        });

        this.updateStatistics();
    }

    updateStatistics() {
        const now = new Date();
        const startDate = new Date(now.getTime() - this.currentFilterDays * 24 * 60 * 60 * 1000);

        const filtered = appState.healthHistory.filter(function(item) {
            const parts = item.date.split('/');
            const itemDate = new Date(parts[2] + '-' + parts[1] + '-' + parts[0]);
            return itemDate >= startDate;
        });

        if (filtered.length === 0) {
            document.getElementById('avgScore').textContent = '0';
            document.getElementById('avgEnergy').textContent = '0';
            document.getElementById('avgSleep').textContent = '0';
            document.getElementById('avgMood').textContent = '0';
            document.getElementById('avgStress').textContent = '0';
            document.getElementById('avgHunger').textContent = '0';
            document.getElementById('detailedStats').innerHTML = '<p>Chưa có dữ liệu.</p>';
            return;
        }

        const avgScore = Math.round(filtered.reduce(function(a, b) { return a + b.score; }, 0) / filtered.length);
        const avgEnergy = Math.round(filtered.reduce(function(a, b) { return a + b.energy; }, 0) / filtered.length);
        const avgSleep = Math.round(filtered.reduce(function(a, b) { return a + b.sleep; }, 0) / filtered.length);
        const avgMood = Math.round(filtered.reduce(function(a, b) { return a + b.mood; }, 0) / filtered.length);
        const avgStress = Math.round(filtered.reduce(function(a, b) { return a + b.stress; }, 0) / filtered.length);
        const avgHunger = Math.round(filtered.reduce(function(a, b) { return a + b.hunger; }, 0) / filtered.length);

        document.getElementById('avgScore').textContent = avgScore;
        document.getElementById('avgEnergy').textContent = avgEnergy;
        document.getElementById('avgSleep').textContent = avgSleep;
        document.getElementById('avgMood').textContent = avgMood;
        document.getElementById('avgStress').textContent = avgStress;
        document.getElementById('avgHunger').textContent = avgHunger;

        const detailedStats = document.getElementById('detailedStats');
        if (detailedStats) {
            detailedStats.innerHTML = filtered.map(function(item) {
                return '<div class="detailed-stat"><strong>' + item.date + ':</strong> Điểm ' + item.score + ' | Năng lượng ' + item.energy + ' | Giấc ngủ ' + item.sleep + '</div>';
            }).join('');
        }
    }
}

// ============== INITIALIZE ==============
const app = new HealthChatApp();

window.addEventListener('load', function() {
    if (appState.isAuthenticated && appState.currentUser) {
        const userNameEl = document.getElementById('userName');
        const userEmailEl = document.getElementById('userEmail');
        if (userNameEl) userNameEl.textContent = appState.currentUser.name;
        if (userEmailEl) userEmailEl.textContent = appState.currentUser.email;
        app.goToPage('chat');
    }
});

window.addEventListener('beforeunload', function() {
    if (app.timerInterval) {
        clearInterval(app.timerInterval);
    }
});