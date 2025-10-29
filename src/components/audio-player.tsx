import { Card } from "./ui/card";

type AudioPlayerProps = {
  src: string;
};

export default function AudioPlayer({ src }: AudioPlayerProps) {
  return (
    <Card className="p-4 bg-muted/50">
      <audio controls src={src} className="w-full">
        Seu navegador não suporta o elemento de áudio.
      </audio>
    </Card>
  );
}
