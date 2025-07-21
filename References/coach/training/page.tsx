'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BookOpen, 
  Video, 
  FileText, 
  Download, 
  Search, 
  Filter,
  PlayCircle,
  Clock,
  Users,
  Star
} from 'lucide-react';

// Mock training materials data
const trainingMaterials = {
  videos: [
    {
      id: 1,
      title: "Getting Started with Agency Management",
      description: "Learn the basics of setting up and managing your first agency",
      duration: "15 min",
      difficulty: "Beginner",
      views: 1234,
      rating: 4.8,
      thumbnail: "/api/placeholder/320/180",
      category: "Setup"
    },
    {
      id: 2,
      title: "Advanced Client Onboarding Strategies",
      description: "Master the art of smooth client onboarding for better retention",
      duration: "22 min",
      difficulty: "Advanced",
      views: 856,
      rating: 4.9,
      thumbnail: "/api/placeholder/320/180",
      category: "Clients"
    },
    {
      id: 3,
      title: "Performance Analytics Deep Dive",
      description: "Understanding metrics and KPIs that matter for coaching success",
      duration: "18 min",
      difficulty: "Intermediate",
      views: 692,
      rating: 4.7,
      thumbnail: "/api/placeholder/320/180",
      category: "Analytics"
    }
  ],
  documents: [
    {
      id: 1,
      title: "Coach Success Handbook",
      description: "Complete guide to becoming a successful coach on the Ozza platform",
      type: "PDF",
      size: "2.5 MB",
      downloads: 1567,
      category: "Guides"
    },
    {
      id: 2,
      title: "Client Communication Templates",
      description: "Pre-written email templates for various client interactions",
      type: "DOCX",
      size: "850 KB",
      downloads: 923,
      category: "Templates"
    },
    {
      id: 3,
      title: "Pricing Strategy Worksheet",
      description: "Interactive worksheet to help determine optimal pricing",
      type: "XLSX",
      size: "1.2 MB",
      downloads: 456,
      category: "Worksheets"
    }
  ],
  webinars: [
    {
      id: 1,
      title: "Monthly Coach Q&A Session",
      description: "Ask questions and get answers from experienced coaches",
      date: "2024-07-15",
      time: "2:00 PM EST",
      attendees: 45,
      status: "upcoming"
    },
    {
      id: 2,
      title: "Advanced Marketing Techniques",
      description: "Learn cutting-edge marketing strategies for your agency",
      date: "2024-07-08",
      time: "3:00 PM EST",
      attendees: 78,
      status: "completed"
    }
  ]
};

export default function TrainingPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = ['all', 'Setup', 'Clients', 'Analytics', 'Marketing', 'Templates'];

  const filteredVideos = trainingMaterials.videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || video.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const filteredDocuments = trainingMaterials.documents.filter(doc => {
    const matchesSearch = doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         doc.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Training Materials</h1>
        <p className="text-muted-foreground">
          Access resources, tutorials, and training content to enhance your coaching skills
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search training materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
            >
              {category === 'all' ? 'All' : category}
            </Button>
          ))}
        </div>
      </div>

      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="videos" className="gap-2">
            <Video className="h-4 w-4" />
            Video Training
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="webinars" className="gap-2">
            <Users className="h-4 w-4" />
            Webinars
          </TabsTrigger>
        </TabsList>

        <TabsContent value="videos">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredVideos.map((video) => (
              <Card key={video.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video bg-muted relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <PlayCircle className="h-12 w-12 text-primary" />
                  </div>
                  <Badge className="absolute top-2 right-2">{video.difficulty}</Badge>
                </div>
                <CardHeader>
                  <CardTitle className="text-lg">{video.title}</CardTitle>
                  <CardDescription>{video.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {video.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4" />
                      {video.rating}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{video.views} views</span>
                    <Button size="sm">
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Watch
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="documents">
          <div className="grid gap-4">
            {filteredDocuments.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <FileText className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{doc.title}</h3>
                        <p className="text-sm text-muted-foreground">{doc.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{doc.type}</span>
                          <span>{doc.size}</span>
                          <span>{doc.downloads} downloads</span>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="webinars">
          <div className="grid gap-4">
            {trainingMaterials.webinars.map((webinar) => (
              <Card key={webinar.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-primary/10 rounded-lg">
                        <Users className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{webinar.title}</h3>
                        <p className="text-sm text-muted-foreground">{webinar.description}</p>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{webinar.date}</span>
                          <span>{webinar.time}</span>
                          <span>{webinar.attendees} attendees</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Badge variant={webinar.status === 'upcoming' ? 'default' : 'secondary'}>
                        {webinar.status}
                      </Badge>
                      <Button size="sm">
                        {webinar.status === 'upcoming' ? 'Register' : 'Watch Recording'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}