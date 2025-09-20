import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Copy, Download, Edit, Music, Image as ImageIcon, Clock, MapPin, User, Building } from "lucide-react";

interface ReleaseDetailsModalProps {
  releaseId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ReleaseDetails {
  id: string;
  title: string;
  type: string;
  status: string;
  upc?: string;
  primaryGenre?: string;
  secondaryGenre?: string;
  language?: string;
  albumVersion?: string;
  originalReleaseDate?: string;
  releaseDate?: string;
  releaseTime?: string;
  subLabel?: string;
  territories?: string[];
  rightsOwner?: string;
  artworkUrl?: string;
  artworkOriginalName?: string;
  artworkSize?: number;
  labelName?: string;
  pCopyright?: string;
  performers?: { name: string; role: string }[];
  createdAt: string;
  updatedAt: string;
  artist: {
    id: string;
    name: string;
  };
  organization: {
    id: string;
    name: string;
    type: string;
  };
  tracks: {
    id: string;
    title: string;
    isrc?: string;
    trackIndex: number;
    explicit: boolean;
    audioUrl?: string;
    audioOriginalName?: string;
    audioSize?: number;
    lyrics?: string;
    version?: string;
    duration?: number;
    participants?: any;
  }[];
}

export default function ReleaseDetailsModal({ releaseId, isOpen, onClose }: ReleaseDetailsModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState<Partial<ReleaseDetails>>({});
  const { toast } = useToast();

  const { data: release, isLoading } = useQuery({
    queryKey: ["/api/admin/releases", releaseId],
    enabled: !!releaseId && isOpen,
  }) as { data: ReleaseDetails | undefined; isLoading: boolean };

  const updateMutation = useMutation({
    mutationFn: async (updates: Partial<ReleaseDetails>) => {
      if (!releaseId) throw new Error("No release ID");
      const response = await apiRequest("PUT", `/api/admin/releases/${releaseId}`, updates);
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/releases", releaseId] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/releases"] });
      setIsEditing(false);
      setEditedData({});
      toast({
        title: "Успішно!",
        description: "Реліз оновлено",
      });
    },
    onError: (error) => {
      toast({
        title: "Помилка",
        description: "Не вдалося оновити реліз",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Скопійовано!",
      description: `${label} скопійовано в буфер обміну`,
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "Невідомо";
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} MB`;
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: "Завантажено!",
        description: `Файл ${filename} завантажено`,
      });
    } catch (error) {
      toast({
        title: "Помилка",
        description: "Не вдалося завантажити файл",
        variant: "destructive",
      });
    }
  };

  if (!isOpen || !releaseId) return null;

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!release) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-3">
              <Music className="w-6 h-6" />
              {release.title}
              <Badge variant={release.status === 'APPROVED' ? 'default' : 'secondary'}>
                {release.status}
              </Badge>
            </DialogTitle>
            <div className="flex gap-2">
              <Button
                variant={isEditing ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (isEditing) {
                    updateMutation.mutate(editedData);
                  } else {
                    setIsEditing(true);
                    setEditedData({});
                  }
                }}
                disabled={updateMutation.isPending}
                data-testid="edit-release-button"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditing ? "Зберегти" : "Редагувати"}
              </Button>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  data-testid="cancel-edit-button"
                >
                  Скасувати
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Основна інформація */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Основна інформація
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Назва релізу</label>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Input
                        value={editedData.title ?? release.title}
                        onChange={(e) => setEditedData(prev => ({ ...prev, title: e.target.value }))}
                        className="font-medium"
                        data-testid="edit-title"
                      />
                    ) : (
                      <span className="font-medium">{release.title}</span>
                    )}
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(release.title, "Назва")}
                      data-testid="copy-title"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Артист</label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{release.artist.name}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(release.artist.name, "Артист")}
                      data-testid="copy-artist"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">UPC</label>
                  <div className="flex items-center gap-2">
                    {isEditing ? (
                      <Input
                        value={editedData.upc ?? release.upc ?? ""}
                        onChange={(e) => setEditedData(prev => ({ ...prev, upc: e.target.value }))}
                        className="font-medium"
                        placeholder="Введіть UPC"
                        data-testid="edit-upc"
                      />
                    ) : (
                      <span className="font-medium">{release.upc || "Не вказано"}</span>
                    )}
                    {release.upc && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(release.upc!, "UPC")}
                        data-testid="copy-upc"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Тип релізу</label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{release.type}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(release.type, "Тип релізу")}
                      data-testid="copy-type"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Жанр</label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{release.primaryGenre || "Не вказано"}</span>
                    {release.primaryGenre && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(release.primaryGenre!, "Жанр")}
                        data-testid="copy-genre"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground">Дата релізу</label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">
                      {release.releaseDate ? new Date(release.releaseDate).toLocaleDateString('uk-UA') : "Не вказано"}
                    </span>
                    {release.releaseDate && (
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => copyToClipboard(new Date(release.releaseDate!).toLocaleDateString('uk-UA'), "Дата релізу")}
                        data-testid="copy-release-date"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <label className="text-sm font-medium text-muted-foreground">Організація</label>
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{release.organization.name}</span>
                  <Badge variant="outline">{release.organization.type}</Badge>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={() => copyToClipboard(release.organization.name, "Організація")}
                    data-testid="copy-organization"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {release.territories && release.territories.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Території</label>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium">{release.territories.join(", ")}</span>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => copyToClipboard(release.territories!.join(", "), "Території")}
                      data-testid="copy-territories"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Обкладинка */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                Обкладинка
              </CardTitle>
            </CardHeader>
            <CardContent>
              {release.artworkUrl ? (
                <div className="space-y-4">
                  <div className="relative">
                    <img 
                      src={release.artworkUrl} 
                      alt={release.title}
                      className="w-full max-w-sm mx-auto rounded-lg shadow-lg"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Оригінальна назва:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{release.artworkOriginalName || "Невідомо"}</span>
                        {release.artworkOriginalName && (
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(release.artworkOriginalName!, "Назва файлу")}
                            data-testid="copy-artwork-name"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Розмір:</span>
                      <span className="text-sm font-medium">{formatFileSize(release.artworkSize)}</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full" 
                    onClick={() => downloadFile(release.artworkUrl!, release.artworkOriginalName || `${release.title}-artwork.jpg`)}
                    data-testid="download-artwork"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Завантажити обкладинку
                  </Button>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <ImageIcon className="w-12 h-12 mx-auto mb-2" />
                  <p>Обкладинка не завантажена</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Треки */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Треки ({release.tracks.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {release.tracks.length > 0 ? (
              <div className="space-y-4">
                {release.tracks.map((track, index) => (
                  <div key={track.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-lg">{track.trackIndex}. {track.title}</span>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            onClick={() => copyToClipboard(track.title, "Назва треку")}
                            data-testid={`copy-track-title-${index}`}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {track.explicit && <Badge variant="destructive">Explicit</Badge>}
                        </div>
                        
                        {track.isrc && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm text-muted-foreground">ISRC:</span>
                            <span className="text-sm font-mono">{track.isrc}</span>
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              onClick={() => copyToClipboard(track.isrc!, "ISRC")}
                              data-testid={`copy-track-isrc-${index}`}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        )}

                        {track.duration && (
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {track.audioUrl && (
                      <div className="bg-muted rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Аудіо файл:</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{track.audioOriginalName || "Невідомо"}</span>
                            {track.audioOriginalName && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => copyToClipboard(track.audioOriginalName!, "Назва аудіо файлу")}
                                data-testid={`copy-audio-name-${index}`}
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Розмір:</span>
                          <span className="text-sm font-medium">{formatFileSize(track.audioSize)}</span>
                        </div>

                        <Button 
                          size="sm" 
                          className="w-full" 
                          onClick={() => downloadFile(track.audioUrl!, track.audioOriginalName || `${track.title}.wav`)}
                          data-testid={`download-audio-${index}`}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Завантажити аудіо
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <Music className="w-12 h-12 mx-auto mb-2" />
                <p>Треки не додані</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Кнопки дій */}
        <div className="flex items-center gap-3 pt-4">
          <Button 
            variant="outline" 
            onClick={() => setIsEditing(!isEditing)}
            data-testid="edit-release"
          >
            <Edit className="w-4 h-4 mr-2" />
            {isEditing ? "Скасувати редагування" : "Редагувати реліз"}
          </Button>
          <Button variant="outline" onClick={onClose} data-testid="close-modal">
            Закрити
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}