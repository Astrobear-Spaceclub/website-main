const walletlink = require('walletlink');

const apiHost = 'https://api.astrobearspace.club';
const network = 'mainnet';
const infuraId = 'fbbd4ab4c92041dbb41f6014de43408b';
const providers = {
    mainnet: 'https://mainnet.infura.io/v3/fbbd4ab4c92041dbb41f6014de43408b',
    ropsten: 'https://ropsten.infura.io/v3/fbbd4ab4c92041dbb41f6014de43408b',
    rinkeby: 'https://rinkeby.infura.io/v3/fbbd4ab4c92041dbb41f6014de43408b'
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
    mainnet: '0x77ed8f086df1e8b04baa99690fd8bc6bf17de9e0',
    ropsten: '',
    rinkeby: '0x9e020BC81597d27A1c3EF044AA331943082B6AF3'
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
let saleState;
let maxMintAmount = 0;
let mintedAmount = 0;

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

const showNotification = function (message, classNames = 'error') {
    Toastify({
        text: message,
        className: classNames,
        duration: 3000,
        gravity: "top", // `top` or `bottom`
        position: "right", // `left`, `center` or `right`
    }).showToast();
}

const formatWalletAddress = function (walletAddress) {
    return walletAddress.slice(0, 4) + '...' + walletAddress.slice(-4);
};

window.addEventListener("error", errorEvent => {
    showNotification(parseError(errorEvent.error), false);
    errorEvent.preventDefault();
});

window.addEventListener("unhandledrejection", errorEvent => {
    showNotification(parseError(errorEvent.reason, true));
    errorEvent.preventDefault();
});

const retrieveNFTsForAddress = async function(address) {
    console.log(address);
    if (ReadingContract === undefined) {
        throw new Error('Not initialized');
    }

    const firstBlock = 11011110;

    const ingoingTransfers = EthersProvider.getLogs({...ReadingContract.filters.Transfer(null, address),...{fromBlock:firstBlock, toBlock: 'latest'}});
    const outgoingTransfers = EthersProvider.getLogs({...ReadingContract.filters.Transfer(address),...{fromBlock:firstBlock, toBlock: 'latest'}});

    const logs = await Promise.all([ingoingTransfers, outgoingTransfers]);

    const mergedLogs = [...logs[0], ...logs[1]];

    mergedLogs.sort(function (logA, logB) {
        return logA.blockNumber - logB.blockNumber;
    });

    const parsedLogs = mergedLogs.map(function (rawLog) {
        return ReadingContract.interface.parseLog(rawLog);
    });

    let tokenIds = [];

    for (const parsedLog of parsedLogs) {
        if (parsedLog.name === 'Transfer' && parsedLog.args['to'] === address) {
            tokenIds.push(parsedLog.args['id'].toNumber());
        }

        if (parsedLog.name === 'Transfer' && parsedLog.args['from'] === address) {
            tokenIds.splice(tokenIds.indexOf(parsedLog.args['id'].toNumber()), 1);
        }
    }

    tokenIds.sort(function(a, b) {
        return b - a;
    });

    for (const tokenId of tokenIds) {
        const isClaimed = await ReadingContract.claimedSculpture(tokenId);

        const nftTemplate = `
                <div class="single-nft">
                    <img src="metadata/${tokenId}${isClaimed ? '_claimed' : ''}.jpg" alt="" class="image know-width">
                    <a class="download-nft no-select" data-token-id="${tokenId}" href="#">Download</a>
                </div>
            `;

        document.getElementById('nfts-container').insertAdjacentHTML('afterbegin', nftTemplate);
    }

    if (tokenIds.length !== 0) {
        document.getElementById('takeoff').classList.add('hasNFTs');
        document.getElementById('nfts-container').parentElement.parentElement.parentElement.classList.remove('hide');
    }
};

const onDownloadNft = async function () {
    if (EthersSigner === undefined) {
        throw new Error('not connected');
    }

    const tokenId = this.dataset.tokenId;
    const digest = `Download high resolution file of #${tokenId}`;
    const signature = await EthersSigner.signMessage(digest);

    fetch(`${apiHost}/download-nft/${tokenId}/${signature}`)
        .then((res) => { return res.blob(); })
        .then((data) => {
            const a = document.createElement("a");
            a.href = window.URL.createObjectURL(data);
            a.download = `${tokenId}.jpg`;
            a.click();
        })
    ;
};

window.addEventListener('load', async function() {
    /*const disclaimerModal = document.getElementById('disclaimerModal');
    const modal = bootstrap.Modal.getOrCreateInstance(disclaimerModal);

    modal.show();*/

    EthersProvider.pollingInterval = 1000 * 240; // 4min
    ReadingContract = new ethers.Contract(contractAddress[network], await (await fetch('abi_'+network+'.json')).json(), EthersProvider);

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

    const refresh = async function () {
        if (EthersSigner === undefined) {
            throw new Error('Not connected');
        }

        const address = await EthersSigner.getAddress();

        saleState = await ReadingContract.saleState();

        if (saleState >= 2) {
            maxMintAmount = (await ReadingContract.maxMintPerWallet());
            mintedAmount = (await ReadingContract.publicAddressesMinted(address)).toNumber();
        }

        if (saleState === 0) {
            maxMintAmount = (await ReadingContract.genesisAddresses(address)).toNumber();
            mintedAmount = (await ReadingContract.genesisAddressesMinted(address)).toNumber();
        }

        if (saleState === 1) {
            maxMintAmount = (await ReadingContract.whitelistAddresses(address)).toNumber();
            mintedAmount = (await ReadingContract.whitelistAddressesMinted(address)).toNumber();
        }
    }

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

            retrieveNFTsForAddress(connectedWallet).then(function () {
                for (const downloadNftButton of document.getElementsByClassName('download-nft')) {
                    downloadNftButton.addEventListener('click', onDownloadNft);
                }
            });

            await refresh();

            if (saleState === 3) {
                this.querySelector('.connect-button-inner').innerText = formatWalletAddress(connectedWallet);
            } else {
                if (maxMintAmount !== mintedAmount) {
                    document.getElementById('mint-amount-container').classList.remove('hide');
                }
                this.querySelector('.connect-button-inner').innerText = 'Mint';

                for (const connectButton of document.getElementsByClassName('connect-button')) {
                    connectButton.removeEventListener('click', onConnect, false);
                }

                this.classList.remove('connect-button');
                this.classList.add('mint-button');

                for (const mintButton of document.getElementsByClassName('mint-button')) {
                    mintButton.addEventListener('click', onMint);
                }
            }
        } catch (error) {
            console.error(error);
            showNotification(parseError(error));
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

    const onMint = async function () {
        if (EthersSigner === undefined) {
            throw new Error('Not connected');
        }

        const Contract = ReadingContract.connect(EthersSigner);

        const walletBalance = await EthersSigner.getBalance();

        let mintPrice = '0.1';
        if (saleState === 0) {
            mintPrice = '0.05';
        }
        if (saleState === 1) {
            mintPrice = '0.075';
        }

        const mintAmount = parseInt(document.getElementById('mint-amount').innerText);
        if (mintAmount === 0) {
            throw new Error('Cannot mint zero NFTs');
        }
        const mintValue = ethers.utils.parseEther(mintPrice).mul(mintAmount);

        if (mintValue.gte(walletBalance)) {
            throw new Error(`Not enough funds to mint ${mintAmount} for ${ethers.utils.formatEther(mintValue)}`);
        }

        const mintTx = await Contract.mint(mintAmount, {value: mintValue});

        const receiptCall = mintTx.wait(1);

        receiptCall.catch(function (error) {
            console.error(error);
            showNotification(parseError(error));
        });

        receiptCall.then(async function (receipt) {
            console.debug('Mint successful', receipt);

            await refresh();
        });
    }

    for (const connectButton of document.getElementsByClassName('connect-button')) {
        connectButton.addEventListener('click', onConnect);
    }

    document.getElementById('increment-mint').addEventListener('click', function () {
        let counter = document.getElementById('mint-amount');

        const incrementedAmount = parseInt(counter.innerText) + 1;

        if (incrementedAmount > maxMintAmount - mintedAmount) {
            return;
        }

        counter.innerText = incrementedAmount;
    });

    document.getElementById('decrement-mint').addEventListener('click', function () {
        let counter = document.getElementById('mint-amount');

        const decrementedAmount = parseInt(counter.innerText) - 1;

        if (decrementedAmount < 0) {
            return;
        }

        counter.innerText = decrementedAmount;
    });
});
