import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Download } from "lucide-react";

interface ResultViewerProps {
  composedImage: string | null;
  onDownload: () => void;
}

const ResultViewer: React.FC<ResultViewerProps> = ({
  composedImage,
  onDownload,
}) => {
  if (!composedImage) return null;
  return (
    <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-emerald-400 flex items-center gap-2">
          <Download className="w-5 h-5" />
          Generated NFT
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <img
                src={composedImage || "/placeholder.svg"}
                alt="Generated NFT"
                className="max-w-full h-auto border-2 border-emerald-400 rounded-lg shadow-2xl"
              />
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-400 to-cyan-400 rounded-lg blur opacity-25"></div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              onClick={onDownload}
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white border-0 px-6 py-2"
            >
              <Download className="w-4 h-4 mr-2" />
              Download NFT
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResultViewer;
