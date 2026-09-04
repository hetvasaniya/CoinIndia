# Coinomart

Digital Marketplace for Old, Rare and Collectible Coins & Currency

## Setup

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Cloudinary account
- Razorpay account

### Environment Variables

Copy `.env.example` files and fill in your values:

```bash
cp server/.env.example server/.env
```

### Install Dependencies

```bash
# Server
cd server && npm install

# Client
cd client && npm install
```

### Seed Admin User

```bash
cd server && node seeds/seedAdmin.js
```

### Run Development

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend
cd client && npm run dev
```

## Tech Stack
- **Frontend**: React, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js
- **Database**: MongoDB, Mongoose
- **Auth**: JWT, bcryptjs
- **Payment**: Razorpay
- **Images**: Cloudinary
- **Email**: Nodemailer
