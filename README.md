# Booking-Service --- Documentação Completa

## Contexto

O **Booking-Service** é o microserviço responsável pela gestão de
reservas de equipamentos no ecossistema **Retail Tractor**.\
Garante que: - Um utilizador só pode reservar equipamentos
disponíveis. - O Payment-Service só inicia pagamentos válidos. - O
estado das reservas é sempre coerente. - Nenhum equipamento é pago duas
vezes devido a falhas de concorrência.

## Tecnologias Utilizadas

-   Node.js (Express)
-   MongoDB + Prisma
-   JWT (RS256)
-   dotenv

## Fluxo Geral das Reservas

1.  O utilizador envia um pedido para criar uma reserva.
2.  O Booking-Service verifica se o equipamento existe e a sua disponibilidade.
3.  O Booking-Service pede ao Payment-Service um link de checkout.
4.  O utilizador paga.
5.  O Payment-Service envia um webhook.
6.  O Booking-Service atualiza o estado.

## Modelo de Dados

``` prisma
model Bookings {
  id          String        @id @default(auto()) @map("_id") @db.ObjectId
  userId      Int
  equipmentId Int
  startDate   DateTime
  endDate     DateTime
  totalPrice  Float
  status      BookingStatus @default(PENDING)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  paymentId   Int?
}

enum BookingStatus {
  PENDING
  CONFIRMED
  CANCELLED
  COMPLETED
}
```

## Endpoints da API

### **POST /bookings/**

Cria nova reserva.

### **GET /bookings/**

Lista todas as reservas.

### **GET /bookings/:id**

Busca uma reserva específica.

### **PUT /bookings/:id/status**

Atualiza status (payment-service).

### **DELETE /bookings/:id**

Remove reserva.

### **GET /bookings/user/:userId**

Lista reservas por utilizador.

### **GET /bookings/equipment/:equipmentId**

Lista reservas por equipamento.

### **POST /bookings/check-availability**

Verifica disponibilidade.
