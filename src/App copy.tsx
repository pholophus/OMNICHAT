import React, { useEffect, useState } from 'react';
import { FaSearch} from "react-icons/fa";
import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
// import logo from './logo.svg';
import './App.scss';

import { Fluence, KeyPair } from '@fluencelabs/fluence';
import { krasnodar } from '@fluencelabs/fluence-network-environment';
import { sayHello, registerHelloPeer, registerImageGenerator, getTokenURI, getMetadata } from './_aqua/getting-started';
import { dataToString } from '@fluencelabs/fluence/dist/internal/utils';
import { ethers } from 'ethers'
import { PublicKey, Transaction } from "@solana/web3.js";
import Web3 from 'web3'
import erc721ABI from "../src/data/erc721.json"
import { Buffer } from 'buffer';

type DisplayEncoding = "utf8" | "hex";
type PhantomEvent = "disconnect" | "connect" | "accountChanged";
type PhantomRequestMethod =
  | "connect"
  | "disconnect"
  | "signTransaction"
  | "signAllTransactions"
  | "signMessage";

interface ConnectOpts {
  onlyIfTrusted: boolean;
}

interface PhantomProvider {
    publicKey: PublicKey | null;
    isConnected: boolean | null;
    signTransaction: (transaction: Transaction) => Promise<Transaction>;
    signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
    signMessage: (
      message: Uint8Array | string,
      display?: DisplayEncoding
    ) => Promise<any>;
    connect: (opts?: Partial<ConnectOpts>) => Promise<{ publicKey: PublicKey }>;
    disconnect: () => Promise<void>;
    on: (event: PhantomEvent, handler: (args: any) => void) => void;
    request: (method: PhantomRequestMethod, params: any) => Promise<unknown>;
}

const relayNodes = [krasnodar[4], krasnodar[5], krasnodar[6]];

function App() {
    const [isConnected, setIsConnected] = useState<boolean>(false);
    const [helloMessage, setHelloMessage] = useState<string | null>(null);

    const [peerIdInput, setPeerIdInput] = useState<string>('');
    const [relayPeerIdInput, setRelayPeerIdInput] = useState<string>('');
    const [message, setMessage] = useState<string>('');
    const [searchInput, setsearchInput] = useState<string>('');

    const [data, setdata] = useState<any>({
        address: "",
        Balance: null,
    });

    const [provider, setProvider] = useState<PhantomProvider | undefined>(
        undefined
    );
    const [walletKey, setWalletKey] = useState<PhantomProvider | undefined>(
        undefined
    );

    const getProvider = (): PhantomProvider | undefined => {
        if ("solana" in window) {
          // @ts-ignore
          const provider = window.solana as any;
          if (provider.isPhantom) return provider as PhantomProvider;
        }
    };

    const connectWallet = async () => {
        // @ts-ignore
        const { solana } = window;
    
        if (solana) {
          try {
            const response = await solana.connect();
            console.log("wallet account ", response.publicKey.toString());
            setWalletKey(response.publicKey.toString());
          } catch (err) {
            // { code: 4001, message: 'User rejected the request.' }
          }
        }
    };

    const disconnectWallet = async () => {
        // @ts-ignore
        const { solana } = window;
    
        if (walletKey && solana) {
          await (solana as PhantomProvider).disconnect();
          setWalletKey(undefined);
        }
    };

    useEffect(() => {
        const provider = getProvider();
    
        if (provider) setProvider(provider);
        else setProvider(undefined);
    }, []);

    const btnhandler = () => {
  
        // Asking if metamask is already present or not
        if ((window as any).ethereum) {
      
          // res[0] for fetching a first wallet
          (window as any).ethereum
            .request({ method: "eth_requestAccounts" })
            .then((res: any) => accountChangeHandler(res[0]));
        } else {
          alert("install metamask extension!!");
        }
      };

    const getbalance = (address: string) => {
  
        // Requesting balance method
        (window as any).ethereum.request({ 
            method: "eth_getBalance", 
            params: [address, "latest"] 
        })
        .then((balance: string) => {
            // Setting balance
            setdata({
                Balance: ethers.utils.formatEther(balance),
            });
        });
    };

    const accountChangeHandler = (account: string) => {
        // Setting an address data
        setdata({
            address: account,
        });
        
        // Setting a balance
        getbalance(account);
    };

    const connect = async (relayPeerId: string) => {

        try {
            await Fluence.start({ connectTo: relayPeerId });
            setIsConnected(true);
            // Register handler for this call in aqua:
            // HelloPeer.hello(%init_peer_id%)

            //register this code
            registerHelloPeer({
                hello: (from, target, message) => {
                    setHelloMessage(`From ${from} : ${message}`);
                    return 'You ' + from + ' sent a message to ' + target;
                },
            });
        } catch (err) {
            console.log('Peer initialization failed', err);
        }
        
    };

    const helloBtnOnClick = async () => {
        if (!Fluence.getStatus().isConnected) {
            return;
        }

        const peerIdInputs = peerIdInput.split(",")
        console.log(peerIdInputs)

        // Using aqua is as easy as calling a javascript funсtion
        const res = await sayHello(peerIdInputs, relayPeerIdInput, message);
        
        //this code will fire code line 26
        setHelloMessage(res);
    };

    return (
        <div className="App">
            <header>
             
            <h1>OMNI CHAT</h1>
            <div className="app">
                <div className="search">
                <input placeholder='Type your id'
                    onChange={e => setsearchInput(e.target.value)}
                />
                <FaSearch
                style={{color: "orange", position:"relative"}}
                // alt = "search input"
                onClick={()=>{
                    
                }}
                    />

                </div>
                </div>

            </header>
            <Container maxWidth="sm">
                <Typography component="div" style={{ 
                    backgroundColor: 'cream', height: '25vh', position: 'absolute', left: '50px' 
                    }}>
                    <h4>Address:</h4>
                    <div style={{ textAlign: 'center',backgroundColor:'EEECD9', width: '150px', height: '150px'}}>    
                    {data.address}
                    </div> 
                   
                    <strong>Balance: </strong>
                    <div style={{ textAlign: 'center', backgroundColor:'EEECD9',width: '150px', height: '150px'}}>    
                    {data.Balance}
                    {/* <button onClick={btnhandler} style = {{}}>
                    Connect to wallet
                    </button> */}
                    </div> 
                </Typography>
            </Container>

            <Container maxWidth="sm">
                <Typography component="div" style={{ 
                    backgroundColor: 'cream', height: '18vh', alignItems:'center', left: '50px' 
                    }}>
                <div className='connectbtn'>
                {/* <h2>Tutorial: Connect to Phantom Wallet</h2> */}
                <h2>Choose your wallet</h2>
                <button onClick={btnhandler} style = {{}}>
                    Connect to wallet
                    </button>
                   
               
                {provider && !walletKey  && (
                <button
                    style={{
                    fontSize: "15px",
                    
                    }}
                    onClick={connectWallet}
                >
                    Connect to Phantom Wallet
                </button>
                )}

                {provider && walletKey && (
                <div>
                    <p style = {{ alignContent: "center"}}>Connected account </p>

                    <button
                    // style={{
                    //     fontSize: "16px",
                    //     padding: "15px",
                    //     fontWeight: "bold",
                    //     borderRadius: "5px",
                    //     margin: "15px auto",
                    //     width: "130px",
                    // }}
                    onClick={disconnectWallet}
                    >
                    Disconnect
                    </button>
                </div>
                )}

                {!provider && (
                <p>
                    No provider found. Install{" "}
                    <a href="https://phantom.app/">Phantom Browser extension</a>
                </p>
                )}

                <p>
                <a
                    href="https://twitter.com/arealesramirez"
                    target="_blank"
                    rel="noreferrer"
                    className="twitter-link"
                >
                </a>
                </p>
            </div>
                </Typography>
            </Container>


  


            <div className="content">
                {isConnected ? (
                    <>
                        <h1>Connected</h1>
                        <table>
                            <tbody>
                                <tr>
                                    <td className="bold">Peer id:</td>
                                    <td className="mono">
                                        <span id="peerId">{Fluence.getStatus().peerId!}</span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-clipboard"
                                            onClick={() => copyToClipboard(Fluence.getStatus().peerId!)}
                                        >
                                            <i className="gg-clipboard"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td className="bold">Relay peer id:</td>
                                    <td className="mono">
                                        <span id="relayId">{Fluence.getStatus().relayPeerId}</span>
                                    </td>
                                    <td>
                                        <button
                                            className="btn-clipboard"
                                            onClick={() => copyToClipboard(Fluence.getStatus().relayPeerId!)}
                                        >
                                            <i className="gg-clipboard"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                     
                        <div>
                            <h2>Finding friend to connect with?</h2>
                            <p className="p">
                                Now try opening a new tab with the same application. Copy paste the peer id and relay
                                from the second tab and say hello!
                            </p>
                            <div className="row">
                                <label className="label bold">Target peer id</label>
                                <input
                                    id="targetPeerId"
                                    className="input"
                                    type="text"
                                    onChange={(e) => setPeerIdInput(e.target.value)}
                                    value={peerIdInput}
                                />
                            </div>
                            <div className="row">
                                <label className="label bold">Target relay</label>
                                <input
                                    id="targetRelayId"
                                    className="input"
                                    type="text"
                                    onChange={(e) => setRelayPeerIdInput(e.target.value)}
                                    value={relayPeerIdInput}
                                />
                            </div>
                            <div className="row">
                                <label className="label bold">Message</label>
                                <input
                                    id="messageId"
                                    className="input"
                                    type="text"
                                    onChange={(e) => setMessage(e.target.value)}
                                    value={message}
                                />
                            </div>
                            <div className="row">
                                <button className="btn btn-hello" onClick={helloBtnOnClick}>
                                    say hello
                                </button>
                            </div>
                        </div>
                    </>
                    
                ) : (
                    <>
                        {/* <h1>Intro 1: P2P browser-to-browser</h1> */}
                        <h2>Pick a relay</h2>
                        <ul>
                            {relayNodes.map((x) =>{
                                // searchInput
                           if(searchInput===''||x.peerId.search(searchInput)!==-1 ){
                            return (
                                <li key={x.peerId}>
                                    <span className="mono">{x.peerId}</span>
                                    <button className="btn" onClick={() => connect(x.multiaddr)}>
                                        Connect
                                    </button>
                                </li>
                                )
                           }
                           else{
                            return null
                           }
                               
                            })}
                        </ul>
                    </>
                )}

                {helloMessage && (
                    <>
                        <h2>Message</h2>
                        <div id="message"> {helloMessage} </div>
                    </>
                )}
            </div>

        </div>
    );
}

const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
};

export default App;
