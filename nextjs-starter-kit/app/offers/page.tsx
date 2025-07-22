"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatPrice } from "@/lib/pricing";
import { toast } from "sonner";
import { 
  DollarSign, 
  Clock, 
  CheckCircle, 
  XCircle,
  Eye,
  MessageSquare,
  TrendingUp,
  Package,
  Calendar,
  User,
  ArrowRight
} from "lucide-react";

interface Offer {
  id: string;
  amount: number;
  currency: string;
  message?: string;
  status: "pending" | "accepted" | "rejected" | "expired";
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
  buyer: {
    id: string;
    name: string;
    email: string;
    credibilityScore?: number;
  };
  listing: {
    id: string;
    title: string;
    description?: string;
    price: number;
    isBundle: boolean;
    dataset?: {
      id: string;
      name: string;
      instanceCount: number;
    };
    bundleDatasets?: Array<{
      id: string;
      name: string;
      instanceCount: number;
    }>;
  };
}

interface OfferStats {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  totalValue: number;
  avgOffer: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  const fetchOffers = useCallback(async () => {
    try {
      const response = await fetch("/api/offers");
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/sign-in");
          return;
        }
        throw new Error("Failed to fetch offers");
      }

      const data = await response.json();
      setOffers(data.offers);
      setStats(data.stats);
    } catch (error) {
      console.error("Error fetching offers:", error);
      toast.error("Failed to load offers");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const respondToOffer = async (offerId: string, action: "accept" | "reject") => {
    setResponding(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to ${action} offer`);
      }

      toast.success(`Offer ${action}ed successfully!`);
      await fetchOffers(); // Refresh the list

    } catch (error) {
      console.error(`Error ${action}ing offer:`, error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error(`Failed to ${action} offer`);
      }
    } finally {
      setResponding(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-yellow-100 text-yellow-800";
      case "accepted": return "bg-green-100 text-green-800";
      case "rejected": return "bg-red-100 text-red-800";
      case "expired": return "bg-gray-100 text-gray-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending": return <Clock className="h-4 w-4" />;
      case "accepted": return <CheckCircle className="h-4 w-4" />;
      case "rejected": return <XCircle className="h-4 w-4" />;
      case "expired": return <Clock className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const isOfferExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const filteredOffers = (status: string) => {
    return offers.filter(offer => {
      if (status === "all") return true;
      if (status === "expired") return isOfferExpired(offer.expiresAt);
      return offer.status === status;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading offers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Incoming Offers</h1>
          <p className="text-gray-600 mt-2">
            Manage offers from potential buyers for your dataset listings.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/sell")}
          >
            Create Listing
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Offers</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Pending</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-primary">{formatPrice(stats.totalValue)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Offer</p>
                  <p className="text-2xl font-bold">{formatPrice(stats.avgOffer)}</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Offers Tabs */}
      <Tabs defaultValue="pending" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all">All ({offers.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending ({filteredOffers("pending").length})
          </TabsTrigger>
          <TabsTrigger value="accepted">
            Accepted ({filteredOffers("accepted").length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({filteredOffers("rejected").length})
          </TabsTrigger>
          <TabsTrigger value="expired">
            Expired ({filteredOffers("expired").length})
          </TabsTrigger>
        </TabsList>

        {["all", "pending", "accepted", "rejected", "expired"].map(status => (
          <TabsContent key={status} value={status}>
            <div className="space-y-4">
              {filteredOffers(status).length === 0 ? (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center py-8 text-gray-500">
                      <DollarSign className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p className="mb-2">No {status === "all" ? "" : status} offers found</p>
                      <p className="text-sm">
                        {status === "pending" 
                          ? "New offers will appear here when buyers are interested in your listings."
                          : "Check back later for new offers."
                        }
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                filteredOffers(status).map(offer => {
                  const isExpired = isOfferExpired(offer.expiresAt);
                  const isPending = offer.status === "pending" && !isExpired;
                  
                  return (
                    <Card key={offer.id} className={isPending ? "border-yellow-200" : ""}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{offer.listing.title}</CardTitle>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className={getStatusColor(isExpired ? "expired" : offer.status)}>
                                {getStatusIcon(isExpired ? "expired" : offer.status)}
                                {isExpired ? "Expired" : offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                              </Badge>
                              {offer.listing.isBundle && (
                                <Badge variant="outline">Bundle</Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-primary">
                              {formatPrice(offer.amount)}
                            </p>
                            <p className="text-sm text-gray-500">
                              Listed: {formatPrice(offer.listing.price)}
                            </p>
                          </div>
                        </div>
                      </CardHeader>
                      
                      <CardContent className="space-y-4">
                        {/* Buyer Info */}
                        <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <User className="h-5 w-5 text-gray-600" />
                          <div className="flex-1">
                            <p className="font-medium">{offer.buyer.name}</p>
                            <p className="text-sm text-gray-600">{offer.buyer.email}</p>
                          </div>
                          {offer.buyer.credibilityScore && (
                            <Badge variant="secondary">
                              {offer.buyer.credibilityScore}/100 credibility
                            </Badge>
                          )}
                        </div>

                        {/* Dataset Info */}
                        <div className="space-y-2">
                          <h4 className="font-medium text-sm">Dataset Details</h4>
                          {offer.listing.isBundle ? (
                            <div className="space-y-1">
                              {offer.listing.bundleDatasets?.map(dataset => (
                                <div key={dataset.id} className="flex justify-between text-sm">
                                  <span>{dataset.name}</span>
                                  <span className="text-gray-500">{dataset.instanceCount} instances</span>
                                </div>
                              ))}
                            </div>
                          ) : offer.listing.dataset ? (
                            <div className="flex justify-between text-sm">
                              <span>{offer.listing.dataset.name}</span>
                              <span className="text-gray-500">{offer.listing.dataset.instanceCount} instances</span>
                            </div>
                          ) : null}
                        </div>

                        {/* Message */}
                        {offer.message && (
                          <div className="space-y-2">
                            <h4 className="font-medium text-sm flex items-center gap-2">
                              <MessageSquare className="h-4 w-4" />
                              Buyer Message
                            </h4>
                            <p className="text-sm text-gray-600 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                              &quot;{offer.message}&quot;
                            </p>
                          </div>
                        )}

                        {/* Timing */}
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Received {new Date(offer.createdAt).toLocaleDateString()}
                          </span>
                          {offer.expiresAt && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {isExpired ? "Expired" : "Expires"} {new Date(offer.expiresAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>

                        {/* Actions */}
                        {isPending && (
                          <div className="flex gap-3 pt-4 border-t">
                            <Button
                              onClick={() => respondToOffer(offer.id, "accept")}
                              disabled={responding === offer.id}
                              className="flex-1"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {responding === offer.id ? "Processing..." : "Accept Offer"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => respondToOffer(offer.id, "reject")}
                              disabled={responding === offer.id}
                              className="flex-1"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        )}

                        {offer.status === "accepted" && (
                          <div className="flex justify-center pt-4 border-t">
                            <Button variant="outline" className="flex items-center gap-2">
                              <Eye className="h-4 w-4" />
                              View Transaction
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}