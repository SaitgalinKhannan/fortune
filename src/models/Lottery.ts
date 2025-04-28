// Lottery представляет запись о лотерее в базе данных
export interface Lottery {
    contractAddress: string;      // Адрес контракта
    network: string;              // Сеть (eth, bsc)
    environment: string;          // testnet или mainnet
    ticketPrice: string;          // Цена билета в wei
    maxTickets: number;           // Максимум билетов
    ownerFeePercent: number;      // % владельцу
    winnerPrizePercent: number;   // % победителю
    returnedPrizePercent: number; // % возврат
    startTime: number;            // Время начала (Unix timestamp)
    duration: number;             // Продолжительность в секундах
    createdAt: number;            // Время создания (Unix timestamp)
}

// CreateLotteryRequest представляет запрос для создания новой лотереи
export interface CreateLotteryRequest {
    network: string;              // Сеть: eth, bsc
    environment: string;          // testnet или mainnet
    ticketPrice: string;          // Цена билета в wei
    maxTickets: number;           // Максимум билетов
    ownerFeePercent: number;      // % владельцу
    winnerPrizePercent: number;   // % победителю
    returnedPrizePercent: number; // % возврат
    startTime: number;            // Время начала (Unix timestamp)
    duration: number;             // Продолжительность в секундах
}

// CreateLotteryResponse представляет ответ после успешного создания лотереи
export interface CreateLotteryResponse {
    contractAddress: string;      // Адрес развернутого контракта
    transactionHash: string;      // Хэш транзакции деплоя
}