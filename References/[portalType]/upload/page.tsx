"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Check, FileImage, Upload, X, Bot, Code, Copy } from "lucide-react";
import Image from "next/image";
import { useCallback, useState } from "react";
import { toast } from "sonner";

interface UploadedFile {
  id: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

export default function UploadPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  // Workflow conversion state
  const [workflowJson, setWorkflowJson] = useState("");
  const [agentName, setAgentName] = useState("");
  const [converting, setConverting] = useState(false);
  const [yamlPreview, setYamlPreview] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);

  const handleFileUpload = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);

    for (const file of fileArray) {
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not an image file`);
        continue;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const formData = new FormData();
        formData.append("file", file);

        // Simulate progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => {
            if (prev >= 90) {
              clearInterval(progressInterval);
              return prev;
            }
            return prev + Math.random() * 20;
          });
        }, 200);

        const response = await fetch("/api/upload-image", {
          method: "POST",
          body: formData,
        });

        clearInterval(progressInterval);
        setUploadProgress(100);

        if (!response.ok) {
          throw new Error("Upload failed");
        }

        const { url } = await response.json();

        const uploadedFile: UploadedFile = {
          id: crypto.randomUUID(),
          name: file.name,
          url,
          size: file.size,
          type: file.type,
          uploadedAt: new Date(),
        };

        setUploadedFiles((prev) => [uploadedFile, ...prev]);
        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error("Upload error:", error);
        toast.error(`Failed to upload ${file.name}`);
      } finally {
        setUploading(false);
        setUploadProgress(0);
      }
    }
  };

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileUpload(e.target.files);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleWorkflowConvert = async () => {
    if (!workflowJson.trim()) {
      toast.error("Please enter workflow JSON");
      return;
    }

    setConverting(true);
    try {
      const response = await fetch("/api/convert", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          workflowJson: workflowJson.trim(),
          agentName: agentName.trim() || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}`);
      }

      if (data.success) {
        setYamlPreview(data.yaml);
        setPreviewOpen(true);
        toast.success(`Agent "${data.agent.name}" created successfully!`);
        
        // Clear form
        setWorkflowJson("");
        setAgentName("");
      } else {
        throw new Error(data.error || "Conversion failed");
      }
    } catch (error) {
      console.error("Conversion error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to convert workflow");
    } finally {
      setConverting(false);
    }
  };

  const copyYamlToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(yamlPreview);
      toast.success("YAML copied to clipboard");
    } catch (error) {
      toast.error("Failed to copy YAML");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Upload & Convert</h1>
        <p className="text-muted-foreground mt-2">
          Upload images to Cloudflare R2 storage and convert workflows to MCP agents
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Upload Area */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Images
            </CardTitle>
            <CardDescription>
              Upload images to Cloudflare R2. Maximum file size is 5MB.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <Input
                type="file"
                accept="image/*"
                multiple
                onChange={handleInputChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                disabled={uploading}
              />
              <div className="space-y-2">
                <FileImage className="h-10 w-10 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {dragActive
                      ? "Drop files here"
                      : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, GIF up to 5MB
                  </p>
                </div>
              </div>
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Workflow to MCP Converter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              Workflow to MCP Agent
            </CardTitle>
            <CardDescription>
              Convert n8n workflow JSON to MCP agent specification
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="agentName">Agent Name (optional)</Label>
              <Input
                id="agentName"
                placeholder="My Custom Agent"
                value={agentName}
                onChange={(e) => setAgentName(e.target.value)}
                disabled={converting}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="workflowJson">Workflow JSON</Label>
              <Textarea
                id="workflowJson"
                placeholder='{"name": "My Workflow", "nodes": [...], ...}'
                value={workflowJson}
                onChange={(e) => setWorkflowJson(e.target.value)}
                className="min-h-[120px] font-mono text-sm"
                disabled={converting}
              />
            </div>

            <Button
              onClick={handleWorkflowConvert}
              disabled={converting || !workflowJson.trim()}
              className="w-full"
            >
              {converting ? (
                <>
                  <Code className="h-4 w-4 mr-2 animate-spin" />
                  Converting...
                </>
              ) : (
                <>
                  <Bot className="h-4 w-4 mr-2" />
                  Convert to Agent
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Upload Info */}
        <Card>
          <CardHeader>
            <CardTitle>About R2 Storage</CardTitle>
            <CardDescription>
              Cloudflare R2 provides S3-compatible object storage
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Global CDN</p>
                  <p className="text-muted-foreground">
                    Fast delivery worldwide
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Zero Egress Fees</p>
                  <p className="text-muted-foreground">No bandwidth charges</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">S3 Compatible</p>
                  <p className="text-muted-foreground">
                    Works with existing tools
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Check className="h-4 w-4 text-green-500 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium">Auto Scaling</p>
                  <p className="text-muted-foreground">Handles any file size</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploaded Files ({uploadedFiles.length})</CardTitle>
            <CardDescription>
              Recently uploaded images to R2 storage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {uploadedFiles.map((file) => (
                <div
                  key={file.id}
                  className="group relative border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video relative bg-muted">
                    <Image
                      src={file.url}
                      alt={file.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                  <div className="p-3">
                    <p
                      className="font-medium text-sm truncate"
                      title={file.name}
                    >
                      {file.name}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-1">
                      <span>{formatFileSize(file.size)}</span>
                      <span>{file.uploadedAt.toLocaleDateString()}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigator.clipboard.writeText(file.url)}
                        className="flex-1 text-xs"
                      >
                        Copy URL
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(file.url, "_blank")}
                        className="flex-1 text-xs"
                      >
                        Open
                      </Button>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(file.id)}
                    className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 hover:bg-background"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* YAML Preview Modal */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              MCP Agent Specification
            </DialogTitle>
            <DialogDescription>
              Your workflow has been converted to an MCP agent specification in YAML format.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={copyYamlToClipboard}
                variant="outline"
                size="sm"
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy YAML
              </Button>
              <Button
                onClick={() => setPreviewOpen(false)}
                variant="outline"
                size="sm"
              >
                Close
              </Button>
            </div>
            
            <div className="border rounded-md overflow-hidden">
              <div className="bg-muted px-3 py-2 border-b">
                <code className="text-sm font-mono">agent-specification.yaml</code>
              </div>
              <div className="p-4 overflow-auto max-h-[50vh]">
                <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                  {yamlPreview}
                </pre>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
