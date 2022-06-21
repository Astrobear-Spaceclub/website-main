const walletlink = require('walletlink');

const network = 'rinkeby';
const infuraId = '5763c626153e4597bc6d3fd89c3bcd21';
const providers = {
    mainnet: 'https://mainnet.infura.io/v3/5763c626153e4597bc6d3fd89c3bcd21',
    ropsten: 'https://ropsten.infura.io/v3/5763c626153e4597bc6d3fd89c3bcd21',
    rinkeby: 'https://rinkeby.infura.io/v3/5763c626153e4597bc6d3fd89c3bcd21'
};
const chainIds = {
    mainnet: '0x1',
    ropsten: '0x3',
    rinkeby: '0x4'
};
const etherscan = {
    mainnet: 'https://etherscan.io',
    ropsten: 'https://ropsten.etherscan.io',
    rinkeby: 'https://rinkeby.etherscan.io'
};
const contractAddress = {
    mainnet: '',
    ropsten: '',
    rinkeby: ''
};
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const WalletLink = walletlink.WalletLink;

const EthersProvider = new ethers.providers.JsonRpcProvider(providers[network]);

let ReadingContract;
let EthersSigner;
let Web3Provider;
let web3Modal;
let connectedWallet;

const parseError = function (error) {
    if (typeof error === 'string') {
        return error;
    }

    if (typeof error === 'object') {
        if (error.message.indexOf('MetaMask Tx Signature: ') !== -1) {
            return error.message;
        }

        const parsedError = JSON.stringify(error);
        return parsedError === '{}' ? error.message : parsedError;
    }
};

const formatWalletAddress = function (walletAddress) {
    return walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4);
};

window.addEventListener('load', async function() {
    /*const disclaimerModal = document.getElementById('disclaimerModal');
    const modal = bootstrap.Modal.getOrCreateInstance(disclaimerModal);

    modal.show();*/

    EthersProvider.pollingInterval = 1000 * 240; // 4min
    //ReadingContract = new ethers.Contract(contractAddress[network], await (await fetch('abi_'+network+'.json')).json(), EthersProvider);

    web3Modal = new Web3Modal({
        cacheProvider: false,
        providerOptions: {
            walletconnect: {
                package: WalletConnectProvider,
                options: {
                    infuraId: infuraId,
                }
            },
            walletlink: {
                package: WalletLink, // Required
                options: {
                    appName: "Astrobear Spaceclub", // Required
                    infuraId: infuraId, // Required unless you provide a JSON RPC url; see `rpc` below
                    rpc: "", // Optional if `infuraId` is provided; otherwise it's required
                    chainId: 1, // Optional. It defaults to 1 if not provided
                    appLogoUrl: null, // Optional. Application logo image URL. favicon is used if unspecified
                    darkMode: false // Optional. Use dark theme, defaults to false
                }
            }
        },
        disableInjectedProvider: false
    });

    const onConnect = async function () {
        try {
            Web3Provider = await web3Modal.connect();

            if (Web3Provider.chainId !== chainIds[network]) {
                await Web3Provider.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: chainIds[network] }]
                });
            }

            EthersSigner = (new ethers.providers.Web3Provider(Web3Provider)).getSigner();

            connectedWallet = ethers.utils.getAddress(Web3Provider.selectedAddress);
            this.querySelector('.connect-button-inner').innerText = formatWalletAddress(connectedWallet);
        } catch (error) {
            console.error(error);
            return;
        }

        Web3Provider.on('accountsChanged', (accounts) => {
            console.debug('Account changed', accounts);
            location.reload();
        });

        Web3Provider.on('chainChanged', (chainId) => {
            console.debug('Chain changed', chainId);
            location.reload();
        });
    };

    for (const connectButton of document.getElementsByClassName('connect-button')) {
        connectButton.addEventListener('click', onConnect);
    }
});
