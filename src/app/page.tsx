"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  CreditCard,
  Download,
  Home,
  Rocket,
  Landmark,
  Wallet,
  IndianRupee,
  Bus,
  RefreshCw,
  Ticket,
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AnimatedCounter } from "@/components/animated-counter";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("home");
  const [refreshKey, setRefreshKey] = useState(0);
  const [totalCollection, setTotalCollection] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [yesterdayRevenue, setYesterdayRevenue] = useState(0);
  const [yesterdayRevenueSum, setYesterdayRevenueSum] = useState(0);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [metricsError, setMetricsError] = useState("");
  const [upiTotal, setUpiTotal] = useState(0);
  const [cardTotal, setCardTotal] = useState(0);
  const [cashTotal, setCashTotal] = useState(0);
  const [busReports, setBusReports] = useState<any[]>([]);
  const [loginChecked, setLoginChecked] = useState(false);
  const [expandedBus, setExpandedBus] = useState<number | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [operatorName, setOperatorName] = useState("");
  const router = useRouter();
  const baseUrl = "https://prod-api.bus3.in/api/v1-beta";
  const [tcFlash, setTcFlash] = useState(false);
  const [ttFlash, setTtFlash] = useState(false);
  const prevTotalCollection = useRef(totalCollection);
  const prevTotalTickets = useRef(totalTickets);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const loggedIn = localStorage.getItem("bus3_logged_in");
      if (loggedIn !== "1") {
        router.replace("/login");
      } else {
        setLoginChecked(true);
      }
    }
  }, [router]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const name = localStorage.getItem("bus3_operator_name");
      if (name) setOperatorName(name);
    }
  }, []);

  useEffect(() => {
    if (!loginChecked) return;
    async function fetchMetrics() {
      setLoadingMetrics(true);
      setMetricsError("");
      try {
        const token = localStorage.getItem("bus3_token");
        if (!token) throw new Error("No token found");
        // Fetch bus list
        const busRes = await fetch(`${baseUrl}/client/bus`, {
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (busRes.status === 401) {
          router.replace("/login");
          return;
        }
        const busData = await busRes.json();
        if (!busData.success || !Array.isArray(busData.data)) throw new Error("Failed to fetch buses");
        const busIds = busData.data.map((bus: any) => bus.id);
        // Fetch revenue and shift report for each bus
        let totalRevenueSum = 0;
        let totalTicketsSum = 0;
        let yesterdayRevenueSumLocal = 0;
        let upiSum = 0;
        let cardSum = 0;
        const reports: any[] = [];
        for (const id of busIds) {
          // Revenue
          const revRes = await fetch(`${baseUrl}/client/ticket/revenue?busId=${id}`, {
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (revRes.status === 401) {
            router.replace("/login");
            return;
          }
          const revData = await revRes.json();
          let busTotalRevenue = 0;
          let busTotalTickets = 0;
          let busYesterdayRevenue = 0;
          if (revData.success && Array.isArray(revData.data) && revData.data.length > 0) {
            for (const item of revData.data) {
              busTotalRevenue += Number(item.total_revenue) || 0;
              busTotalTickets += Number(item.total_tickets) || 0;
              busYesterdayRevenue += Number(item.yesterday_revenue) || 0;
            }
            totalRevenueSum += busTotalRevenue;
            totalTicketsSum += busTotalTickets;
            yesterdayRevenueSumLocal += busYesterdayRevenue;
          }
          // Shift report
          const shiftRes = await fetch(`${baseUrl}/client/shift/report/${id}`, {
            headers: { "Authorization": `Bearer ${token}` },
          });
          if (shiftRes.status === 401) {
            router.replace("/login");
            return;
          }
          const shiftData = await shiftRes.json();
          let upi = 0, card = 0, busName = "", regNo = "";
          let tripDetails: any[] = [];
          let bata = undefined;
          if (shiftData.success && shiftData.data) {
            upi = Number(shiftData.data.upi) || 0;
            card = Number(shiftData.data.card) || 0;
            busName = shiftData.data.busName || "";
            regNo = shiftData.data.regNo || "";
            upiSum += upi;
            cardSum += card;
            tripDetails = Array.isArray(shiftData.data.tripDetails) ? shiftData.data.tripDetails : [];
            bata = typeof shiftData.data.bata !== 'undefined' ? Number(shiftData.data.bata) : undefined;
          }
          const cash = busTotalRevenue - (upi + card);
          reports.push({
            id,
            busName,
            regNo,
            totalCollection: busTotalRevenue,
            totalTickets: busTotalTickets,
            yesterdayRevenue: busYesterdayRevenue,
            upi,
            card,
            cash,
            tripDetails,
            bata,
          });
        }
        setTotalCollection(totalRevenueSum);
        setTotalTickets(totalTicketsSum);
        setYesterdayRevenue(yesterdayRevenueSumLocal);
        setYesterdayRevenueSum(yesterdayRevenueSumLocal);
        setUpiTotal(upiSum);
        setCardTotal(cardSum);
        setCashTotal(totalRevenueSum - (upiSum + cardSum));
        setBusReports(reports);
      } catch (err: any) {
        setMetricsError(err.message || "Failed to load metrics");
      } finally {
        setLoadingMetrics(false);
      }
    }
    fetchMetrics();
    // eslint-disable-next-line
  }, [refreshKey, loginChecked]);

  useEffect(() => {
    if (prevTotalCollection.current !== totalCollection) {
      setTcFlash(true);
      setTimeout(() => setTcFlash(false), 600);
      prevTotalCollection.current = totalCollection;
    }
  }, [totalCollection]);

  useEffect(() => {
    if (prevTotalTickets.current !== totalTickets) {
      setTtFlash(true);
      setTimeout(() => setTtFlash(false), 600);
      prevTotalTickets.current = totalTickets;
    }
  }, [totalTickets]);

  const difference = totalCollection - yesterdayRevenue;

  return (
    <div className="flex min-h-screen w-full flex-col bg-white text-slate-900">
      <div className="flex flex-col sm:gap-4 sm:py-4">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200 bg-black px-4 py-4 sm:static sm:h-auto sm:border-0 sm:bg-black sm:px-6">
          <div>
            <h1 className="text-3xl font-bold text-white">BUS3</h1>
          </div>
          <button
            className="ml-2 p-2 rounded-lg hover:bg-gray-800"
            onClick={() => setShowMenu(true)}
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-white" />
          </button>
        </header>
        <div className="w-full mt-2 mb-2">
          <span className="text-lg font-extrabold tracking-wide ml-4 text-black" style={{ fontFamily: 'Inter, Montserrat, Arial, sans-serif' }}>{operatorName || ""}</span>
        </div>
        <main
          className={`grid flex-1 gap-4 p-4 pb-20 sm:px-6 sm:py-0 md:gap-8 items-start bg-white`}
        >
          {activeView === "home" ? (
            <Tabs defaultValue="today" className="bg-white rounded-xl">
              <div className="flex items-center">
                <TabsList>
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="yesterday">Yesterday</TabsTrigger>
                  <TabsTrigger value="custom">Custom</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 w-8 flex items-center justify-center group"
                    aria-label="Refresh metrics"
                    onClick={() => setRefreshKey((k) => k + 1)}
                  >
                    <RefreshCw className="h-6 w-6 transition-transform duration-300 group-hover:rotate-180 text-blue-600" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap font-semibold text-blue-700 ml-2">Refresh</span>
                  </Button>
                </div>
              </div>
              <TabsContent value="today">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col justify-start">
                      <div className="grid grid-cols-2 gap-4 bg-white rounded-xl mt-3">
                        <div className="flex flex-col items-center justify-center py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground text-center">
                            Total Collection
                          </p>
                          <p className={`text-2xl font-bold text-center transition-all duration-500 ${tcFlash ? 'animate-pulse text-green-600' : ''}`}> 
                            {loadingMetrics ? <span className="text-base">Loading...</span> : <AnimatedCounter key={`tc-${refreshKey}`} value={totalCollection} prefix="₹" />}
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground text-center">
                            Total Tickets
                          </p>
                          <p className={`text-2xl font-bold text-center transition-all duration-500 ${ttFlash ? 'bg-green-100 ring-2 ring-green-400 rounded' : ''}`}> 
                            {loadingMetrics ? <span className="text-base">Loading...</span> : <AnimatedCounter key={`tt-${refreshKey}`} value={totalTickets} />}
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground text-center">
                            Previous Day
                          </p>
                          <p className="text-2xl font-bold text-center">
                            {loadingMetrics ? <span className="text-base">Loading...</span> : <AnimatedCounter key={`pd-${refreshKey}`} value={yesterdayRevenueSum} prefix="₹" />}
                          </p>
                        </div>
                        <div className="flex flex-col items-center justify-center py-2">
                          <p className="text-xs font-medium uppercase text-muted-foreground text-center">
                            Difference
                          </p>
                          <p className="text-2xl font-bold text-red-500 text-center">
                            {loadingMetrics ? (
                              <span className="text-base">Loading...</span>
                            ) : (
                              <span className={difference < 0 ? "text-red-500" : "text-green-600"}>
                                <AnimatedCounter key={`diff-${refreshKey}`} value={difference} prefix="₹" />
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <div className="col-span-2 mt-4">
                        <div className="flex justify-between gap-6">
                          <div className="flex flex-col items-center flex-1">
                            <div className="flex items-center gap-1">
                              <Wallet className="h-4 w-4 text-yellow-600" />
                              <span className="font-semibold text-base text-yellow-700">
                                {loadingMetrics ? <span className="text-base">--</span> : <AnimatedCounter key={`cash-${refreshKey}`} value={cashTotal} prefix="₹" />}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">Cash</span>
                          </div>
                          <div className="flex flex-col items-center flex-1">
                            <div className="flex items-center gap-1">
                              <IndianRupee className="h-4 w-4 text-green-600" />
                              <span className="font-semibold text-base text-green-700">
                                {loadingMetrics ? <span className="text-base">--</span> : <AnimatedCounter key={`upi-${refreshKey}`} value={upiTotal} />}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">UPI</span>
                          </div>
                          <div className="flex flex-col items-center flex-1">
                            <div className="flex items-center gap-1">
                              <CreditCard className="h-4 w-4 text-blue-600" />
                              <span className="font-semibold text-base text-blue-700">
                                {loadingMetrics ? <span className="text-base">--</span> : <AnimatedCounter key={`card-${refreshKey}`} value={cardTotal} prefix="₹" />}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground mt-1">Card</span>
                          </div>
                        </div>
                      </div>
                      {metricsError && <p className="text-red-500 text-center font-semibold mt-2">{metricsError}</p>}
                    </div>
                  </CardContent>
                </Card>

                <div className="mt-6">
                  <h3 className="flex items-center gap-2 text-base font-semibold mb-2">
                    <span>Report</span>
                  </h3>
                  <div className="mt-2 space-y-3">
                    {loadingMetrics ? (
                      <div className="text-center text-base">Loading bus reports...</div>
                    ) : (
                      busReports.map((bus) => (
                        <div key={bus.id} className={`flex flex-col gap-2 rounded-xl shadow-sm p-4 cursor-pointer transition-all duration-200
                          ${expandedBus === bus.id
                            ? 'ring-2 ring-blue-400 scale-[1.02] bg-white border border-gray-200 text-slate-900'
                            : 'bg-white border border-gray-200 text-slate-900'}
                        `} onClick={() => setExpandedBus(expandedBus === bus.id ? null : bus.id)}>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center bg-primary/10 rounded-full h-10 w-10">
                              <Bus className="h-6 w-6 text-primary" />
                            </div>
                            <div className="flex-1">
                              <p className="font-semibold text-base flex items-center justify-between">
                                <span>{bus.busName} <span className="text-xs text-muted-foreground">({bus.regNo})</span></span>
                                <span className="relative flex h-3 w-3 ml-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">₹{bus.totalCollection} &bull; {bus.totalTickets} tickets</p>
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 text-xs font-medium">
                            <span>Cash: <span className="text-yellow-700 font-bold">₹{bus.cash}</span></span>
                            <span>UPI: <span className="text-green-700 font-bold">₹{bus.upi}</span></span>
                            <span>Card: <span className="text-blue-700 font-bold">₹{bus.card}</span></span>
                            {typeof bus.bata !== 'undefined' && (
                              <span>Bata: <span className="text-green-700 font-bold">₹{bus.bata}</span></span>
                            )}
                          </div>
                          {expandedBus === bus.id && bus.tripDetails && bus.tripDetails.length > 0 && (
                            <div className="mt-3 overflow-x-auto bg-white border border-gray-200 rounded-lg p-2 transition-colors duration-200">
                              <table className="min-w-full text-xs text-left border border-gray-200 bg-white rounded-lg">
                                <thead className="bg-gray-100">
                                  <tr>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b border-gray-200">Trip ID</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b border-gray-200">Total Tickets</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b border-gray-200">Total Collection</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b border-gray-200">UPI</th>
                                    <th className="px-3 py-2 font-semibold text-gray-700 border-b border-gray-200">ST</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {bus.tripDetails.map((trip: any) => (
                                    <tr key={trip.id} className="border-b last:border-b-0 hover:bg-blue-50 border-gray-200">
                                      <td className="px-3 py-2 text-slate-900">{trip.id}</td>
                                      <td className="px-3 py-2 text-slate-900">{trip.totalTickets}</td>
                                      <td className="px-3 py-2 text-slate-900">₹{trip.totalCollection}</td>
                                      <td className="px-3 py-2 text-slate-900">₹{trip.upi}</td>
                                      <td className="px-3 py-2 text-slate-900">{trip.st}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="yesterday">
                <div className="flex flex-col items-center justify-center text-center bg-white text-slate-900 rounded-xl border border-gray-200 p-8">
                  <Rocket className="mb-4 h-16 w-16 text-green-600" />
                  <h2 className="text-2xl font-semibold">Coming Soon!</h2>
                  <p className="mt-2 text-muted-foreground">
                    We&apos;re working hard to bring you something amazing.
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="custom">
                <div className="flex flex-col items-center justify-center text-center bg-white text-slate-900 rounded-xl border border-gray-200 p-8">
                  <Rocket className="mb-4 h-16 w-16 text-green-600" />
                  <h2 className="text-2xl font-semibold">Coming Soon!</h2>
                  <p className="mt-2 text-muted-foreground">
                    We&apos;re working hard to bring you something amazing.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="flex flex-col items-center justify-center text-center bg-white text-slate-900 rounded-xl border border-gray-200 p-8">
              <Rocket className="mb-4 h-16 w-16 text-green-600" />
              <h2 className="text-2xl font-semibold">Coming Soon!</h2>
              <p className="mt-2 text-muted-foreground">
                We&apos;re working hard to bring you something amazing.
              </p>
            </div>
          )}
        </main>
      </div>
      <footer className="fixed bottom-0 left-0 z-50 h-16 w-full border-t border-gray-200 bg-white">
        <div className="grid h-full grid-cols-3 font-medium">
          <Button
            className={`inline-flex h-full flex-col items-center justify-center rounded-none px-5 border border-gray-200 text-slate-900 bg-white ${activeView === "home" ? "bg-gray-200" : ""}`}
            onClick={() => setActiveView("home")}
          >
            <Home className="mb-1 h-5 w-5" />
            Home
          </Button>
          <Button
            className={`inline-flex h-full flex-col items-center justify-center rounded-none px-5 border border-gray-200 text-slate-900 bg-white ${activeView === "analytics" ? "bg-gray-200" : ""}`}
            onClick={() => setActiveView("analytics")}
          >
            <Activity className="mb-1 h-5 w-5" />
            Analytics
          </Button>
          <Button
            className={`inline-flex h-full flex-col items-center justify-center rounded-none px-5 border border-gray-200 text-slate-900 bg-white ${activeView === "settlements" ? "bg-gray-200" : ""}`}
            onClick={() => setActiveView("settlements")}
          >
            <Landmark className="mb-1 h-5 w-5" />
            Settlements
          </Button>
        </div>
      </footer>
      {/* Side Menu Drawer */}
      {showMenu && (
        <div className="fixed inset-0 z-50 bg-black/40 flex">
          <div className="w-64 bg-white h-full shadow-lg flex flex-col p-6 animate-slide-in-left">
            <button
              className="self-end mb-4 text-gray-500 hover:text-black"
              onClick={() => setShowMenu(false)}
              aria-label="Close menu"
            >
              ✕
            </button>
            <button
              className="mb-2 px-4 py-2 rounded-lg bg-gray-100 text-slate-900 font-semibold hover:bg-gray-200 transition"
              onClick={() => { setShowMenu(false); router.push('/change-passcode'); }}
            >
              Change Passcode
            </button>
            <button
              className="mb-4 px-4 py-2 rounded-lg bg-gray-100 text-slate-900 font-semibold hover:bg-gray-200 transition"
              onClick={() => { setShowMenu(false); router.push('/profile'); }}
            >
              Profile
            </button>
            <button
              className="mt-auto px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition"
              onClick={() => setShowLogoutConfirm(true)}
            >
              Logout
            </button>
          </div>
          {showLogoutConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
              <div className="bg-white rounded-xl shadow-lg p-6 flex flex-col items-center animate-fade-slide-down">
                <p className="mb-4 text-lg font-semibold text-slate-900">Are you sure you want to logout?</p>
                <div className="flex gap-4">
                  <button
                    className="px-4 py-2 rounded-lg bg-gray-200 text-slate-900 font-semibold hover:bg-gray-300 transition"
                    onClick={() => setShowLogoutConfirm(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 transition"
                    onClick={() => {
                      localStorage.removeItem("bus3_token");
                      localStorage.removeItem("bus3_logged_in");
                      setTotalCollection(0);
                      setTotalTickets(0);
                      setYesterdayRevenue(0);
                      setYesterdayRevenueSum(0);
                      setUpiTotal(0);
                      setCardTotal(0);
                      setCashTotal(0);
                      setBusReports([]);
                      setShowMenu(false);
                      setShowLogoutConfirm(false);
                      router.replace("/login");
                    }}
                  >
                    Confirm Logout
                  </button>
                </div>
              </div>
            </div>
          )}
          <div className="flex-1" onClick={() => setShowMenu(false)} />
        </div>
      )}
    </div>
  );
}

/*
Add this to your global CSS (e.g. globals.css):
@keyframes slide-in-left {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
.animate-slide-in-left {
  animation: slide-in-left 0.3s cubic-bezier(0.4, 0, 0.2, 1) both;
}
@keyframes fade-slide-down {
  from { opacity: 0; transform: translateY(-24px); }
  to { opacity: 1; transform: translateY(0); }
}
.animate-fade-slide-down {
  animation: fade-slide-down 0.25s cubic-bezier(0.4, 0, 0.2, 1) both;
}
*/
