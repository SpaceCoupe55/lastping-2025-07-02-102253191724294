# 🔔 LastPing - A Dead Man's Switch on the Internet Computer

**LastPing** is a decentralized "dead man's switch" built on the Internet Computer (ICP), allowing users to maintain ownership of their accounts through periodic check-ins (pings). If a user fails to ping within a specified timeout period, a designated backup wallet can claim ownership of their account. The system is designed to be secure, extensible, and user-friendly — with token-based incentives and a clean, responsive frontend.

---

## 🚀 Features

### ✅ Core Smart Contract Logic (Motoko)
- **initializeUser** - Registers a new LastPing account for a user.
- **setBackup** - Assigns a backup Principal (wallet).
- **setTimeout** - Sets custom timeout duration (default: 30 days).
- **ping** - Resets the timeout timer.
- **claim** - Backup wallet claims ownership after timeout expiration.
- **getMyStatus / getUserStatus** - Check status of current or any user.
- **userExists / getAllUsers** - Utility endpoints to inspect contract state.

### 🔒 Security & Persistence
- Principal-based authentication.
- Persistent state across upgrades using `preupgrade`/`postupgrade`.
- Clean Result-type error handling for all operations.

---

## 🎨 Frontend (React + Tailwind CSS)

### User-Focused Features
- **Authentication** via Internet Identity.
- **Responsive UI** with gradient styling and mobile support.
- **Smart Status Display**: Role-aware (owner/backup) interactions.
- **Clipboard Copying** for Principals and error-resistant forms.
- **Visual Feedback**: Loading states, errors, success messaging.

### Core Frontend Functionality
- Create/Initialize account
- Set or update backup wallet
- Adjust timeout period
- Perform periodic pings
- Claim accounts (as backup)
- View real-time account status

---
### Final Frontend
<img width ="635" alt="Final Frontend" src= https://github.com/user-attachments/assets/0212199d-e4de-44b4-ba40-5703c3e55f61 />




## 💰 Token System (Coming Soon)

A utility token system ("**LPT** - LastPing Token") is planned to integrate with LastPing's core logic. Features will include:

### 🔐 Backend Architecture
- **Token Ledger**: `Principal → Balance` mapping
- **Token Metadata**: name, symbol, total supply, decimals
- **Token Functions**:
  - `getTokenBalance(principal)`
  - `getMyTokenBalance()`
  - `transferTokens(to, amount)`
  - `mintTokens(to, amount)` *(admin only)*
  - `getAllTokenHolders()` *(for debugging)*

### 💡 Use Cases
- **Ping Rewards**: Earn tokens by staying active
- **Claim Incentives**: Backup wallets receive tokens on successful claims
- **Service Fees**: Deduct tokens for premium features (e.g., custom timeouts)
- **Staking Model**: Users stake tokens that are forfeited if timeout expires

---

## 🛠 Tech Stack

| Layer        | Technology                    |
| ------------ | ----------------------------- |
| Blockchain   | Internet Computer Protocol     |
| Language     | Motoko                         |
| Frontend     | React, Tailwind CSS            |
| Auth         | Internet Identity              |
| State Mgmt   | React Context API              |

---

## 🧪 Running Locally

### Prerequisites:
- [DFX SDK](https://smartcontracts.org/docs/quickstart/quickstart.html)
- Node.js (v18+)
- Internet Identity setup

### Clone & Start:

### bash
git clone https://github.com/your-username/lastping.git
cd lastping
dfx start --background
npm install
dfx deploy
npm run dev


### Images 
<h2>ICP NINJA Terminal</h2>
<img width="635" alt="ICP ninja terminal" src="https://github.com/user-attachments/assets/93a8a5e3-d005-440f-b97d-adbcb15d6111" />

<h2>Front End</h2>
<img width="627" alt="Login Page" src="https://github.com/user-attachments/assets/740b46f8-c801-4f3e-bb19-204f2ec07205" />

<h2>ICP Auth</h2>
<img width="915" alt="Screenshot 2025-07-02 at 10 34 01 AM" src="https://github.com/user-attachments/assets/522b70d9-b0c3-40bb-9f1b-b6666f44cb5f" />

<h2>After Login</h2>
<img width="839" alt="Screenshot 2025-07-02 at 10 34 21 AM" src="https://github.com/user-attachments/assets/bce0cd11-7259-4be1-8425-8881d70deed8" />

<h2>HomePage</h2>
<b>Link to Canister homepage 👉 </b> : (https://github.com/user-attachments/assets/bf7d243f-d25b-428c-8ef5-7e3068cef1a7)



### Roadmap
✅ Basic LastPing system

✅ Internet Identity integration

✅ UI + UX enhancements

✅ Ownerhsip transfer

⏳ Token system 


### Local Setup instructions here ⬇️
<h1>https://icp-setup.daftpage.com/</h1>

### 🚀 Deployment and Local Setup (ICP)
✅ Prerequisites

Before you begin, ensure you have:

Node.js (v16+)

DFX SDK (latest)

Vite (optional for frontend)

Internet access (unless running a fully local dev setup)

#### 🔧 Local Development Setup
Clone the repository:

bash
Copy
Edit
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name
Start the local replica and deploy canisters:

bash
Copy
Edit
dfx start --background
dfx deploy
Start the frontend (if using React + Vite):

bash
Copy
Edit
cd src/frontend
npm install
npm run dev
The backend canister will be running locally.

The frontend will be available at http://localhost:5173 (or Vite’s default port).

The canister frontend URL (default): http://localhost:4943/?canisterId=<your_frontend_canister_id>

### 🌐 Deployment to ICP Mainnet
Authenticate with Internet Identity (optional for mainnet):

bash
Copy
Edit
dfx identity new <your-identity-name> # optional
dfx identity use <your-identity-name>
Deploy to the Internet Computer:

bash
Copy
Edit
dfx deploy --network ic
Access your canister:

bash
Copy
Edit
https://<your_frontend_canister_id>.icp0.io
You can find your deployed canister IDs in .dfx/ic/canister_ids.json.

### 🛠 Useful Commands
Command	Description
dfx start --background	Start local replica
dfx deploy	Deploy to local replica
dfx deploy --network ic	Deploy to mainnet
dfx canister call backend getStatus	Call backend method
dfx generate	Generate frontend canister bindings
