"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner"; // Import toast for notifications

// Import the IngredientList component
import IngredientList from '@/components/IngredientList';
import axios from "axios";

// Define the IngredientStatus interface
interface IngredientStatus {
  name: string;
  status: 'Approved' | 'Not Approved' | 'Not Safe';
}
interface User {
  username: string;
  email: string;
  id: string;
}
interface Company {
  id: string;
  name: string;
  archived: boolean;
  img: string | null;
}

interface Item {
  id: string;
  name: string;
  imageurl: string;
  halal: boolean;
  healthy: boolean;
  retrived: string;
  AI: string;
  status: string;
  ingredients: IngredientStatus[]; // Added ingredients field
}

export default function CompanyDetails({ params }: { params: { id: string } }) {
  const [company, setCompany] = useState<Company | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  function parseJwt(token: string) {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    return JSON.parse(jsonPayload);
  }

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = parseJwt(token);
      setUser({ id: decoded.userId, username: decoded.username, email: decoded.email });
    } else {
      router.push("/login");
    }
    setLoading(false);
  }, [router]);
  useEffect(() => {
    fetch(`/api/companies/${params.id}/approve`)
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          toast.error(data.error); // Use toast for errors
        } else {
          setCompany(data.company);
          setItems(data.items);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to fetch company details"); // Use toast for errors
        setLoading(false);
      });
  }, [params.id]);

  const handleApprove = async (itemId: string) => {
    if (!user?.id) {
      toast.error("User ID is missing.");
      return;
    }
  
    try {
      const response = await axios.patch(`/api/items/${itemId}/approve`, {
        userFrom: user.id, // Ensure userFrom is passed
      });
  
      toast.success("Item approved successfully!");
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, status: "APPROVED" } : item
        )
      );
    } catch (error) {
      toast.error("Error approving item");
    }
  };
  
  const handleReject = async (itemId: string) => {
    if (!user?.id) {
      toast.error("User ID is missing.");
      return;
    }
  
    try {
      const response = await axios.patch(`/api/items/${itemId}/reject`, {
        userFrom: user.id, // Ensure userFrom is passed
      });
  
      toast.success("Item rejected successfully!");
      setItems((prevItems) =>
        prevItems.map((item) =>
          item.id === itemId ? { ...item, status: "REJECTED" } : item
        )
      );
    } catch (error) {
      toast.error("Error rejecting item");
    }
  };
  
  

  if (loading) return <p className="text-center p-8">Loading...</p>;
  if (error) return <p className="text-center p-8 text-red-500">{error}</p>;
  if (!company) return <p className="text-center p-8">No company details found.</p>;

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-3xl">{company.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant={company.archived ? "secondary" : "default"}>
            {company.archived ? "Archived" : "Active"}
          </Badge>
          {company.img && (
            <img src={company.img} alt={company.name} className="mt-4 w-full h-auto rounded-lg" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Uploaded Items for Review</CardTitle>
        </CardHeader>
        <CardContent>
          {items.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <img src={item.imageurl} alt={item.name} className="w-full h-48 object-cover rounded-md mb-4" />
                    <h3 className="text-xl font-bold mb-2">{item.name}</h3>
                    <div className="space-y-2 mb-4">
                      <Badge variant={item.halal ? "secondary" : "destructive"}>
                        {item.halal ? "Halal" : "Not Halal"}
                      </Badge>
                      <Badge variant={item.healthy ? "secondary" : "destructive"}>
                        {item.healthy ? "Healthy" : "Not Healthy"}
                      </Badge>
                      <Badge variant="outline">{item.status}</Badge>
                    </div>
                    <p className="text-sm mb-2">Extracted Text: {item.retrived}</p>
                    <p className="text-sm mb-4">AI Advisory: {item.AI}</p>

                    {/* Display Ingredients with Highlights */}
                    {item.ingredients && item.ingredients.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-semibold">Ingredients:</h4>
                        <IngredientList ingredients={item.ingredients} />
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button onClick={() => handleApprove(item.id)} size="sm" className="flex-1">
                        Approve
                      </Button>
                      <Button onClick={() => handleReject(item.id)} variant="destructive" size="sm" className="flex-1">
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <p>No items found for review.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
