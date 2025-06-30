"use client";

import type React from "react";

import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import ImageUploader from "@/components/ImageUploader";
import DraggableOverlay from "@/components/DraggableOverlay";
import ResultViewer from "@/components/ResultViewer";
import ErrorModal from "@/components/ErrorModal";
import { loadImage } from "@/lib/utils";

interface Position {
  x: number;
  y: number;
}

export default function ImageComposer() {
  const [baseImage, setBaseImage] = useState<HTMLImageElement | null>(null);
  const [itemImage, setItemImage] = useState<HTMLImageElement | null>(null);
  const [itemPosition, setItemPosition] = useState<Position>({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [composedImage, setComposedImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [errorModal, setErrorModal] = useState({
    isOpen: false,
    title: "",
    message: "",
  });

  const canvasRef = useRef<HTMLCanvasElement>(
    null
  ) as React.RefObject<HTMLCanvasElement>;
  const composedCanvasRef = useRef<HTMLCanvasElement>(
    null
  ) as React.RefObject<HTMLCanvasElement>;
  const baseFileRef = useRef<HTMLInputElement>(
    null
  ) as React.RefObject<HTMLInputElement>;
  const itemFileRef = useRef<HTMLInputElement>(
    null
  ) as React.RefObject<HTMLInputElement>;

  const ITEM_SIZE = 100; // 固定サイズ

  const handleBaseImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const img = await loadImage(file);
        setBaseImage(img);
        setComposedImage(null);
      } catch (error) {
        console.error("Failed to load base image:", error);
      }
    }
  };

  const handleItemImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const img = await loadImage(file);
        setItemImage(img);
        setComposedImage(null);
      } catch (error) {
        console.error("Failed to load item image:", error);
      }
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImage) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // キャンバスサイズを調整
    const maxWidth = 600;
    const maxHeight = 400;
    let { width, height } = baseImage;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width *= ratio;
      height *= ratio;
    }

    canvas.width = width;
    canvas.height = height;

    // 背景画像を描画
    ctx.drawImage(baseImage, 0, 0, width, height);

    // アイテム画像を描画する部分を枠線の描画に変更
    if (itemImage) {
      // 枠線を描画（NFTスタイルのネオンカラー）
      ctx.strokeStyle = "#00ff88"; // ネオングリーン
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 4]); // 破線スタイル
      ctx.strokeRect(itemPosition.x, itemPosition.y, ITEM_SIZE, ITEM_SIZE);

      // 中央に十字線を描画
      ctx.setLineDash([]); // 実線に戻す
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#ff0080"; // ネオンピンク
      ctx.beginPath();
      // 水平線
      ctx.moveTo(itemPosition.x, itemPosition.y + ITEM_SIZE / 2);
      ctx.lineTo(itemPosition.x + ITEM_SIZE, itemPosition.y + ITEM_SIZE / 2);
      // 垂直線
      ctx.moveTo(itemPosition.x + ITEM_SIZE / 2, itemPosition.y);
      ctx.lineTo(itemPosition.x + ITEM_SIZE / 2, itemPosition.y + ITEM_SIZE);
      ctx.stroke();

      // 角にサイズ表示（ネオンスタイル）
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 14px 'Courier New', monospace";
      ctx.fillText(
        `${ITEM_SIZE}×${ITEM_SIZE}`,
        itemPosition.x + 2,
        itemPosition.y - 8
      );
    }
  }, [baseImage, itemImage, itemPosition]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // アイテム画像の範囲内かチェック
    if (
      x >= itemPosition.x &&
      x <= itemPosition.x + ITEM_SIZE &&
      y >= itemPosition.y &&
      y <= itemPosition.y + ITEM_SIZE
    ) {
      setIsDragging(true);
      setDragOffset({
        x: x - itemPosition.x,
        y: y - itemPosition.y,
      });
    }
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault(); // スクロールを防ぐ
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // アイテム画像の範囲内かチェック
    if (
      x >= itemPosition.x &&
      x <= itemPosition.x + ITEM_SIZE &&
      y >= itemPosition.y &&
      y <= itemPosition.y + ITEM_SIZE
    ) {
      setIsDragging(true);
      setDragOffset({
        x: x - itemPosition.x,
        y: y - itemPosition.y,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    e.preventDefault(); // スクロールを防ぐ
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left - dragOffset.x;
    const y = touch.clientY - rect.top - dragOffset.y;

    // キャンバス内に制限
    const maxX = canvas.width - ITEM_SIZE;
    const maxY = canvas.height - ITEM_SIZE;

    setItemPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !itemImage) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left - dragOffset.x;
    const y = e.clientY - rect.top - dragOffset.y;

    // キャンバス内に制限
    const maxX = canvas.width - ITEM_SIZE;
    const maxY = canvas.height - ITEM_SIZE;

    setItemPosition({
      x: Math.max(0, Math.min(x, maxX)),
      y: Math.max(0, Math.min(y, maxY)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const executeAllSteps = async () => {
    if (!baseImage || !itemImage) return;

    setIsGenerating(true);
    setCurrentStep(0);
    setComposedImage(null);

    try {
      // バックエンドのURL
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8080";
      
      // base image
      const baseCanvas = document.createElement("canvas");
      const baseCtx = baseCanvas.getContext("2d");
      if (!baseCtx) throw new Error("Could not get canvas context");

      baseCanvas.width = baseImage.width;
      baseCanvas.height = baseImage.height;
      baseCtx.drawImage(baseImage, 0, 0);
      const baseImageData = baseCanvas.toDataURL("image/png").split(",")[1];

      // item image
      const itemCanvas = document.createElement("canvas");
      const itemCtx = itemCanvas.getContext("2d");
      if (!itemCtx) throw new Error("Could not get canvas context");

      itemCanvas.width = itemImage.width;
      itemCanvas.height = itemImage.height;
      itemCtx.drawImage(itemImage, 0, 0);
      const itemImageData = itemCanvas.toDataURL("image/png").split(",")[1];

      // scale calculation
      const displayCanvas = canvasRef.current;
      if (!displayCanvas) throw new Error("Display canvas not found");
      const scaleX = baseImage.width / displayCanvas.width;
      const scaleY = baseImage.height / displayCanvas.height;

      // Step 1: 画像分析
      setCurrentStep(1);
      setProgressMessage("アイテム画像を分析しています...");
      
      const step1Response = await fetch(`${BACKEND_URL}/api/analyze-item-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_image: itemImageData }),
      });

      if (!step1Response.ok) {
        const errorData = await step1Response.json();
        throw new Error(`Step 1 エラー: ${errorData.error || 'Unknown error'}`);
      }

      const step1Data = await step1Response.json();
      console.log("Step 1 完了:", step1Data);

      // Step 2: プロンプト生成
      setCurrentStep(2);
      setProgressMessage("補完用プロンプトを生成しています...");
      
      const step2Response = await fetch(`${BACKEND_URL}/api/generate-prompt`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ "image-info": step1Data }),
      });

      if (!step2Response.ok) {
        const errorData = await step2Response.json();
        throw new Error(`Step 2 エラー: ${errorData.error || 'Unknown error'}`);
      }

      const step2Data = await step2Response.json();
      console.log("Step 2 完了:", step2Data);

      // Step 3: マスク画像生成
      setCurrentStep(3);
      setProgressMessage("マスク画像を生成しています...");
      
      const step3Response = await fetch(`${BACKEND_URL}/api/generate-mask-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          item_image: itemImageData,
          missing_part: step1Data.missing_part,
        }),
      });

      if (!step3Response.ok) {
        const errorData = await step3Response.json();
        throw new Error(`Step 3 エラー: ${errorData.error || 'Unknown error'}`);
      }

      const step3Blob = await step3Response.blob();
      const step3Base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(step3Blob);
      });
      console.log("Step 3 完了: マスク画像生成");

      // Step 4: DALL-E画像生成
      setCurrentStep(4);
      setProgressMessage("AIが画像を補完しています...");
      
      const step4Response = await fetch(`${BACKEND_URL}/api/generate-item-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_image: itemImageData,
          mask_image: step3Base64,
          prompt: step2Data.prompt,
        }),
      });

      if (!step4Response.ok) {
        const errorData = await step4Response.json();
        throw new Error(`Step 4 エラー: ${errorData.error || 'Unknown error'}`);
      }

      const step4Blob = await step4Response.blob();
      const step4Base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(step4Blob);
      });
      console.log("Step 4 完了: DALL-E画像生成");

      // Step 5: 背景除去
      setCurrentStep(5);
      setProgressMessage("背景を除去しています...");
      
      const step5Response = await fetch(`${BACKEND_URL}/api/remove-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: step4Base64 }),
      });

      if (!step5Response.ok) {
        const errorData = await step5Response.json();
        throw new Error(`Step 5 エラー: ${errorData.error || 'Unknown error'}`);
      }

      const step5Blob = await step5Response.blob();
      const step5Base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.readAsDataURL(step5Blob);
      });
      console.log("Step 5 完了: 背景除去");

      // Step 6: 最終合成
      setCurrentStep(6);
      setProgressMessage("最終画像を合成しています...");
      
      const step6Response = await fetch(`${BACKEND_URL}/api/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          base_image: baseImageData,
          item_image: step5Base64,
          position: {
            x: Math.round(itemPosition.x * scaleX),
            y: Math.round(itemPosition.y * scaleY),
          },
        }),
      });

      if (!step6Response.ok) {
        const errorData = await step6Response.json();
        throw new Error(`Step 6 エラー: ${errorData.error || 'Unknown error'}`);
      }

      const step6Data = await step6Response.json();
      console.log("Step 6 完了:", step6Data);

      setComposedImage(step6Data.result_image);
      setProgressMessage("完了！");

    } catch (error) {
      console.error("Processing Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      
      setErrorModal({
        isOpen: true,
        title: "処理エラー",
        message: `処理に失敗しました: ${errorMessage}`,
      });
    } finally {
      setIsGenerating(false);
      setCurrentStep(0);
    }
  };

  const downloadComposedImage = async () => {
    if (!composedImage) return;

    try {
      let blob: Blob;
      
      if (composedImage.startsWith("data:")) {
        // Data URLをBlobに変換
        const base64 = composedImage.split(',')[1];
        const byteCharacters = atob(base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        blob = new Blob([byteArray], { type: 'image/png' });
      } else {
        // GCS URLから画像をフェッチ
        const response = await fetch(composedImage);
        blob = await response.blob();
      }

      // Blob URLを作成
      const url = URL.createObjectURL(blob);
      
      // ダウンロードリンクを作成
      const link = document.createElement("a");
      link.download = "azuki-generated.png";
      link.href = url;
      link.style.display = "none";
      
      // Firefoxの場合はクリックイベントを手動でトリガー
      if (navigator.userAgent.includes('Firefox')) {
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
      }
      
      document.body.appendChild(link);
      link.click();
      
      // クリーンアップ
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      console.error("Download error:", error);
      // フォールバック: 直接URLを開く
      window.open(composedImage, "_blank");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* ヘッダー */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Sparkles className="w-8 h-8 text-cyan-400" />
            <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Azuki Generator
            </h1>
            <Sparkles className="w-8 h-8 text-pink-400" />
          </div>
          <p className="text-slate-300 text-lg">
            Create unique NFT compositions with ease
          </p>
        </div>

        {/* 画像アップロードUI */}
        <ImageUploader
          baseFileRef={baseFileRef}
          itemFileRef={itemFileRef}
          handleBaseImageUpload={handleBaseImageUpload}
          handleItemImageUpload={handleItemImageUpload}
          baseImage={baseImage}
          itemImage={itemImage}
          ITEM_SIZE={ITEM_SIZE}
        />

        {/* プレビュー（ドラッグ可能なオーバーレイ） */}
        {baseImage && (
          <Card className="mb-8 bg-slate-800/50 border-slate-700 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-purple-400 flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Composition Studio
              </CardTitle>
              <p className="text-slate-400">
                {itemImage
                  ? "Drag the neon frame to position your item"
                  : "Upload an item image to start composing"}
              </p>
            </CardHeader>
            <CardContent>
              <DraggableOverlay
                baseImage={baseImage}
                itemImage={itemImage}
                itemPosition={itemPosition}
                isDragging={isDragging}
                canvasRef={canvasRef}
                handleMouseDown={handleMouseDown}
                handleMouseMove={handleMouseMove}
                handleMouseUp={handleMouseUp}
                handleMouseLeave={handleMouseUp}
                handleTouchStart={handleTouchStart}
                handleTouchMove={handleTouchMove}
                handleTouchEnd={handleTouchEnd}
              />
              
              {/* Processing Controls */}
              <div className="space-y-6 mt-6">
                {/* プログレスバー */}
                {isGenerating && (
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-purple-400 font-medium">進捗</span>
                      <span className="text-slate-300">{currentStep}/6</span>
                    </div>
                    
                    {/* プログレスバー */}
                    <div className="w-full bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${(currentStep / 6) * 100}%` }}
                      ></div>
                    </div>
                    
                    {/* 進捗メッセージ */}
                    <div className="text-center">
                      <p className="text-slate-300 text-sm">
                        {progressMessage}
                      </p>
                    </div>
                  </div>
                )}

                {/* 実行ボタン */}
                <div className="flex justify-center">
                  <Button
                    onClick={executeAllSteps}
                    disabled={!baseImage || !itemImage || isGenerating}
                    size="lg"
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white border-0 px-8 py-3 text-lg font-semibold disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        処理中...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        NFT生成開始
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* 合成画像の表示 */}
        <ResultViewer
          composedImage={composedImage}
          onDownload={downloadComposedImage}
        />

        {/* 非表示の合成用キャンバス */}
        <canvas ref={composedCanvasRef} className="hidden" />
        
        {/* エラーモーダル */}
        <ErrorModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ ...errorModal, isOpen: false })}
          title={errorModal.title}
          message={errorModal.message}
        />
      </div>
    </div>
  );
}