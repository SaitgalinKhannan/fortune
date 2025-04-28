import { useState, useEffect } from 'react';
import { BrowserProvider, Signer, ethers } from 'ethers';

// Информация о сетях
const NETWORKS = {
    ethereum: {
        chainId: '0x1', // 1 в hex
        chainName: 'Ethereum Mainnet',
        nativeCurrency: {
            name: 'Ether',
            symbol: 'ETH',
            decimals: 18
        },
        rpcUrls: ['https://mainnet.infura.io/v3/your-infura-key'],
        blockExplorerUrls: ['https://etherscan.io/']
    },
    bsc: {
        chainId: '0x38', // 56 в hex
        chainName: 'Binance Smart Chain',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        rpcUrls: ['https://bsc-dataseed.binance.org/'],
        blockExplorerUrls: ['https://bscscan.com/']
    },
    bscTestnet: {
        chainId: '0x61', // 97 в hex
        chainName: 'Binance Smart Chain Testnet',
        nativeCurrency: {
            name: 'BNB',
            symbol: 'BNB',
            decimals: 18
        },
        rpcUrls: ['https://data-seed-prebsc-1-s1.binance.org:8545/'],
        blockExplorerUrls: ['https://testnet.bscscan.com/']
    }
};

function WalletConnect() {
    const [provider, setProvider] = useState<BrowserProvider | null>(null);
    const [signer, setSigner] = useState<Signer | null>(null);
    const [account, setAccount] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentChainId, setCurrentChainId] = useState<string | null>(null);
    const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

    const connectWallet = async (forcePrompt = true) => {
        setIsConnecting(true);
        setError(null);

        try {
            // Проверка на установленный MetaMask
            if (window.ethereum == null) {
                setError("MetaMask не установлен. Пожалуйста, установите MetaMask.");
                return;
            }

            // Создаем провайдер
            const browserProvider = new ethers.BrowserProvider(window.ethereum);

            // Запрашиваем доступ к аккаунтам - важно использовать правильный метод
            // forcePrompt = true будет всегда показывать окно подключения
            let accounts;
            if (forcePrompt) {
                // Этот метод всегда показывает диалог
                accounts = await window.ethereum.request({
                    method: 'wallet_requestPermissions',
                    params: [{ eth_accounts: {} }]
                }).then(() => window.ethereum.request({ method: 'eth_accounts' }));
            } else {
                // Этот метод может не показывать диалог, если уже есть разрешение
                accounts = await browserProvider.send("eth_requestAccounts", []);
            }

            if (accounts.length === 0) {
                throw new Error("Нет доступных аккаунтов");
            }

            const currentAccount = accounts[0];
            setAccount(currentAccount);
            setProvider(browserProvider);

            // Получаем signer
            const walletSigner = await browserProvider.getSigner();
            setSigner(walletSigner);

            // Получаем chainId текущей сети
            const { chainId } = await browserProvider.getNetwork();
            setCurrentChainId('0x' + chainId.toString(16)); // Преобразуем в hex

            console.log("Кошелек подключен:", currentAccount);
            console.log("Текущая сеть:", chainId.toString());
        } catch (err: any) {
            console.error("Ошибка подключения кошелька:", err);

            if (err.message && (
                err.message.includes("User rejected") ||
                err.message.includes("user rejected") ||
                err.code === 4001)
            ) {
                setError("Пользователь отклонил запрос на подключение.");
            } else {
                setError(`Не удалось подключить кошелек: ${err.message}`);
            }

            // Сбрасываем состояние при ошибке
            setProvider(null);
            setSigner(null);
            setAccount(null);
        } finally {
            setIsConnecting(false);
        }
    };

    const switchNetwork = async (networkKey: 'ethereum' | 'bsc' | 'bscTestnet') => {
        if (!window.ethereum) {
            setError("MetaMask не установлен");
            return;
        }

        const network = NETWORKS[networkKey];
        setIsSwitchingNetwork(true);
        setError(null);

        try {
            // Сначала пробуем переключить на существующую сеть
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: network.chainId }]
            });

            // Если здесь - значит сеть успешно переключена
            setCurrentChainId(network.chainId);
        } catch (err: any) {
            // Код ошибки 4902 означает, что сеть не существует и нужно её добавить
            if (err.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [network]
                    });
                    // Проверяем, успешно ли переключились на новую сеть
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    setCurrentChainId(chainId);
                } catch (addError: any) {
                    setError(`Ошибка при добавлении сети: ${addError.message}`);
                }
            } else {
                setError(`Ошибка при переключении сети: ${err.message}`);
            }
        } finally {
            setIsSwitchingNetwork(false);
        }
    };

    // Отслеживаем изменения аккаунта и сети
    useEffect(() => {
        if (window.ethereum) {
            const handleAccountsChanged = (accounts: string[]) => {
                if (accounts.length > 0) {
                    setAccount(accounts[0]);
                } else {
                    // Пользователь отключил кошелек
                    disconnectWallet();
                }
            };

            const handleChainChanged = (chainId: string) => {
                setCurrentChainId(chainId);
                // Обновляем provider при смене сети
                if (window.ethereum) {
                    const browserProvider = new ethers.BrowserProvider(window.ethereum);
                    setProvider(browserProvider);
                    browserProvider.getSigner().then(setSigner).catch(console.error);
                }
            };

            window.ethereum.on('accountsChanged', handleAccountsChanged);
            window.ethereum.on('chainChanged', handleChainChanged);

            // Проверяем текущее состояние при инициализации
            window.ethereum.request({ method: 'eth_chainId' })
                .then(setCurrentChainId)
                .catch(console.error);

            window.ethereum.request({ method: 'eth_accounts' })
                .then((accounts: string[]) => {
                    if (accounts.length > 0 && window.ethereum) {
                        setAccount(accounts[0]);
                        const browserProvider = new ethers.BrowserProvider(window.ethereum);
                        setProvider(browserProvider);
                        browserProvider.getSigner().then(setSigner).catch(console.error);
                    }
                })
                .catch(console.error);

            return () => {
                if (window.ethereum) {
                    window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
                    window.ethereum.removeListener('chainChanged', handleChainChanged);
                }
            };
        }
    }, []);

    const disconnectWallet = () => {
        // MetaMask не поддерживает программное отключение,
        // поэтому мы просто очищаем локальное состояние
        setAccount(null);
        setSigner(null);
        setProvider(null);
        setError(null);
    };

    // Определяем текущую сеть для отображения
    const getCurrentNetworkName = () => {
        if (!currentChainId) return 'Не определено';

        for (const [, network] of Object.entries(NETWORKS)) {
            if (network.chainId === currentChainId) {
                return network.chainName;
            }
        }

        return `Неизвестная сеть (${currentChainId})`;
    };

    return (
        <div>
            {!account ? (
                <button
                    onClick={() => connectWallet(true)}
                    disabled={isConnecting}
                >
                    {isConnecting ? 'Подключение...' : 'Подключить кошелек'}
                </button>
            ) : (
                <div>
                    <p>Подключенный аккаунт: {account}</p>
                    <p>Текущая сеть: {getCurrentNetworkName()}</p>

                    <div style={{ marginTop: '10px', marginBottom: '10px' }}>
                        <button
                            onClick={() => switchNetwork('bsc')}
                            disabled={isSwitchingNetwork || currentChainId === NETWORKS.bsc.chainId}
                        >
                            {isSwitchingNetwork ? 'Переключение...' : 'Подключиться к BSC'}
                        </button>

                        <button
                            onClick={() => switchNetwork('bscTestnet')}
                            disabled={isSwitchingNetwork || currentChainId === NETWORKS.bscTestnet.chainId}
                            style={{ marginLeft: '10px' }}
                        >
                            {isSwitchingNetwork ? 'Переключение...' : 'Подключиться к BSC Testnet'}
                        </button>

                        <button
                            onClick={() => switchNetwork('ethereum')}
                            disabled={isSwitchingNetwork || currentChainId === NETWORKS.ethereum.chainId}
                            style={{ marginLeft: '10px' }}
                        >
                            {isSwitchingNetwork ? 'Переключение...' : 'Подключиться к Ethereum'}
                        </button>
                    </div>

                    <button onClick={disconnectWallet}>Отключить кошелек</button>
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}
        </div>
    );
}

export default WalletConnect;