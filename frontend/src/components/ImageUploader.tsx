import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Upload, Sparkles } from "lucide-react";

interface ImageUploaderProps {
  baseFileRef: React.RefObject<HTMLInputElement>;
  itemFileRef: React.RefObject<HTMLInputElement>;
  handleBaseImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleItemImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  baseImage: HTMLImageElement | null;
  itemImage: HTMLImageElement | null;
  ITEM_SIZE: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  baseFileRef,
  itemFileRef,
  handleBaseImageUpload,
  handleItemImageUpload,
  baseImage,
  itemImage,
  ITEM_SIZE,
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-cyan-400 flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Base Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                ref={baseFileRef}
                type="file"
                accept="image/*"
                onChange={handleBaseImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => baseFileRef.current?.click()}
                className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white border-0"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Base Image
              </Button>
            </div>
            {baseImage && (
              <div className="text-sm text-slate-400 bg-slate-700/50 p-3 rounded-lg">
                Size: {baseImage.width} × {baseImage.height}px
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-pink-400 flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Item Image
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Input
                ref={itemFileRef}
                type="file"
                accept="image/*"
                onChange={handleItemImageUpload}
                className="hidden"
              />
              <Button
                onClick={() => itemFileRef.current?.click()}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white border-0"
              >
                <Upload className="w-4 h-4 mr-2" />
                Upload Item Image
              </Button>
            </div>
            {itemImage && (
              <div className="text-sm text-slate-400 bg-slate-700/50 p-3 rounded-lg">
                Display Size: {ITEM_SIZE} × {ITEM_SIZE}px (Fixed)
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageUploader;
