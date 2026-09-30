# 🚀 Real User & IP Information Service (EC2 Ready)

A production-ready Node.js / Express backend that fetches **real user data and real public IP information** instead of dummy placeholders.

Every response is **properly formatted, indented JSON** (`app.set('json spaces', 2)`).

---

## 📌 Real Data Features

1. **Real Public IP Address**:
   - Automatically detects your external public WAN IP (even when testing on `localhost:3000`).
   - On EC2, it reads the remote caller's actual public IP address.
2. **Real Geolocation & ISP**:
   - Fetches live City, Region, Country, Postal Code, Timezone, and ISP/Organization (e.g. Airtel, Jio, Comcast, etc.).
3. **Real System User Details**:
   - Extracts actual OS user username (e.g. `Admin`), Home Directory, Hostname, CPU cores, and OS architecture from the machine.
4. **Real Device & Browser Detection**:
   - Parses the incoming `User-Agent` header to report actual browser (Chrome, Edge, Firefox, Safari) and OS (Windows 11, macOS, Linux, Android, iOS).

---

## 📋 Real JSON Response Example (`GET /`)

```json
{
  "status": "success",
  "timestamp": "2026-09-30T17:30:15.120Z",
  "realPublicIp": "103.xxx.xxx.xxx",
  "connectionType": "Localhost (Fetched WAN Public IP)",
  "realUserDetails": {
    "username": "Admin",
    "homeDirectory": "C:\\Users\\Admin",
    "machineHostname": "YOUR-PC",
    "operatingSystem": "Windows_NT 10.0.26100 (x64)",
    "totalMemory": "16384 MB"
  },
  "ipGeolocation": {
    "city": "Mumbai",
    "region": "Maharashtra",
    "country": "India",
    "countryCode": "IN",
    "zipCode": "400001",
    "timezone": "Asia/Kolkata",
    "isp": "Bharti Airtel",
    "organization": "Bharti Airtel Ltd",
    "latitude": 19.076,
    "longitude": 72.8777
  },
  "clientDevice": {
    "detectedBrowser": "Google Chrome",
    "detectedOS": "Windows 10 / 11",
    "language": "en-US,en;q=0.9",
    "rawUserAgent": "Mozilla/5.0 ..."
  }
}
```

---

## 💻 1. Local Testing

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open in browser:**
   - **Root (Complete Real JSON):** [http://localhost:3000/](http://localhost:3000/)
   - **Real IP & Geolocation Only:** [http://localhost:3000/api/ip](http://localhost:3000/api/ip)
   - **Health Check:** [http://localhost:3000/health](http://localhost:3000/health)

---

## ☁️ 2. AWS EC2 Deployment Guide

### Step 2.1: Launch EC2 Instance
- **OS**: Ubuntu 24.04 LTS (Free tier eligible).
- **Instance Type**: `t2.micro` or `t3.micro`.
- **Security Group**:
  - Allow **SSH** (Port 22).
  - Add Custom TCP **Port 3000** from Anywhere (`0.0.0.0/0`).

### Step 2.2: SSH into EC2
```bash
ssh -i "your-key.pem" ubuntu@<YOUR_EC2_PUBLIC_IP>
```

### Step 2.3: Install Node.js & PM2 on EC2
```bash
sudo apt update && sudo apt install -y nodejs npm git
sudo npm install -g pm2
```

### Step 2.4: Clone & Run
```bash
git clone <YOUR_GITHUB_REPO_URL>
cd PROJECT_1
npm install
pm2 start server.js --name "real-ip-api"
pm2 startup
pm2 save
```

### Step 2.5: Test Live
Visit:
```text
http://<YOUR_EC2_PUBLIC_IP>:3000/
```
Your EC2 instance will instantly identify your device's actual public IP, city, ISP, and browser!
