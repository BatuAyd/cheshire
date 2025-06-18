import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { http } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { QueryClient } from "@tanstack/react-query";
import '@rainbow-me/rainbowkit/styles.css';

// Use your environment variables to set the project ID and Infura API key
const projectId = import.meta.env.VITE_PROJECT_ID || "YOUR_PROJECT_ID";
if (!projectId) {
    throw new Error("Missing WalletConnect Project ID. Please add it to your .env file.");
}

const infuraApiKey = import.meta.env.VITE_INFURA_API_KEY;
if (!infuraApiKey) {
    throw new Error("Missing Infura API key. Please add it to your .env file.");
  }

// Create the default configuration for RainbowKit
export const config = getDefaultConfig({
  appName: "cheshire",
  projectId,
  chains: [sepolia],
  ssr: false,
  transports: {
    [sepolia.id]: http(`https://sepolia.infura.io/v3/${infuraApiKey}`),
},
});

// Create the TanStack Query client
export const queryClient = new QueryClient();
