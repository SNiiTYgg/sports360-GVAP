/**
 * Media Upload Component
 * 
 * Upload images and embed videos for house galleries.
 * Supports:
 * - YouTube Shorts embeds
 * - Instagram Reels/Posts embeds
 * - Direct image uploads to Supabase storage
 */

import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Upload, Trash2, Loader2, Image, Video, Link, Youtube, Instagram, BarChart3, Pin, PinOff, Pencil } from 'lucide-react';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import { houses } from '@/data/houses';
import { useHouseMedia, validateAndParseUrl, type HouseMediaItem } from '@/hooks/useHouseMedia';
import { cn } from '@/lib/utils';
import { logToggleChange, logEntityChange } from '@/lib/adminActivityLog';

interface MediaUploadProps {
  restrictToHouse?: string | null;
}

const MediaUpload: React.FC<MediaUploadProps> = ({ restrictToHouse }) => {
  // Filter available houses based on restriction
  const availableHouses = restrictToHouse
    ? houses.filter(h => h.slug === restrictToHouse)
    : houses;

  const [selectedHouse, setSelectedHouse] = useState(availableHouses[0]?.slug || houses[0].slug);
  const [platform, setPlatform] = useState<'youtube' | 'instagram'>('youtube');
  const [videoUrl, setVideoUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPollId, setSelectedPollId] = useState<string>('none');
  const [availablePolls, setAvailablePolls] = useState<{ id: string; question: string; isActive: boolean }[]>([]);
  const [uploading, setUploading] = useState(false);
  // Edit modal state
  const [editingItem, setEditingItem] = useState<HouseMediaItem | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [editPlatform, setEditPlatform] = useState<'youtube' | 'instagram'>('youtube');
  const [editSaving, setEditSaving] = useState(false);
  const { toast } = useToast();

  // Delete confirmation state
  const [deleteTarget, setDeleteTarget] = useState<HouseMediaItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch all media for admin view
  const { media, loading, refetch } = useHouseMedia();

  // Fetch available polls for selection
  useEffect(() => {
    const fetchPolls = async () => {
      const { data, error } = await supabase
        .from('polls')
        .select('id, question, is_active, ends_at')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const now = new Date();
        setAvailablePolls(data.map(p => ({
          id: p.id,
          question: p.question,
          isActive: p.is_active && (!p.ends_at || new Date(p.ends_at) > now)
        })));
      }
    };
    fetchPolls();
  }, []);

  // Handle video link submission
  const handleLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoUrl.trim()) {
      toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
      return;
    }

    // Validate and parse URL
    const { isValid, embedUrl, error } = validateAndParseUrl(videoUrl, platform);

    if (!isValid || !embedUrl) {
      toast({ title: 'Invalid URL', description: error, variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const mediaData = {
        house: selectedHouse,
        media_type: 'video',
        platform: platform,
        original_url: videoUrl,
        embed_url: embedUrl,
        thumbnail_url: (platform === 'youtube' && thumbnailUrl) ? thumbnailUrl : null,
        description: description || null,
        poll_id: selectedPollId !== 'none' ? selectedPollId : null,
      };
      const { error: dbError } = await supabase
        .from('house_media')
        .insert(mediaData);

      if (dbError) throw dbError;

      await logEntityChange('insert', 'house_media', `video:${selectedHouse}`, null, mediaData, selectedHouse);
      toast({ title: 'Success', description: 'Video link added successfully!' });
      setVideoUrl('');
      setThumbnailUrl('');
      setDescription('');
      setSelectedPollId('none');
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  // Handle image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImage = file.type.startsWith('image/');

    if (!isImage) {
      toast({ title: 'Error', description: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedHouse}/${Date.now()}.${fileExt}`;

      // Upload to 'house-media' bucket
      const { error: uploadError } = await supabase.storage
        .from('house-media')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('house-media')
        .getPublicUrl(fileName);

      // Insert into house_media table
      const { error: dbError } = await supabase
        .from('house_media')
        .insert({
          house: selectedHouse,
          media_type: 'image',
          platform: null,
          image_url: publicUrl,
          description: description || null,
        });

      if (dbError) throw dbError;

      toast({ title: 'Success', description: 'Image uploaded successfully!' });
      setDescription('');
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  // Handle pin/unpin toggle
  const handleTogglePin = async (item: HouseMediaItem) => {
    try {
      // If we are pinning, check if there are already 3 pinned items for this house
      if (!item.is_pinned) {
        const pinnedCount = media.filter(m => m.house === item.house && m.is_pinned).length;
        if (pinnedCount >= 3) {
          toast({
            title: 'Limit reached',
            description: 'You can only pin up to 3 items per house.',
            variant: 'destructive'
          });
          return;
        }
      }

      const oldValue = item.is_pinned;
      const { error } = await supabase
        .from('house_media')
        .update({ is_pinned: !item.is_pinned })
        .eq('id', item.id);

      if (error) throw error;

      await logToggleChange(`media_pinned:${item.id}`, oldValue, !oldValue);
      toast({
        title: item.is_pinned ? 'Unpinned' : 'Pinned',
        description: `Media ${item.is_pinned ? 'unpinned from' : 'pinned to'} top`
      });
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  // Handle delete click - opens confirmation
  const handleDeleteClick = (item: HouseMediaItem) => {
    setDeleteTarget(item);
  };

  // Handle delete confirmation
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;

    setIsDeleting(true);
    try {
      // If it's an image, delete from storage first
      if (deleteTarget.media_type === 'image' && deleteTarget.image_url) {
        const urlParts = deleteTarget.image_url.split('/house-media/');
        if (urlParts.length > 1) {
          const filePath = urlParts[urlParts.length - 1];
          await supabase.storage.from('house-media').remove([filePath]);
        }
      }

      // Delete from database
      const { error } = await supabase
        .from('house_media')
        .delete()
        .eq('id', deleteTarget.id);

      if (error) throw error;

      await logEntityChange('delete', 'house_media', `${deleteTarget.media_type}:${deleteTarget.house}`, deleteTarget, null, deleteTarget.house);
      toast({ title: 'Deleted', description: 'Media removed successfully' });
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  // Open edit modal
  const openEditModal = (item: HouseMediaItem) => {
    setEditingItem(item);
    setEditUrl(item.original_url || '');
    setEditPlatform(item.platform || 'youtube');
  };

  // Handle edit save
  const handleEditSave = async () => {
    if (!editingItem) return;

    if (!editUrl.trim()) {
      toast({ title: 'Error', description: 'Please enter a URL', variant: 'destructive' });
      return;
    }

    // Validate and parse URL
    const { isValid, embedUrl, error } = validateAndParseUrl(editUrl, editPlatform);

    if (!isValid || !embedUrl) {
      toast({ title: 'Invalid URL', description: error, variant: 'destructive' });
      return;
    }

    setEditSaving(true);

    try {
      const { error: dbError } = await supabase
        .from('house_media')
        .update({
          original_url: editUrl,
          embed_url: embedUrl,
          platform: editPlatform,
        })
        .eq('id', editingItem.id);

      if (dbError) throw dbError;

      toast({ title: 'Updated', description: 'Video link updated successfully!' });
      setEditingItem(null);
      setEditUrl('');
      refetch();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setEditSaving(false);
    }
  };

  // Get display URL for media item
  const getMediaUrl = (item: HouseMediaItem) => {
    if (item.media_type === 'image') {
      return item.image_url || '';
    }
    return item.embed_url || item.original_url || '';
  };

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add Media</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="link" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="link" className="gap-2">
                <Link className="h-4 w-4" />
                Upload Link
              </TabsTrigger>
              <TabsTrigger value="image" className="gap-2">
                <Image className="h-4 w-4" />
                Upload Image
              </TabsTrigger>
            </TabsList>

            {/* Upload Link Tab */}
            <TabsContent value="link">
              <form onSubmit={handleLinkSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select House</Label>
                    <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHouses.map((house) => (
                          <SelectItem key={house.slug} value={house.slug}>
                            {house.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={platform} onValueChange={(v) => setPlatform(v as 'youtube' | 'instagram')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="youtube">
                          <span className="flex items-center gap-2">
                            <Youtube className="h-4 w-4 text-red-500" />
                            YouTube
                          </span>
                        </SelectItem>
                        <SelectItem value="instagram">
                          <span className="flex items-center gap-2">
                            <Instagram className="h-4 w-4 text-pink-500" />
                            Instagram
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Video URL</Label>
                  <Input
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    placeholder={platform === 'youtube'
                      ? 'https://youtube.com/shorts/VIDEO_ID'
                      : 'https://instagram.com/reel/POST_ID/'
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    {platform === 'youtube'
                      ? 'Paste a YouTube Shorts, regular video, or youtu.be link'
                      : 'Paste an Instagram Reel or Post link (profile links not supported)'
                    }
                  </p>
                </div>

                {/* Thumbnail URL - Only for YouTube */}
                {platform === 'youtube' && (
                  <div className="space-y-2">
                    <Label>Thumbnail URL (optional)</Label>
                    <Input
                      value={thumbnailUrl}
                      onChange={(e) => setThumbnailUrl(e.target.value)}
                      placeholder="https://i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Add a description..."
                    rows={2}
                  />
                </div>

                {/* Poll Selector */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Attach Poll (optional)
                  </Label>
                  <Select value={selectedPollId} onValueChange={setSelectedPollId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a poll to attach" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No poll</SelectItem>
                      {availablePolls.map((poll) => (
                        <SelectItem key={poll.id} value={poll.id}>
                          <span className="flex items-center gap-2">
                            <span className={poll.isActive ? 'text-green-500' : 'text-muted-foreground'}>
                              {poll.isActive ? '●' : '○'}
                            </span>
                            <span className="truncate max-w-[200px]">{poll.question}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Attach a live poll to display on this video. Green dot = active poll.
                  </p>
                </div>

                <Button type="submit" disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? 'Adding...' : 'Add Link'}
                </Button>
              </form>
            </TabsContent>

            {/* Upload Image Tab */}
            <TabsContent value="image">
              <div className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Select House</Label>
                    <Select value={selectedHouse} onValueChange={setSelectedHouse}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {availableHouses.map((house) => (
                          <SelectItem key={house.slug} value={house.slug}>
                            {house.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter description..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <Button disabled={uploading} asChild>
                    <label className="cursor-pointer">
                      {uploading ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4 mr-2" />
                      )}
                      {uploading ? 'Uploading...' : 'Upload Image'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="hidden"
                        disabled={uploading}
                      />
                    </label>
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Supports JPG, PNG, GIF, WebP
                  </span>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Media Grid - Filtered by selected house */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Uploaded Media - {selectedHouse.charAt(0).toUpperCase() + selectedHouse.slice(1)}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : media.filter(item => item.house === selectedHouse).length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No media uploaded for this house yet</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {media.filter(item => item.house === selectedHouse).map((item) => (
                <div key={item.id} className="relative group rounded-lg overflow-hidden bg-muted aspect-[4/5] sm:aspect-square">
                  {item.media_type === 'video' ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-secondary gap-2">
                      {item.platform === 'youtube' && <Youtube className="h-10 w-10 sm:h-8 sm:w-8 text-red-500" />}
                      {item.platform === 'instagram' && <Instagram className="h-10 w-10 sm:h-8 sm:w-8 text-pink-500" />}
                      <Video className="h-8 w-8 sm:h-6 sm:w-6 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={item.image_url || ''}
                      alt={item.description || 'Media'}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {/* Overlay - always visible on mobile (touch), hover on desktop */}
                  <div className="absolute inset-0 bg-black/60 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2 sm:p-2">
                    <div className="flex justify-between items-start">
                      <span className="text-xs text-white bg-black/50 px-2 py-1 rounded uppercase">
                        {item.house}
                      </span>
                      {/* Action buttons - vertical on mobile, horizontal on desktop */}
                      <div className="flex flex-col sm:flex-row gap-1.5 sm:gap-1">
                        <Button
                          size="icon"
                          variant={item.is_pinned ? "default" : "secondary"}
                          className={cn("h-9 w-9 sm:h-7 sm:w-7", item.is_pinned ? "bg-primary text-primary-foreground" : "bg-white/20 text-white")}
                          onClick={() => handleTogglePin(item)}
                        >
                          {item.is_pinned ? <PinOff className="h-4 w-4 sm:h-3.5 sm:w-3.5" /> : <Pin className="h-4 w-4 sm:h-3.5 sm:w-3.5" />}
                        </Button>
                        {/* Edit button - only for videos */}
                        {item.media_type === 'video' && (
                          <Button
                            size="icon"
                            variant="secondary"
                            className="h-9 w-9 sm:h-7 sm:w-7 bg-blue-500/80 hover:bg-blue-600 text-white"
                            onClick={() => openEditModal(item)}
                            title="Edit video link"
                          >
                            <Pencil className="h-4 w-4 sm:h-3 sm:w-3" />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="destructive"
                          className="h-9 w-9 sm:h-7 sm:w-7"
                          onClick={() => handleDeleteClick(item)}
                        >
                          <Trash2 className="h-4 w-4 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {item.platform && (
                        <span className="text-xs text-white/80 capitalize">{item.platform}</span>
                      )}
                      {item.description && (
                        <p className="text-xs text-white truncate">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Video Link Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Video Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Platform</Label>
              <Select value={editPlatform} onValueChange={(v) => setEditPlatform(v as 'youtube' | 'instagram')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube">
                    <span className="flex items-center gap-2">
                      <Youtube className="h-4 w-4 text-red-500" />
                      YouTube
                    </span>
                  </SelectItem>
                  <SelectItem value="instagram">
                    <span className="flex items-center gap-2">
                      <Instagram className="h-4 w-4 text-pink-500" />
                      Instagram
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>New Video URL</Label>
              <Input
                value={editUrl}
                onChange={(e) => setEditUrl(e.target.value)}
                placeholder={editPlatform === 'youtube'
                  ? 'https://youtube.com/shorts/VIDEO_ID'
                  : 'https://instagram.com/reel/POST_ID/'
                }
              />
              <p className="text-xs text-muted-foreground">
                {editPlatform === 'youtube'
                  ? 'Paste a YouTube Shorts, regular video, or youtu.be link'
                  : 'Paste an Instagram Reel or Post link'
                }
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={editSaving}>
              Cancel
            </Button>
            <Button onClick={handleEditSave} disabled={editSaving}>
              {editSaving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        itemName={deleteTarget?.media_type === 'video' ? 'this video' : 'this image'}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default MediaUpload;
