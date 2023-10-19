import { ClickToComponent } from "click-to-react-component";
import { ThemeProvider } from "next-themes";
import Head from "@components/common/Head";
import { Background, Layout } from "@components/ui";
import "../styles/global/styles.scss";
import { AppWrapper } from "@components/ui/context";
import { AppProps } from "next/dist/shared/lib/router/router";
import { SessionProvider } from "next-auth/react";

import { getDefaultWallets, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { alchemyProvider } from "wagmi/providers/alchemy";
import { publicProvider } from "wagmi/providers/public";
import { createConfig, configureChains, WagmiConfig, mainnet } from "wagmi";
import "@rainbow-me/rainbowkit/styles.css";
import { base } from "../networks";
const env = String(process.env.NEXT_PUBLIC_ENV);
const alchemyId = String(process.env.NEXT_PUBLIC_ALCHEMY_ID);

const { chains, publicClient } = configureChains(
  [base],
  [alchemyProvider({ apiKey: alchemyId }), publicProvider()]
);

const { connectors } = getDefaultWallets({
  appName: "Merge to earn",
  projectId: "de0572b37606593fb394dfe2324f427f",
  chains,
});

const wagmiConfig = createConfig({
  autoConnect: true,
  connectors,
  publicClient,
});

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <>
      <ClickToComponent />
      <Head />
      <ThemeProvider
        attribute="class"
        storageKey="nightwind-mode"
        defaultTheme="dark"
      >
        <WagmiConfig config={wagmiConfig}>
          <RainbowKitProvider
            chains={chains}
            coolMode
            showRecentTransactions={true}
          >
            <SessionProvider session={session}>
              <AppWrapper>
                <Layout>
                  <Background />
                  <Component {...pageProps} />
                </Layout>
              </AppWrapper>
            </SessionProvider>
          </RainbowKitProvider>
        </WagmiConfig>
      </ThemeProvider>
    </>
  );
}

export default MyApp;
