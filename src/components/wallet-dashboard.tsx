"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Address,
  PublicClient,
  formatUnits,
  erc20Abi,
  encodeFunctionData,
  parseUnits,
} from "viem";
import {
  LogOut,
  Send,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Loader2,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BundlerClient, SmartAccount } from "viem/account-abstraction";
import { useToast } from "@/hooks/use-toast";

interface WalletDashboardProps {
  account: SmartAccount;
  bundlerClient: BundlerClient;
  client: PublicClient;
  onLogout: () => void;
}

const ARBITRUM_SEPOLIA_USDC: Address =
  "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d";
const USDC_DECIMALS = 6;

type ViewState = "overview" | "gasless" | "tx_success";

export function WalletDashboard({
  account,
  bundlerClient,
  client,
  onLogout,
}: WalletDashboardProps) {
  const [balance, setBalance] = useState<string>("0.00");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [view, setView] = useState<ViewState>("overview");
  const [txHash, setTxHash] = useState<string>("");
  const { toast } = useToast();

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const balance = await client.readContract({
          address: ARBITRUM_SEPOLIA_USDC,
          abi: erc20Abi,
          functionName: "balanceOf",
          args: [account.address],
        });

        // Format USDC balance with exactly 2 decimal places
        const formattedBalance = Number(
          formatUnits(balance, USDC_DECIMALS)
        ).toFixed(2);
        setBalance(formattedBalance);
      } catch (error) {
        console.error("Error fetching USDC balance:", error);
        setBalance("0.00");
      } finally {
        if (isInitialLoad) {
          setIsInitialLoad(false);
        }
      }
    };

    fetchBalance();
    // Poll for balance updates every 10 seconds
    const interval = setInterval(fetchBalance, 10000);
    return () => clearInterval(interval);
  }, [account, client]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setAmount(newAmount);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount) return;

    try {
      setIsLoading(true);

      const callData = {
        to: ARBITRUM_SEPOLIA_USDC,
        data: encodeFunctionData({
          abi: erc20Abi,
          functionName: "transfer",
          args: [recipient as Address, parseUnits(amount, USDC_DECIMALS)],
        }),
      };

      const hash = await bundlerClient.sendUserOperation({
        account,
        calls: [callData],
        paymaster: true,
      });

      const { receipt } = await bundlerClient.waitForUserOperationReceipt({
        hash,
      });

      setRecipient("");
      setAmount("");
      setTxHash(receipt.transactionHash);
      setView("tx_success");
    } catch (error) {
      console.error("Transaction error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to send transaction. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransactionForm = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
    >
      <div className="flex items-center space-x-2 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setView("overview");
            setAmount("");
            setRecipient("");
          }}
          className="h-8 w-8"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-lg font-semibold">Send a Gasless Transaction</h3>
      </div>
      <form onSubmit={(e) => handleSend(e)} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="recipient">Recipient Address</Label>
          <Input
            id="recipient"
            placeholder="Recipient's Arbitrum Sepolia address"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount">Amount (USDC)</Label>
          <Input
            id="amount"
            type="number"
            step="1"
            placeholder="0.00"
            value={amount}
            onChange={handleAmountChange}
            required
          />
        </div>
        <Button className="w-full" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="mr-2">Sending</span>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Loader2 className="h-4 w-4" />
              </motion.div>
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" /> Send
            </>
          )}
        </Button>
      </form>
    </motion.div>
  );

  const renderTransactionSuccess = () => (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="text-center"
    >
      <div className="space-y-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-green-100 p-3">
            <Check className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Transaction Hash</p>
          <div className="flex items-center justify-between rounded-lg bg-muted p-3 font-mono text-sm">
            <span className="truncate">{txHash}</span>
            <button
              onClick={() => copyToClipboard(txHash)}
              className="ml-2 rounded-md p-1 hover:bg-muted-foreground/20"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-500" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
        <div className="space-y-4">
          <a
            href={`https://sepolia.arbiscan.io/tx/${txHash}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
          >
            View on Arbiscan
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </a>
          <div>
            <Button
              onClick={() => {
                setView("overview");
                setAmount("");
                setRecipient("");
                setTxHash("");
              }}
              className="mt-4"
            >
              Return to Overview
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-blue-700 mb-2 uppercase tracking-wide mt-2">
                <img
                  src="https://sepolia.arbiscan.io/assets/arbsepolia/images/svg/logos/chain-light.svg?v=25.1.3.4"
                  alt="Arbitrum Logo"
                  className="h-4 w-4"
                />
                Arbitrum Sepolia
              </div>
              <Button variant="ghost" size="icon" onClick={onLogout}>
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
            <CardTitle>Your Modular Wallet</CardTitle>
            <CardDescription>
              Manage your wallet and send transactions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AnimatePresence mode="wait">
              {view === "overview" ? (
                <motion.div
                  key="overview"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-6"
                >
                  <div className="space-y-2">
                    <Label>Wallet Address</Label>
                    <div className="flex items-center justify-between rounded-lg bg-muted p-3 font-mono text-sm">
                      <span className="truncate">{account.address}</span>
                      <button
                        onClick={() => copyToClipboard(account.address)}
                        className="ml-2 rounded-md p-1 hover:bg-muted-foreground/20"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Balance</Label>
                    <div className="py-1">
                      {isInitialLoad ? (
                        <div className="flex items-center space-x-2">
                          <Skeleton className="h-8 w-8" />
                          <Skeleton className="h-7 w-12" />
                        </div>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-primary">
                            {balance}
                          </span>
                          <span className="ml-2 text-lg font-medium">USDC</span>
                        </>
                      )}
                    </div>
                  </div>

                  <Card
                    className="cursor-pointer transition-colors hover:bg-muted/50"
                    onClick={() => setView("gasless")}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-base">
                            Send a Gasless Transaction
                          </CardTitle>
                          <CardDescription>
                            Gas fees are covered by the developer via a
                            preconfigured policy.
                          </CardDescription>
                        </div>
                        <ArrowRight className="h-5 w-5 text-muted-foreground" />
                      </div>
                    </CardHeader>
                  </Card>
                </motion.div>
              ) : view === "gasless" ? (
                <motion.div key="gasless">{renderTransactionForm()}</motion.div>
              ) : (
                <motion.div key="tx_success">
                  {renderTransactionSuccess()}
                </motion.div>
              )}
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
