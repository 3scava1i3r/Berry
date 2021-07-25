const web3btn = document.getElementById("web3connect");
const acc = document.getElementById("acc");

const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
let selectedACC;
let chainId;

const ConnectWallet = async () => {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider, // required
      options: {
        infuraId: "d4c7101b7a7e45fd8adaaf71881b6be4", // required
      },
    },
    portis: {
      package: Portis, // required
      options: {
        id: "b7d059de-0fea-4fbf-a725-143562297c30", // required
      },
    },
  };

  const web3Modal = new Web3Modal({
    providerOptions, // required
  });

  const provider = await web3Modal.connect();
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  chainId = await web3.eth.net.getId();
  console.log(chainId);
  selectedACC = accounts[0];
  acc.innerText = selectedACC;

  if ((selectedACC != null) | undefined) {
    console.log(selectedACC);
  } else {
    console.log("yo! connect the damn wallet");
  }
};

web3btn.addEventListener("click", () => {
  ConnectWallet();
  setTimeout(() => {
      getNftBalance()
  }, 2000);
});




const getNftBalance = () => {
    if ((selectedACC == undefined) | null) {
      swal("Error", "no wallet found", "error");
    } else {
      const options = { method: "GET" };
      fetch(
        `https://api.covalenthq.com/v1/${chainId}/address/${selectedACC}/balances_v2/?nft=true&key=ckey_62dc169a991f4d7ebe7dd52afef:`,
        options
      )
        .then((response) => response.json())
        .then((char) => {
          console.log("found all nfts");
          char.data.items.map((res, i) => {
            if (res.type == "nft") {
              try {
                
                const gg = document.getElementById("nft-balance");
                const content = `
                        <div id="container">
                            <div id="card">
                                <div id="content">
                                <img src="${res.nft_data[0].external_data.image}" alt="NFT image" id="nftimg" >
                                    <h2>${res.contract_name}</h2>
                                    <h3>${res.nft_data[0].external_data.name}</h3>
                                    <p>${res.contract_name}</p>
                                    <a href="#">More info on the nft</a>
                                </div>
                            </div>
                        </div>
                        `;
                gg.innerHTML += content;
              } catch (error) {
                console.log(error);
              }
            }
          });
        });
    }
}