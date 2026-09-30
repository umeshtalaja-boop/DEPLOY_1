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
