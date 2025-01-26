"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { arbitrumSepolia } from "viem/chains";
import { createPublicClient } from "viem";
import {
  createBundlerClient,
  SmartAccount,
  toWebAuthnAccount,
} from "viem/account-abstraction";
import {
  toCircleSmartAccount,
  toModularTransport,
  toPasskeyTransport,
  toWebAuthnCredential,
  WebAuthnMode,
} from "@circle-fin/modular-wallets-core";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LoginForm } from "@/components/login-form";
import { RegisterForm } from "@/components/register-form";
import { WalletDashboard } from "@/components/wallet-dashboard";
import { useToast } from "@/hooks/use-toast";

// Initialize Circle client
const clientKey = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_KEY as string;
const clientUrl = process.env.NEXT_PUBLIC_CIRCLE_CLIENT_URL as string;

// Create Circle transports
const passkeyTransport = toPasskeyTransport(clientUrl, clientKey);
const modularTransport = toModularTransport(
  `${clientUrl}/arbitrumSepolia`,
  clientKey
);

// Create a bundler client
const bundlerClient = createBundlerClient({
  chain: arbitrumSepolia,
  transport: modularTransport,
});

// Create a public client
const client = createPublicClient({
  chain: arbitrumSepolia,
  transport: modularTransport,
});

export default function Home() {
  const [account, setAccount] = useState<SmartAccount>();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check for existing credential in localStorage
    const checkExistingCredential = async () => {
      const storedCredential = localStorage.getItem("credential");
      const storedUsername = localStorage.getItem("username");

      if (storedCredential) {
        try {
          setLoading(true);
          const credential = JSON.parse(storedCredential);
          const owner = toWebAuthnAccount({ credential });

          const circleAccount = await toCircleSmartAccount({
            client,
            owner,
            name: storedUsername ?? undefined,
          });

          setAccount(circleAccount);
        } catch (error) {
          console.error("Error restoring session:", error);
          localStorage.removeItem("credential");
          localStorage.removeItem("username");
        } finally {
          setLoading(false);
        }
      }
    };

    checkExistingCredential();
  }, []);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const credential = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Login,
      });

      localStorage.setItem("credential", JSON.stringify(credential));

      const owner = toWebAuthnAccount({ credential });
      const circleAccount = await toCircleSmartAccount({
        client,
        owner,
      });

      setAccount(circleAccount);
      toast({
        title: "Success",
        description: "Successfully logged in to your wallet",
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to login. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (username: string) => {
    try {
      setLoading(true);
      const credential = await toWebAuthnCredential({
        transport: passkeyTransport,
        mode: WebAuthnMode.Register,
        username,
      });

      localStorage.setItem("credential", JSON.stringify(credential));
      localStorage.setItem("username", username);

      const owner = toWebAuthnAccount({ credential });
      const circleAccount = await toCircleSmartAccount({
        client,
        owner,
        name: username,
      });

      setAccount(circleAccount);
      toast({
        title: "Success",
        description: "Successfully created your wallet",
      });
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create wallet. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("credential");
    localStorage.removeItem("username");
    setAccount(undefined);
    toast({
      title: "Logged out",
      description: "Successfully logged out of your wallet",
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-[350px]">
            <CardContent className="p-6">
              <div className="flex flex-col items-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (account) {
    return (
      <WalletDashboard
        account={account}
        bundlerClient={bundlerClient}
        client={client}
        onLogout={handleLogout}
      />
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-[350px]">
          <CardHeader>
            <CardTitle>Modular Wallet Demo</CardTitle>
            <CardDescription>
              Login or create a new wallet using your passkey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Login</TabsTrigger>
                <TabsTrigger value="register">Register</TabsTrigger>
              </TabsList>
              <TabsContent value="login">
                <LoginForm onSubmit={handleLogin} />
              </TabsContent>
              <TabsContent value="register">
                <RegisterForm onSubmit={handleRegister} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
