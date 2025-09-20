import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

export default function TestRelease() {
  const [albumName, setAlbumName] = useState("");
  const [artist, setArtist] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleGenerateRelease = async () => {
    if (!albumName.trim() || !artist.trim()) {
      toast({
        title: "Помилка",
        description: "Заповніть всі поля",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    console.log("🚀 Generating test release:", { albumName, artist });

    try {
      // Створюємо простий реліз у правильному форматі для сервера
      const releaseData = {
        releaseMetadata: {
          title: albumName,
          primaryGenre: "pop",
          performers: [{ name: artist, role: "primary" }],
          upc: "", // Додаємо обов'язкові поля
          copyrightYear: new Date().getFullYear(),
          copyrightHolder: artist
        },
        tracksMetadata: [{
          title: albumName,
          isrc: "",
          explicitContent: "clean",
          contributors: []
        }],
        selectedTerritories: ["US", "CA", "UA"]
      };

      console.log("📦 Sending release data:", releaseData);

      const response = await apiRequest("POST", "/api/releases", releaseData);
      const created = await response.json();
      
      console.log("✅ Release created:", created);

      // Оновлюємо кеш каталогу
      queryClient.invalidateQueries({ queryKey: ['/api/releases'] });

      toast({
        title: "Успіх!",
        description: `Реліз "${albumName}" від ${artist} створено`,
      });

      // Очищуємо форму
      setAlbumName("");
      setArtist("");

    } catch (error: any) {
      console.error("❌ Error creating release:", error);
      toast({
        title: "Помилка створення релізу",
        description: error.message || "Невідома помилка",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Test Release
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Швидкий тест створення релізу для налагодження
          </p>
        </div>
      </div>

      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Створити тестовий реліз</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="album-name">Назва альбому</Label>
            <Input
              id="album-name"
              data-testid="input-album-name"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
              placeholder="Введіть назву альбому"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="artist">Виконавець</Label>
            <Input
              id="artist"
              data-testid="input-artist"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Введіть ім'я виконавця"
            />
          </div>

          <Button
            onClick={handleGenerateRelease}
            disabled={loading}
            className="w-full"
            data-testid="button-generate-release"
          >
            {loading ? "Створюється..." : "Генерувати реліз"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}