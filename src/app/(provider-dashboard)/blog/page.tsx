'use client';

import { useEffect, useState, useRef } from 'react';
import { auth, storage } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { getProviderByEmail, updateProvider } from '@/lib/data';
import type { Provider, BlogPost, BlogFaqItem } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Loader2, PlusCircle, Calendar, Upload, Trash2, X, FileText, Edit, Search, Plus, Trash, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { getDownloadURL, ref, uploadBytesResumable, deleteObject } from 'firebase/storage';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import Image from 'next/image';
import { formatInTimeZone } from 'date-fns-tz';

const emptyItem: BlogPost = {
  id: '',
  slug: '',
  title: '',
  description: '',
  imageUrl: '',
  faq: [],
  tags: [],
  seo: {
    metaTitle: '',
    metaDescription: '',
    metaKeywords: '',
  },
  enabled: true,
  createdAt: '',
};

export default function BlogManagementPage() {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<BlogPost | null>(null);
  const [tagsInput, setTagsInput] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser?.email) {
        try {
          let providerData = await getProviderByEmail(currentUser.email);
          if (providerData) {
            if (!providerData.settings.blogs || providerData.settings.blogs.length === 0) {
              const defaultBlog: BlogPost = {
                id: uuidv4(),
                slug: 'welcome-to-our-blog',
                title: 'Welcome to Our Blog',
                description: 'We are excited to launch our new blog page! Here, we will share regular updates, industry news, helpful guides, tips, and insights to help you get the most out of our services. Stay tuned for our upcoming posts, and feel free to reach out if you have any questions or would like to see us cover a specific topic.',
                imageUrl: 'https://picsum.photos/seed/welcomeblog/800/450',
                faq: [
                  {
                    question: 'What kind of topics will you cover?',
                    answer: 'We plan to cover a wide range of topics, including expert maintenance guides, business insights, service updates, and practical tips to solve common challenges.'
                  },
                  {
                    question: 'How can I get in touch with questions?',
                    answer: 'You can easily get in touch with us using the Contact details on our profile page, or by booking a direct consultation slot.'
                  }
                ],
                tags: ['welcome', 'news', 'tips'],
                seo: {
                  metaTitle: 'Welcome to Our Service Blog - Guides and Updates',
                  metaDescription: 'Read our opening blog post introducing our new articles, guides, tips, and service updates to help your business thrive.',
                  metaKeywords: 'blog, news, service tips, guides, updates'
                },
                enabled: true,
                createdAt: new Date().toISOString(),
              };
              const updatedBlogs = [defaultBlog];
              await updateProvider(providerData.username, {
                settings: {
                  ...providerData.settings,
                  blogs: updatedBlogs
                }
              });
              providerData = {
                ...providerData,
                settings: {
                  ...providerData.settings,
                  blogs: updatedBlogs
                }
              };
            }
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
    setTagsInput('');
    setImageFile(null);
    setImagePreview(null);
    setUploadProgress(null);
  };

  const handleOpenForm = (item: BlogPost | null = null) => {
    if (item) {
      setCurrentItem({ ...item });
      setTagsInput(item.tags ? item.tags.join(', ') : '');
      setImagePreview(item.imageUrl || null);
    } else {
      setCurrentItem({
        ...emptyItem,
        id: uuidv4(),
        faq: [],
        tags: [],
        seo: { metaTitle: '', metaDescription: '', metaKeywords: '' },
      });
      setTagsInput('');
      setImagePreview(null);
    }
    setIsFormOpen(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentItem) return;
    const title = e.target.value;
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    
    setCurrentItem({
      ...currentItem,
      title,
      slug: currentItem.slug === '' || currentItem.slug === title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, -1) ? slug : currentItem.slug
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast({ title: 'File too large', description: 'Please upload an image smaller than 5MB.', variant: 'destructive' });
        return;
      }
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleAddFaq = () => {
    if (!currentItem) return;
    const currentFaq = currentItem.faq || [];
    setCurrentItem({
      ...currentItem,
      faq: [...currentFaq, { question: '', answer: '' }]
    });
  };

  const handleFaqChange = (index: number, field: 'question' | 'answer', value: string) => {
    if (!currentItem || !currentItem.faq) return;
    const updatedFaq = currentItem.faq.map((item, idx) => {
      if (idx === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setCurrentItem({ ...currentItem, faq: updatedFaq });
  };

  const handleRemoveFaq = (index: number) => {
    if (!currentItem || !currentItem.faq) return;
    setCurrentItem({
      ...currentItem,
      faq: currentItem.faq.filter((_, idx) => idx !== index)
    });
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!currentItem || !provider) return;

    if (!currentItem.title.trim()) {
      toast({ title: 'Validation Error', description: 'Blog Title is required.', variant: 'destructive' });
      return;
    }
    if (!currentItem.slug.trim()) {
      toast({ title: 'Validation Error', description: 'Blog Slug is required.', variant: 'destructive' });
      return;
    }
    if (!currentItem.description.trim()) {
      toast({ title: 'Validation Error', description: 'Blog Description is required.', variant: 'destructive' });
      return;
    }

    setIsPending(true);

    try {
      let imageUrl = currentItem.imageUrl || '';
      if (imageFile) {
        setUploadProgress(0);
        const storageRef = ref(storage, `blogs/${provider.username}/${uuidv4()}-${imageFile.name}`);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        imageUrl = await new Promise<string>((resolve, reject) => {
          uploadTask.on('state_changed',
            (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
            reject,
            async () => resolve(await getDownloadURL(uploadTask.snapshot.ref))
          );
        });
      }

      const parsedTags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const finalItem: BlogPost = {
        ...currentItem,
        imageUrl,
        tags: parsedTags,
        createdAt: currentItem.createdAt || new Date().toISOString(),
      };

      const existingItems = provider.settings.blogs || [];
      const itemIndex = existingItems.findIndex(b => b.id === finalItem.id);

      let updatedItems: BlogPost[];
      if (itemIndex > -1) {
        updatedItems = existingItems.map(b => b.id === finalItem.id ? finalItem : b);
      } else {
        updatedItems = [finalItem, ...existingItems];
      }

      await updateProvider(provider.username, {
        settings: {
          ...provider.settings,
          blogs: updatedItems
        }
      });

      setProvider(p => p ? { ...p, settings: { ...p.settings, blogs: updatedItems } } : null);
      toast({ title: 'Success', description: 'Blog post saved successfully.' });
      resetFormState();
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to save blog post.', variant: 'destructive' });
      console.error(error);
    } finally {
      setIsPending(false);
    }
  };

  const handleDelete = async () => {
    if (!currentItem?.id || !provider) return;
    setIsPending(true);

    try {
      const itemToDelete = provider.settings.blogs?.find(b => b.id === currentItem.id);
      const updatedItems = (provider.settings.blogs || []).filter(b => b.id !== currentItem.id);

      await updateProvider(provider.username, {
        settings: {
          ...provider.settings,
          blogs: updatedItems
        }
      });

      if (itemToDelete?.imageUrl && itemToDelete.imageUrl.includes('firebasestorage')) {
        const imageRef = ref(storage, itemToDelete.imageUrl);
        await deleteObject(imageRef).catch(err => console.warn("Could not delete cover image:", err));
      }

      setProvider(p => p ? { ...p, settings: { ...p.settings, blogs: updatedItems } } : null);
      toast({ title: 'Success', description: 'Blog post deleted.' });
    } catch (error: any) {
      toast({ title: 'Error', description: 'Failed to delete blog post.', variant: 'destructive' });
    } finally {
      setIsDeleteAlertOpen(false);
      setCurrentItem(null);
      setIsPending(false);
    }
  };

  if (loading || !provider) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  const blogs = provider.settings.blogs || [];

  return (
    <div className="space-y-6">
      <Card className="border shadow-md">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl font-bold">Manage Blogs</CardTitle>
            <CardDescription>Write and publish blogs to share updates, guides, and boost SEO.</CardDescription>
          </div>
          <Button onClick={() => handleOpenForm()}>
            <PlusCircle className="mr-2 h-4 w-4" /> Add Blog Post
          </Button>
        </CardHeader>
        <CardContent>
          {blogs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map(item => (
                <Card key={item.id} className="flex flex-col overflow-hidden border shadow-sm">
                  {item.imageUrl ? (
                    <div className="relative aspect-video w-full">
                      <Image
                        src={item.imageUrl}
                        alt={item.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 33vw"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="aspect-video w-full bg-muted flex items-center justify-center text-muted-foreground">
                      <FileText className="h-12 w-12" />
                    </div>
                  )}
                  <CardHeader className="flex-1 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatInTimeZone(new Date(item.createdAt), provider?.settings?.timezone || 'UTC', provider?.settings?.dateFormat || 'dd/MM/yyyy')}</span>
                      </div>
                      <Badge variant={item.enabled ? 'default' : 'secondary'}>
                        {item.enabled ? 'Published' : 'Draft'}
                      </Badge>
                    </div>
                    <CardTitle className="line-clamp-2 text-lg font-bold">{item.title}</CardTitle>
                    <p className="text-sm text-muted-foreground line-clamp-3 mt-2">{item.description}</p>
                  </CardHeader>
                  {item.tags && item.tags.length > 0 && (
                    <div className="px-6 pb-2 flex flex-wrap gap-1">
                      {item.tags.slice(0, 3).map((tag, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">#{tag}</Badge>
                      ))}
                      {item.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs">+{item.tags.length - 3} more</Badge>
                      )}
                    </div>
                  )}
                  <CardFooter className="flex justify-end gap-2 border-t pt-4 bg-muted/20">
                    <Button variant="outline" size="sm" onClick={() => handleOpenForm(item)}>
                      <Edit className="mr-2 h-3.5 w-3.5" />Edit
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => {
                      setCurrentItem(item);
                      setIsDeleteAlertOpen(true);
                    }}>
                      <Trash2 className="mr-2 h-3.5 w-3.5" />Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-12 text-center h-[40vh]">
              <FileText className="h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-semibold animate-pulse">No blog posts yet.</h3>
              <p className="mb-4 mt-2 text-sm text-muted-foreground">Create posts to attract organic search engine traffic.</p>
              <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Blog Post
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor Modal */}
      <Dialog open={isFormOpen} onOpenChange={(open) => !open && resetFormState()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <form onSubmit={handleSave} className="space-y-6">
            <DialogHeader>
              <DialogTitle>{currentItem?.createdAt ? 'Edit Blog Post' : 'Add Blog Post'}</DialogTitle>
              <DialogDescription>
                Provide detailed post information, FAQs, tags, and SEO configurations.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {/* Cover Image Upload */}
              <div className="space-y-2">
                <Label>Cover Image</Label>
                <div className="flex items-center gap-4">
                  {imagePreview && (
                    <div className="relative w-32 h-20 rounded-lg overflow-hidden border">
                      <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={() => {
                          setImageFile(null);
                          setImagePreview(null);
                          if (currentItem) currentItem.imageUrl = '';
                        }}
                        className="absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full hover:bg-destructive/80 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" /> Upload Cover Image
                    </Button>
                    <p className="text-xs text-muted-foreground mt-1">Recommended size: 1200x630. Max size: 5MB.</p>
                  </div>
                </div>
                {uploadProgress !== null && (
                  <div className="space-y-1">
                    <Progress value={uploadProgress} className="h-2" />
                    <p className="text-xs text-muted-foreground text-right">{Math.round(uploadProgress)}% uploaded</p>
                  </div>
                )}
              </div>

              {/* Title & Slug */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter blog title"
                    value={currentItem?.title || ''}
                    onChange={handleTitleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">URL Slug *</Label>
                  <Input
                    id="slug"
                    placeholder="slug-url-path"
                    value={currentItem?.slug || ''}
                    onChange={(e) => currentItem && setCurrentItem({ ...currentItem, slug: e.target.value.toLowerCase().replace(/[^a-z0-9\-]+/g, '-') })}
                    required
                  />
                  <p className="text-[10px] text-muted-foreground">Unique URL slug (e.g. standard-cleaning-tips).</p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Content / Description *</Label>
                <Textarea
                  id="description"
                  placeholder="Start writing blog content here..."
                  rows={8}
                  value={currentItem?.description || ''}
                  onChange={(e) => currentItem && setCurrentItem({ ...currentItem, description: e.target.value })}
                  required
                />
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">Tags</Label>
                <Input
                  id="tags"
                  placeholder="cleaning, tips, maintenance"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                />
                <p className="text-[10px] text-muted-foreground">Enter tags separated by commas.</p>
              </div>

              {/* FAQs Section */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <Label className="text-base font-semibold">Frequently Asked Questions (FAQ)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={handleAddFaq}>
                    <Plus className="mr-1 h-4 w-4" /> Add FAQ Item
                  </Button>
                </div>
                <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                  {currentItem?.faq && currentItem.faq.length > 0 ? (
                    currentItem.faq.map((faqItem, idx) => (
                      <Card key={idx} className="relative p-4 border shadow-sm space-y-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-2 top-2 h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveFaq(idx)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Question #{idx + 1}</Label>
                          <Input
                            placeholder="Enter question"
                            value={faqItem.question}
                            onChange={(e) => handleFaqChange(idx, 'question', e.target.value)}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-semibold">Answer #{idx + 1}</Label>
                          <Textarea
                            placeholder="Enter answer"
                            rows={2}
                            value={faqItem.answer}
                            onChange={(e) => handleFaqChange(idx, 'answer', e.target.value)}
                            required
                          />
                        </div>
                      </Card>
                    ))
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">No FAQs added for this blog post yet.</p>
                  )}
                </div>
              </div>

              {/* SEO Meta Tags (Accordion) */}
              <Accordion type="single" collapsible className="w-full pt-2">
                <AccordionItem value="seo" className="border rounded-md px-4">
                  <AccordionTrigger className="hover:no-underline py-3">
                    <span className="flex items-center gap-2 font-medium">
                      <Globe className="h-4 w-4 text-primary" /> SEO Search Engine Optimization Settings
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-2 pb-4">
                    <div className="space-y-2">
                      <Label htmlFor="metaTitle">SEO Meta Title</Label>
                      <Input
                        id="metaTitle"
                        placeholder="Default is Blog Title"
                        value={currentItem?.seo?.metaTitle || ''}
                        onChange={(e) => currentItem && setCurrentItem({
                          ...currentItem,
                          seo: { ...(currentItem.seo || {}), metaTitle: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaDescription">SEO Meta Description</Label>
                      <Textarea
                        id="metaDescription"
                        placeholder="Default is blog description summary..."
                        rows={2}
                        value={currentItem?.seo?.metaDescription || ''}
                        onChange={(e) => currentItem && setCurrentItem({
                          ...currentItem,
                          seo: { ...(currentItem.seo || {}), metaDescription: e.target.value }
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="metaKeywords">SEO Meta Keywords</Label>
                      <Input
                        id="metaKeywords"
                        placeholder="cleaning service, repair tips, kitchen fix"
                        value={currentItem?.seo?.metaKeywords || ''}
                        onChange={(e) => currentItem && setCurrentItem({
                          ...currentItem,
                          seo: { ...(currentItem.seo || {}), metaKeywords: e.target.value }
                        })}
                      />
                      <p className="text-[10px] text-muted-foreground">Separate keywords with commas.</p>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              {/* Visibility status */}
              <div className="flex items-center justify-between border-t pt-4">
                <div className="space-y-0.5">
                  <Label htmlFor="enabled">Publish Status</Label>
                  <p className="text-xs text-muted-foreground">Drafts won't show on the public page.</p>
                </div>
                <Switch
                  id="enabled"
                  checked={currentItem?.enabled ?? true}
                  onCheckedChange={(checked) => currentItem && setCurrentItem({ ...currentItem, enabled: checked })}
                />
              </div>
            </div>

            <DialogFooter className="border-t pt-4 gap-2">
              <Button type="button" variant="outline" onClick={resetFormState}>
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Blog Post
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this blog post ("{currentItem?.title}"). This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCurrentItem(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
