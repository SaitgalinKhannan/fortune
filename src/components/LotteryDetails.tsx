// Компонент деталей лотереи
import abi from "../contract/abi/SingleLottery.json"
import { ethers } from 'ethers';
import {Lottery} from "../models/Lottery.ts";

function LotteryDetails(lottery: Lottery, onBack: () => void) {

    const buyTicket = async () => {
        if (!lottery) return;
        try {
            const contract = new ethers.Contract(lottery.contractAddress, abi);
            const ticketPrice = ethers.formatEther(lottery.ticketPrice);
            const tx = await contract.buyTicket(1, {value: ticketPrice});
            await tx.wait();
            alert('Билет успешно куплен!');
        } catch (error) {
            console.error('Ошибка покупки билета:', error);
            alert('Не удалось купить билет.');
        }
    };

    return (
        <div className="p-4">
            <button className="mb-4 text-blue-500" onClick={onBack}>Назад</button>
            <h1 className="text-2xl font-bold mb-4">Детали лотереи</h1>
            <p><strong>Адрес контракта:</strong> {lottery.contractAddress}</p>
            <p><strong>Сеть:</strong> {lottery.network}</p>
            <p><strong>Среда:</strong> {lottery.environment}</p>
            <p><strong>Цена
                билета:</strong> {ethers.formatEther(lottery.ticketPrice)} {lottery.network === 'bsc' ? 'BNB' : 'ETH'}
            </p>
            <p><strong>Макс. билетов:</strong> {lottery.maxTickets}</p>
            <p><strong>% владельцу:</strong> {lottery.ownerFeePercent}%</p>
            <p><strong>% победителю:</strong> {lottery.winnerPrizePercent}%</p>
            <p><strong>% возврат:</strong> {lottery.returnedPrizePercent}%</p>
            <p><strong>Время начала:</strong> {new Date(lottery.startTime * 1000).toLocaleString()}</p>
            <p><strong>Продолжительность:</strong> {lottery.duration / 3600} ч</p>
            <p><strong>Создано:</strong> {new Date(lottery.createdAt * 1000).toLocaleString()}</p>
        </div>
    );
};