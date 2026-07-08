'use client';

import { useEffect, useState, useRef } from 'react';
import { auth, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getProviderByEmail, updateProvider } from '@/lib/data';
import type { Provider, ProviderVideoItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, PlusCircle, Upload, Trash2, X, Video, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

const emptyItem: Partial<ProviderVideoItem> = {
  title: '',
  videoUrl: '',
  type: 'youtube',
  displayOrder: 0,
  enabled: true,
};

function getYoutubeId(url: string) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function VideosPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<Partial<ProviderVideoItem> | null>(null);
  
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser?.email) {
        try {
          const providerData = await getProviderByEmail(currentUser.email);
          if (providerData) {
            setProvider(providerData);
          } else {
            router.push('/dashboard');
          }
        } catch (error) {
          toast({ title: 'Error', description: 'Could not load your data.', variant: 'destructive' });
        } finally {
          setLoading(false);
        }
      } else {
        router.push('/login');
      }
    });
  }, [router, toast]);

  const resetFormState = () => {
    setIsFormOpen(false);
    setCurrentItem(null);
    setVideoFile(null);
    setVideoPreview(null);
    setUploadProgress(null);
  };

  const handleOpenForm = (item: ProviderVideoItem | null = null) => {
    if (item) {
      setCurrentItem({ ...item });
      if (item.type === 'uploaded') {
        setVideoPreview(item.videoUrl);
      } else {
        setVideoPreview(null);
      }
    } else {
      const newOrder = provider?.settings.videos?.items ? Math.max(0, ...provider.settings.videos.items.map(s => s.displayOrder)) + 1 : 1;
      setCurrentItem({ ...emptyItem, displayOrder: newOrder });
      setVideoPreview(null);
    }
    setIsFormOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast({ title: 'Invalid File Type', description: 'Please upload a video file.', variant: 'destructive' });
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast({ title: 'File too large', description: 'Please upload a video smaller than 10MB.', variant: 'destructive' });
        return;
      }
      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      if (currentItem) {
        setCurrentItem(prev => prev ? { ...prev, type: 'uploaded' } : null);
      }
    }
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentItem || !provider) return;

    if (currentItem.type === 'youtube' && !currentItem.videoUrl) {
      toast({ title: 'URL Required', description: 'Please enter a YouTube video URL.', variant: 'destructive'});
      return;
    }
    if (currentItem.type === 'youtube' && !getYoutubeId(currentItem.videoUrl || '')) {
      toast({ title: 'Invalid YouTube URL', description: 'Please provide a valid YouTube watch link or share link.', variant: 'destructive'});
      return;
    }
    if (currentItem.type === 'uploaded' && !videoFile && !currentItem.videoUrl) {
      toast({ title: 'Video File Required', description: 'Please select a video file to upload.', variant: 'destructive'});
      return;
    }

    setIsPending(true);
    try {
      let videoUrl = currentItem.videoUrl || '';
      
      if (currentItem.type === 'uploaded' && videoFile) {
        setUploadProgress(0);
        const storageRef = ref(storage, `videos/${provider.username}/${uuidv4()}-${videoFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, videoFile);
        videoUrl = await new Promise<string>((resolve, reject) => {
            uploadTask.on('state_changed',
                (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                reject,
                async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
            );
        });
      }

      const finalItem: ProviderVideoItem = {
        ...emptyItem,
        ...currentItem,
        id: currentItem.id || uuidv4(),
        videoUrl,
      } as ProviderVideoItem;

      const existingItems = provider.settings.videos?.items || [];
      const itemIndex = existingItems.findIndex(s => s.id === finalItem.id);
      
      let updatedItems: ProviderVideoItem[];
      if (itemIndex > -1) {
        updatedItems = existingItems.map(s => s.id === finalItem.id ? finalItem : s);
      } else {
        updatedItems = [...existingItems, finalItem];
      }
      
      const videosSettings = { 
        enabled: provider.settings.videos?.enabled ?? true,
        title: provider.settings.videos?.title || 'Review Videos',
        items: updatedItems 
      };
      await updateProvider(provider.username, { settings: { ...provider.settings, videos: videosSettings } });
      toast({ title: 'Success', description: 'Video review saved.' });
      setProvider(p => p ? { ...p, settings: { ...p.settings, videos: videosSettings } } : null);
      resetFormState();
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: 'Failed to save video review.', variant: 'destructive' });
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!currentItem?.id || !provider) return;

    setIsPending(true);
    try {
        const itemToDelete = provider.settings.videos?.items.find(i => i.id === currentItem.id);
        const updatedItems = (provider.settings.videos?.items || []).filter(i => i.id !== currentItem.id);
        const videosSettings = { 
            enabled: provider.settings.videos?.enabled ?? true, 
            title: provider.settings.videos?.title || 'Review Videos',
            items: updatedItems 
        };
        await updateProvider(provider.username, { settings: { ...provider.settings, videos: videosSettings } });
        if (itemToDelete?.videoUrl && itemToDelete.type === 'uploaded' && itemToDelete.videoUrl.includes('firebasestorage')) {
            const videoRef = ref(storage, itemToDelete.videoUrl);
            await deleteObject(videoRef).catch(err => console.warn("Could not delete video file:", err));
        }
        toast({ title: 'Success', description: 'Video review deleted.' });
        setProvider(p => p ? { ...p, settings: { ...p.settings, videos: videosSettings } } : null);
    } catch (error: any) {
        console.error(error);
        toast({ title: 'Error', description: 'Failed to delete video review.', variant: 'destructive' });
    } finally {
        setIsPending(false);
        setIsDeleteAlertOpen(false);
        setCurrentItem(null);
    }
  };

  const sortedItems = provider?.settings.videos?.items?.slice().sort((a, b) => a.displayOrder - b.displayOrder) || [];

  if (loading || !provider) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            Manage Video Reviews
          </h1>
          <p className="text-muted-foreground mt-1">Upload direct video reviews or embed YouTube reviews to display on your public page.</p>
        </div>
        <Button onClick={() => handleOpenForm()} className="w-full sm:w-auto justify-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Video Review
        </Button>
      </div>

      {sortedItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedItems.map(item => {
            const ytId = item.type === 'youtube' ? getYoutubeId(item.videoUrl) : null;
            const embedUrl = ytId ? `https://www.youtube.com/embed/${ytId}` : null;
            return (
              <Card key={item.id} className="overflow-hidden flex flex-col group border">
                <CardContent className="p-0 bg-muted/40 aspect-video relative flex items-center justify-center border-b">
                  {item.type === 'youtube' && embedUrl ? (
                    <iframe
                      src={embedUrl}
                      className="w-full h-full pointer-events-none"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      title={item.title}
                    />
                  ) : (
                    <video
                      src={item.videoUrl}
                      className="w-full h-full object-cover"
                      muted
                      playsInline
                    />
                  )}
                  <Badge variant={item.type === 'youtube' ? "destructive" : "secondary"} className="absolute top-2 left-2 z-10 capitalize">
                    {item.type}
                  </Badge>
                  {!item.enabled && (
                    <Badge variant="outline" className="absolute top-2 right-2 z-10 bg-background/90 text-red-500 border-red-500">
                      Disabled
                    </Badge>
                  )}
                </CardContent>
                <CardHeader className="p-4 flex-1">
                  <div className="flex justify-between items-start gap-2">
                    <CardTitle className="text-lg font-bold line-clamp-1">{item.title}</CardTitle>
                    <span className="text-xs text-muted-foreground bg-muted py-1 px-2 rounded-md font-mono shrink-0">Order: {item.displayOrder}</span>
                  </div>
                </CardHeader>
                <CardFooter className="p-4 border-t bg-muted/10 flex justify-between gap-2">
                  <Button variant="outline" size="sm" onClick={() => handleOpenForm(item)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => { setCurrentItem(item); setIsDeleteAlertOpen(true); }}>
                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="border-dashed py-16 flex flex-col items-center justify-center text-center">
          <Video className="h-16 w-16 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-semibold mb-2">No video reviews added yet.</h3>
          <p className="text-muted-foreground max-w-sm mb-6">Click the button below to upload video reviews or add YouTube embeds to your page.</p>
          <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Video Review
          </Button>
        </Card>
      )}

      <Dialog open={isFormOpen} onOpenChange={(isOpen) => !isOpen && resetFormState()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{currentItem?.id ? 'Edit Video Review' : 'Add Video Review'}</DialogTitle>
            <DialogDescription>Fill in the details below to add a video review to your public page.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title / Customer Name</Label>
              <Input
                id="title"
                value={currentItem?.title || ''}
                onChange={(e) => setCurrentItem(prev => prev ? { ...prev, title: e.target.value } : null)}
                placeholder="e.g. John Doe - Satisfied Customer"
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Video Source</Label>
              <Select
                value={currentItem?.type || 'youtube'}
                onValueChange={(val: 'youtube' | 'uploaded') => {
                  setCurrentItem(prev => prev ? { ...prev, type: val } : null);
                  setVideoPreview(null);
                  setVideoFile(null);
                }}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select video source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">YouTube Embed Link</SelectItem>
                  <SelectItem value="uploaded">Direct Upload (Max 10MB)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {currentItem?.type === 'youtube' ? (
              <div className="space-y-2">
                <Label htmlFor="youtubeUrl">YouTube Video URL</Label>
                <Input
                  id="youtubeUrl"
                  value={currentItem?.videoUrl || ''}
                  onChange={(e) => setCurrentItem(prev => prev ? { ...prev, videoUrl: e.target.value } : null)}
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  required
                  disabled={isPending}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Video File Upload</Label>
                <div 
                  onClick={() => !isPending && fileInputRef.current?.click()}
                  className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 transition-colors rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer text-center"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="video/*"
                    onChange={handleFileChange}
                    disabled={isPending}
                  />
                  <Upload className="h-10 w-10 text-muted-foreground/75 mb-2" />
                  <p className="text-sm font-semibold">
                    {videoFile ? videoFile.name : 'Click to select video file'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">MP4, WEBM or MOV files up to 10MB</p>
                </div>

                {videoPreview && (
                  <div className="mt-4 aspect-video relative rounded-lg overflow-hidden border">
                    <video
                      src={videoPreview}
                      className="w-full h-full object-cover"
                      controls
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="absolute top-2 right-2 rounded-full"
                      onClick={(e) => {
                        e.stopPropagation();
                        setVideoPreview(null);
                        setVideoFile(null);
                        if (currentItem) setCurrentItem(prev => prev ? { ...prev, videoUrl: '' } : null);
                      }}
                      disabled={isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}

            {uploadProgress !== null && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span>Uploading video...</span>
                  <span>{Math.round(uploadProgress)}%</span>
                </div>
                <Progress value={uploadProgress} />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="displayOrder">Display Order</Label>
                <Input
                  id="displayOrder"
                  type="number"
                  value={currentItem?.displayOrder ?? 0}
                  onChange={(e) => setCurrentItem(prev => prev ? { ...prev, displayOrder: parseInt(e.target.value) || 0 } : null)}
                  required
                  disabled={isPending}
                />
              </div>

              <div className="flex items-center gap-2 pt-8">
                <Switch
                  id="enabled"
                  checked={currentItem?.enabled ?? true}
                  onCheckedChange={(checked) => setCurrentItem(prev => prev ? { ...prev, enabled: checked } : null)}
                  disabled={isPending}
                />
                <Label htmlFor="enabled">Enable on public page</Label>
              </div>
            </div>

            <DialogFooter className="pt-4 border-t">
              <Button type="button" variant="outline" onClick={resetFormState} disabled={isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Video Review
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this video review ("{currentItem?.title}"). If the video was uploaded, the file will be removed from storage. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
