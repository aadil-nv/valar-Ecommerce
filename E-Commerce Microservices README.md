# 🧩 E-Commerce Microservices Backend

This repository contains the **backend** of an e-commerce system built using **microservices architecture**. Each service runs independently and communicates via **REST APIs** and **RabbitMQ**. Real-time updates are handled with **WebSockets**, and caching is managed using **Redis**.

---

## 📚 Documentation

- **[README.md](README.md)** - Setup instructions and quick start guide (this file)
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Detailed architecture and design decisions
- **[PERFORMANCE.md](PERFORMANCE.md)** - Performance optimization strategies
- **[SCALING.md](SCALING.md)** - Scaling to 1 million+ users

---

## ⚙️ Tech Stack

- **React Router DOM** (frontend)
- **Node.js** + **Express** + **TypeScript**
- **MongoDB** (per service database)
- **RabbitMQ** (asynchronous communication)
- **Redis** (caching)
- **WebSocket** (real-time updates)
- **Docker & Docker Compose**
- **API Gateway** (centralized validation, error handling, rate limiting)

---

## 🏗️ Services Overview

| Service | Port | WebSocket | Description |
|---------|------|-----------|-------------|
| **API Gateway** | 5000 | - | Central entry point, validates requests, applies rate limiting |
| **Customer Service** | 5003 | - | Manages customer registration and authentication |
| **Product Service** | 5002 | - | Handles product data and inventory updates |
| **Order Service** | 5001 | 8081 | Manages order creation, updates, and real-time notifications |
| **Alert Service** | 5004 | 8082 | Sends notifications and alerts for specific events |
| **Analytics Service** | 5005 | 8080 | Collects and processes analytics data (optional) |

---

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
- **Docker** and **Docker Compose** - [Download](https://www.docker.com/products/docker-desktop)
- **MongoDB** (or MongoDB Atlas account) - [Setup Guide](https://www.mongodb.com/cloud/atlas)
- **Git** - [Download](https://git-scm.com/downloads)

### Installation

#### Option 1: Using Docker Compose (Recommended)

This is the easiest way to get started. Docker Compose will set up all services, databases, and dependencies.

```bash
# 1. Clone the repository
git clone <repository-url>
cd backend

# 2. Create environment files (see .env Configuration section below)
# Copy the example .env files and update with your values

# 3. Build and start all containers
docker-compose build
docker-compose up

# Optional: Run in detached mode (background)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

**Access the services:**
- API Gateway: http://localhost:5000
- Order Service: http://localhost:5001
- Product Service: http://localhost:5002
- Customer Service: http://localhost:5003
- Alert Service: http://localhost:5004
- RabbitMQ Management: http://localhost:15672 (guest/guest)
- MongoDB: localhost:27017

#### Option 2: Manual Installation

For development or when you want more control:

**Step 1: Install Dependencies**

```bash
# Install all service dependencies
cd api-gateway && npm install && cd ..
cd customer-service && npm install && cd ..
cd product-service && npm install && cd ..
cd order-service && npm install && cd ..
cd alert-service && npm install && cd ..
cd analytics-service && npm install && cd ..  # Optional
cd frontend && npm install && cd ..
```

**Step 2: Start Infrastructure Services**

```bash
# Start MongoDB (if not using Atlas)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Start RabbitMQ
docker run -d -p 5672:5672 -p 15672:15672 --name rabbitmq rabbitmq:3-management

# Start Redis
docker run -d -p 6379:6379 --name redis redis:latest
```

**Step 3: Start Microservices**

Open separate terminal windows for each service:

```bash
# Terminal 1: API Gateway
cd api-gateway
npm start

# Terminal 2: Customer Service
cd customer-service
npm start

# Terminal 3: Product Service
cd product-service
npm start

# Terminal 4: Order Service
cd order-service
npm start

# Terminal 5: Alert Service
cd alert-service
npm start

# Terminal 6: Analytics Service (Optional)
cd analytics-service
npm start

# Terminal 7: Frontend
cd frontend
npm run dev
```

---

## 🧾 Environment Configuration

Each service requires its own `.env` file. Create these files in their respective directories:

### 🛡️ API Gateway (`/api-gateway/.env`)

```env
PORT=5000

# Microservices URLs
ORDER_SERVICE_URL=http://localhost:5001
PRODUCT_SERVICE_URL=http://localhost:5002
CUSTOMER_SERVICE_URL=http://localhost:5003
ALERTS_SERVICE_URL=http://localhost:5004

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 👤 Customer Service (`/customer-service/.env`)

```env
PORT=5003
RABBITMQ_URI=amqp://localhost
MONGO_URI=mongodb://localhost:27017/customer-service
# For MongoDB Atlas, use:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/customer-service?retryWrites=true&w=majority

CUSTOMER_QUEUE_NAME=analytics
REDIS_URL=redis://localhost:6379

# JWT Secret (generate a secure random string)
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRY=24h
```

### 📦 Product Service (`/product-service/.env`)

```env
PORT=5002
MONGO_URI=mongodb://localhost:27017/product-service
# For Docker: mongodb://mongo-product:27017/productdb

RABBITMQ_URI=amqp://localhost
ALERTS_SERVICE_URL=http://localhost:5004

ORDER_QUEUE_NAME=orders
PRODUCT_QUEUE_NAME=products

REDIS_HOST=localhost
REDIS_PORT=6379

# Stock alert threshold
LOW_STOCK_THRESHOLD=10
```

### 🛒 Order Service (`/order-service/.env`)

```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/order-service

RABBITMQ_URI=amqp://localhost
PRODUCT_SERVICE_URL=http://localhost:5002
CUSTOMER_SERVICE_URL=http://localhost:5003

ORDER_QUEUE_NAME=orders
PRODUCT_QUEUE_NAME=products

REDIS_HOST=localhost
REDIS_PORT=6379

# WebSocket configuration
WS_PORT=8081
WS_CORS_ORIGIN=http://localhost:5173
```

### 🚨 Alert Service (`/alert-service/.env`)

```env
PORT=5004
MONGO_URI=mongodb://localhost:27017/alert-service

RABBITMQ_URI=amqp://localhost
QUEUE_NAME=alerts

# WebSocket configuration
WS_PORT=8082
WS_CORS_ORIGIN=http://localhost:5173

# Email configuration (optional)
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
```

### 📊 Analytics Service (`/analytics-service/.env`) (Optional)

```env
PORT=5005
MONGO_URI=mongodb://localhost:27017/analytics-service

RABBITMQ_URL=amqp://localhost
REDIS_URL=redis://localhost:6379

WEBSOCKET_PORT=8080

# Analytics configuration
ANALYTICS_REFRESH_INTERVAL=300000
CACHE_TTL=1800
```

### 🌐 Frontend (`/frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_WS_URL=ws://localhost:8081
VITE_ALERT_WS_URL=ws://localhost:8082
```

---

## 🐇 RabbitMQ Configuration

### Exchanges & Queues

The system uses the following RabbitMQ exchanges and queues:

| Exchange | Type | Publisher | Subscriber(s) | Events |
|----------|------|-----------|---------------|--------|
| `order_exchange` | topic | Order Service | Product, Alert, Analytics | order.created, order.updated, order.cancelled |
| `product_exchange` | topic | Product Service | Order, Analytics | product.updated, product.stock_low |
| `alert_exchange` | topic | Alert Service | Analytics | alert.sent |

### Manual Queue Setup (Optional)

If queues don't auto-create, you can set them up manually:

```bash
# Access RabbitMQ Management UI
# http://localhost:15672 (username: guest, password: guest)

# Or use CLI
docker exec -it rabbitmq rabbitmqctl list_queues
docker exec -it rabbitmq rabbitmqctl list_exchanges
```

---

## 🔄 System Communication Flow

### Order Creation Flow

```
1. Client → API Gateway: POST /api/orders
2. API Gateway → Validates request (Joi schema)
3. API Gateway → Checks rate limit (Redis)
4. API Gateway → Order Service: Forward request
5. Order Service → Customer Service: Validate customer (GET /customers/:id)
6. Order Service → Product Service: Check inventory (GET /products/:id)
7. Order Service → MongoDB: Save order
8. Order Service → RabbitMQ: Publish "order.created" event
9. Product Service ← RabbitMQ: Consumes event, updates inventory
10. Analytics Service ← RabbitMQ: Consumes event, updates metrics
11. Alert Service ← RabbitMQ: Consumes event, sends notification
12. Order Service → WebSocket: Broadcast order update to client
13. Client ← API Gateway: Order confirmation response
```

---

## 🧰 Development Commands

### Docker Commands

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up

# Start specific service
docker-compose up api-gateway

# Stop all services
docker-compose down

# Remove volumes (clean slate)
docker-compose down -v

# View logs
docker-compose logs -f [service-name]

# Restart a service
docker-compose restart order-service

# Check running containers
docker ps

# Execute command in container
docker exec -it order-service sh
```

### NPM Scripts

Each service has the following npm scripts:

```bash
# Development (with hot reload)
npm run dev

# Production build
npm run build

# Start production server
npm start

# Run tests
npm test

# Run linter
npm run lint

# Type checking (TypeScript)
npm run type-check
```

---

## 🔍 API Documentation

### Health Check

```bash
GET /api/health

Response:
{
  "status": "ok",
  "timestamp": "2025-10-26T10:00:00.000Z",
  "services": {
    "order-service": "running",
    "product-service": "running",
    "customer-service": "running",
    "alert-service": "running"
  }
}
```

### Customer Endpoints

```bash
# Register customer
POST /api/customers/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "phone": "+1234567890"
}

# Login
POST /api/customers/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!"
}

# Get customer profile
GET /api/customers/:id
Authorization: Bearer <token>
```

### Product Endpoints

```bash
# Get all products
GET /api/products?page=1&limit=20&category=electronics

# Get product by ID
GET /api/products/:id

# Search products
GET /api/products/search?q=laptop

# Create product (admin)
POST /api/products
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "name": "Laptop",
  "description": "High-performance laptop",
  "price": 999.99,
  "stock": 50,
  "category": "electronics",
  "images": ["https://example.com/image1.jpg"]
}

# Update product
PUT /api/products/:id

# Delete product
DELETE /api/products/:id
```

### Order Endpoints

```bash
# Create order
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "customerId": "customer_id_here",
  "items": [
    {
      "productId": "product_id_here",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}

# Get order by ID
GET /api/orders/:id

# Get customer orders
GET /api/orders/customer/:customerId

# Update order status
PATCH /api/orders/:id/status
Content-Type: application/json

{
  "status": "shipped"
}

# Cancel order
DELETE /api/orders/:id
```

---

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run tests for specific service
cd order-service
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

### Integration Tests

```bash
# Start test environment
docker-compose -f docker-compose.test.yml up

# Run integration tests
npm run test:integration

# Clean up
docker-compose -f docker-compose.test.yml down -v
```

### Load Testing

```bash
# Install Artillery
npm install -g artillery

# Run load test
cd tests
artillery run load-test.yml

# Generate report
artillery run --output report.json load-test.yml
artillery report report.json
```

---

## 📊 Monitoring & Logging

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f order-service

# Last 100 lines
docker-compose logs --tail=100 order-service

# Follow logs with timestamp
docker-compose logs -f -t order-service
```

### Redis Monitoring

```bash
# Connect to Redis CLI
docker exec -it redis redis-cli

# Monitor commands
MONITOR

# Check memory usage
INFO memory

# View all keys
KEYS *

# Get cache statistics
INFO stats
```

### RabbitMQ Monitoring

```bash
# Access management UI
http://localhost:15672

# CLI commands
docker exec rabbitmq rabbitmqctl list_queues
docker exec rabbitmq rabbitmqctl list_exchanges
docker exec rabbitmq rabbitmqctl list_connections
```

### MongoDB Monitoring

```bash
# Connect to MongoDB
docker exec -it mongodb mongo

# Check database status
use order-service
db.stats()

# View collections
show collections

# Query documents
db.orders.find().limit(5).pretty()

# Check indexes
db.orders.getIndexes()
```

---

## 🔧 Troubleshooting

### Common Issues

#### Port Already in Use

```bash
# Find process using port
lsof -i :5001  # macOS/Linux
netstat -ano | findstr :5001  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

#### RabbitMQ Connection Failed

```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# Restart RabbitMQ
docker-compose restart rabbitmq

# Check logs
docker-compose logs rabbitmq

# Verify connection
telnet localhost 5672
```

#### MongoDB Connection Error

```bash
# Check MongoDB status
docker ps | grep mongodb

# Test connection
docker exec -it mongodb mongo --eval "db.adminCommand('ping')"

# Restart MongoDB
docker-compose restart mongodb

# Check logs
docker-compose logs mongodb
```

#### Redis Connection Failed

```bash
# Check Redis status
docker exec -it redis redis-cli ping

# Should return: PONG

# Restart Redis
docker-compose restart redis

# Clear all cache
docker exec -it redis redis-cli FLUSHALL
```

#### Service Not Responding

```bash
# Check service health
curl http://localhost:5000/api/health

# Check service logs
docker-compose logs order-service

# Restart service
docker-compose restart order-service

# Rebuild and restart
docker-compose up --build order-service
```

---

## 🧩 Project Structure

```
backend/
├── api-gateway/
│   ├── src/
│   │   ├── middleware/
│   │   │   ├── validation.ts
│   │   │   ├── rateLimit.ts
│   │   │   └── errorHandler.ts
│   │   ├── routes/
│   │   │   └── index.ts
│   │   ├── config/
│   │   │   └── proxy.ts
│   │   └── server.ts
│   ├── .env
│   ├── package.json
│   └── tsconfig.json
│
├── customer-service/
│   ├── src/
│   │   ├── models/
│   │   │   └── Customer.ts
│   │   ├── controllers/
│   │   │   └── customerController.ts
│   │   ├── routes/
│   │   │   └── customerRoutes.ts
│   │   ├── services/
│   │   │   └── authService.ts
│   │   ├── utils/
│   │   │   └── validators.ts
│   │   └── server.ts
│   ├── .env
│   └── package.json
│
├── product-service/
│   ├── src/
│   │   ├── models/
│   │   │   └── Product.ts
│   │   ├── controllers/
│   │   │   └── productController.ts
│   │   ├── routes/
│   │   │   └── productRoutes.ts
│   │   ├── services/
│   │   │   ├── cacheService.ts
│   │   │   └── inventoryService.ts
│   │   ├── events/
│   │   │   ├── publisher.ts
│   │   │   └── consumer.ts
│   │   └── server.ts
│   ├── .env
│   └── package.json
│
├── order-service/
│   ├── src/
│   │   ├── models/
│   │   │   └── Order.ts
│   │   ├── controllers/
│   │   │   └── orderController.ts
│   │   ├── routes/
│   │   │   └── orderRoutes.ts
│   │   ├── services/
│   │   │   └── orderService.ts
│   │   ├── websocket/
│   │   │   └── orderSocket.ts
│   │   ├── events/
│   │   │   ├── publisher.ts
│   │   │   └── consumer.ts
│   │   └── server.ts
│   ├── .env
│   └── package.json
│
├── alert-service/
│   ├── src/
│   │   ├── models/
│   │   │   └── Alert.ts
│   │   ├── services/
│   │   │   ├── emailService.ts
│   │   │   └── notificationService.ts
│   │   ├── websocket/
│   │   │   └── alertSocket.ts
│   │   ├── events/
│   │   │   └── consumer.ts
│   │   └── server.ts
│   ├── .env
│   └── package.json
│
├── analytics-service/
│   ├── src/
│   │   ├── models/
│   │   │   └── Analytics.ts
│   │   ├── controllers/
│   │   │   └── analyticsController.ts
│   │   ├── services/
│   │   │   ├── aggregationService.ts
│   │   │   └── cacheService.ts
│   │   └── server.ts
│   ├── .env
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   └── App.tsx
│   ├── .env
│   └── package.json
│
├── docker-compose.yml
├── README.md
├── ARCHITECTURE.md
├── PERFORMANCE.md
└── SCALING.md
```

---

## 📝 Best Practices

### Code Quality

- Use TypeScript for type safety
- Follow ESLint rules
- Write unit tests (target: 80% coverage)
- Use meaningful variable names
- Add JSDoc comments for public APIs
- Keep functions small and focused

### Security

- Never commit `.env` files
- Use environment variables for secrets
- Hash passwords with bcrypt
- Implement rate limiting
- Validate all input data
- Use HTTPS in production
- Implement proper CORS policies

### Performance

- Use Redis caching effectively
- Implement database indexes
- Use pagination for large datasets
- Optimize database queries
- Enable compression
- Use CDN for static assets

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Commit Message Convention

```
<type>(<scope>): <subject>

<body>

<footer>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Example:
```
feat(order): add order cancellation feature

- Add cancel order endpoint
- Update order status validation
- Add cancellation event publisher

Closes #123
```

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## ✨ Author

**Muhammed Aadil Nv**  
📧 adilev2000@gmail.com  
💼 [LinkedIn](https://linkedin.com/in/muhammed-aadil)  
🐙 [GitHub](https://github.com/muhammed-aadil)  
💻 Passionate about scalable microservice systems and clean architecture

---

## 🙏 Acknowledgments

- Express.js team for the excellent web framework
- MongoDB team for the robust database
- RabbitMQ team for reliable messaging
- Redis team for blazing-fast caching
- Docker team for containerization made easy
- All open-source contributors

---

## 📞 Support

If you have any questions or issues:

1. Check the [Troubleshooting](#troubleshooting) section
2. Search existing [GitHub Issues](https://github.com/your-repo/issues)
3. Create a new issue with detailed information
4. Join our [Discord Community](#) (if available)
5. Email: adilev2000@gmail.com

---

**Happy Coding! 🚀**