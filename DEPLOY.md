# Deploy HealthChat

## 1) Deploy backend (`chatbot-server`) len Render
1. Tao tai khoan Render.
2. New `Web Service` -> chon repo nay.
3. Dat `Root Directory`: `AI Young Guru/chatbot-server`
4. `Build Command`: `npm install`
5. `Start Command`: `npm start`
6. Them bien moi truong:
   - `DEEPSEEK_API_KEY=...` (key cua ban)
7. Deploy xong, Render se cho URL backend, vi du:
   - `https://healthchat-server.onrender.com`

## 2) Cau hinh frontend dung URL backend
1. Mo file `AI Young Guru/index.html`
2. Sua dong:
   - `window.CHAT_API_ENDPOINT = "";`
3. Thanh:
   - `window.CHAT_API_ENDPOINT = "https://healthchat-server.onrender.com/api/chat";`

## 3) Deploy frontend len Netlify
1. Tao tai khoan Netlify.
2. New site -> import repo.
3. `Base directory`: `AI Young Guru`
4. `Build command`: de trong
5. `Publish directory`: `AI Young Guru`
6. Deploy.

Sau khi deploy xong, gui link Netlify cho moi nguoi la vao duoc.
