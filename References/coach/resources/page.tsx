'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ExternalLink, Download } from 'lucide-react';
import { toast } from 'sonner';

interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'link' | 'file';
  url: string;
}

export default function CoachResourcesPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/coach/resources');
      if (!response.ok) {
        throw new Error('Failed to fetch resources');
      }
      const data = await response.json();
      setResources(data.resources || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast.error('Failed to load resources.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading resources...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Coaching Resources</h1>

      <p className="text-muted-foreground">Access a library of valuable materials to support your coaching practice.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {!resources || resources.length === 0 ? (
          <p className="col-span-full">No resources available at the moment.</p>
        ) : (
          resources.map((resource) => (
            <Card key={resource.id}>
              <CardHeader>
                <CardTitle>{resource.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{resource.description}</p>
                <Button asChild>
                  {resource.type === 'link' ? (
                    <a href={resource.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-2 h-4 w-4" /> View Resource
                    </a>
                  ) : (
                    <a href={resource.url} download>
                      <Download className="mr-2 h-4 w-4" /> Download File
                    </a>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
