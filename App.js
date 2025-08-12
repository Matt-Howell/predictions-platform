import React, { useMemo } from 'react';
import {
    ConnectionProvider,
    WalletProvider,
} from '@solana/wallet-adapter-react';
import {
    WalletModalProvider
} from '@solana/wallet-adapter-react-ui';
import {
    PhantomWalletAdapter,
    SolflareWalletAdapter,
    TrustWalletAdapter
} from '@solana/wallet-adapter-wallets';
import SolGuesser from './BettingApp.tsx';

export default function App() {
    // Configure the network and wallets
    const network = "https://api.devnet.solana.com";
    const wallets = useMemo(
        () => [
            new PhantomWalletAdapter(),
            new SolflareWalletAdapter(),
            new TrustWalletAdapter()
        ],
        []
    );

    return (
    <ConnectionProvider endpoint={network}>
        <WalletProvider wallets={wallets} autoConnect>
            <WalletModalProvider>
                <SolGuesser />
            </WalletModalProvider>
        </WalletProvider>
    </ConnectionProvider>
    );
}