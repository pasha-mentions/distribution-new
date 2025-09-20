import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Music, Image, CheckCircle, AlertCircle, ArrowLeft, ArrowRight, FileText, Plus, Trash2, Search, Globe } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface FileUpload {
  file: File | null;
  isValid: boolean;
  error?: string;
}

// Validation schema for release metadata
const releaseMetadataSchema = z.object({
  language: z.string().min(1, "Мова метаданих обов'язкова"),
  title: z.string().min(1, "Назва альбому обов'язкова"),
  albumVersion: z.string().optional(),
  primaryGenre: z.string().min(1, "Головний жанр обов'язковий"),
  secondaryGenre: z.string().optional(),
  originalReleaseDate: z.string().min(1, "Дата першого випуску обов'язкова"),
  releaseDate: z.string().optional(),
  subLabel: z.string().optional(),
  upc: z.string().min(1, "UPC обов'язковий"),
  performers: z.array(z.object({
    name: z.string().min(1, "Ім'я виконавця обов'язкове"),
    role: z.string().min(1, "Посада виконавця обов'язкова"),
  })).max(5, "Можна додати максимум 5 виконавців").optional(),
});

// Validation schema for track metadata
const trackMetadataSchema = z.object({
  title: z.string().min(1, "Назва пісні обов'язкова"),
  version: z.string().optional(),
  primaryGenre: z.string().min(1, "Головний жанр обов'язковий"),
  secondaryGenre: z.string().optional(),
  language: z.string().min(1, "Мова релізу обов'язкова"),
  explicitContent: z.enum(["yes", "no", "censored"]),
  previewStartTime: z.string().optional(),
  isrc: z.string().min(1, "ISRC обов'язковий"),
  iswc: z.string().optional(),
  pLine: z.string().optional(),
  cLine: z.string().optional(),
  contributors: z.array(z.object({
    name: z.string().min(1, "Ім'я обов'язкове"),
    role: z.string().min(1, "Роль обов'язкова"),
  })).optional(),
  hasNoMusic: z.boolean().default(false),
  hasNoLyrics: z.boolean().default(false),
  lyrics: z.string().optional(),
});

type ReleaseMetadata = z.infer<typeof releaseMetadataSchema>;
type TrackMetadata = z.infer<typeof trackMetadataSchema>;

// Структура даних для країн та континентів
const TERRITORIES_DATA = {
  "Europe": [
    "Åland Islands", "Albania", "Andorra", "Austria", "Belarus", "Belgium", 
    "Bosnia and Herzegovina", "Bulgaria", "Croatia", "Cyprus", "Czech Republic", 
    "Denmark", "Estonia", "Faroe Islands", "Finland", "Macedonia", "France", 
    "Germany", "Gibraltar", "Greece", "Guernsey", "Vatican", "Hungary", 
    "Iceland", "Ireland", "Isle of Man", "Italy", "Jersey", "Latvia", 
    "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", 
    "Montenegro", "Netherlands", "Norway", "Poland", "Portugal", "Romania", 
    "Russian Federation", "San Marino", "Serbia", "Slovakia", "Slovenia", 
    "Spain", "Sweden", "Switzerland", "Ukraine", "United Kingdom"
  ],
  "Asia": [
    "Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan", 
    "British Indian Ocean Territory", "Brunei Darussalam", "Cambodia", "China", 
    "Christmas Island", "Cocos (Keeling) Islands", "Georgia", "Hong Kong", 
    "India", "Indonesia", "Iran", "Iraq", "Israel", "Japan", "Jordan", 
    "Kazakhstan", "Kuwait", "Kyrgyzstan", "Lao People's Democratic Republic", 
    "Lebanon", "Macao", "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", 
    "North Korea", "Oman", "Pakistan", "Philippines", "Qatar", "Russian Federation", 
    "Saudi Arabia", "Singapore", "South Korea", "Sri Lanka", "Palestine", 
    "Syria", "Taiwan", "Tajikistan", "Thailand", "Timor-Leste", "Turkey", 
    "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Vietnam", "Yemen"
  ],
  "North America": [
    "Anguilla", "Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Bermuda", 
    "Canada", "Cayman Islands", "Costa Rica", "Cuba", "Dominica", "Dominican Republic", 
    "El Salvador", "Greenland", "Grenada", "Guatemala", "Haiti", "Honduras", 
    "Jamaica", "Martinique", "Mexico", "Montserrat", "Nicaragua", "Panama", 
    "Puerto Rico", "Saint Barthélemy", "Saint Kitts and Nevis", "Saint Lucia", 
    "Saint Pierre and Miquelon", "Saint Vincent and the Grenadines", "Sint Maarten", 
    "Turks and Caicos Islands", "United States", "Virgin Islands"
  ],
  "South America": [
    "Argentina", "Aruba", "Bolivia", "Bonaire", "Brazil", "Chile", "Colombia", 
    "Curaçao", "Ecuador", "Falkland Islands (Malvinas)", "Guyana", "French Guiana", 
    "Suriname", "Paraguay", "Peru", "Trinidad and Tobago", "Uruguay", "Venezuela"
  ],
  "Africa": [
    "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", 
    "Cape Verde", "Cameroon", "Central African Republic", "Chad", "Comoros", 
    "Congo, the Democratic Republic", "Djibouti", "Egypt", "Equatorial Guinea", 
    "Eritrea", "Ethiopia", "Gabon", "Gambia", "Ghana", "Guinea", "Guinea-Bissau", 
    "Ivory Coast", "Kenya", "Lesotho", "Liberia", "Libya", "Madagascar", 
    "Malawi", "Mali", "Mauritania", "Mauritius", "Morocco", "Mozambique", 
    "Namibia", "Niger", "Nigeria", "Congo", "Rwanda", "Sao Tome and Principe", 
    "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", 
    "South Sudan", "Sudan", "Swaziland", "Tanzania", "Togo", "Tunisia", 
    "Uganda", "Western Sahara", "Zambia", "Zimbabwe"
  ],
  "Oceania": [
    "American Samoa", "Australia", "Cook Islands", "Micronesia", "Fiji", 
    "French Polynesia", "Guam", "Kiribati", "Marshall Islands", "Nauru", 
    "New Zealand", "Niue", "Norfolk Island", "Northern Mariana Islands", 
    "Palau", "Papua New Guinea", "Pitcairn", "Samoa", "Solomon Islands", 
    "Tokelau", "Tonga", "Tuvalu", "Vanuatu"
  ]
};

export default function NewRelease() {
  console.log("🏁 NewRelease component loading...");
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState<"files" | "metadata" | "tracks" | "territories">("files");
  const [tracksMetadata, setTracksMetadata] = useState<TrackMetadata[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isGeneratingIsrc, setIsGeneratingIsrc] = useState(false);
  const [selectedTerritories, setSelectedTerritories] = useState<Set<string>>(new Set());
  const [territorySearchQuery, setTerritorySearchQuery] = useState("");
  const [coverArt, setCoverArt] = useState<FileUpload>({ file: null, isValid: false });
  const [audioFiles, setAudioFiles] = useState<FileUpload[]>([{ file: null, isValid: false }]);
  const [isGeneratingUpc, setIsGeneratingUpc] = useState(false);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const form = useForm<ReleaseMetadata>({
    resolver: zodResolver(releaseMetadataSchema),
    defaultValues: {
      language: "",
      title: "",
      albumVersion: "",
      primaryGenre: "",
      secondaryGenre: "",
      originalReleaseDate: "",
      releaseDate: "",
      subLabel: "",
      upc: "",
      performers: [{ name: "", role: "" }],
    },
  });

  // Валідація обкладинки
  const validateCoverArt = (file: File): { isValid: boolean; error?: string } => {
    // Перевірка типу файлу
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      return { isValid: false, error: 'Дозволені формати: JPG, JPEG, PNG' };
    }

    // Перевірка розміру файлу (макс 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return { isValid: false, error: 'Розмір файлу не повинен перевищувати 10MB' };
    }

    return { isValid: true };
  };

  // Валідація аудіо файлу
  const validateAudioFile = (file: File): { isValid: boolean; error?: string } => {
    // Перевірка типу файлу
    if (file.type !== 'audio/wav' && !file.name.toLowerCase().endsWith('.wav')) {
      return { isValid: false, error: 'Дозволений формат: WAV' };
    }

    // Перевірка розміру файлу (макс 100MB)
    if (file.size > 100 * 1024 * 1024) {
      return { isValid: false, error: 'Розмір файлу не повинен перевищувати 100MB' };
    }

    return { isValid: true };
  };

  // Перевірка розмірів зображення
  const checkImageDimensions = (file: File): Promise<boolean> => {
    return new Promise((resolve) => {
      const img = document.createElement('img');
      img.onload = () => {
        const isValid = img.width === 3000 && img.height === 3000;
        URL.revokeObjectURL(img.src);
        resolve(isValid);
      };
      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        resolve(false);
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const handleCoverArtChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setCoverArt({ file: null, isValid: false });
      return;
    }

    const validation = validateCoverArt(file);
    if (!validation.isValid) {
      setCoverArt({ file: null, isValid: false, error: validation.error });
      toast({
        title: "Помилка завантаження",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    // Перевірка розмірів
    const isDimensionsValid = await checkImageDimensions(file);
    if (!isDimensionsValid) {
      setCoverArt({ file: null, isValid: false, error: "Розміри повинні бути 3000x3000 пікселів" });
      toast({
        title: "Невірні розміри",
        description: "Обкладинка повинна бути 3000x3000 пікселів",
        variant: "destructive",
      });
      return;
    }

    setCoverArt({ file, isValid: true });
    toast({
      title: "Обкладинка завантажена",
      description: "Файл пройшов валідацію успішно",
    });
  };

  // Функції для керування треками
  const addTrack = () => {
    if (audioFiles.length < 20) {
      setAudioFiles([...audioFiles, { file: null, isValid: false }]);
    }
  };

  const removeTrack = (index: number) => {
    if (audioFiles.length > 1) {
      setAudioFiles(audioFiles.filter((_, i) => i !== index));
    }
  };

  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>, trackIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) {
      const newAudioFiles = [...audioFiles];
      newAudioFiles[trackIndex] = { file: null, isValid: false };
      setAudioFiles(newAudioFiles);
      return;
    }

    const validation = validateAudioFile(file);
    const newAudioFiles = [...audioFiles];
    
    if (!validation.isValid) {
      newAudioFiles[trackIndex] = { file: null, isValid: false, error: validation.error };
      setAudioFiles(newAudioFiles);
      toast({
        title: "Помилка завантаження",
        description: validation.error,
        variant: "destructive",
      });
      return;
    }

    newAudioFiles[trackIndex] = { file, isValid: true };
    setAudioFiles(newAudioFiles);
    toast({
      title: "Аудіо файл завантажено",
      description: "Файл пройшов валідацію успішно",
    });
  };

  const handleNextStep = () => {
    const allAudioFilesValid = audioFiles.every(af => af.isValid);
    if (!coverArt.isValid || !allAudioFilesValid) {
      toast({
        title: "Завантажте всі файли",
        description: "Будь ласка, завантажте обкладинку та всі аудіо файли",
        variant: "destructive",
      });
      return;
    }
    setCurrentStep("metadata");
  };

  const handleGenerateUpc = async () => {
    setIsGeneratingUpc(true);
    try {
      const response = await apiRequest("POST", "/api/generate-upc");
      const data = await response.json();
      if (data.upc) {
        form.setValue("upc", data.upc);
        toast({
          title: "UPC згенеровано",
          description: `Новий UPC: ${data.upc}`,
        });
      }
    } catch (error) {
      toast({
        title: "Помилка генерації UPC",
        description: "Спробуйте ще раз пізніше",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingUpc(false);
    }
  };

  // Функції для керування виконавцями
  const addPerformer = () => {
    const currentPerformers = form.getValues("performers") || [];
    if (currentPerformers.length < 5) {
      form.setValue("performers", [...currentPerformers, { name: "", role: "" }]);
    }
  };

  const removePerformer = (index: number) => {
    const currentPerformers = form.getValues("performers") || [];
    if (currentPerformers.length > 1) {
      form.setValue("performers", currentPerformers.filter((_, i) => i !== index));
    }
  };

  // Ініціалізація метаданих треків при переході до кроку треків
  const initializeTracksMetadata = () => {
    if (tracksMetadata.length === 0) {
      const initialTracks = audioFiles.map((_, index) => ({
        title: audioFiles[index].file?.name?.replace(/\.[^/.]+$/, "") || `Трек ${index + 1}`,
        version: "",
        primaryGenre: "",
        secondaryGenre: "",
        language: "",
        explicitContent: "no" as const,
        previewStartTime: "00:00:00",
        isrc: "",
        iswc: "",
        pLine: "",
        cLine: "",
        contributors: [{ name: "", role: "main_performer" }],
        hasNoMusic: false,
        hasNoLyrics: false,
        lyrics: "",
      }));
      setTracksMetadata(initialTracks);
    }
  };

  const handleGenerateIsrc = async (trackIndex: number) => {
    setIsGeneratingIsrc(true);
    try {
      const response = await apiRequest("POST", "/api/generate-isrc");
      const data = await response.json();
      if (data.isrc) {
        const newTracksMetadata = [...tracksMetadata];
        newTracksMetadata[trackIndex].isrc = data.isrc;
        setTracksMetadata(newTracksMetadata);
        toast({
          title: "ISRC згенеровано",
          description: `Новий ISRC: ${data.isrc}`,
        });
      }
    } catch (error) {
      toast({
        title: "Помилка генерації ISRC",
        description: "Спробуйте ще раз пізніше",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingIsrc(false);
    }
  };

  // Ініціалізація всіх територій при переході до кроку територій
  const initializeTerritories = () => {
    if (selectedTerritories.size === 0) {
      const allTerritories = new Set<string>();
      Object.values(TERRITORIES_DATA).forEach(continentCountries => {
        continentCountries.forEach(country => allTerritories.add(country));
      });
      setSelectedTerritories(allTerritories);
    }
  };

  const onSubmitMetadata = (data: ReleaseMetadata) => {
    setHasAttemptedSubmit(true);
    console.log("Submitted metadata:", data);
    initializeTracksMetadata();
    setCurrentStep("tracks");
  };

  const onCompleteTracksMetadata = () => {
    initializeTerritories();
    setCurrentStep("territories");
  };

  // Логіка для роботи з територіями
  const toggleTerritory = (territory: string) => {
    const newSelected = new Set(selectedTerritories);
    if (newSelected.has(territory)) {
      newSelected.delete(territory);
    } else {
      newSelected.add(territory);
    }
    setSelectedTerritories(newSelected);
  };

  const toggleContinentSelection = (continent: string) => {
    const continentCountries = TERRITORIES_DATA[continent as keyof typeof TERRITORIES_DATA];
    const allSelected = continentCountries.every(country => selectedTerritories.has(country));
    
    const newSelected = new Set(selectedTerritories);
    if (allSelected) {
      // Скасувати всі країни континенту
      continentCountries.forEach(country => newSelected.delete(country));
    } else {
      // Вибрати всі країни континенту
      continentCountries.forEach(country => newSelected.add(country));
    }
    setSelectedTerritories(newSelected);
  };

  const getFilteredCountries = () => {
    if (!territorySearchQuery) return TERRITORIES_DATA;
    
    const filtered: Record<string, string[]> = {};
    Object.entries(TERRITORIES_DATA).forEach(([continent, countries]) => {
      const filteredCountries = countries.filter(country =>
        country.toLowerCase().includes(territorySearchQuery.toLowerCase())
      );
      if (filteredCountries.length > 0) {
        filtered[continent] = filteredCountries;
      }
    });
    return filtered;
  };

  const onCompleteRelease = async () => {
    console.log("🚀 onCompleteRelease function called!");
    console.log("Current step:", currentStep);
    console.log("Selected territories count:", selectedTerritories.size);
    console.log("Tracks metadata count:", tracksMetadata.length);
    
    try {
      const finalReleaseData = {
        releaseMetadata: form.getValues(),
        tracksMetadata,
        selectedTerritories: Array.from(selectedTerritories)
      };

      console.log("✅ Final release data prepared:", finalReleaseData);

      const response = await apiRequest("POST", "/api/releases", finalReleaseData);
      console.log("📡 Request sent, response status:", response.status);

      const result = await response.json();
      console.log("✅ Release created successfully:", result);

      toast({
        title: "Реліз створено",
        description: "Реліз успішно збережено в базі даних",
      });

      // Redirect to catalog after successful creation
      setTimeout(() => {
        window.location.href = "/catalog";
      }, 1500);

    } catch (error) {
      console.error("💥 Error creating release:", error);
      toast({
        title: "Помилка",
        description: "Не вдалося створити реліз. Спробуйте ще раз.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Створити новий реліз</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {currentStep === "files" 
              ? "Завантажте обкладинку та аудіо файли для створення релізу"
              : currentStep === "metadata"
                ? "Заповніть метадані релізу"
                : currentStep === "tracks"
                  ? "Заповніть метадані треків"
                  : "Оберіть території для дистрибуції"
            }
          </p>
        </div>

        {/* Прогрес індикатор */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${
              currentStep === "files" ? "text-purple-500" : "text-muted-foreground"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "files" 
                  ? "bg-purple-500 text-white" 
                  : (coverArt.isValid && audioFiles.every(af => af.isValid))
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}>
                {(coverArt.isValid && audioFiles.every(af => af.isValid)) ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  "1"
                )}
              </div>
              <span className="text-sm font-medium">Файли</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center space-x-2 ${
              currentStep === "metadata" ? "text-purple-500" : "text-muted-foreground"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "metadata" 
                  ? "bg-purple-500 text-white" 
                  : currentStep === "tracks"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}>
                {currentStep === "tracks" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm font-medium">Метадані</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center space-x-2 ${
              currentStep === "tracks" ? "text-purple-500" : "text-muted-foreground"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "tracks" 
                  ? "bg-purple-500 text-white" 
                  : currentStep === "territories"
                    ? "bg-green-500 text-white"
                    : "bg-muted text-muted-foreground"
              }`}>
                {currentStep === "territories" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <Music className="h-4 w-4" />
                )}
              </div>
              <span className="text-sm font-medium">Треки</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className={`flex items-center space-x-2 ${
              currentStep === "territories" ? "text-purple-500" : "text-muted-foreground"
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                currentStep === "territories" 
                  ? "bg-purple-500 text-white" 
                  : "bg-muted text-muted-foreground"
              }`}>
                4
              </div>
              <span className="text-sm font-medium">Території</span>
            </div>
          </div>
        </div>

        {currentStep === "files" && (
          <div className="space-y-6">
            {/* Завантаження обкладинки */}
            <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="h-5 w-5" />
                Обкладинка релізу
              </CardTitle>
              <CardDescription>
                Завантажте обкладинку у форматі JPG, JPEG або PNG розміром 3000x3000 пікселів
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label htmlFor="cover-art" className="cursor-pointer">
                    <div className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-md">
                      <Upload className="h-4 w-4" />
                      Вибрати файл
                    </div>
                  </Label>
                  <Input
                    id="cover-art"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleCoverArtChange}
                    className="hidden"
                    data-testid="cover-art-input"
                  />
                  {coverArt.file && (
                    <div className="flex items-center gap-2">
                      {coverArt.isValid ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <AlertCircle className="h-5 w-5 text-red-500" />
                      )}
                      <span className="text-sm">{coverArt.file.name}</span>
                    </div>
                  )}
                </div>
                {coverArt.error && (
                  <p className="text-sm text-red-500">{coverArt.error}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Завантаження аудіо файлів */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Аудіо файли
                  </CardTitle>
                  <CardDescription>
                    Завантажте пісні у форматі WAV (максимум 20 треків)
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTrack}
                  disabled={audioFiles.length >= 20}
                  data-testid="add-track-button"
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Додати пісню
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {audioFiles.map((audioFile, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                    {index > 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeTrack(index)}
                        className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700"
                        data-testid={`remove-track-${index}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <div className="flex items-center gap-4">
                      <Label htmlFor={`audio-file-${index}`} className="cursor-pointer">
                        <div className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-md">
                          <Upload className="h-4 w-4" />
                          Трек {index + 1}
                        </div>
                      </Label>
                      <Input
                        id={`audio-file-${index}`}
                        type="file"
                        accept="audio/wav,.wav"
                        onChange={(e) => handleAudioFileChange(e, index)}
                        className="hidden"
                        data-testid={`audio-file-input-${index}`}
                      />
                      {audioFile.file && (
                        <div className="flex items-center gap-2">
                          {audioFile.isValid ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          <span className="text-sm">{audioFile.file.name}</span>
                        </div>
                      )}
                    </div>
                    {audioFile.error && (
                      <p className="text-sm text-red-500">{audioFile.error}</p>
                    )}
                  </div>
                ))}
                
                {audioFiles.length < 20 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground">
                      Можна додати ще {20 - audioFiles.length} треків
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

            {/* Кнопка переходу до метаданих */}
            <div className="flex justify-end">
              <Button 
                onClick={handleNextStep}
                disabled={!coverArt.isValid || !audioFiles.every(af => af.isValid)}
                data-testid="next-step-button"
              >
                Продовжити
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "metadata" && (
          <div className="space-y-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitMetadata)} className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Ліва панель з обкладинкою */}
                  <div className="lg:col-span-1">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Обкладинка</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {coverArt.file && coverArt.isValid ? (
                            <div className="relative aspect-square w-full max-w-[250px] mx-auto">
                              <img 
                                src={URL.createObjectURL(coverArt.file)} 
                                alt="Обкладинка релізу"
                                className="w-full h-full object-cover rounded-lg border"
                              />
                              <div className="absolute top-2 right-2">
                                <CheckCircle className="h-6 w-6 text-green-500 bg-white rounded-full" />
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-square w-full max-w-[250px] mx-auto bg-muted rounded-lg border border-dashed flex items-center justify-center">
                              <div className="text-center text-muted-foreground">
                                <Image className="h-12 w-12 mx-auto mb-2" />
                                <p className="text-sm">Обкладинка не завантажена</p>
                              </div>
                            </div>
                          )}
                          <div className="text-center">
                            <Button 
                              type="button"
                              variant="outline" 
                              onClick={() => setCurrentStep("files")}
                              size="sm"
                            >
                              Змінити обкладинку
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Права панель з формою */}
                  <div className="lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <FileText className="h-5 w-5" />
                          Інформація про альбом
                        </CardTitle>
                        <CardDescription>
                          Почніть заповнювати метадані свого релізу з мови метаданих.
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-4">
                          {/* Мова метаданих */}
                          <FormField
                            control={form.control}
                            name="language"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>* Мова метаданих</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger 
                                      data-testid="language-select" 
                                      className={`h-12 ${hasAttemptedSubmit && !field.value ? 'border-red-500 focus:border-red-600' : ''}`}
                                    >
                                      <SelectValue placeholder="Ukrainian" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="ukrainian">Ukrainian</SelectItem>
                                    <SelectItem value="english">English</SelectItem>
                                    <SelectItem value="russian">Russian</SelectItem>
                                    <SelectItem value="german">German</SelectItem>
                                    <SelectItem value="french">French</SelectItem>
                                    <SelectItem value="spanish">Spanish</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Назва альбому */}
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>* Назва альбому</FormLabel>
                                <FormControl>
                                  <Input 
                                    placeholder="" 
                                    {...field} 
                                    data-testid="release-title" 
                                    className={`h-12 ${hasAttemptedSubmit && !field.value ? 'border-red-500 focus:border-red-600' : ''}`}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Версія альбому */}
                          <FormField
                            control={form.control}
                            name="albumVersion"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Версія альбому</FormLabel>
                                <FormControl>
                                  <Input placeholder="" {...field} data-testid="album-version" className="h-12" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Жанри у дві колонки */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Головний жанр */}
                            <FormField
                              control={form.control}
                              name="primaryGenre"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>* Головний жанр</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger 
                                        data-testid="primary-genre-select" 
                                        className={`h-12 ${hasAttemptedSubmit && !field.value ? 'border-red-500 focus:border-red-600' : ''}`}
                                      >
                                        <SelectValue placeholder="Pop" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="pop">Pop</SelectItem>
                                      <SelectItem value="rock">Rock</SelectItem>
                                      <SelectItem value="hiphop">Hip-Hop</SelectItem>
                                      <SelectItem value="electronic">Electronic</SelectItem>
                                      <SelectItem value="folk">Folk</SelectItem>
                                      <SelectItem value="jazz">Jazz</SelectItem>
                                      <SelectItem value="classical">Classical</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Вторинний жанр */}
                            <FormField
                              control={form.control}
                              name="secondaryGenre"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Вторинний жанр</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger data-testid="secondary-genre-select" className="h-12">
                                        <SelectValue placeholder="Hip Hop/Rap" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      <SelectItem value="hiphop-rap">Hip Hop/Rap</SelectItem>
                                      <SelectItem value="indie">Indie</SelectItem>
                                      <SelectItem value="alternative">Alternative</SelectItem>
                                      <SelectItem value="dance">Dance</SelectItem>
                                      <SelectItem value="ambient">Ambient</SelectItem>
                                      <SelectItem value="acoustic">Acoustic</SelectItem>
                                      <SelectItem value="experimental">Experimental</SelectItem>
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Дати у дві колонки */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Дата першого випуску */}
                            <FormField
                              control={form.control}
                              name="originalReleaseDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>* Дата першого випуску</FormLabel>
                                  <FormControl>
                                    <Input 
                                      type="date" 
                                      {...field} 
                                      data-testid="original-release-date" 
                                      className={`h-12 ${hasAttemptedSubmit && !field.value ? 'border-red-500 focus:border-red-600' : ''}`}
                                      placeholder="дд.мм.рррр"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            {/* Дата релау */}
                            <FormField
                              control={form.control}
                              name="releaseDate"
                              render={({ field }) => (
                                <FormItem>
                                  <FormLabel>Дата релау</FormLabel>
                                  <div className="relative">
                                    <FormControl>
                                      <Input 
                                        type="date" 
                                        {...field} 
                                        data-testid="release-date" 
                                        className="h-12 pr-10" 
                                        placeholder="дд.мм.рррр"
                                      />
                                    </FormControl>
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                    </div>
                                  </div>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>

                          {/* Саб-лейбл */}
                          <FormField
                            control={form.control}
                            name="subLabel"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Саб-лейбл</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="sub-label-select" className="h-12">
                                      <SelectValue placeholder="" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="label1">Label 1</SelectItem>
                                    <SelectItem value="label2">Label 2</SelectItem>
                                    <SelectItem value="label3">Label 3</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* UPC */}
                          <FormField
                            control={form.control}
                            name="upc"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>* UPC</FormLabel>
                                <div className="flex gap-3">
                                  <FormControl>
                                    <Input 
                                      placeholder="" 
                                      {...field} 
                                      data-testid="upc-input"
                                      className={`flex-1 h-12 ${hasAttemptedSubmit && !field.value ? 'border-red-500 focus:border-red-600' : ''}`}
                                    />
                                  </FormControl>
                                  <Button 
                                    type="button" 
                                    onClick={handleGenerateUpc}
                                    disabled={isGeneratingUpc}
                                    data-testid="generate-upc-button"
                                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-6"
                                  >
                                    {isGeneratingUpc ? "Генеруєм..." : "Генерувати"}
                                  </Button>
                                </div>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          {/* Виконавці */}
                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <h3 className="text-lg font-medium">Виконавці</h3>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={addPerformer}
                                disabled={(form.watch("performers") || []).length >= 5}
                                data-testid="add-performer-button"
                                className="flex items-center gap-2"
                              >
                                <Plus className="h-4 w-4" />
                                Додати виконавця
                              </Button>
                            </div>
                            
                            {(form.watch("performers") || []).map((_, index) => (
                              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg relative">
                                {index > 0 && (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removePerformer(index)}
                                    className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700"
                                    data-testid={`remove-performer-${index}`}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                                
                                {/* Ім'я виконавця */}
                                <FormField
                                  control={form.control}
                                  name={`performers.${index}.name`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Виконавець альбому</FormLabel>
                                      <FormControl>
                                        <Input 
                                          placeholder="Введіть ім'я виконавця" 
                                          {...field} 
                                          data-testid={`performer-name-${index}`}
                                          className="h-12"
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                {/* Посада виконавця */}
                                <FormField
                                  control={form.control}
                                  name={`performers.${index}.role`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Посада виконавця</FormLabel>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger 
                                            data-testid={`performer-role-${index}`}
                                            className="h-12"
                                          >
                                            <SelectValue placeholder="Оберіть посаду" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          <SelectItem value="main_performer">Main Performer</SelectItem>
                                          <SelectItem value="featuring">Featuring (Feat)</SelectItem>
                                          <SelectItem value="remixer">Remixer</SelectItem>
                                        </SelectContent>
                                      </Select>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Кнопки навігації */}
                <div className="flex justify-between">
                  <Button 
                    type="button"
                    variant="outline" 
                    onClick={() => setCurrentStep("files")}
                    data-testid="back-button"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Назад
                  </Button>
                  <Button 
                    type="submit"
                    data-testid="submit-metadata-button"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Продовжити до треків
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        )}

        {currentStep === "tracks" && (
          <div className="space-y-6">
            {/* Навігація між треками */}
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Метадані треків</h2>
              <div className="flex items-center gap-2">
                {audioFiles.map((_, index) => (
                  <Button
                    key={index}
                    variant={currentTrackIndex === index ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentTrackIndex(index)}
                    data-testid={`track-nav-${index}`}
                  >
                    Трек {index + 1}
                  </Button>
                ))}
              </div>
            </div>

            {/* Вкладки для поточного треку */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  {audioFiles[currentTrackIndex]?.file?.name || `Трек ${currentTrackIndex + 1}`}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="info" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="info" data-testid="info-tab">Інформація про трек</TabsTrigger>
                    <TabsTrigger value="performers" data-testid="performers-tab">Виконавець треку</TabsTrigger>
                    <TabsTrigger value="lyrics" data-testid="lyrics-tab">Текст пісні</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="info" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Назва пісні */}
                      <div className="md:col-span-2">
                        <Label htmlFor="track-title">* Назва пісні</Label>
                        <Input
                          id="track-title"
                          value={tracksMetadata[currentTrackIndex]?.title || ""}
                          onChange={(e) => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              newTracksMetadata[currentTrackIndex].title = e.target.value;
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                          className="h-12"
                          data-testid="track-title-input"
                        />
                      </div>

                      {/* Версія пісні */}
                      <div className="md:col-span-2">
                        <Label htmlFor="track-version">Версія пісні</Label>
                        <Input
                          id="track-version"
                          value={tracksMetadata[currentTrackIndex]?.version || ""}
                          onChange={(e) => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              newTracksMetadata[currentTrackIndex].version = e.target.value;
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                          className="h-12"
                          data-testid="track-version-input"
                        />
                      </div>

                      {/* Жанри */}
                      <div>
                        <Label htmlFor="track-primary-genre">* Головний жанр</Label>
                        <Select
                          value={tracksMetadata[currentTrackIndex]?.primaryGenre || ""}
                          onValueChange={(value) => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              newTracksMetadata[currentTrackIndex].primaryGenre = value;
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                        >
                          <SelectTrigger className="h-12" data-testid="track-primary-genre">
                            <SelectValue placeholder="Pop" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pop">Pop</SelectItem>
                            <SelectItem value="rock">Rock</SelectItem>
                            <SelectItem value="hip-hop">Hip Hop/Rap</SelectItem>
                            <SelectItem value="electronic">Electronic</SelectItem>
                            <SelectItem value="jazz">Jazz</SelectItem>
                            <SelectItem value="classical">Classical</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="track-secondary-genre">Вторинний жанр</Label>
                        <Select
                          value={tracksMetadata[currentTrackIndex]?.secondaryGenre || ""}
                          onValueChange={(value) => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              newTracksMetadata[currentTrackIndex].secondaryGenre = value;
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                        >
                          <SelectTrigger className="h-12" data-testid="track-secondary-genre">
                            <SelectValue placeholder="Hip Hop/Rap" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="pop">Pop</SelectItem>
                            <SelectItem value="rock">Rock</SelectItem>
                            <SelectItem value="hip-hop">Hip Hop/Rap</SelectItem>
                            <SelectItem value="electronic">Electronic</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Мова релізу */}
                      <div>
                        <Label htmlFor="track-language">* Мова релізу</Label>
                        <Select
                          value={tracksMetadata[currentTrackIndex]?.language || ""}
                          onValueChange={(value) => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              newTracksMetadata[currentTrackIndex].language = value;
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                        >
                          <SelectTrigger className="h-12" data-testid="track-language">
                            <SelectValue placeholder="Ukrainian" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ukrainian">Ukrainian</SelectItem>
                            <SelectItem value="english">English</SelectItem>
                            <SelectItem value="russian">Russian</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Відвертий вміст */}
                      <div>
                        <Label>* Чи містить трек відвертий вміст?</Label>
                        <div className="flex gap-4 mt-2">
                          {[
                            { value: "yes", label: "Да" },
                            { value: "no", label: "Ні" },
                            { value: "censored", label: "Цензура" }
                          ].map((option) => (
                            <Button
                              key={option.value}
                              type="button"
                              variant={tracksMetadata[currentTrackIndex]?.explicitContent === option.value ? "default" : "outline"}
                              onClick={() => {
                                const newTracksMetadata = [...tracksMetadata];
                                if (newTracksMetadata[currentTrackIndex]) {
                                  newTracksMetadata[currentTrackIndex].explicitContent = option.value as "yes" | "no" | "censored";
                                  setTracksMetadata(newTracksMetadata);
                                }
                              }}
                              data-testid={`explicit-${option.value}`}
                            >
                              {option.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      {/* Час початку прослуховувань */}
                      <div className="md:col-span-2">
                        <Label htmlFor="preview-start">Час початку попереднього прослуховування</Label>
                        <Input
                          id="preview-start"
                          value={tracksMetadata[currentTrackIndex]?.previewStartTime || "00:00:00"}
                          onChange={(e) => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              newTracksMetadata[currentTrackIndex].previewStartTime = e.target.value;
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                          placeholder="00:00:50"
                          className="h-12"
                          data-testid="preview-start-input"
                        />
                      </div>

                      {/* ISRC */}
                      <div className="md:col-span-2">
                        <Label htmlFor="track-isrc">* ISRC</Label>
                        <div className="flex gap-3">
                          <Input
                            id="track-isrc"
                            value={tracksMetadata[currentTrackIndex]?.isrc || ""}
                            onChange={(e) => {
                              const newTracksMetadata = [...tracksMetadata];
                              if (newTracksMetadata[currentTrackIndex]) {
                                newTracksMetadata[currentTrackIndex].isrc = e.target.value;
                                setTracksMetadata(newTracksMetadata);
                              }
                            }}
                            className="flex-1 h-12"
                            data-testid="track-isrc-input"
                          />
                          <Button
                            type="button"
                            onClick={() => handleGenerateIsrc(currentTrackIndex)}
                            disabled={isGeneratingIsrc}
                            className="h-12 bg-blue-600 hover:bg-blue-700 text-white px-6"
                            data-testid="generate-isrc-button"
                          >
                            {isGeneratingIsrc ? "Генеруєм..." : "Генерувати"}
                          </Button>
                        </div>
                      </div>

                      {/* ISWC */}
                      <div className="md:col-span-2">
                        <Label htmlFor="track-iswc">ISWC</Label>
                        <Input
                          id="track-iswc"
                          value={tracksMetadata[currentTrackIndex]?.iswc || ""}
                          onChange={(e) => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              newTracksMetadata[currentTrackIndex].iswc = e.target.value;
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                          className="h-12"
                          data-testid="track-iswc-input"
                        />
                      </div>

                      {/* Права */}
                      <div className="md:col-span-2">
                        <h4 className="font-medium mb-4">Права</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="p-line">℗ Рік прав на видання</Label>
                            <Input
                              id="p-line"
                              value={tracksMetadata[currentTrackIndex]?.pLine || ""}
                              onChange={(e) => {
                                const newTracksMetadata = [...tracksMetadata];
                                if (newTracksMetadata[currentTrackIndex]) {
                                  newTracksMetadata[currentTrackIndex].pLine = e.target.value;
                                  setTracksMetadata(newTracksMetadata);
                                }
                              }}
                              className="h-12"
                              data-testid="p-line-input"
                            />
                          </div>
                          <div>
                            <Label htmlFor="c-line">© текст</Label>
                            <Input
                              id="c-line"
                              value={tracksMetadata[currentTrackIndex]?.cLine || ""}
                              onChange={(e) => {
                                const newTracksMetadata = [...tracksMetadata];
                                if (newTracksMetadata[currentTrackIndex]) {
                                  newTracksMetadata[currentTrackIndex].cLine = e.target.value;
                                  setTracksMetadata(newTracksMetadata);
                                }
                              }}
                              className="h-12"
                              data-testid="c-line-input"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="performers" className="space-y-6">
                    <div className="space-y-4">
                      {(tracksMetadata[currentTrackIndex]?.contributors || []).map((contributor, index) => (
                        <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg relative">
                          {index > 0 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newTracksMetadata = [...tracksMetadata];
                                if (newTracksMetadata[currentTrackIndex]?.contributors) {
                                  newTracksMetadata[currentTrackIndex].contributors = 
                                    newTracksMetadata[currentTrackIndex].contributors.filter((_, i) => i !== index);
                                  setTracksMetadata(newTracksMetadata);
                                }
                              }}
                              className="absolute top-2 right-2 h-8 w-8 p-0 text-red-500 hover:text-red-700"
                              data-testid={`remove-contributor-${index}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <div>
                            <Label htmlFor={`contributor-name-${index}`}>Ім'я</Label>
                            <Input
                              id={`contributor-name-${index}`}
                              value={contributor.name}
                              onChange={(e) => {
                                const newTracksMetadata = [...tracksMetadata];
                                if (newTracksMetadata[currentTrackIndex]?.contributors?.[index]) {
                                  newTracksMetadata[currentTrackIndex].contributors[index].name = e.target.value;
                                  setTracksMetadata(newTracksMetadata);
                                }
                              }}
                              className="h-12"
                              data-testid={`contributor-name-${index}`}
                            />
                          </div>
                          
                          <div>
                            <Label htmlFor={`contributor-role-${index}`}>Роль</Label>
                            <Select
                              value={contributor.role}
                              onValueChange={(value) => {
                                const newTracksMetadata = [...tracksMetadata];
                                if (newTracksMetadata[currentTrackIndex]?.contributors?.[index]) {
                                  newTracksMetadata[currentTrackIndex].contributors[index].role = value;
                                  setTracksMetadata(newTracksMetadata);
                                }
                              }}
                            >
                              <SelectTrigger className="h-12" data-testid={`contributor-role-${index}`}>
                                <SelectValue placeholder="Main Performer" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="main_performer">Main Performer</SelectItem>
                                <SelectItem value="composer">Composer</SelectItem>
                                <SelectItem value="lyricist">Lyricist</SelectItem>
                                <SelectItem value="arranger">Arranger</SelectItem>
                                <SelectItem value="mixing_engineer">Mixing Engineer</SelectItem>
                                <SelectItem value="mastering_engineer">Mastering Engineer</SelectItem>
                                <SelectItem value="musician">Musician</SelectItem>
                                <SelectItem value="backing_vocalist">Backing Vocalist</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex flex-col gap-4">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="no-music"
                            checked={tracksMetadata[currentTrackIndex]?.hasNoMusic || false}
                            onCheckedChange={(checked) => {
                              const newTracksMetadata = [...tracksMetadata];
                              if (newTracksMetadata[currentTrackIndex]) {
                                newTracksMetadata[currentTrackIndex].hasNoMusic = !!checked;
                                setTracksMetadata(newTracksMetadata);
                              }
                            }}
                            data-testid="no-music-checkbox"
                          />
                          <Label htmlFor="no-music">Пісня не містить музики</Label>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="no-lyrics"
                            checked={tracksMetadata[currentTrackIndex]?.hasNoLyrics || false}
                            onCheckedChange={(checked) => {
                              const newTracksMetadata = [...tracksMetadata];
                              if (newTracksMetadata[currentTrackIndex]) {
                                newTracksMetadata[currentTrackIndex].hasNoLyrics = !!checked;
                                setTracksMetadata(newTracksMetadata);
                              }
                            }}
                            data-testid="no-lyrics-checkbox"
                          />
                          <Label htmlFor="no-lyrics">Пісня не містить тексту</Label>
                        </div>
                        
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const newTracksMetadata = [...tracksMetadata];
                            if (newTracksMetadata[currentTrackIndex]) {
                              if (!newTracksMetadata[currentTrackIndex].contributors) {
                                newTracksMetadata[currentTrackIndex].contributors = [];
                              }
                              newTracksMetadata[currentTrackIndex].contributors.push({ name: "", role: "musician" });
                              setTracksMetadata(newTracksMetadata);
                            }
                          }}
                          className="flex items-center gap-2"
                          data-testid="add-contributor-button"
                        >
                          <Plus className="h-4 w-4" />
                          Додайте іншого музиканта
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="lyrics" className="space-y-6">
                    <div>
                      <Label htmlFor="track-lyrics">Текст пісні</Label>
                      <Textarea
                        id="track-lyrics"
                        value={tracksMetadata[currentTrackIndex]?.lyrics || ""}
                        onChange={(e) => {
                          const newTracksMetadata = [...tracksMetadata];
                          if (newTracksMetadata[currentTrackIndex]) {
                            newTracksMetadata[currentTrackIndex].lyrics = e.target.value;
                            setTracksMetadata(newTracksMetadata);
                          }
                        }}
                        placeholder="Введіть текст пісні..."
                        className="min-h-[400px] resize-none"
                        data-testid="track-lyrics-textarea"
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Кнопки навігації */}
            <div className="flex justify-between">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setCurrentStep("metadata")}
                data-testid="back-to-metadata-button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад до метаданих
              </Button>
              <Button 
                onClick={onCompleteTracksMetadata}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="continue-to-territories-button"
              >
                Продовжити до територій
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {currentStep === "territories" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5" />
                  Території дистрибуції
                </CardTitle>
                <CardDescription>
                  Оберіть країни та регіони, де буде доступний ваш реліз. За замовчуванням обрано всі території.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Пошук країн */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Країна пошуку"
                    value={territorySearchQuery}
                    onChange={(e) => setTerritorySearchQuery(e.target.value)}
                    className="pl-10 h-12"
                    data-testid="territory-search"
                  />
                </div>

                {/* Списки країн по континентах */}
                <div className="space-y-6">
                  {Object.entries(getFilteredCountries()).map(([continent, countries]) => {
                    const selectedCount = countries.filter(country => selectedTerritories.has(country)).length;
                    const totalCount = countries.length;
                    const allSelected = selectedCount === totalCount;

                    return (
                      <div key={continent} className="space-y-4">
                        {/* Заголовок континенту */}
                        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-blue-600">
                              {selectedCount}/{totalCount}
                            </span>
                            <h3 className="font-semibold">{continent}</h3>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleContinentSelection(continent)}
                            className="text-blue-600 hover:text-blue-700"
                            data-testid={`select-all-${continent.toLowerCase()}`}
                          >
                            {allSelected ? "Скасувати все" : "Вибрати все"}
                            <CheckCircle className={`ml-2 h-4 w-4 ${allSelected ? "text-green-600" : ""}`} />
                          </Button>
                        </div>

                        {/* Сітка країн */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {countries.map((country) => {
                            const isSelected = selectedTerritories.has(country);
                            return (
                              <button
                                key={country}
                                onClick={() => toggleTerritory(country)}
                                className={`
                                  flex items-center gap-3 p-3 rounded-lg border transition-all text-left
                                  ${isSelected 
                                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30" 
                                    : "border-border hover:border-border/80 hover:bg-muted/50"
                                  }
                                `}
                                data-testid={`territory-${country.toLowerCase().replace(/\s+/g, '-')}`}
                              >
                                {/* Замість прапорів використовуємо кольорові кружки */}
                                <div className={`
                                  w-4 h-4 rounded-full flex-shrink-0
                                  ${isSelected ? "bg-blue-500" : "bg-muted-foreground/30"}
                                `} />
                                <span className={`
                                  text-sm font-medium truncate
                                  ${isSelected ? "text-blue-700 dark:text-blue-300" : "text-foreground"}
                                `}>
                                  {country}
                                </span>
                                {isSelected && (
                                  <CheckCircle className="h-4 w-4 text-blue-500 ml-auto flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Підсумок вибору */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    Обрано <span className="font-semibold text-foreground">{selectedTerritories.size}</span> з{' '}
                    <span className="font-semibold text-foreground">
                      {Object.values(TERRITORIES_DATA).flat().length}
                    </span> доступних територій
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Кнопки навігації */}
            <div className="flex justify-between">
              <Button 
                type="button"
                variant="outline" 
                onClick={() => setCurrentStep("tracks")}
                data-testid="back-to-tracks-button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Назад до треків
              </Button>
              <Button
                type="button"

                onClick={onCompleteRelease}
                className="bg-green-600 hover:bg-green-700 text-white"
                data-testid="complete-release-button"
              >
                Завершити створення релізу
                <CheckCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
